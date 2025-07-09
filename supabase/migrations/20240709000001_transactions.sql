-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  stripe_payment_intent_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Create stripe_webhook_events table
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for both tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT ON TABLE transactions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE stripe_webhook_events TO service_role;

-- RLS Policies for transactions
CREATE POLICY "Users see their transactions" ON transactions
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert transactions" ON transactions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for stripe_webhook_events: only service_role can access
CREATE POLICY "Service role can manage webhook events" ON stripe_webhook_events
FOR ALL TO service_role USING (true);

-- Create indexes for faster queries
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);

-- Function to keep user balance in sync with transactions
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'deposit' THEN
    UPDATE profiles
    SET balance = balance + NEW.amount
    WHERE id = NEW.user_id;
  ELSIF NEW.type = 'withdrawal' THEN
    UPDATE profiles
    SET balance = balance - NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire after each transaction insert
CREATE TRIGGER update_balance_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_balance();
