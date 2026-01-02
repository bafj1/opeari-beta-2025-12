# Data Integrity Smoke Test

**Objective**: Verify that member data flows correctly from Onboarding -> Supabase -> Settings -> Supabase.

## Test 1: Family Member Lifecycle

1. **Create Account**
    * Sign up as a new user (Role: Family).
    * Complete Onboarding fully (Name, Zip, Care Options, Schedule, Kids).
    * **Verify DB**: Check `members` table for new row.
        * `role` = 'family'
        * `care_types` populated?
        * `children_age_groups` derived correctly?

2. **View Settings**
    * Go to `/settings`.
    * **Verify UI**:
        * **Profile Tab**: Name, Zip, Phone prefilled?
        * **Family Needs Tab**: Care Types, Schedule prefilled?
        * **Village Intent Tab**: Empty (default) or prefilled if added to onboarding?

3. **Edit & Persist**
    * Change `Last Name` in Profile.
    * Add `Special Availability` in Family Needs.
    * Add `Support Needed` (e.g. 'carpool') in Village Intent.
    * Click Save for each section.
    * **Refresh Page**: Verify changes persist.

## Test 2: Caregiver Member Lifecycle

1. **Create Account**
    * Sign up as new user (Role: Caregiver).
    * Complete Onboarding (Experience, Rates, Logistics).
    * **Verify DB**: Check `caregiver_profiles` table.
        * `hourly_rate` is integer?
        * `certifications` is JSONB array?
        * `user_id` links to `members.id`.

2. **View Settings**
    * Go to `/settings`.
    * **Verify UI**:
        * **Care Tab**: Should be "Experience & Logistics".
        * Verify Rate, Experience, Roles prefilled.

3. **Edit & Persist**
    * Change `Hourly Rate` to new value.
    * Add `Support Offered` (e.g. 'cooking') in Village Intent.
    * Click Save.
    * **Refresh Page**: Verify changes persist.

## Test 3: Role-Awareness

1. **Family View**
    * Ensure "Experience & Logistics" tab is **HIDDEN** (Label shows "Family Needs").
    * Ensure "Family Needs" tab is **VISIBLE** (Label shows "Family Needs").

2. **Caregiver View**
    * Ensure "Family Needs" tab is **HIDDEN** (Label shows "Experience & Logistics").
    * Ensure "Experience & Logistics" tab is **VISIBLE** (Label shows "Experience & Logistics").

3. **Village Intent**
    * Ensure **VISIBLE** for both roles.

## Verification SQL Snippets

Run these in Supabase SQL Editor to confirm data integrity:

```sql
-- 1. Confirm Role Normalization (Should be 0 parents)
SELECT role, count(*) FROM members GROUP BY role;
-- EXPECT: 'family' and 'caregiver' counts only.

-- 2. Confirm strict 'parent' removal
SELECT count(*) FROM members WHERE role='parent'; 
-- EXPECT: 0
```
