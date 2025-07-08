-- Add balance column
ALTER TABLE profiles
ADD COLUMN balance NUMERIC(15,2) NOT NULL DEFAULT 0;

-- Create function to update balance
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
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_balance_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_balance();
