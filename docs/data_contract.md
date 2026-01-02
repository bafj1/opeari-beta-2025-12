# Opeari Data Contract: Settings & Onboarding Persistence

**Status**: Draft
**Last Updated**: 2026-01-02

This document defines the canonical mapping between user-facing fields (Onboarding/Settings) and the Supabase database schema. **Settings is the canonical editor** for all fields seeded during Onboarding.

## 1. Terminology

* **Member**: Any registered user (Family or Caregiver).
* **Role**: STRICTLY `'family'` (was parent) or `'caregiver'`.
* **Village Intent**: How a member wants to help (Offer Support) or be helped (Find Support) within the community, independent of their primary role.

## 2. Shared Identity (Table: `members`)

These fields define the core identity and are editable by **ALL** members in **Settings > Profile**.

| Field Name | Type | Source (Onboarding) | Notes |
| :--- | :--- | :--- | :--- |
| `first_name` | `text` | `firstName` | Required |
| `last_name` | `text` | `lastName` | Required |
| `phone` | `text` | `phone` | Normalized (digits only ideal) |
| `zip_code` | `text` | `zipCode` | 5 digits |
| `neighborhood` | `text` | `neighborhood` | Nullable |
| `bio` | `text` | `bio` | Personal bio |
| `languages` | `text[]` | `languages` (Settings only) | Spoken languages |

## 3. Family Needs (Table: `members`)

These fields are relevant when `role = 'family'`. Editable in **Settings > Family Needs**.

| Field Name | Type | Source (Onboarding) | Notes |
| :--- | :--- | :--- | :--- |
| `care_types` | `text[]` | `careOptions` | e.g. ['nanny_share', 'backup_care'] |
| `children_age_groups` | `text[]` | `kids` (derived ages) | e.g. ['infant', 'toddler'] |
| `availability_days` | `text[]` | `schedule` (derived) | Days needing care |
| `availability_blocks` | `text[]` | `schedule` (derived) | Time blocks needing care |
| `special_availability` | `text[]` | `specificNeeds` (mapped) | e.g. 'sick_care', 'overnight' |
| `budget_tiers` | `text[]` | N/A (Settings only) | e.g. ['20-25'] |
| `transportation_required` | `bool` | N/A (Settings only) | |
| `require_identity_verified`| `bool` | N/A (Settings only) | |
| `require_background_verified`| `bool` | N/A (Settings only) | |
| `language_requirement` | `text` | N/A (Settings only) | 'nice_to_have' or 'must_have' |

## 4. Caregiver Profile (Table: `caregiver_profiles`)

These fields are relevant when `role = 'caregiver'`. Editable in **Settings > Experience & Logistics**.
**Foreign Key**: `user_id` references `members.id`.

| Field Name | Type | Source (Onboarding) | Notes |
| :--- | :--- | :--- | :--- |
| `role_type` | `text` | `caregiverRole` | Primary role (e.g. 'nanny') |
| `secondary_roles` | `text[]` | `secondaryRoles` | |
| `years_experience` | `text` | `yearsExperience` | e.g. '5-10' |
| `hourly_rate` | `int4` | `hourlyRate` | Integer ($/hr) |
| `age_groups` | `text[]` | `ageGroups` | Ages comfortable with |
| `logistics` | `text[]` | `logistics` | e.g. ['own_car', 'cpr'] |
| `certifications` | `jsonb` | `certifications` | `[{name: 'CPR', verified: false}]` |
| `transportation` | `text` | `logistics` (derived) | 'own_car', 'public_transit', 'none' |
| `availability_days` | `text[]` | `availabilityType` (mapped) | Manual edit in Settings |
| `availability_blocks` | `text[]` | `availabilityType` (mapped) | Manual edit in Settings |
| `languages` | `text[]` | N/A (Settings only) | Specific to caregiving if diff from profile |

## 5. Village Intent (Table: `members`)

These fields allow **ALL** members to participate in the community economy. Editable in **Settings > Village Intent**.

| Field Name | Type | Source (Onboarding) | Notes |
| :--- | :--- | :--- | :--- |
| `support_needed` | `text[]` | TBD | e.g. ['meal_prep', 'carpool'] |
| `support_offered` | `text[]` | TBD | e.g. ['pet_sitting', 'tutoring'] |
| `support_notes` | `text` | TBD | Freeform notes |

## 6. Migration Requirements

Ensure the following column modifications are applied:

1. Add `neighborhood` (text) to `members`.
2. Add `languages` (text[]) to `members`.
3. Add `support_needed` (text[]) to `members`.
4. Add `support_offered` (text[]) to `members`.
5. Add `support_notes` (text) to `members`.
6. Ensure `caregiver_profiles.languages` exists (text[]).

## 7. Verification Smoke Test

See `docs/data_integrity_smoke_test.md` for manual verification steps.
