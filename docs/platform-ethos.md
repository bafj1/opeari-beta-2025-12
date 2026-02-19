# Opeari Platform Ethos & Safety Rules

## Last Updated: February 15, 2026

---

## Core Identity

**Opeari connects families who want to share care arrangements and helps them find professional caregivers.**

Opeari is a community platform, not an employment agency. We facilitate introductions and help families organize their own care arrangements. We do not employ, vet, guarantee, or insure any user on the platform.

---

## User Roles

### 1. Parent / Family

- Primary role: seeking care, sharing care, building village
- Activities: nanny shares, carpools, playdates, backup care swaps, school pickup coordination
- Parent-to-parent interactions are **neighborly reciprocity**, not professional caregiving
- Parents do NOT need background checks for parent-to-parent connections
- Parents cannot list themselves as available-for-hire caregivers through the parent role

### 2. Professional Caregiver

- Primary role: providing professional childcare services
- Activities: nanny positions, babysitting, mother's helper, household management, special needs care
- Must complete caregiver onboarding (separate from parent onboarding)
- Verified identity required
- Background check: **strongly recommended**, earns trust badge
- References: optional, earns trust badge

### 3. Hybrid User (Parent + Caregiver)

- A parent who ALSO happens to be a professional caregiver
- Example: a nanny who has their own children, an early childhood educator who is also a mom
- Must explicitly opt into the caregiver role — this is a conscious choice, not automatic
- Caregiver requirements apply to their caregiver profile
- Their parent profile and caregiver profile coexist but serve different purposes
- This is NOT a path for "any parent who wants extra income watching kids"

---

## What Opeari Is NOT

- **Not an employment agency.** We don't employ caregivers or manage payroll.
- **Not a gig platform.** We don't enable "side hustle childcare" for parents.
- **Not a vetting service.** We provide tools (background checks, references, verification) but families make their own decisions.
- **Not a guarantee.** Connecting on Opeari does not constitute an endorsement by Opeari.

---

## Background Check Policy

### Required: Nobody (yet)

- Background checks are not currently required for any user
- This may change as the platform scales

### Strongly Recommended: Professional Caregivers

- Any user in the caregiver role is strongly encouraged to complete a background check
- Completing one earns a visible "Background Checked" trust badge
- Planned integration: Checkr

### Optional: Parents

- Parents can opt into a background check as a trust signal
- This is a "nice to have" for nanny share partners who want extra assurance
- Never required for parent-to-parent connections

### Not Applicable: Parent-to-Parent Reciprocity

- Playdate hosting, carpool, backup care swaps between families
- These are neighborly arrangements, not professional care
- Background checks would change the nature of these relationships

---

## Trust & Safety Tiers

### Tier 1: Basic (All Users)

- Email verified (via Supabase Auth)
- Profile completed
- Accepted community guidelines

### Tier 2: Verified (Optional for Parents, Recommended for Caregivers)

- Phone number verified
- Identity confirmed (name matches)

### Tier 3: Trusted (Caregivers)

- Background check completed (Checkr)
- At least 1 reference provided and contacted
- Earns "Trusted Caregiver" badge

### Tier 4: Village Endorsed (Future)

- Multiple positive interactions within their village
- Connected members can vouch/endorse
- Organic trust built through platform usage

---

## Liability & Legal Position

### Platform Disclaimer (to be reviewed by legal counsel)

- Opeari facilitates introductions between families and caregivers
- Opeari does not employ, supervise, or control any caregiver
- Opeari does not guarantee the quality, safety, or reliability of any user
- Families are responsible for their own due diligence
- All care arrangements are made directly between users
- Opeari is not a party to any employment or care agreement

### Nanny Share Specifics

- In a nanny share, families co-employ the nanny — Opeari is not the employer
- Opeari helps families find nanny share partners — the legal relationship is between the families and the nanny
- Families are responsible for payroll, taxes, insurance, and contracts

---

## Implications for Product Development

### Caregiver Onboarding Must Include

- Clear explanation that they are listing as a professional caregiver
- Identity verification step
- Background check invitation (not gate — don't block onboarding)
- Agreement to caregiver-specific community guidelines
- Option to indicate certifications, experience, references

### Parent Experience Should NOT

- Suggest parents can "earn money" watching other kids
- Frame parent-to-parent help as a service marketplace
- Require background checks for community features
- Position playdates or backup swaps as professional care

### Matching Algorithm Should

- Clearly distinguish caregiver results from parent results
- Show trust badges prominently (verified, background checked, references)
- Allow parents to filter for "background checked only" in caregiver searches
- Not apply caregiver filters to parent-to-parent discovery

### Profile Display Should

- Show role clearly (Parent vs. Caregiver vs. Both)
- Display trust badges earned
- For hybrid users: show separate sections for parent info and caregiver qualifications
- Never show a parent as a "caregiver" unless they've opted in

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-15 | Parents cannot list as caregivers without explicit opt-in | Prevents liability, maintains platform identity |
| 2026-02-15 | Background checks recommended, not required for caregivers | Don't gate access, but incentivize trust signals |
| 2026-02-15 | Parent-to-parent connections never require background checks | Preserves neighborly, community feel |
| 2026-02-15 | Opeari facilitates, does not employ or guarantee | Core legal position |
| 2026-02-15 | Hybrid users must explicitly opt into caregiver role | Conscious choice with different requirements |
