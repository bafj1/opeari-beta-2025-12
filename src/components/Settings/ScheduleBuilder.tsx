import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useViewer } from '../../hooks/useViewer';
import { ScheduleGrid } from '../common/ScheduleGrid'; // Use named export if possible, or default
import { Check, Loader2 } from 'lucide-react';

export default function ScheduleBuilder() {
    const { viewer } = useViewer();
    const isCaregiver = viewer?.member?.role === 'caregiver';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Detailed schedule state (Day ID "mon" -> Array of Slots ["Morning"])
    const [schedule, setSchedule] = useState<Record<string, string[]>>({});
    const [flexible, setFlexible] = useState(false);

    useEffect(() => {
        if (viewer?.user?.id) {
            loadSchedule();
        }
    }, [viewer?.user?.id]);

    const loadSchedule = async () => {
        if (!viewer?.user?.id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('members')
                .select('availability_days, schedule, schedule_flexible')
                .eq('id', viewer.user.id)
                .single();

            if (error) throw error;

            setFlexible(data.schedule_flexible || false);

            // Use saved schedule if available
            if (data.schedule && Object.keys(data.schedule).length > 0) {
                setSchedule(data.schedule);
            } else {
                // Fallback: Populate schedule based on availability_days
                const storedDays = (data.availability_days ?? []) as string[];
                const newSchedule: Record<string, string[]> = {};

                // If we only have days, default to Morning + Afternoon for those days
                if (storedDays.length > 0) {
                    storedDays.forEach(d => {
                        newSchedule[d] = ['Morning', 'Afternoon'];
                    });
                    setSchedule(newSchedule);
                }
            }
        } catch (err) {
            console.error('Failed to load schedule:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchedule = async () => {
        if (!viewer?.user?.id) return;

        setSaving(true);
        try {
            // 1. Derived availability_days (any day with at least one slot)
            const availabilityDays = Object.keys(schedule).filter(day =>
                schedule[day] && schedule[day].length > 0
            );

            // 2. Save both
            const { error } = await supabase
                .from('members')
                .update({
                    availability_days: availabilityDays,
                    schedule: schedule,
                    schedule_flexible: flexible
                })
                .eq('id', viewer.user.id);

            if (error) throw error;

            setSuccessMessage('Schedule saved!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            console.error('Failed to save schedule:', err);
            alert('Failed to save schedule. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <p className="text-[#1e6b4e] animate-pulse flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Loading schedule...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-opeari-heading">Weekly Availability</h3>
                    <p className="text-sm text-gray-500">
                        {isCaregiver ? 'Tap the time blocks when you can work.' : 'Tap the time blocks you are available.'}
                    </p>
                </div>
            </div>

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
                    <Check className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <ScheduleGrid
                    value={schedule}
                    onChange={setSchedule}
                />
            </div>

            {/* Flexible Toggle */}
            <div
                onClick={() => setFlexible(!flexible)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${flexible ? 'border-[#1e6b4e] bg-[#f0faf4]' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
            >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${flexible ? 'bg-[#1e6b4e] border-[#1e6b4e]' : 'bg-white border-gray-300'}`}>
                    {flexible && <Check size={14} className="text-white" />}
                </div>
                <div>
                    <p className="font-semibold text-opeari-heading">My schedule is flexible</p>
                    <p className="text-sm text-[#1e6b4e]">
                        {isCaregiver ? 'Let families know you can adjust your hours' : 'Totally fine — many families start here'}
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="bg-[#1e6b4e] hover:bg-[#155a3e] text-white font-bold rounded-full px-8 py-3 shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Saving...
                        </>
                    ) : 'Save Schedule'}
                </button>
            </div>
        </div>
    );
}
