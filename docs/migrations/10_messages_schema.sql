-- Migration: 10_messages_schema.sql
-- Description: Create conversations and messages tables

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES members(id),
    participant_2 UUID NOT NULL REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_1, participant_2)
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES members(id),
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add RLS policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (
        auth.uid() = participant_1 OR auth.uid() = participant_2
    );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

-- 4. Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
