-- DIAGNOSTICS
-- Run this to see the current state of your tables

SELECT 
    table_schema, 
    table_name, 
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE 'waitlist%';

-- Check rows in backups (if they exist)
-- Note: These might error if the tables don't exist, which is good information.
SELECT 'waitlist_entries_backup' as table_name, count(*) as count FROM waitlist_entries_backup;
SELECT 'waitlist_legacy_backup' as table_name, count(*) as count FROM waitlist_legacy_backup;
