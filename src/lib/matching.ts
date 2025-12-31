import { WEEKDAYS } from './Constants';

// --- Types ---
export type Schedule = Record<string, string[]>

export interface Kid {
    id: string
    birth_month: number | null
    birth_year: number | null
}

export interface FamilyMatch {
    id: string
    first_name: string
    location: string
    neighborhood: string
    photo_url: string | null
    nanny_situation: string
    care_timeline: string
    schedule: Schedule
    kids: Kid[]
    invited_by: string | null
    compatibility: number
    matchReasons: MatchReason[]
    overlapDays: string[]
}

export interface MatchReason {
    icon: 'schedule' | 'location' | 'kids' | 'nanny' | 'connections' | 'ready'
    text: string
    highlight?: boolean
}

export interface UserProfile {
    id: string
    schedule: Schedule
    location: string
    neighborhood: string
    nanny_situation: string
    kids: Kid[]
    invited_by: string | null
    care_timeline?: string
}

// --- Logic ---

export function calculateOverlap(userSchedule: Schedule, otherSchedule: Schedule) {
    const overlapDays: string[] = []
    let totalUserSlots = 0
    let matchingSlots = 0

    WEEKDAYS.forEach(day => {
        const userSlots = userSchedule[day.id] || []
        const otherSlots = otherSchedule[day.id] || []
        totalUserSlots += userSlots.length

        const matching = userSlots.filter(slot => otherSlots.includes(slot))
        if (matching.length > 0) {
            overlapDays.push(day.id)
            matchingSlots += matching.length
        }
    })

    const percentage = totalUserSlots > 0 ? Math.round((matchingSlots / totalUserSlots) * 100) : 0
    return { days: overlapDays, percentage }
}

export function checkKidAgeCompatibility(userKids: Kid[], otherKids: Kid[]): boolean {
    if (userKids.length === 0 || otherKids.length === 0) return false

    // Check if any kid in family B is within +/- 2 years of any kid in family A
    // (Simplified: assuming birth_year is present. In real app, handle nulls)
    const currentYear = new Date().getFullYear();

    return userKids.some(uKid => {
        const uAge = uKid.birth_year ? currentYear - uKid.birth_year : 0;
        return otherKids.some(oKid => {
            const oAge = oKid.birth_year ? currentYear - oKid.birth_year : 0;
            return Math.abs(uAge - oAge) <= 2;
        });
    });
}

export function getMatchReasons(user: UserProfile, family: FamilyMatch): MatchReason[] {
    const reasons: MatchReason[] = []

    // Schedule
    if (family.overlapDays.length > 0) {
        reasons.push({ icon: 'schedule', text: 'Schedule Match', highlight: true })
    }

    // Location
    if (user.neighborhood && family.neighborhood && user.neighborhood === family.neighborhood) {
        reasons.push({ icon: 'location', text: 'Same Neighborhood', highlight: true })
    }

    // Kids Age
    if (checkKidAgeCompatibility(user.kids, family.kids)) {
        reasons.push({ icon: 'kids', text: 'Similar Age Kids', highlight: true })
    }

    return reasons
}

export function calculateCompatibility(reasons: MatchReason[], overlapPercentage: number): number {
    let score = 0

    // Schedule Overlap (Max 50 points)
    score += Math.round(overlapPercentage * 0.5)

    // Baseline bonus for potential (avoid 0% for neighbors)
    if (overlapPercentage > 0) score += 10

    // Weighted Reasons
    reasons.forEach(r => {
        if (r.icon === 'location') score += 30 // High value on proximity
        if (r.icon === 'kids') score += 20     // High value on peer groups
    })

    return Math.min(score, 99)
}
