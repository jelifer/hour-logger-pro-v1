/*
  # Add Name Columns to User Roles Table

  1. Changes
    - Add first_name column to user_roles table
    - Add last_name column to user_roles table
    - These columns store user's first and last names for display purposes

  2. Columns Added
    - `first_name` (text, nullable) - User's first name
    - `last_name` (text, nullable) - User's last name

  3. Important Notes
    - Columns are nullable to support existing users who signed up before this feature
    - New users will have their names populated during registration
    - Existing users can add their names through the profile page
*/

-- Add first_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN first_name text;
  END IF;
END $$;

-- Add last_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN last_name text;
  END IF;
END $$;
