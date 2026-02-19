-- Drop the restrictive type CHECK and replace with expanded list
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'mention', 'like', 'comment', 'reply',
    'connection_request', 'connection_accepted', 
    'care_need', 'match', 'message',
    'village_update', 'report_resolved'
  ));

-- Add care_need_id column if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS care_need_id uuid REFERENCES care_needs(id) ON DELETE SET NULL;

-- Add link column for navigation targets
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link text;

-- RLS: Users can only read their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users read own notifications" 
  ON notifications FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" 
  ON notifications FOR UPDATE 
  USING (user_id = auth.uid());

-- Allow any authenticated user to insert (needed for createNotification)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
