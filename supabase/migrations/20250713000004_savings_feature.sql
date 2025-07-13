-- Create savings products table
CREATE TABLE savings_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  demographic TEXT NOT NULL,
  annual_interest_pct NUMERIC(5,2) NOT NULL,
  term_months INTEGER NOT NULL,
  min_deposit NUMERIC(15,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user savings accounts table
CREATE TABLE user_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  product_id UUID REFERENCES savings_products NOT NULL,
  principal NUMERIC(15,2) NOT NULL,
  term_months INTEGER NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK (status IN ('active', 'matured', 'cancelled')) DEFAULT 'active',
  maturity_at TIMESTAMP WITH TIME ZONE NOT NULL,
  interest_accrued NUMERIC(15,2) DEFAULT 0
);

-- Enable RLS
ALTER TABLE savings_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_savings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Savings products: public read access
CREATE POLICY "Public can view active savings products" ON savings_products
FOR SELECT USING (is_active = true);

-- User savings: users can only access their own savings
CREATE POLICY "Users can manage their savings" ON user_savings
FOR ALL USING (auth.uid() = user_id);

-- Admin access
CREATE POLICY "Admins can manage all savings" ON savings_products
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all user savings" ON user_savings
FOR ALL USING (public.is_admin(auth.uid()));

-- Function to create savings account
CREATE OR REPLACE FUNCTION create_savings(
  p_user_id UUID,
  p_product_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$
DECLARE
  v_min_deposit NUMERIC;
  v_balance NUMERIC;
  v_term INTEGER;
  v_maturity TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get product details
  SELECT min_deposit, term_months INTO v_min_deposit, v_term
  FROM savings_products WHERE id = p_product_id;
  
  -- Validate minimum deposit
  IF p_amount < v_min_deposit THEN
    RAISE EXCEPTION 'Amount below minimum deposit requirement';
  END IF;
  
  -- Check user balance
  SELECT balance INTO v_balance FROM profiles WHERE id = p_user_id;
  
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- Deduct from balance
  UPDATE profiles SET balance = balance - p_amount WHERE id = p_user_id;
  
  -- Calculate maturity date
  v_maturity := NOW() + (v_term || ' months')::INTERVAL;
  
  -- Create savings account
  INSERT INTO user_savings (user_id, product_id, principal, term_months, maturity_at)
  VALUES (p_user_id, p_product_id, p_amount, v_term, v_maturity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate interest
CREATE OR REPLACE FUNCTION calculate_interest() RETURNS VOID AS $$
BEGIN
  -- Daily interest calculation (simple interest)
  UPDATE user_savings
  SET interest_accrued = interest_accrued + 
      (principal * (annual_interest_pct/100) / 365)
  FROM savings_products
  WHERE 
    user_savings.product_id = savings_products.id AND
    user_savings.status = 'active';
    
  -- Mark matured savings
  UPDATE user_savings
  SET status = 'matured'
  WHERE maturity_at <= NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to withdraw savings
CREATE OR REPLACE FUNCTION withdraw_savings(
  p_savings_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_total NUMERIC;
BEGIN
  -- Get savings details
  SELECT user_id, (principal + interest_accrued) INTO v_user_id, v_total
  FROM user_savings WHERE id = p_savings_id AND status = 'matured';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Savings not found or not matured';
  END IF;
  
  -- Credit user's balance
  UPDATE profiles SET balance = balance + v_total WHERE id = v_user_id;
  
  -- Update savings status
  UPDATE user_savings SET status = 'cancelled' WHERE id = p_savings_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON TABLE savings_products TO anon;
GRANT SELECT ON TABLE savings_products TO authenticated;
GRANT SELECT ON TABLE user_savings TO authenticated;
GRANT EXECUTE ON FUNCTION create_savings(UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_savings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_interest() TO service_role;

-- Enable pg_cron extension (ignored if already enabled)
--CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job for daily interest calculation
-- (Note: This requires Supabase Edge Functions in production)
-- Insert cron job only if not exists
-- Removed cron job creation because it caused errors. We'll use an Edge Function instead.
