import { useState } from 'react';
import { useViewer } from '../hooks/useViewer';
import { useCareNeeds } from '../hooks/useCareNeeds';
import { CareNeedCard } from '../components/care-needs/CareNeedCard';
import { CareNeedForm } from '../components/care-needs/CareNeedForm';
import { supabase } from '../lib/supabase';
import { Plus, Calendar } from 'lucide-react';
import type { CareNeed } from '../types/careNeed';

export default function CareNeedsPage() {
    const { viewer } = useViewer();
    const { careNeeds, isLoading, createCareNeed, updateCareNeed, deleteCareNeed } = useCareNeeds();
    const [showForm, setShowForm] = useState(false);
    const [editingNeed, setEditingNeed] = useState<CareNeed | null>(null);

    const effectiveUserId = viewer?.member?.id;

    const handleSave = async (data: Partial<CareNeed>) => {
        if (!effectiveUserId) return;
        try {
            if (editingNeed) {
                await updateCareNeed(editingNeed.id, data);
            } else {
                await createCareNeed({
                    ...data,
                    member_id: effectiveUserId,
                    is_active: true,
                    area_bucket: 'local',
                } as any);

                // Sync schedule to member if regular
                if (data.duration_type === 'regular' && data.days_needed?.length) {
                    await supabase
                        .from('members')
                        .update({
                            availability_days: data.days_needed,
                            schedule: {
                                days: data.days_needed,
                                start_time: data.start_time || '09:00',
                                end_time: data.end_time || '17:00',
                                flexible: false,
                            },
                        })
                        .eq('id', effectiveUserId);
                }
            }
            setShowForm(false);
            setEditingNeed(null);
        } catch (error) {
            console.error('Error saving care need:', error);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-[#f0faf4]" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
                <div className="max-w-3xl mx-auto px-4 py-8" style={{ paddingTop: '100px' }}>

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-[#1e6b4e] mb-1">Care Needs</h1>
                            <p className="text-sm text-[#546E5C]">
                                Manage your scheduling requirements and find the right care.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingNeed(null);
                                setShowForm(true);
                            }}
                            className="px-5 py-2.5 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#155a3e] transition-colors flex items-center gap-2 shadow-sm self-start"
                        >
                            <Plus className="w-4 h-4" />
                            Add Care Need
                        </button>
                    </div>

                    {/* Care Needs List */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="animate-pulse bg-white rounded-[20px] h-32 border border-gray-100" />
                            ))}
                        </div>
                    ) : careNeeds.length > 0 ? (
                        <div className="space-y-4">
                            {careNeeds.map(need => (
                                <CareNeedCard
                                    key={need.id}
                                    careNeed={need}
                                    onEdit={(need) => {
                                        setEditingNeed(need);
                                        setShowForm(true);
                                    }}
                                    onDelete={deleteCareNeed}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[20px] p-12 text-center border border-[#8bd7c7]/20 shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-[#d8f5e5] flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-[#1e6b4e]" />
                            </div>
                            <h3 className="font-semibold text-[#1e6b4e] mb-2 text-lg">No care needs yet</h3>
                            <p className="text-sm text-[#546E5C] mb-6 max-w-md mx-auto">
                                Add your first care need to help us match you with the right families and caregivers.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="px-6 py-2.5 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#155a3e] transition-colors"
                            >
                                Create Your First Care Need
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Care Need Form Modal */}
            {showForm && (
                <CareNeedForm
                    careNeed={editingNeed}
                    onClose={() => {
                        setShowForm(false);
                        setEditingNeed(null);
                    }}
                    onSave={handleSave}
                />
            )}
        </>
    );
}
