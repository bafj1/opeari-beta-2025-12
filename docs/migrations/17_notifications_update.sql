-- Add care_need_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'care_need_id') THEN
        ALTER TABLE notifications ADD COLUMN care_need_id uuid;
    END IF;
END $$;

-- Update the type check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'mention', 
    'like', 
    'comment', 
    'reply', 
    'connection_request', 
    'connection_accepted', 
    'connection', -- Keeping for backward compatibility if any exist
    'care_need', 
    'match', 
    'message', 
    'report_resolved'
));
