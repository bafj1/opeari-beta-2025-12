import { useState, useEffect } from 'react';
import type { CareNeed } from '../../types/careNeed';
import { X, Calendar, Clock, CalendarDays, Shield, Info } from 'lucide-react';
import { TimePicker } from '../common/TimePicker';
import { useViewer } from '../../hooks/useViewer';

interface CareNeedFormProps {
    careNeed?: CareNeed | null;
    onClose: () => void;
    onSave: (data: Partial<CareNeed>) => Promise<void>;
}

const NEED_TYPES = [
    { value: 'regular', label: 'Regular Schedule', description: 'Ongoing weekly care', icon: Calendar },
    { value: 'temporary', label: 'Temporary', description: 'Care for a set period', icon: Clock },
    { value: 'one-time', label: 'One-Time', description: 'Single event or date night', icon: CalendarDays },
    { value: 'backup', label: 'Backup Care', description: 'Emergency or fill-in', icon: Shield },
];

const CARE_TYPES = [
    { value: 'mothers-helper', label: "Mother's Helper" },
    { value: 'backup-care', label: 'Backup Care' },
    { value: 'coshare-family', label: 'Coshare Family' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'occasional', label: 'Occasional' },
    { value: 'household-help', label: 'Household Help' },
    { value: 'nanny-share', label: 'Nanny Share' },
];

const DAYS = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
];

function CareNeedSummary({ formData }: { formData: any }) {
    const dayNames: Record<string, string> = {
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
        thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        // If seconds are present, strip them for display logic, or just handle HH:MM
        const [h, m] = time.split(':').map(Number);
        const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const period = h >= 12 ? 'PM' : 'AM';
        return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const days = formData.days_needed?.map((d: string) => dayNames[d] || d).join(', ');
    const timeRange = formData.start_time && formData.end_time
        ? `${formatTime(formData.start_time)} – ${formatTime(formData.end_time)}`
        : '';

    const careTypeLabel = CARE_TYPES.find(c => c.value === formData.care_type)?.label || formData.care_type;

    return (
        <div className="bg-[#d8f5e5]/30 rounded-xl p-4 border border-[#8bd7c7]/30 mt-4">
            <p className="text-sm font-semibold text-[#1e6b4e] mb-1">Your Care Need</p>
            <p className="text-sm text-[#546E5C]">
                {careTypeLabel || 'Care'}{' '}
                {formData.duration_type === 'regular' && days && <>on {days}</>}
                {formData.duration_type === 'backup' && days && <>on {days}</>}
                {timeRange && <>, {timeRange}</>}
                {formData.duration_type === 'temporary' && formData.start_date && (
                    <>, from {new Date(formData.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        {formData.end_date && <> to {new Date(formData.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</>}
                    </>
                )}
                {formData.duration_type === 'one-time' && formData.start_date && (
                    <> on {new Date(formData.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}</>
                )}
            </p>
        </div>
    );
}

export function CareNeedForm({ careNeed, onClose, onSave }: CareNeedFormProps) {
    // Determine initial duration type mapping if legacy 'ongoing'/'short-term' are present
    const getInitialDurationType = () => {
        if (!careNeed?.duration_type) return 'regular';
        if (careNeed.duration_type === 'ongoing') return 'regular';
        if (careNeed.duration_type === 'short-term') return 'temporary';
        return careNeed.duration_type;
    };

    const [formData, setFormData] = useState({
        care_type: careNeed?.care_type || 'nanny-share',
        also_open_to: careNeed?.also_open_to || [],
        days_needed: careNeed?.days_needed || ['mon', 'wed', 'fri'],
        start_time: careNeed?.start_time || '09:00:00',
        end_time: careNeed?.end_time || '17:00:00',
        duration_type: getInitialDurationType(),
        start_date: careNeed?.start_date || new Date().toISOString().split('T')[0],
        end_date: careNeed?.end_date || '',
        start_timeframe: careNeed?.start_timeframe || 'immediately',
        is_active: careNeed?.is_active ?? true,
        status: careNeed?.status || 'open'
    });

    const [isSaving, setIsSaving] = useState(false);
    const { viewer } = useViewer();

    // Pre-fill from member's schedule settings when creating a NEW care need
    useEffect(() => {
        if (careNeed) return; // Don't override when editing
        const member = viewer?.member;
        if (!member) return;

        const updates: Partial<typeof formData> = {};

        // Pre-fill days from settings schedule
        const scheduleDays = (member as any).schedule?.days || member.availability_days || [];
        if (scheduleDays.length > 0) {
            updates.days_needed = scheduleDays;
        }

        // Pre-fill times from settings schedule
        const startTime = (member as any).schedule?.start_time;
        const endTime = (member as any).schedule?.end_time;
        if (startTime) updates.start_time = startTime;
        if (endTime) updates.end_time = endTime;

        // Pre-fill care type from member's care_types if only one
        const careTypes = member.care_types || [];
        if (careTypes.length === 1) {
            updates.care_type = careTypes[0];
        }

        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
    }, [viewer?.member, careNeed]);

    // Clear specific fields when duration type changes to keep state clean (optional but good UX)
    // For now we keep state to preserve user input if they switch back and forth

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            days_needed: prev.days_needed.includes(day)
                ? prev.days_needed.filter(d => d !== day)
                : [...prev.days_needed, day]
        }));
    };

    const setDays = (days: string[]) => {
        setFormData(prev => ({ ...prev, days_needed: days }));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Map back to legacy types if needed, or just save new types.
            // Data model supports new types in TS interface, assuming DB handles string values.
            await onSave({
                ...formData,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
                area_bucket: 'local',
                visibility: 'village_only',
            });
            onClose();
        } catch (error) {
            console.error('Failed to save care need', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#1e6b4e]">
                        {careNeed ? 'Edit Care Need' : 'Add Care Need'}
                    </h2>
                    <button onClick={onClose} aria-label="Close modal" className="text-[#546E5C] hover:text-[#1e6b4e]">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col gap-6">

                    {/* 1. Need Type Selector */}
                    <div>
                        <label className="block text-sm font-bold text-[#1e6b4e] uppercase tracking-wide mb-3">
                            What type of care do you need?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {NEED_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, duration_type: type.value as any })}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${formData.duration_type === type.value
                                        ? 'border-[#1e6b4e] bg-[#d8f5e5]/30'
                                        : 'border-gray-200 hover:border-[#8bd7c7] bg-white'
                                        }`}
                                >
                                    <type.icon className={`w-5 h-5 mb-2 ${formData.duration_type === type.value ? 'text-[#1e6b4e]' : 'text-gray-400'
                                        }`} />
                                    <p className="font-semibold text-sm text-[#1e6b4e]">{type.label}</p>
                                    <p className="text-xs text-[#546E5C]">{type.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Care Type (Role) */}
                    <div>
                        <label className="block text-sm font-bold text-[#1e6b4e] mb-3 uppercase tracking-wide">
                            Specific Role
                        </label>
                        <select
                            value={formData.care_type}
                            onChange={(e) => setFormData({ ...formData, care_type: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] text-sm bg-white"
                        >
                            {CARE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Conditional Fields */}
                    <div className="border-t border-gray-100 border-dashed pt-6">

                        {/* Date Picker for Temporary / One-Time */}
                        {(formData.duration_type === 'temporary' || formData.duration_type === 'one-time') && (
                            <div className="mb-6 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#1e6b4e] mb-1">
                                        {formData.duration_type === 'one-time' ? 'Date' : 'Start Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.start_date || ''}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] text-sm"
                                    />
                                </div>
                                {formData.duration_type === 'temporary' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-[#1e6b4e] mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.end_date || ''}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            min={formData.start_date || undefined}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Day Selection (Regular, Temporary, Backup) */}
                        {formData.duration_type !== 'one-time' && (
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-[#1e6b4e] mb-3 uppercase tracking-wide">
                                    Days Needed
                                </label>
                                {/* Quick select buttons */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <button type="button" onClick={() => setDays(['mon', 'tue', 'wed', 'thu', 'fri'])}
                                        className="px-3 py-1 rounded-full text-xs border border-gray-200 hover:border-[#8bd7c7] transition-colors text-gray-600">
                                        Weekdays
                                    </button>
                                    <button type="button" onClick={() => setDays(['sat', 'sun'])}
                                        className="px-3 py-1 rounded-full text-xs border border-gray-200 hover:border-[#8bd7c7] transition-colors text-gray-600">
                                        Weekends
                                    </button>
                                    <button type="button" onClick={() => setDays(DAYS.map(d => d.value))}
                                        className="px-3 py-1 rounded-full text-xs border border-gray-200 hover:border-[#8bd7c7] transition-colors text-gray-600">
                                        Every Day
                                    </button>
                                </div>

                                {/* Individual day pills */}
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(day => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => toggleDay(day.value)}
                                            className={`w-10 h-10 rounded-full text-xs font-semibold transition-all ${formData.days_needed?.includes(day.value)
                                                ? 'bg-[#1e6b4e] text-white'
                                                : 'bg-gray-100 text-[#546E5C] hover:bg-[#d8f5e5]'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Time Picker */}
                        <div className="grid grid-cols-2 gap-4">
                            <TimePicker
                                label="Start Time"
                                value={formData.start_time || ''}
                                onChange={(val) => setFormData({ ...formData, start_time: val })}
                            />
                            <TimePicker
                                label="End Time"
                                value={formData.end_time || ''}
                                onChange={(val) => setFormData({ ...formData, end_time: val })}
                            />
                        </div>

                        {/* Inline Error for Time */}
                        {formData.start_time && formData.end_time && formData.start_time >= formData.end_time && (
                            <p className="text-xs text-[#E07A5F] mt-2 flex items-center gap-1">
                                <Info className="w-3 h-3" /> End time should be after start time
                            </p>
                        )}
                    </div>

                    {/* 4. Summary */}
                    <CareNeedSummary formData={formData} />

                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-[12px] border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-[12px] bg-[#8bd7c7] text-[#1E6B4E] font-semibold hover:bg-[#79c9b8] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? 'Saving...' : 'Save Care Need'}
                    </button>
                </div>

            </div>
        </div>
    );
}

