export interface CareNeed {
    id: string;
    member_id: string;
    name: string | null;
    is_active: boolean;
    care_type: string;
    also_open_to: string[];
    days_needed: string[];
    start_time: string | null;
    end_time: string | null;
    duration_type: 'ongoing' | 'short-term' | 'regular' | 'temporary' | 'one-time' | 'backup';
    start_date: string | null;
    end_date: string | null;
    status: string;
    created_at: string;
    updated_at: string;

    // Legacy / optional fields for backward compatibility
    area_bucket?: string | null;
    start_timeframe?: string | null;
    pay_band?: string | null;
    visibility?: string;
    notes_for_caregiver?: string | null;
}
