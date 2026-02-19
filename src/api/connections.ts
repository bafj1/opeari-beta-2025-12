import { supabase } from '../lib/supabase';

export interface SuggestedConnection {
    member_id: string;
    display_name: string;
    avatar_url: string | null;
    neighborhood: string | null;
    zip_code: string | null;
    role: string | null;
    mutual_connection_count: number;
    looking_for?: string[];
    nanny_situation?: string;
}

export async function getSuggestedConnections(
    userId: string,
    limit: number = 10
): Promise<SuggestedConnection[]> {
    const { data, error } = await supabase.rpc('get_suggested_connections', {
        p_user_id: userId,
        p_limit: limit,
    });

    if (error) {
        console.error('Error fetching suggested connections:', error);
        throw error;
    }

    return data || [];
}
