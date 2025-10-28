-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reg_no text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  batch text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create practice_entries table
CREATE TABLE IF NOT EXISTS public.practice_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_client_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reg_no text NOT NULL,
  date date NOT NULL,
  minutes integer NOT NULL CHECK (minutes >= 0 AND minutes <= 1440),
  practice_text text,
  sankalp_word text,
  airtable_record_id text,
  synced boolean DEFAULT false,
  sync_attempts integer DEFAULT 0,
  last_sync_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_practice_user_date ON public.practice_entries (user_id, date DESC);
CREATE INDEX idx_practice_regno_date ON public.practice_entries (reg_no, date DESC);
CREATE INDEX idx_practice_synced ON public.practice_entries (synced, sync_attempts);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at on both tables
CREATE TRIGGER set_timestamp_users 
BEFORE UPDATE ON public.users
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_entries 
BEFORE UPDATE ON public.practice_entries
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'Stores registered MKSM students';
COMMENT ON TABLE public.practice_entries IS 'Stores daily Riyaz practice entries';
COMMENT ON COLUMN public.practice_entries.entry_client_id IS 'Client-generated UUID for idempotency';
COMMENT ON COLUMN public.practice_entries.synced IS 'Whether entry has been synced to Airtable';
COMMENT ON COLUMN public.practice_entries.sync_attempts IS 'Number of sync attempts to Airtable';

