
import {
    Calendar,
    Globe,
    RefreshCw,
    Link2,
    Clock
} from 'lucide-react';
import SettingsCard from './SettingsCard';

import ScheduleBuilder from './ScheduleBuilder';
import { useViewer } from '../../hooks/useViewer';

interface SchedulePanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function SchedulePanel({ formData, setFormData, saving, onSave }: SchedulePanelProps) {
    const { viewer } = useViewer();
    const isCaregiver = viewer?.member?.role === 'caregiver';

    return (
        <div className="space-y-6 pb-8 max-w-4xl">

            {/* === SCHEDULE BUILDER (handles its own load/save) === */}
            <ScheduleBuilder />

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
                        Looking to save your availability? Use the "Save Schedule" button inside the calendar above.
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
