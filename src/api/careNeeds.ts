import { supabase } from '../lib/supabase';
import type { CareNeed } from '../types/careNeed';

export async function getActiveCareNeed(userId: string): Promise<CareNeed | null> {
    const { data, error } = await supabase
        .from('care_needs')
        .select('*')
        .eq('member_id', userId)
        .eq('is_active', true)
        .single();

    // If no rows found, .single() returns error code PGRST116. Return null in that case.
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}

export async function getAllCareNeeds(userId: string): Promise<CareNeed[]> {
    const { data, error } = await supabase
        .from('care_needs')
        .select('*')
        .eq('member_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createCareNeed(careNeed: Partial<CareNeed>): Promise<CareNeed> {
    const { data, error } = await supabase
        .from('care_needs')
        .insert(careNeed)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCareNeed(id: string, updates: Partial<CareNeed>): Promise<CareNeed> {
    const { data, error } = await supabase
        .from('care_needs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function setActiveCareNeed(userId: string, careNeedId: string): Promise<void> {
    // Deactivate all care needs for user
    const { error: deactivateError } = await supabase
        .from('care_needs')
        .update({ is_active: false })
        .eq('member_id', userId);

    if (deactivateError) throw deactivateError;

    // Activate the selected one
    const { error: activateError } = await supabase
        .from('care_needs')
        .update({ is_active: true })
        .eq('id', careNeedId);

    if (activateError) throw activateError;
}
