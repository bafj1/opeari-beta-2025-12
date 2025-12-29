# Waitlist Table Audit & Cleanup Report

## Executive Summary

This audit identified a discrepancy between the codebase and the database:

- **Active Code (`Waitlist.tsx`)**: Writes to `waitlist_entries`.
- **Legacy Table (`waitlist`)**: Contains 10 rows of older data and a superset of columns.
- **Goal**: Standardize on a clean schema (likely for `waitlist` as the canonical name).

## Task 1: Current vs. Active Schema

### Active Inputs (from `Waitlist.tsx`)

These are the fields currently collected from users:

- `first_name`, `last_name`
- `email`
- `zip_code`
- `role` (mapped to `user_type` in legacy)
- `looking_for` (mapped to `urgency` in legacy)
- `why_join`
- `hear_about_us` (mapped to `referral_source` in legacy)
- `referred_by` (mapped to `referral_name` in legacy)
- `linkedin_url`
- `referral_code`

### Legacy Columns (from `waitlist` table introspection)

Found 28 columns. Many are unused or duplicates.

## Task 4: Assessment

### ✅ KEEP (Essential)

| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `created_at` | TIMESTAMPTZ | Default NOW() |
| `email` | TEXT | Unique Identifier |
| `first_name` | TEXT | |
| `last_name` | TEXT | |
| `zip_code` | TEXT | Routing/Vetting |
| `role` | TEXT | (Replacing `user_type` for consistency with valid values: `family`, `caregiver`) |
| `status` | TEXT | Enum: `pending`, `approved`, `rejected` |
| `referral_code` | TEXT | Generated code for the user |

### 🤔 REVIEW (Discuss)

| Column | Current State | Recommendation |
| :--- | :--- | :--- |
| `looking_for` | Active Input | **Keep**. Valuable signal for sorting urgency. |
| `why_join` | Active Input | **Keep**. Open-ended text useful for vetting. |
| `linkedin_url` | Active Input | **Keep**. High value for identity verification. |
| `hear_about_us` | Active Input | **Keep**. Critical for marketing attribution. |
| `referred_by` | Active Input | **Keep**. Tracks network effects. |
| `approved_at` | Metadata | **Keep**. Useful for audit logs. |
| `invited_at` | Metadata | **Keep**. Tracks when invitation email was sent. |
| `review_notes` | Admin | **Keep**. Useful for admin vetting context. |

### ❌ REMOVE (Deprecated / Redundant)

| Column | Reason |
| :--- | :--- |
| `user_type` | Duplicate of `role`. |
| `urgency` | Duplicate of `looking_for`. |
| `referral_source` | Duplicate of `hear_about_us`. |
| `referral_name` | Duplicate of `referred_by`. |
| `interests` | Not collected. |
| `situation` | Not collected. |
| `childcare_challenge`| Not collected. |
| `social_handle` | Not collected (replaced by LinkedIn). |
| `invite_sent` | Redundant with `invited_at` (not null). |
| `approved` | Redundant with `status = 'approved'`. |
| `heard_from` | Duplicate of `hear_about_us`. |
| `referral_count` | Computed value (should differ to a view or count query). |
| `position` | Computed value (based on created_at). |

## Task 5: Proposed Clean Schema

This schema standardizes naming to match the codebase (`Waitlist.tsx`) and strict typing.

```sql
CREATE TABLE waitlist_clean (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  zip_code TEXT NOT NULL CHECK (length(zip_code) = 5),
  linkedin_url TEXT,

  -- Routing & Context
  role TEXT NOT NULL CHECK (role IN ('family', 'caregiver', 'both')),
  looking_for TEXT, -- e.g. 'asap', '1-3months'
  why_join TEXT,

  -- Attribution
  hear_about_us TEXT, -- e.g. 'friend', 'google'
  referred_by TEXT, -- Name of referrer

  -- System / Status
  referral_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  review_notes TEXT
);
```

## Task 6: Migration Plan

1. **Backup**: Export `waitlist` (Legacy) and `waitlist_entries` (Active) to CSV.
2. **Unify**: Map columns from both sources into the new schema structure.
3. **Create**: Create the new table `waitlist` (or replace existing).
4. **Migrate Data**: Insert transformed rows.
5. **Code Update**: Update `Waitlist.tsx`, `AdminWaitlist.tsx`, and Netlify Functions to point to the definitive `waitlist` table.

---
**Question for Breada**:

- Confirm that `waitlist_entries` is indeed the table you want to consolidate *into* `waitlist`?
- Are there any fields in the "Remove" list that you want to resurrect?
