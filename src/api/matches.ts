import { supabase } from '../lib/supabase';

export interface MatchResult {
    member_id: string;
    display_name: string;
    role: string | null; // 'family' | 'caregiver' via table column 'role' (singular) or 'roles' array
    avatar_url: string | null;
    match_score: number;
    distance_miles: number;
    availability_days: string[] | null;
    care_types: string[] | null;
    also_open_to?: string[];
}

export async function getTopMatches(
    userId: string,
    filter: 'all' | 'caregivers' | 'families' = 'all',
    limit: number = 10
): Promise<MatchResult[]> {
    const { data, error } = await supabase
        .rpc('get_top_matches', {
            p_user_id: userId,
            p_match_filter: filter,
            p_limit: limit
        });

    if (error) throw error;
    return data || [];
}
