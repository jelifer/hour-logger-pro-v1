/*
  # Attendance Log System

  1. New Tables
    - `work_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date, not null)
      - `time_in` (time, not null)
      - `time_out` (time, not null)
      - `break_minutes` (integer, default 0)
      - `total_hours` (numeric, calculated)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
    
    - `holidays`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `date` (date, not null, unique)
      - `is_statutory` (boolean, default true)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own work logs
    - All authenticated users can view holidays (read-only)
    - Only authenticated users can manage their work logs

  3. Indexes
    - Index on work_logs(user_id, date) for efficient querying
    - Index on holidays(date) for holiday lookups
*/

-- Create work_logs table
CREATE TABLE IF NOT EXISTS work_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  time_in time NOT NULL,
  time_out time NOT NULL,
  break_minutes integer DEFAULT 0 CHECK (break_minutes >= 0),
  total_hours numeric GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (time_out - time_in)) / 3600 - (break_minutes / 60.0)
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL UNIQUE,
  is_statutory boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_logs_user_date ON work_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Enable RLS
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Work logs policies
CREATE POLICY "Users can view own work logs"
  ON work_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work logs"
  ON work_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work logs"
  ON work_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own work logs"
  ON work_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Holidays policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view holidays"
  ON holidays FOR SELECT
  TO authenticated
  USING (true);

-- Insert Canadian statutory holidays for 2025
INSERT INTO holidays (name, date, is_statutory) VALUES
  ('New Year''s Day', '2025-01-01', true),
  ('Good Friday', '2025-04-18', true),
  ('Victoria Day', '2025-05-19', true),
  ('Canada Day', '2025-07-01', true),
  ('Civic Holiday', '2025-08-04', true),
  ('Labour Day', '2025-09-01', true),
  ('Thanksgiving', '2025-10-13', true),
  ('Christmas Day', '2025-12-25', true),
  ('Boxing Day', '2025-12-26', true)
ON CONFLICT (date) DO NOTHING;