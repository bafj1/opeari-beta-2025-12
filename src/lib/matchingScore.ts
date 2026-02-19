/**
 * matchingScore.ts
 * 
 * Computes a weighted compatibility score (0-100) between a viewer and a candidate.
 * Used by the Matches page to rank and filter discovery results.
 * 
 * Score Weights:
 *   Schedule overlap:    30 points max
 *   Care type alignment: 20 points max
 *   Age group match:     15 points max
 *   Location proximity:  15 points max
 *   Language overlap:    10 points max
 *   Practical match:     10 points max  (lifestyle + transportation + overnight + support)
 */

export interface MatchSignal {
    icon: string;
    label: string;
    weight: number; // How much this contributed to the score
}

export interface MatchResult {
    score: number;          // 0-100
    signals: MatchSignal[];
    scheduleOverlap: number; // 0-100 (for MatchCard compat)
    matchDays: string[];     // Formatted day names for MatchCard
    distance: number;        // Estimated miles
}

export function computeMatchScore(viewer: any, candidate: any): MatchResult {
    const signals: MatchSignal[] = [];
    let totalScore = 0;

    // --- 1. Schedule Overlap (30 pts max) ---
    const myDays = viewer.availability_days || [];
    const theirDays = candidate.availability_days || [];
    const commonDays = myDays.filter((d: string) => theirDays.includes(d));

    const scheduleScore = myDays.length > 0
        ? Math.round((commonDays.length / myDays.length) * 30)
        : 0;
    totalScore += scheduleScore;

    const dayNames: Record<string, string> = {
        mon: 'Mon', tue: 'Tue', wed: 'Wed',
        thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'
    };
    const matchDays = commonDays.map((d: string) => dayNames[d] || d);

    if (commonDays.length > 0) {
        signals.push({
            icon: '📅',
            label: commonDays.length <= 3
                ? `${matchDays.join(', ')} overlap`
                : `${commonDays.length} days overlap`,
            weight: scheduleScore
        });
    }

    // --- 2. Care Type Alignment (20 pts max) ---
    const myCareTypes = viewer.care_types || [];
    const theirCareTypes = candidate.care_types || [];
    const sharedCare = myCareTypes.filter((c: string) => theirCareTypes.includes(c));

    if (myCareTypes.length > 0 && sharedCare.length > 0) {
        const careScore = Math.round((sharedCare.length / myCareTypes.length) * 20);
        totalScore += careScore;

        const careLabels: Record<string, string> = {
            'babysitter': 'babysitter', 'nanny': 'nanny', 'nanny-share': 'nanny share',
            'mothers-helper': "mother's helper", 'backup-care': 'backup care',
            'household-manager': 'household manager', 'special-needs': 'special needs care'
        };
        const label = careLabels[sharedCare[0]] || sharedCare[0].replace(/-/g, ' ');
        signals.push({
            icon: '✨',
            label: sharedCare.length > 1
                ? `${sharedCare.length} care types match`
                : `Both need ${label}`,
            weight: careScore
        });
    }

    // --- 3. Age Group Match (15 pts max) ---
    const myPrefs = viewer.matching_prefs || {};
    const myAgeNeeds = myPrefs.age_ranges_need || viewer.children_age_groups || [];
    const theirAgeGroups = candidate.children_age_groups || [];
    const sharedAges = myAgeNeeds.filter((a: string) => theirAgeGroups.includes(a));

    if (myAgeNeeds.length > 0 && sharedAges.length > 0) {
        const ageScore = Math.round((sharedAges.length / myAgeNeeds.length) * 15);
        totalScore += ageScore;

        const ageLabels: Record<string, string> = {
            'Infant (0-1)': 'infants', 'Toddler (1-3)': 'toddlers',
            'Preschool (3-5)': 'preschoolers', 'School Age (5-12)': 'school-age kids',
            'infants': 'infants', 'toddlers': 'toddlers', 'preschool': 'preschoolers',
            'school_age': 'school-age kids', 'teens': 'teens'
        };
        const label = ageLabels[sharedAges[0]] || sharedAges[0];
        signals.push({
            icon: '👶',
            label: `Both have ${label}`,
            weight: ageScore
        });
    }

    // --- 4. Location Proximity (15 pts max) ---
    let distance = 10.0; // Default unknown
    let locationScore = 0;

    if (candidate.zip_code && viewer.zip_code) {
        if (candidate.zip_code === viewer.zip_code) {
            distance = 0.5;
            locationScore = 15;
            signals.push({ icon: '📍', label: 'Same zip code', weight: 15 });
        } else if (candidate.neighborhood && viewer.neighborhood &&
            candidate.neighborhood.toLowerCase() === viewer.neighborhood.toLowerCase()) {
            distance = 1.5;
            locationScore = 12;
            signals.push({ icon: '📍', label: 'Same neighborhood', weight: 12 });
        } else {
            // Different area — give partial credit
            distance = 5.0;
            locationScore = 5;
        }
    }
    totalScore += locationScore;

    // --- 5. Language Overlap (10 pts max) ---
    const myLangs = (viewer.languages || []).map((l: string) => l.toLowerCase());
    const theirLangs = (candidate.languages || []).map((l: string) => l.toLowerCase());
    const sharedLangs = myLangs.filter((l: string) => theirLangs.includes(l));

    if (myLangs.length > 0 && sharedLangs.length > 0) {
        const langScore = Math.round((sharedLangs.length / myLangs.length) * 10);
        totalScore += langScore;

        if (sharedLangs.length > 0) {
            const formatted = sharedLangs.map((l: string) => l.charAt(0).toUpperCase() + l.slice(1));
            signals.push({
                icon: '🗣',
                label: formatted.length <= 2
                    ? `Both speak ${formatted.join(' & ')}`
                    : `${formatted.length} shared languages`,
                weight: langScore
            });
        }
    }

    // --- 6. Practical + Lifestyle Match (10 pts max) ---
    // Replaces Support Alignment (5) + Lifestyle Match (5) with a single practical section
    let practicalScore = 0;

    // Smoke-free alignment
    if (viewer.smoke_free_required && candidate.smoke_free_required) practicalScore += 2;

    // Pet comfort alignment
    if (viewer.comfortable_with_pets && candidate.comfortable_with_pets) practicalScore += 1;

    // Schedule flexibility
    if (viewer.schedule_flexible && candidate.schedule_flexible) practicalScore += 1;

    // Transportation match
    if (viewer.role === 'family' && viewer.needs_caregiver_driver && candidate.has_transportation) {
        practicalScore += 3;
        signals.push({ icon: '🚗', label: 'Has own transportation', weight: 3 });
    } else if (viewer.role === 'caregiver' && viewer.has_transportation && candidate.zip_code) {
        practicalScore += 2;
    }

    // Overnight alignment
    if (viewer.role === 'family' && candidate.overnight_available) {
        practicalScore += 1;
    }

    // Support offered overlap (minor signal)
    const mySupport = viewer.support_offered || [];
    const theirSupport = candidate.support_offered || [];
    if (Array.isArray(mySupport) && Array.isArray(theirSupport)) {
        const sharedSupport = mySupport.filter((s: string) =>
            theirSupport.some((t: string) => t.toLowerCase() === s.toLowerCase())
        );
        if (sharedSupport.length > 0) {
            practicalScore += 2;
            signals.push({
                icon: '🤝',
                label: `Both offer ${sharedSupport[0].toLowerCase()}`,
                weight: 2
            });
        }
    }

    // Physical capability match (family has stairs/needs lifting + caregiver can handle)
    if (viewer.role === 'family' && viewer.has_stairs && candidate.comfortable_with_stairs) {
        practicalScore += 1;
    }
    if (viewer.role === 'family' && candidate.can_lift_30lbs) {
        practicalScore += 1;
    }

    // Parking bonus (caregiver drives + family has parking = less friction)
    if (candidate.has_transportation && viewer.has_parking) {
        signals.push({ icon: '🅿️', label: 'Parking available', weight: 1 });
    }

    totalScore += Math.min(practicalScore, 10);

    // Compute schedule overlap percentage for MatchCard compatibility
    const scheduleOverlapPct = myDays.length > 0
        ? Math.round((commonDays.length / myDays.length) * 100)
        : 0;

    return {
        score: Math.min(totalScore, 100),
        signals: signals.sort((a, b) => b.weight - a.weight).slice(0, 4),
        scheduleOverlap: scheduleOverlapPct,
        matchDays,
        distance,
    };
}

/**
 * Apply "show_me" filter from matching preferences
 */
export function filterByShowMe(candidates: any[], showMe: string): any[] {
    if (showMe === 'both' || !showMe) return candidates;
    if (showMe === 'parents') return candidates.filter(c => c.role === 'family');
    if (showMe === 'caregivers') return candidates.filter(c => c.role === 'caregiver');
    return candidates;
}

/**
 * Apply care type filter
 */
export function filterByCareTypes(candidates: any[], careTypes: string[]): any[] {
    if (!careTypes || careTypes.length === 0) return candidates;
    return candidates.filter(c => {
        const theirTypes = c.care_types || [];
        return careTypes.some((ct: string) => theirTypes.includes(ct));
    });
}

/**
 * Apply age group filter
 */
export function filterByAgeGroups(candidates: any[], ageGroups: string[]): any[] {
    if (!ageGroups || ageGroups.length === 0) return candidates;
    return candidates.filter(c => {
        const theirAges = c.children_age_groups || [];
        return ageGroups.some((ag: string) => theirAges.includes(ag));
    });
}

/**
 * Apply language filter
 */
export function filterByLanguages(candidates: any[], languages: string[]): any[] {
    if (!languages || languages.length === 0) return candidates;
    const lowerLangs = languages.map(l => l.toLowerCase());
    return candidates.filter(c => {
        const theirLangs = (c.languages || []).map((l: string) => l.toLowerCase());
        return lowerLangs.some(l => theirLangs.includes(l));
    });
}

/**
 * Apply timeline filter (ASAP only)
 */
export function filterByTimeline(candidates: any[], asapOnly: boolean): any[] {
    if (!asapOnly) return candidates;
    return candidates.filter(c => c.timeline === 'asap');
}
