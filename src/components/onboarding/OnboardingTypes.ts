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
    userIntent?: 'seeking' | 'providing' | null
    caregiverWorkTypes: string[]
    readyToStart: boolean
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
    readyToStart: false
}

export const STEPS = [
    { id: 0, img: '/opeari-welcome-green.png', text: "It takes a village.\nLet's build yours." },
    { id: 1, img: '/opeari-welcome-green.png', text: "You're early — and that matters. Early families help shape how Opeari grows in their neighborhood." },
    { id: 2, img: '/opeari-explore.png', text: "No pressure. Just possibilities. We'll figure out what works together." },
    { id: 3, img: '/opeari-happy.png', text: "Flexibility is the whole point. Most families don't have a fixed schedule — and that's okay." },
    { id: 4, img: '/opeari-connect.png', text: "Your family. Your village. We match based on what matters to you." },
    { id: 5, img: '/opeari-proud.png', text: "Almost there. Save your progress so you can come back anytime." },
]
