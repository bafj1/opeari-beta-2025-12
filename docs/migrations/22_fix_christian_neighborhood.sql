-- Fix data issue where neighborhood is set to 'test'
UPDATE members 
SET neighborhood = NULL 
WHERE id = '3a092606-43cf-43cf-4b50-b5de-0a911f38e333' AND neighborhood = 'test';
