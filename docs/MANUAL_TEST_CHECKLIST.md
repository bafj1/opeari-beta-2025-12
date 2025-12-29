# Opeari Onboarding & Vetting Test Checklist

## Prerequisites

- [ ] Logged into Supabase dashboard to verify data
- [ ] Have access to test email account (for magic links)

## Test A: Unauthenticated Access

1. Open incognito browser
2. Go to: `https://opeari.com/onboarding` (or localhost)
3. **Expected**: Redirects to `/signin`
4. Result: [ ] PASS  [ ] FAIL

## Test B: Seeker Flow (No Vetting)

1. Sign in via magic link
2. Go to `/onboarding`
3. Select "I'm exploring care options"
4. Select only: "Nanny Share", "Backup Care" (do **NOT** select any "Offer Support" options)
5. Complete all steps
6. **Expected**: Redirects to `/dashboard`
7. **Verify**: No "Hosting locked" banner
8. **Verify in Supabase**: `vetting_required = false`
9. Result: [ ] PASS  [ ] FAIL

## Test C: Host Flow (Vetting Required)

1. Sign in (new user or clear existing data)
2. Go to `/onboarding`
3. Select "I'm exploring care options"
4. Select "Host Nanny Share" or "Care Exchange" (under Offer Support)
5. Complete all steps
6. **Expected**: Redirects to `/verify` (NOT `/dashboard`)
7. **Verify in Supabase**: `vetting_required = true`, `vetting_status = 'required'`
8. Result: [ ] PASS  [ ] FAIL

## Test D: Maybe Later

1. On `/verify` page
2. Click "Maybe Later"
3. **Expected**: Redirects to `/dashboard`
4. **Verify**: Shows "Hosting is locked" banner
5. Result: [ ] PASS  [ ] FAIL

## Test E: Continue to Verification

1. Click "Verify to Host →" on the dashboard banner (or go to `/verify`)
2. Click "Continue to Verification"
3. **Expected**: Success message / State change
4. **Verify in Supabase**: `vetting_status = 'pending'`
5. Result: [ ] PASS  [ ] FAIL

## Test F: Caregiver Interest Flow

1. Open incognito
2. Go to `/onboarding`
3. Select "I provide childcare"
4. Click Next
5. **Expected**: Redirects to `/caregiver-interest`
6. Fill form and submit
7. **Verify in Supabase**: New row in `caregiver_interest` table
8. Result: [ ] PASS  [ ] FAIL
