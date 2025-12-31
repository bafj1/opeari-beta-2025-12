export interface Child {
    id: string
    firstName: string
    nickname: string
    age: string
    month?: string
}

export interface OnboardingData {
    firstName: string
    lastName: string
    email: string
    zipCode: string
    neighborhood: string
    careOptions: string[]
    specificNeeds?: string
    scheduleFlexible: boolean
    schedule: Record<string, string[]>
    kids: Child[]
    expecting: boolean
    expectingTiming?: string
    password?: string
    userIntent?: 'family' | 'caregiver' | null
    caregiverWorkTypes: string[]
    readyToStart: boolean
    // Caregiver Specific
    phone?: string
    contactTime?: string
    caregiverRole?: string
    secondaryRoles?: string[]
    yearsExperience?: string
    ageGroups?: string[]
    certifications?: string[]
    bio?: string
    scheduleNotes?: string
    referrals?: { name: string; email: string; phone: string; relation: string; description: string }[]
    availabilityType?: string
    hourlyRate?: string
    logistics?: string[]
    photoUrl?: string
    avatarId?: string
    skipped?: boolean
}

export const INITIAL_DATA: OnboardingData = {
    firstName: '',
    lastName: '',
    email: '',
    zipCode: '',
    neighborhood: '',
    careOptions: [],
    scheduleFlexible: true,
    schedule: {},
    kids: [],
    expecting: false,
    expectingTiming: '',
    password: '',
    userIntent: null,
    caregiverWorkTypes: [],
    readyToStart: false,
    phone: '',
    contactTime: '',
    caregiverRole: '',
    secondaryRoles: [],
    yearsExperience: '',
    ageGroups: [],
    certifications: [],
    bio: '',
    availabilityType: '',
    scheduleNotes: '',
    referrals: [],

    hourlyRate: '',
    logistics: [],
    // Polish
    photoUrl: '',
    avatarId: '',
    skipped: false
}

export const STEPS = [
    { id: 0, img: '/opeari-welcome-green.png', text: "It takes a village.\nLet's build yours." },
    { id: 1, img: '/opeari-welcome-green.png', text: "You're early — and that matters. Early families help shape how Opeari grows in their neighborhood.", textCaregiver: "You're early — and that matters. You're helping us build a trusted foundation for local care." },
    { id: 2, img: '/opeari-explore.png', text: "No pressure. Just possibilities. We'll figure out what works together.", textCaregiver: "Great caregivers make great villages. Let's connect you with families who need you." },
    { id: 3, img: '/opeari-happy.png', text: "Flexibility is the whole point. Most families don't have a fixed schedule — and that's okay.", textCaregiver: "Flexibility works both ways. You set the terms that work for your life." },
    { id: 4, img: '/opeari-connect.png', text: "Your family. Your village. We match based on what matters to you.", textCaregiver: "Trust is everything. We help you find families where you'll be valued." },
    { id: 5, img: '/opeari-proud.png', text: "Almost there. Save your progress so you can come back anytime." },
    { id: 6, img: '/opeari-village-hero.png', text: "Welcome to the neighborhood!\nLet's say hello to your future village." },
]
