import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CareNeed } from '../types/careNeed';
import { useViewer } from './useViewer';

export function useCareNeeds() {
    const { viewer } = useViewer();
    const [careNeeds, setCareNeeds] = useState<CareNeed[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCareNeeds = useCallback(async () => {
        if (!viewer?.member?.id) return;

        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('care_needs')
                .select('*')
                .eq('member_id', viewer.member.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCareNeeds(data || []);
        } catch (err: any) {
            console.error('Error fetching care needs:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [viewer?.member?.id]);

    useEffect(() => {
        fetchCareNeeds();
    }, [fetchCareNeeds]);

    const createCareNeed = async (careNeedData: Partial<CareNeed>) => {
        if (!viewer?.member?.id) return null;

        try {
            const { data, error } = await supabase
                .from('care_needs')
                .insert({
                    ...careNeedData,
                    member_id: viewer.member.id,
                    status: 'open', // Default status
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            setCareNeeds(prev => [data, ...prev]);
            return data;
        } catch (err: any) {
            console.error('Error creating care need:', err);
            throw err;
        }
    };

    const updateCareNeed = async (id: string, updates: Partial<CareNeed>) => {
        try {
            const { data, error } = await supabase
                .from('care_needs')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setCareNeeds(prev => prev.map(need => need.id === id ? data : need));
            return data;
        } catch (err: any) {
            console.error('Error updating care need:', err);
            throw err;
        }
    };

    // Logical delete - just set is_active to false or delete row?
    // User request mentions "Delete" action. Let's assume hard delete for now or status update.
    // Based on "Mark complete" vs "Delete", "Delete" usually implies removal.
    const deleteCareNeed = async (id: string) => {
        try {
            const { error } = await supabase
                .from('care_needs')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCareNeeds(prev => prev.filter(need => need.id !== id));
        } catch (err: any) {
            console.error('Error deleting care need:', err);
            throw err;
        }
    };

    return {
        careNeeds,
        isLoading,
        error,
        refetch: fetchCareNeeds,
        createCareNeed,
        updateCareNeed,
        deleteCareNeed
    };
}
