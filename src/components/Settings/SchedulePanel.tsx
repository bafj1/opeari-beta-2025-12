
import { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    Globe,
    RefreshCw,
    Link2,
    Check,
    Loader2,
    X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SettingsCard from './SettingsCard';
import { useViewer } from '../../hooks/useViewer';
import { TimePicker } from '../common/TimePicker';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const DAYS = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
];
const ALL_DAYS = DAYS.map(d => d.value);
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const WEEKEND_DAYS = ['sat', 'sun'];

interface SchedulePanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function SchedulePanel({ formData, setFormData, saving, onSave }: SchedulePanelProps) {
    const { viewer } = useViewer();
    const isCaregiver = viewer?.member?.role === 'caregiver';

    // Schedule State
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [flexible, setFlexible] = useState(false);

    // Auto-save Status
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Active Care Needs Summary
    const [activeCareNeeds, setActiveCareNeeds] = useState<any[]>([]);
    const [careNeedsLoading, setCareNeedsLoading] = useState(false);

    useEffect(() => {
        if (!viewer?.user?.id) return;
        async function fetchCareNeeds() {
            setCareNeedsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('care_needs')
                    .select('*')
                    .eq('member_id', viewer?.user?.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });
                if (!error && data) setActiveCareNeeds(data);
            } catch (err) {
                console.error('Error fetching care needs:', err);
            } finally {
                setCareNeedsLoading(false);
            }
        }
        fetchCareNeeds();
    }, [viewer?.user?.id]);

    // Load initial schedule
    useEffect(() => {
        if (!viewer?.user?.id) return;

        async function loadSchedule() {
            setScheduleLoading(true);
            try {
                const { data, error } = await supabase
                    .from('members')
                    .select('availability_days, schedule, schedule_flexible')
                    .eq('id', viewer?.user?.id)
                    .single();

                if (error) throw error;

                // Load from schedule JSONB if available, fall back to availability_days
                // Schedule JSONB structure: { days, start_time, end_time, flexible }
                if (data.schedule && data.schedule.days) {
                    setSelectedDays(Array.isArray(data.schedule.days) ? data.schedule.days : []);
                    setStartTime(data.schedule.start_time || '09:00');
                    setEndTime(data.schedule.end_time || '17:00');
                    setFlexible(!!data.schedule.flexible);
                } else if (data.availability_days?.length) {
                    // Fallback to old array
                    setSelectedDays(data.availability_days);
                    setStartTime('09:00');
                    setEndTime('17:00');
                    setFlexible(!!data.schedule_flexible);
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
        debounce(async (days: string[], start: string, end: string, flex: boolean) => {
            if (!viewer?.user?.id) return;
            setSaveStatus('saving');
            try {
                const { error } = await supabase
                    .from('members')
                    .update({
                        availability_days: days,
                        schedule: {
                            days,
                            start_time: start,
                            end_time: end,
                            flexible: flex,
                        },
                        schedule_flexible: flex,
                    })
                    .eq('id', viewer.user.id);

                if (error) throw error;
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Error saving schedule:', err);
                setSaveStatus('error');
            }
        }, 1000),
        [viewer?.user?.id]
    );

    // Handlers
    const handleUpdate = (days: string[], start: string, end: string, flex: boolean) => {
        setSelectedDays(days);
        setStartTime(start);
        setEndTime(end);
        setFlexible(flex);
        debouncedSave(days, start, end, flex);
    };

    const toggleDay = (day: string) => {
        const next = selectedDays.includes(day)
            ? selectedDays.filter(d => d !== day)
            : [...selectedDays, day];
        handleUpdate(next, startTime, endTime, flexible);
    };

    const toggleWeekends = () => {
        const isWeekendsSelected = WEEKEND_DAYS.every(d => selectedDays.includes(d));
        let next: string[];
        if (isWeekendsSelected) {
            next = selectedDays.filter(d => !WEEKEND_DAYS.includes(d));
        } else {
            next = [...new Set([...selectedDays, ...WEEKEND_DAYS])];
        }
        handleUpdate(next, startTime, endTime, flexible);
    };

    const setQuickDays = (days: string[]) => {
        handleUpdate(days, startTime, endTime, flexible);
    };

    const formatDaysSummary = (days: string[]): string => {
        if (days.length === 0) return '';
        if (days.length === 7) return 'Every day';
        if (days.length === 5 && WEEKDAYS.every(d => days.includes(d)) && !WEEKEND_DAYS.some(d => days.includes(d))) return 'Weekdays';
        if (days.length === 2 && WEEKEND_DAYS.every(d => days.includes(d))) return 'Weekends';

        const dayLabels: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
        // Sort by standard week order
        const ordered = ALL_DAYS.filter(d => days.includes(d));
        return ordered.map(d => dayLabels[d]).join(', ');
    };

    const formatTimeDisplay = (time: string): string => {
        if (!time) return '';
        const [h, m] = time.split(':').map(Number);
        const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const period = h >= 12 ? 'PM' : 'AM';
        return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const isWeekdaysSelected = WEEKDAYS.every(d => selectedDays.includes(d));
    const isWeekendsSelected = WEEKEND_DAYS.every(d => selectedDays.includes(d));


    // Upcoming Events Logic
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({
        event_type: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        name: '',
        notes: '',
    });

    const resetNewEvent = () => setNewEvent({
        event_type: '', start_date: '', end_date: '', start_time: '', end_time: '', name: '', notes: ''
    });

    const fetchUpcomingEvents = async () => {
        if (!viewer?.user?.id) return;

        const { data, error } = await supabase
            .from('care_needs')
            .select('*')
            .eq('member_id', viewer.user.id)
            .eq('duration_type', 'one-time')
            .gte('start_date', new Date().toISOString().split('T')[0])
            .order('start_date', { ascending: true })
            .limit(10);

        if (!error && data) {
            setUpcomingEvents(data);
        }
    };

    useEffect(() => {
        fetchUpcomingEvents();
    }, [viewer?.user?.id]);

    const handleSaveEvent = async () => {
        if (!viewer?.user?.id || !newEvent.start_date || !newEvent.event_type) return;

        try {
            const { error } = await supabase
                .from('care_needs')
                .insert({
                    member_id: viewer.user.id,
                    care_type: newEvent.event_type,
                    duration_type: 'one-time',
                    name: newEvent.name || null,
                    start_date: newEvent.start_date,
                    end_date: newEvent.end_date || newEvent.start_date,
                    start_time: newEvent.start_time || null,
                    end_time: newEvent.end_time || null,
                    notes_for_caregiver: newEvent.notes || null,
                    days_needed: [],
                    is_active: true,
                    status: 'open',
                    area_bucket: 'local', // Required for NOT NULL constraint
                    visibility: 'village_only'
                });

            if (error) throw error;

            // Refresh events
            await fetchUpcomingEvents();
            setShowAddEvent(false);
            resetNewEvent();
        } catch (err) {
            console.error('Error saving event:', err);
        }
    };

    const deleteEvent = async (id: string) => {
        try {
            const { error } = await supabase
                .from('care_needs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchUpcomingEvents();
        } catch (err) {
            console.error('Error deleting event:', err);
        }
    };

    const eventTypeLabel = (type: string) => {
        switch (type) {
            case 'date-night': return 'Date Night';
            case 'travel': return 'Travel';
            case 'appointment': return 'Appointment';
            case 'party': return 'Party/Event';
            case 'other': return 'Other';
            default: return type;
        }
    };

    return (
        <div className="space-y-6 pb-8 max-w-4xl">

            {/* === WEEKLY SCHEDULE === */}
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
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="text-base font-bold text-[#1e6b4e] mb-1">Weekly Availability</h3>
                        <p className="text-xs text-[#546E5C] mb-4">Select the days and times you typically need care.</p>

                        {/* Day Selector */}
                        <div className="mb-5">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {/* Quick select buttons */}
                                <button type="button" onClick={() => setQuickDays(WEEKDAYS)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${isWeekdaysSelected ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]' : 'border-gray-200 text-[#546E5C] hover:border-[#8bd7c7]'
                                        }`}>
                                    Weekdays
                                </button>
                                <button type="button" onClick={() => toggleWeekends()}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${isWeekendsSelected ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]' : 'border-gray-200 text-[#546E5C] hover:border-[#8bd7c7]'
                                        }`}>
                                    Weekends
                                </button>
                                <button type="button" onClick={() => setQuickDays(ALL_DAYS)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedDays.length === 7 ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]' : 'border-gray-200 text-[#546E5C] hover:border-[#8bd7c7]'
                                        }`}>
                                    Every Day
                                </button>
                                {selectedDays.length > 0 && (
                                    <button type="button" onClick={() => setQuickDays([])}
                                        className="px-3 py-1 rounded-full text-xs font-medium border border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-200 transition-all">
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Individual day pills */}
                            <div className="flex gap-2 flex-wrap">
                                {DAYS.map(day => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`w-11 h-11 rounded-full text-xs font-semibold transition-all ${selectedDays.includes(day.value)
                                            ? 'bg-[#1e6b4e] text-white shadow-sm'
                                            : 'bg-gray-50 text-[#546E5C] hover:bg-[#d8f5e5] border border-gray-100'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Range — only show when days are selected */}
                        {selectedDays.length > 0 && (
                            <div className="border-t border-gray-100 pt-4 animate-fade-in">
                                <label className="block text-xs font-semibold text-[#1e6b4e] mb-2">Typical Hours</label>
                                <div className="flex items-center gap-3">
                                    <TimePicker
                                        value={startTime}
                                        onChange={(val) => handleUpdate(selectedDays, val, endTime, flexible)}
                                    />
                                    <span className="text-sm text-[#546E5C] font-medium">to</span>
                                    <TimePicker
                                        value={endTime}
                                        onChange={(val) => handleUpdate(selectedDays, startTime, val, flexible)}
                                    />
                                </div>
                                {startTime && endTime && startTime >= endTime && (
                                    <p className="text-xs text-[#E07A5F] mt-2">End time should be after start time</p>
                                )}
                            </div>
                        )}

                        {/* Flexible toggle */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[#1e6b4e]">My schedule is flexible</p>
                                <p className="text-xs text-[#546E5C]">I'm open to adjusting days or times</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleUpdate(selectedDays, startTime, endTime, !flexible)}
                                className="relative w-11 h-6 rounded-full transition-colors"
                                style={{ backgroundColor: flexible ? '#1e6b4e' : '#d1d5db' }}
                            >
                                <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all"
                                    style={{ left: flexible ? '22px' : '2px' }} />
                            </button>
                        </div>

                        {/* Summary */}
                        {selectedDays.length > 0 && startTime && endTime && (
                            <div className="mt-4 bg-[#d8f5e5]/30 rounded-xl p-3 border border-[#8bd7c7]/20">
                                <p className="text-sm text-[#1e6b4e]">
                                    <span className="font-semibold">{formatDaysSummary(selectedDays)}</span>
                                    {', '}
                                    <span>{formatTimeDisplay(startTime)} – {formatTimeDisplay(endTime)}</span>
                                    {flexible && <span className="text-[#546E5C]"> · Flexible</span>}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* === ACTIVE CARE NEEDS SUMMARY === */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-base font-bold text-[#1e6b4e]">Your Care Needs</h3>
                        <p className="text-xs text-[#546E5C]">Active care requests visible to your village</p>
                    </div>
                    <Link
                        to="/village"
                        className="text-xs font-semibold text-[#1e6b4e] hover:underline flex items-center gap-1"
                    >
                        Manage <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {careNeedsLoading ? (
                    <div className="text-sm text-[#546E5C]">Loading...</div>
                ) : activeCareNeeds.length === 0 ? (
                    <div className="border-2 border-dashed border-[#8bd7c7]/30 rounded-xl p-4 text-center">
                        <p className="text-sm text-[#546E5C] mb-1">No active care needs</p>
                        <p className="text-xs text-[#546E5C]/70 mb-3">
                            Post what you're looking for so your village can help
                        </p>
                        <Link
                            to="/village"
                            className="inline-block px-4 py-2 bg-[#1e6b4e] text-white rounded-full text-xs font-semibold hover:bg-[#155a3e] transition-colors"
                        >
                            Post a Care Need
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activeCareNeeds.map((need: any) => (
                            <div key={need.id} className="flex items-center justify-between p-3 bg-[#f0faf4] rounded-xl">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-[#1e6b4e]">
                                            {need.care_type || need.name || 'Care Need'}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${need.duration_type === 'regular' ? 'bg-[#d8f5e5] text-[#1e6b4e]' :
                                                need.duration_type === 'temporary' ? 'bg-blue-100 text-blue-700' :
                                                    need.duration_type === 'one-time' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-purple-100 text-purple-700'
                                            }`}>
                                            {need.duration_type === 'regular' ? 'Regular' :
                                                need.duration_type === 'temporary' ? 'Temporary' :
                                                    need.duration_type === 'one-time' ? 'One-Time' : 'Backup'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#546E5C] mt-0.5">
                                        {need.days_needed?.length > 0 && (
                                            <>{need.days_needed.join(', ')}</>
                                        )}
                                        {need.start_time && need.end_time && (
                                            <> · {formatTimeDisplay(need.start_time)} – {formatTimeDisplay(need.end_time)}</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* === UPCOMING EVENTS === */}
            {!isCaregiver && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-lg font-bold text-[#1e6b4e]">Upcoming Events</h3>
                            <p className="text-xs text-[#546E5C]">One-time care needs — date nights, travel, appointments</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddEvent(true)}
                            className="px-4 py-2 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#155a3e] transition-colors flex items-center gap-1.5"
                        >
                            <span className="text-lg leading-none">+</span>
                            Add Event
                        </button>
                    </div>

                    {/* Add Event Form */}
                    {showAddEvent && (
                        <div className="mb-4 mt-3 p-4 bg-[#d8f5e5]/20 rounded-xl border border-[#8bd7c7]/30 animate-fade-in">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {/* Event Type */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-[#1e6b4e] mb-1">What's the occasion?</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: 'date-night', label: 'Date Night' },
                                            { value: 'travel', label: 'Travel' },
                                            { value: 'appointment', label: 'Appointment' },
                                            { value: 'party', label: 'Party/Event' },
                                            { value: 'other', label: 'Other' },
                                        ].map(type => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setNewEvent({ ...newEvent, event_type: type.value })}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${newEvent.event_type === type.value
                                                    ? 'bg-[#1e6b4e] text-white'
                                                    : 'bg-white border border-gray-200 text-[#546E5C] hover:border-[#8bd7c7]'
                                                    }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#1e6b4e] mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={newEvent.start_date}
                                        onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#1e6b4e] mb-1">
                                        End Date <span className="font-normal text-[#546E5C]">(optional)</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newEvent.end_date || ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                                        min={newEvent.start_date || new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]"
                                    />
                                </div>

                                {/* Optional name */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-[#1e6b4e] mb-1">Name (optional)</label>
                                    <input
                                        type="text"
                                        value={newEvent.name || ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                                        placeholder="e.g., Anniversary dinner"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]"
                                    />
                                </div>

                                {/* Time range */}
                                <div>
                                    <TimePicker label="From" value={newEvent.start_time} onChange={(v) => setNewEvent({ ...newEvent, start_time: v })} />
                                </div>
                                <div>
                                    <TimePicker label="To" value={newEvent.end_time} onChange={(v) => setNewEvent({ ...newEvent, end_time: v })} />
                                </div>

                                {/* Notes */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-[#1e6b4e] mb-1">
                                        Notes <span className="font-normal text-[#546E5C]">(optional)</span>
                                    </label>
                                    <textarea
                                        value={newEvent.notes || ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                                        placeholder="e.g., Kids bedtime is 8pm, need someone comfortable with dogs"
                                        rows={2}
                                        maxLength={500}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowAddEvent(false)}
                                    className="px-4 py-2 text-sm text-[#546E5C] hover:text-[#1e6b4e]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    disabled={!newEvent.start_date || !newEvent.event_type}
                                    className="px-4 py-2 bg-[#1e6b4e] text-white rounded-full text-sm font-semibold hover:bg-[#155a3e] disabled:opacity-50 transition-colors"
                                >
                                    Save Event
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Events List */}
                    {upcomingEvents.length === 0 ? (
                        <div className="border-2 border-dashed border-[#8bd7c7]/30 rounded-xl p-6 text-center">
                            <Calendar className="w-8 h-8 text-[#8bd7c7] mx-auto mb-2" />
                            <p className="text-sm text-[#546E5C] mb-1">No upcoming events</p>
                            <p className="text-xs text-[#546E5C]/70">
                                Add a date night, trip, or special occasion when you'll need care
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingEvents.map(event => (
                                <div key={event.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${event.care_type === 'date-night' ? 'bg-pink-50 text-pink-500' :
                                            event.care_type === 'travel' ? 'bg-blue-50 text-blue-500' :
                                                event.care_type === 'appointment' ? 'bg-amber-50 text-amber-500' :
                                                    'bg-[#d8f5e5] text-[#1e6b4e]'
                                            }`}>
                                            {event.care_type === 'date-night' ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            ) : event.care_type === 'travel' ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            ) : (
                                                <Calendar className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#1e6b4e]">
                                                {event.name || eventTypeLabel(event.care_type)}
                                            </p>
                                            <p className="text-xs text-[#546E5C]">
                                                {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                                {event.end_date && event.end_date !== event.start_date && (
                                                    <> – {new Date(event.end_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</>
                                                )}
                                                {event.start_time && event.end_time && (
                                                    <> · {formatTimeDisplay(event.start_time)} – {formatTimeDisplay(event.end_time)}</>
                                                )}
                                            </p>
                                            {event.notes_for_caregiver && (
                                                <p className="text-xs text-[#546E5C]/70 mt-0.5 italic line-clamp-1">
                                                    {event.notes_for_caregiver}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteEvent(event.id)}
                                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
