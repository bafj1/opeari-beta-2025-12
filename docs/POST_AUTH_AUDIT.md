# Opeari Post-Auth Audit & Wiring Plan

**Status**: Final
**Date**: 2026-01-17
**Scope**: /village, /settings, /profile

---

## 1. Page-by-Page Data Map

### A. /village (Parent Dashboard)

**File**: `src/pages/Village.tsx`

| UI Section | Displayed Fields | Current Data Source | Canonical Source (Recommendation) | Gaps / Issues |
| :--- | :--- | :--- | :--- | :--- |
| **Header** | Neighborhood | `viewer.member.neighborhood` | `members.neighborhood` | Fallback "Your Neighborhood" logic is good, but relies on `viewer` being loaded. |
| **Stats** | "This Week's Potential" | **MOCKED** (`WEEKLY_STATS`) | `rpc/get_village_stats` (TBD) | Completely fake data. Misleading to user. |
| **Map** | "You Are Here" | `neighborhood` | `members.neighborhood` | Visual only. No real map data. |
| **Categories** | Cards (Matches, Share, Backup) | Static Links | N/A (Navigation only) | None. |
| **Active List**| "Active Right Now" | **MOCKED** (`SAMPLE_MATCHES`) | `rpc/get_recommended_members` | Fake users displayed. Needs to show real matches or Empty State. |

### B. /settings

**File**: `src/pages/Settings.tsx`

| UI Section | Fields | Current Data Source | Canonical Source | Gaps / Issues |
| :--- | :--- | :--- | :--- | :--- |
| **Profile** | Name, Phone, Zip, Bio, Neighborhood, Languages | `members` table | `members` | `languages` is string manipulation (comma-sep) -> needs array in DB but UI handles text. |
| **Care (Family)** | Care Types, Ages (Tags), Schedule (Tags), Budget | `members` table | `members` | **CRITICAL**: Updates `children_age_groups` (tags) but **cannot** edit `kids` (table). |
| **Care (CG)** | Role, Exp, Rate, Logistics, Certs | `caregiver_profiles` | `caregiver_profiles` | `certifications` acts as JSONB array. Logic seems sound. |
| **Village** | Support Needed/Offered | `members` | `members` | None. |

### C. /profile (Public View)

**File**: `src/pages/Profile.tsx`

| UI Section | Fields | Current Data Source | Canonical Source | Gaps / Issues |
| :--- | :--- | :--- | :--- | :--- |
| **Header** | Name, Neighborhood, Photo | `members` | `members` | |
| **Kids** | Gender, Age (calc) | `kids` TABLE | `kids` table | **DISCONNECT**: Settings updates `children_age_groups` tags, but Profile tries to render `kids` rows. Users have no way to add `kids` rows in Settings V1. |
| **Schedule** | Detailed Grid | `members.schedule` (JSONB) | `members.schedule` | Settings wipes this to `{}` or `null` if you change high-level tags. Detailed grid is effectively read-only/resets often. |
| **Looking For**| Care Types | `members.looking_for` | `members.care_types` | Naming alignment: `looking_for` (Profile) vs `care_types` (Settings). |

---

## 2. Canonical Data Model Recommendation

### Source of Truth

* **Role**: `auth.users.user_metadata.role` (Synced to `members.role`).
* **Top Needs**: `members.care_types` (Family) / `caregiver_profiles.role_type` (Caregiver).
* **Area Bucket**: `members.neighborhood` (Display) / `members.zip_code` (Matching).
  * *Note*: `CaregiverOpportunities` RPC returns `area_bucket`.
* **Availability**: `members.availability_days` (Array).
  * *Usage*: Search/Filtering uses the Array. Profile Grid (`schedule` JSONB) is secondary/display-only.
* **Request Visibility**: `interest_requests.visibility` ('public' vs 'village_only').

### The "Kids" Mismatch

* **Issue**: Profile page expects `kids` table rows. Settings page saves `children_age_groups` string array.
* **Decision**: **DEFERRED (Phase 2)**.
* **Interim Fix**: Profile page should fallback to displaying `children_age_groups` tags if `kids` table is empty. Do not build full Kids CRUD in settings for V1.

---

## 3. PR-Sized Wiring Plan (Ranked)

### PR 1: Fix Visual Artifacts ("000" & Nulls)

* **Goal**: Polish `CategoryOpportunities` and `IncomingInterests` to look professional.
* **Files**: `src/components/Dashboard/CaregiverOpportunities.tsx`, `IncomingInterests.tsx`.
* **Fix**:
  * Add filter: `if (area === '000' || area === '0') return 'Nearby';`
  * Ensure "Village Only" vs "Public" label logic is consistent.
* **Verification**: View Dashboard as Caregiver. Check Opportunity cards.

### PR 2: Dashboard De-Mocking & Empty States

* **Goal**: Remove misleading fake data from Parent Dashboard.
* **Files**: `src/pages/Village.tsx`.
* **Fix**:
  * Remove `WEEKLY_STATS` const. Replace section with "Schedule Sync" CTA (static placeholder) or hide.
  * Remove `SAMPLE_MATCHES`. Replace with `VillageResults` component (from file list) or simple "No active matches yet" empty state.
* **Verification**: View `/village`. Should see clean, empty state or real data (if any), no static fake "Sarah/Elena".

### PR 3: Profile Fallback for Kids

* **Goal**: Ensure Profile page looks good even without `kids` table rows.
* **Files**: `src/pages/Profile.tsx`.
* **Fix**:
  * Read `members.children_age_groups` as fallback.
  * If `kids` array is empty, render tags like "Toddler", "Infant" (from `children_age_groups`) instead of the "Add your children" link that leads to a Settings page that *can't* add children.
* **Verification**: Edit "Family Needs" in Settings. Verify Profile shows the tags.

---

## 4. Console & Network Notes

* **Observation**: `CaregiverOpportunities` RPC call handling needs robust error catching for `null` returns on joined tables.
* **Performance**: `Settings.tsx` re-fetches `viewer` frequently. Ensure `useViewer` caching is working or minimize `refresh()` calls.
