-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  email TEXT,
  balance NUMERIC DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Table grants for the authenticated role
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

-- Helper function to check admin status (avoids recursive queries)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_id AND p.is_admin = true
  );
$$;

-- RLS Policies
-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow admins to read all profiles (non-recursive)
CREATE POLICY "Admins can read all profiles" ON profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- User creation trigger
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to increment balance
CREATE OR REPLACE FUNCTION increment_balance(user_id uuid, amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET balance = balance + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage setup
INSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar public access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Update own avatar" ON storage.objects
FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');
