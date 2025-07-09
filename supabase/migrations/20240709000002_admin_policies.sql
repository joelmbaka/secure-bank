-- Create a function to check if a user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid) 
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id AND is_admin = true
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Admin read policy
CREATE POLICY "Admins can read all profiles" ON profiles
FOR SELECT
USING (is_admin(auth.uid()));

-- Set initial admin
UPDATE profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'mbakajoe26@gmail.com'
);
