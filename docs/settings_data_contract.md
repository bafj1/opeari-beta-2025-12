# Settings V1.2 Data Contract

This document maps all inputs in the Settings panels to their source of truth in the database.

## 1. Profile Panel (`members` table)

| UI Field | DB Column | Type | Notes |
| :--- | :--- | :--- | :--- |
| **Profile Photo** | `avatar_url` | `text` | Stored in `avatars` bucket, public URL saved here. Replaces `photo_url`. |
| First Name | `first_name` | `text` | |
| Last Name | `last_name` | `text` | |
| Phone | `phone` | `text` | |
| Zip Code | `zip_code` | `text` | |
| Neighborhood | `neighborhood` | `text` | |
| Languages | `languages` | `text[]` | UI uses comma-sep string, parsed to array on save. |
| Bio | `bio` | `text` | |
| **Instagram** | `instagram_handle` | `text` | **[NEW]** Optional social handle. |
| **LinkedIn** | `linkedin_url` | `text` | **[NEW]** Optional social URL. |
| **Facebook** | `facebook_url` | `text` | **[NEW]** Optional social URL. |

## 2. Kids Panel (`kids` table)

> **[NEW]** Child data is no longer stored in `members.children_metadata` JSON. It is now normalized in a separate table.

| UI Field | DB Column | Type | Notes |
| :--- | :--- | :--- | :--- |
| Name | `name` | `text` | |
| Birth Year | `birth_year` | `int` | |
| Notes | `notes` | `text` | |
| *Hidden* | `user_id` | `uuid` | Foreign key to `auth.users(id)`. |

## 3. Care / Family Needs (`members` table)

| UI Field | DB Column | Type | Notes |
| :--- | :--- | :--- | :--- |
| Care Type Needed | `care_types` | `text[]` | Recurring, Occasional, etc. |
| Age Groups | `children_age_groups`| `text[]` | General age ranges needed (Infant, Toddler, etc.) |
| Budget | `budget_tier` | `text` | Single select enum string (e.g. '25-35'). |
| Days Needed | `availability_days` | `text[]` | Mon, Tue, etc. |
| Time Blocks | `availability_blocks`| `text[]` | Morning, Afternoon, etc. |
| Flexible Schedule | `schedule_flexible`| `boolean`| |
| Special Requsts | `special_availability`| `text[]` | Travel, Live-in. |
| Language Pref | `language_requirement`| `text` | 'must_have', 'nice_to_have' |
| Transportation | `transportation_required`| `bool` | |
| ID Verified | `require_identity_verified`| `bool` | |
| Background Check | `require_background_verified`| `bool` | |

## 4. Care / Caregiver Experience (`caregiver_profiles` table)

| UI Field | DB Column | Type | Notes |
| :--- | :--- | :--- | :--- |
| Primary Role | `role_type` | `text` | Nanny, Babysitter, etc. |
| Years Exp | `years_experience` | `text` | |
| Hourly Rate | `hourly_rate` | `int` | |
| Secondary Roles | `secondary_roles` | `text[]` | |
| Days Available | `availability_days` | `text[]` | |
| Time Blocks | `availability_blocks`| `text[]` | |
| Age Experience | `age_groups` | `text[]` | |
| Logistics | `logistics` | `text[]` | Driver, Cook, etc. |
| Certifications | `certifications` | `jsonb` | Array of objects `{ name: string, verified: boolean }`. |
| Transportation | `transportation` | `text` | 'own_car', 'public_transit', 'none' |
| Languages | `languages` | `text[]` | |

## 5. Village Intent (`members` table)

| UI Field | DB Column | Type | Notes |
| :--- | :--- | :--- | :--- |
| Support Offered | `support_offered` | `text[]` | Meal train, Carpool, etc. |
| Support Needed | `support_needed` | `text[]` | |
| Notes | `support_notes` | `text` | |

## 6. Schedule (`members` table)

| UI Field | DB Column | Type | Notes |
| :--- | :--- | :--- | :--- |
| Schedule Notes | `schedule_notes` | `text` | **[NEW]** Free text for specific schedule details. |
| *Summary* | *derived* | - | Displays `availability_days` and `availability_blocks`. |

## Migration Notes

- **Kids**: `user_id` FK references `auth.users(id)`.
- **Budget**: Migrated from `budget_tiers` (array) to `budget_tier` (string).
- **Socials**: New columns added to `members`.
- **Photos**: Migrating to `avatar_url` (Supabase Storage).
