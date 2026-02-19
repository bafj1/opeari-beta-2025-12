import { supabase } from '../lib/supabase';

export interface ReferredCaregiver {
    caregiver_id: string;
    display_name: string;
    avatar_url: string | null;
    experience: string;
    rating: number;
    review_count: number;
    referrer_name: string;
    referrer_count: number;
    distance_miles: number;
    availability_days: string[];
    verified: boolean;
    certifications: any[];
    referrer_note?: string | null;
}

export async function getReferredCaregivers(
    userId: string,
    limit: number = 10
): Promise<ReferredCaregiver[]> {
    const { data, error } = await supabase
        .rpc('get_referred_caregivers', {
            p_user_id: userId,
            p_limit: limit
        });

    if (error) {
        console.error('Error fetching referred caregivers:', error);
        throw error;
    }

    return data || [];
}

export async function createReferral(referral: {
    caregiver_id: string;
    referrer_id: string;
    rating?: number;
    relationship?: string;
    note?: string;
}): Promise<void> {
    const { error } = await supabase
        .from('caregiver_referrals')
        .insert({
            caregiver_id: referral.caregiver_id,
            referrer_id: referral.referrer_id,
            rating: referral.rating,
            relationship: referral.relationship || 'personal',
            note: referral.note,
        });

    if (error) {
        console.error('Error creating referral:', error);
        throw error;
    }
}
