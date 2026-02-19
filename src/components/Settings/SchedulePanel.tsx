
import { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    Globe,
    RefreshCw,
    Link2,
    Clock,
    Check,
    Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SettingsCard from './SettingsCard';
import ScheduleBuilder from './ScheduleBuilder';
import { useViewer } from '../../hooks/useViewer';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

interface SchedulePanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function SchedulePanel({ formData, setFormData, saving, onSave }: SchedulePanelProps) {
    const { viewer } = useViewer();
    const isCaregiver = viewer?.member?.role === 'caregiver';

    // Lifted Schedule State
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [schedule, setSchedule] = useState<Record<string, string[]>>({});
    const [flexible, setFlexible] = useState(false);
    const [scheduleNotes, setScheduleNotes] = useState('');

    // Auto-save Status
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Load initial schedule
    useEffect(() => {
        if (!viewer?.user?.id) return;

        async function loadSchedule() {
            setScheduleLoading(true);
            try {
                // NOTE: Intentionally querying schedule_notes - if column missing, migration needed
                const { data, error } = await supabase
                    .from('members')
                    .select('availability_days, schedule, schedule_flexible, schedule_notes')
                    .eq('id', viewer?.user?.id)
                    .single();

                if (error) throw error; // Will fallback if column error? No, let's catch it.

                setFlexible(data.schedule_flexible || false);
                setScheduleNotes(data.schedule_notes || '');

                // Populate schedule
                if (data.schedule && Object.keys(data.schedule).length > 0) {
                    setSchedule(data.schedule);
                } else {
                    const storedDays = (data.availability_days ?? []) as string[];
                    const newSchedule: Record<string, string[]> = {};
                    if (storedDays.length > 0) {
                        storedDays.forEach(d => {
                            newSchedule[d] = ['Morning', 'Afternoon'];
                        });
                        setSchedule(newSchedule);
                    }
                }
            } catch (err) {
                console.error('Error loading schedule:', err);
            } finally {
                setScheduleLoading(false);
            }
        }
        loadSchedule();
    }, [viewer?.user?.id]);

    // Debounced Autosave
    const debouncedSave = useCallback(
        debounce(async (currentSchedule: Record<string, string[]>, currentFlexible: boolean, currentNotes: string) => {
            if (!viewer?.user?.id) return;
            setSaveStatus('saving');
            try {
                // derived days
                const availabilityDays = Object.keys(currentSchedule).filter(day =>
                    currentSchedule[day] && currentSchedule[day].length > 0
                );

                const { error } = await supabase
                    .from('members')
                    .update({
                        schedule: currentSchedule,
                        availability_days: availabilityDays,
                        schedule_flexible: currentFlexible,
                        schedule_notes: currentNotes
                    })
                    .eq('id', viewer.user.id);

                if (error) throw error;
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Schedule save error:', err);
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }, 1000),
        [viewer?.user?.id]
    );

    // Handlers to update local state + trigger save
    // We use a ref to keep track of latest values for the debounced function if needed, 
    // but passing values directly to debouncer is safer.

    const updateSchedule = (newSchedule: Record<string, string[]>) => {
        setSchedule(newSchedule);
        debouncedSave(newSchedule, flexible, scheduleNotes);
    };

    const updateFlexible = (newFlexible: boolean) => {
        setFlexible(newFlexible);
        debouncedSave(schedule, newFlexible, scheduleNotes);
    };

    const updateNotes = (newNotes: string) => {
        setScheduleNotes(newNotes);
        debouncedSave(schedule, flexible, newNotes);
    };

    return (
        <div className="space-y-6 pb-8 max-w-4xl">

            {/* === SCHEDULE BUILDER (Auto-save) === */}
            <div className="relative">
                {/* Save Status Indicator */}
                <div className="absolute top-0 right-0 z-10">
                    <div className="text-sm font-medium h-6 flex items-center justify-end">
                        {saveStatus === 'saving' && (
                            <span className="text-[#546E5C] flex items-center gap-1 bg-white/80 px-2 rounded-full">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="text-[#1e6b4e] flex items-center gap-1 bg-white/80 px-2 rounded-full transition-all">
                                <Check className="w-3.5 h-3.5" /> Saved
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="text-red-500 flex items-center gap-1 bg-white/80 px-2 rounded-full">
                                Failed to save
                            </span>
                        )}
                    </div>
                </div>

                {scheduleLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-[#1e6b4e]" size={24} />
                    </div>
                ) : (
                    <>
                        <ScheduleBuilder
                            schedule={schedule}
                            onChange={updateSchedule}
                            flexible={flexible}
                            onFlexibleChange={updateFlexible}
                            isCaregiver={!!isCaregiver}
                        />

                        {/* Schedule Notes */}
                        <div className="mt-6">
                            <label className="block text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-1">
                                Schedule Notes
                            </label>
                            <p className="text-xs text-[#546E5C] mb-2">
                                Anything specific about your schedule? Exact times, upcoming changes, or flexibility details.
                            </p>
                            <textarea
                                value={scheduleNotes}
                                onChange={(e) => updateNotes(e.target.value)}
                                placeholder="e.g., Need care 8:30am-3pm on school days, flexible on Fridays after noon"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-transparent text-sm resize-none"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* === UPCOMING CARE NEEDS === */}
            <SettingsCard title={isCaregiver ? "Upcoming Bookings" : "Upcoming Care Needs"} icon={Clock}>
                <div className="flex flex-col items-center justify-center py-8 rounded-2xl"
                    style={{ backgroundColor: 'rgba(139,215,199,0.05)', border: '2px dashed rgba(139,215,199,0.3)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                        style={{ backgroundColor: 'rgba(139,215,199,0.15)' }}>
                        <Calendar className="w-6 h-6" style={{ color: '#1E6B4E' }} />
                    </div>
                    <h3 style={{ color: '#1E6B4E' }} className="font-semibold">
                        {isCaregiver ? 'No upcoming bookings' : 'No upcoming events'}
                    </h3>
                    <p style={{ color: '#6B7280' }} className="text-sm mb-4">
                        {isCaregiver ? 'When families book your time, it will appear here' : 'Add your first event to start planning ahead'}
                    </p>
                    <span className="px-4 py-2 rounded-full text-sm font-semibold"
                        style={{ backgroundColor: 'rgba(139,215,199,0.2)', color: '#1E6B4E' }}>
                        Coming soon
                    </span>
                </div>
            </SettingsCard>

            {/* === CALENDAR INTEGRATION === */}
            <SettingsCard title="Calendar Integration" description="Connect your calendar to automatically sync your availability" icon={Link2}>
                <div className="flex flex-wrap gap-3">
                    {['Google Calendar', 'Apple Calendar', 'Outlook'].map(cal => (
                        <div key={cal}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                            style={{ border: '2px solid rgba(139,215,199,0.3)', opacity: 0.6, cursor: 'default' }}>
                            <Calendar className="w-5 h-5" style={{ color: '#6B7280' }} />
                            <span style={{ color: '#1E6B4E' }} className="font-semibold">{cal}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs mt-3" style={{ color: '#9CA3AF' }}>
                    Calendar sync coming soon
                </p>
            </SettingsCard>

            {/* === TIMEZONE & NOTIFICATIONS === */}
            <SettingsCard>
                <div className="space-y-6">
                    {/* Timezone */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5" style={{ color: '#1E6B4E' }} />
                            <span className="font-bold" style={{ color: '#1E6B4E' }}>Timezone</span>
                        </div>
                        <select
                            value={formData.timezone || 'PT'}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            className="px-4 py-2 bg-white rounded-2xl font-semibold focus:outline-none"
                            style={{
                                border: '2px solid rgba(139,215,199,0.3)',
                                color: '#1E6B4E',
                            }}
                        >
                            <option value="ET">Eastern Time (ET)</option>
                            <option value="CT">Central Time (CT)</option>
                            <option value="MT">Mountain Time (MT)</option>
                            <option value="PT">Pacific Time (PT)</option>
                        </select>
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'rgba(139,215,199,0.2)' }} />

                    {/* Schedule Notification — Custom Toggle */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '2px solid rgba(139,215,199,0.3)',
                        backgroundColor: 'white',
                    }}>
                        <div>
                            <p style={{ fontWeight: 600, color: '#1E6B4E', fontSize: '14px', margin: 0 }}>
                                Schedule notifications
                            </p>
                            <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0 0' }}>
                                {isCaregiver
                                    ? 'Get notified when families need care during your available times'
                                    : 'Get notified when matches become available during your selected times'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({
                                ...formData,
                                notification_prefs: {
                                    ...(formData.notification_prefs || {}),
                                    schedule_updates: !(formData.notification_prefs?.schedule_updates ?? true)
                                }
                            })}
                            style={{
                                width: '48px',
                                height: '28px',
                                borderRadius: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background-color 0.2s',
                                backgroundColor: (formData.notification_prefs?.schedule_updates ?? true) ? '#1E6B4E' : '#D1D5DB',
                                flexShrink: 0,
                            }}
                        >
                            <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                position: 'absolute',
                                top: '3px',
                                transition: 'left 0.2s',
                                left: (formData.notification_prefs?.schedule_updates ?? true) ? '23px' : '3px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }} />
                        </button>
                    </div>
                </div>
            </SettingsCard>

            {/* === INFO CALLOUT === */}
            <div className="flex gap-3 p-4 rounded-2xl"
                style={{ backgroundColor: 'rgba(139,215,199,0.1)', border: '1px solid rgba(139,215,199,0.2)' }}>
                <RefreshCw className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1E6B4E' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                    {isCaregiver
                        ? 'Your schedule will repeat weekly. Update it anytime to reflect your availability. Families searching for care will see your current schedule.'
                        : 'Your schedule will repeat weekly. You can update it anytime to reflect changes in your availability. Matches are updated daily based on your current schedule.'}
                </p>
            </div>

            {/* Footer - Save Preferences */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <div className="flex-1 flex items-center">
                    <p className="text-xs text-gray-400 italic">
                        Note: Schedule grid saves automatically. Use this button for Timezone & Notification settings.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: '#1E6B4E',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '50px',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.5 : 1,
                        fontSize: '14px',
                        fontFamily: 'Comfortaa, sans-serif',
                        transition: 'all 0.2s',
                    }}
                >
                    {saving ? 'Saving Prefs...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
}
