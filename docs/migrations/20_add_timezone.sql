-- Add timezone column to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'PT';

-- Ensure notification_prefs column exists (idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'notification_prefs') THEN
        ALTER TABLE members ADD COLUMN notification_prefs JSONB DEFAULT '{"schedule_updates": true}'::jsonb;
    END IF;
END $$;
