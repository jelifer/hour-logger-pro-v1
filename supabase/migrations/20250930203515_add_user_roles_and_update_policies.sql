/*
  # Add User Roles and Update RLS Policies

  1. Changes
    - Create user_roles table to store role information
    - Add foreign key to auth.users
    - Update RLS policies on work_logs to support admin role
    - Admin users can view all work logs
    - Staff users can only view their own work logs

  2. New Tables
    - `user_roles`
      - `user_id` (uuid, references auth.users, primary key)
      - `role` (text, either 'admin' or 'staff', default 'staff')
      - `email` (text, stores user email for admin dashboard)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  3. Security
    - Enable RLS on user_roles table
    - Users can view their own role
    - Update work_logs SELECT policy to allow admins to see all logs

  4. Important Notes
    - By default, all new users will be 'staff'
    - To create an admin, manually update the user_roles table
    - Admin role is checked via JOIN with user_roles table in RLS policies
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies - admins can view all user roles, staff can view their own
CREATE POLICY "Users can view roles based on permission"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create function to automatically create staff role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, email)
  VALUES (NEW.id, 'staff', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add role when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop existing work_logs SELECT policy
DROP POLICY IF EXISTS "Users can view own work logs" ON work_logs;

-- Create new work_logs SELECT policy that supports admin role
CREATE POLICY "Users can view work logs based on role"
  ON work_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Keep other policies unchanged (insert, update, delete still only for own logs)