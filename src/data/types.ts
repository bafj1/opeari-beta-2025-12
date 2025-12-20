export type Role = 'parent' | 'caregiver' | 'admin';

export interface BaseModel {
    id: string;
    created_at: string;
}

// 4. Waitlist Data
export interface WaitlistEntry extends BaseModel {
    firstName: string;
    lastName: string;
    email: string;
    city: string;
    role: Role;
    kidsAges?: number[]; // Parent only
    availability?: string; // Caregiver only
    source: string;
}

// 6. Profile Data (Parent)
export interface ParentProfile extends BaseModel {
    location: string;
    childrenCount: number;
    childrenAges: number[];
    careNeeds: 'part-time' | 'full-time' | 'swap';
    budgetRange: string;
    preferences: string[];
}

// 6. Caregiver Data (Added for completeness based on user prompt logic)
export interface CaregiverProfile extends BaseModel {
    experienceYears: number;
    availability: string;
    location: string;
    certifications: string[];
    desiredHours: string;
    payRange: string;
}

// 8. Nanny Share
export interface NannyShare extends BaseModel {
    families: string[];
    schedule: string;
    location: string;
    costSplit: string;
    rules: string;
}
