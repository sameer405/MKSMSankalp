-- Create settings table for admin-configurable values
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default target hours (51,000 hours = 3,060,000 minutes)
INSERT INTO public.settings (key, value, description)
VALUES ('target_practice_minutes', '3060000', 'Total target practice minutes for the community (51,000 hours)')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for settings table
CREATE TRIGGER set_timestamp_settings 
BEFORE UPDATE ON public.settings
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create index on settings key
CREATE INDEX idx_settings_key ON public.settings (key);

-- Add comments
COMMENT ON TABLE public.settings IS 'Admin-configurable system settings';
COMMENT ON COLUMN public.settings.key IS 'Unique identifier for the setting';
COMMENT ON COLUMN public.settings.value IS 'Setting value (stored as text, cast as needed)';

