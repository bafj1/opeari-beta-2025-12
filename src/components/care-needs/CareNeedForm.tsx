import { useState, useEffect } from 'react';
import type { CareNeed } from '../../types/careNeed';
import { X, Check } from 'lucide-react';

interface CareNeedFormProps {
    careNeed?: CareNeed | null;
    onClose: () => void;
    onSave: (data: Partial<CareNeed>) => Promise<void>;
}

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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_OPTIONS = [
    { value: '06:00:00', label: '6:00 AM' },
    { value: '06:30:00', label: '6:30 AM' },
    { value: '07:00:00', label: '7:00 AM' },
    { value: '07:30:00', label: '7:30 AM' },
    { value: '08:00:00', label: '8:00 AM' },
    { value: '08:30:00', label: '8:30 AM' },
    { value: '09:00:00', label: '9:00 AM' },
    { value: '09:30:00', label: '9:30 AM' },
    { value: '10:00:00', label: '10:00 AM' },
    { value: '10:30:00', label: '10:30 AM' },
    { value: '11:00:00', label: '11:00 AM' },
    { value: '11:30:00', label: '11:30 AM' },
    { value: '12:00:00', label: '12:00 PM' },
    { value: '12:30:00', label: '12:30 PM' },
    { value: '13:00:00', label: '1:00 PM' },
    { value: '13:30:00', label: '1:30 PM' },
    { value: '14:00:00', label: '2:00 PM' },
    { value: '14:30:00', label: '2:30 PM' },
    { value: '15:00:00', label: '3:00 PM' },
    { value: '15:30:00', label: '3:30 PM' },
    { value: '16:00:00', label: '4:00 PM' },
    { value: '16:30:00', label: '4:30 PM' },
    { value: '17:00:00', label: '5:00 PM' },
    { value: '17:30:00', label: '5:30 PM' },
    { value: '18:00:00', label: '6:00 PM' },
    { value: '18:30:00', label: '6:30 PM' },
    { value: '19:00:00', label: '7:00 PM' },
    { value: '19:30:00', label: '7:30 PM' },
    { value: '20:00:00', label: '8:00 PM' },
    { value: '20:30:00', label: '8:30 PM' },
    { value: '21:00:00', label: '9:00 PM' },
];

export function CareNeedForm({ careNeed, onClose, onSave }: CareNeedFormProps) {
    const [primaryType, setPrimaryType] = useState(careNeed?.care_type || 'nanny-share');
    const [alsoOpenTo, setAlsoOpenTo] = useState<string[]>(careNeed?.also_open_to || []);
    const [selectedDays, setSelectedDays] = useState<string[]>(careNeed?.days_needed || ['mon', 'wed', 'fri']);
    const [isFlexible, setIsFlexible] = useState(!careNeed?.start_time);
    const [startTime, setStartTime] = useState(careNeed?.start_time || '09:00:00');
    const [endTime, setEndTime] = useState(careNeed?.end_time || '15:00:00');
    const [durationType, setDurationType] = useState<'ongoing' | 'short-term'>(
        (careNeed?.duration_type as 'ongoing' | 'short-term') || 'ongoing'
    );
    const [startDate, setStartDate] = useState(careNeed?.start_date || new Date().toISOString().split('T')[0]);

    const [endDate, setEndDate] = useState(careNeed?.end_date || '');
    const [startTimeframe, setStartTimeframe] = useState(careNeed?.start_timeframe || 'immediately');

    const [isSaving, setIsSaving] = useState(false);

    // Clear end date when switching to ongoing
    useEffect(() => {
        if (durationType === 'ongoing') {
            setEndDate('');
        }
    }, [durationType]);

    const toggleAlsoOpenTo = (value: string) => {
        setAlsoOpenTo(prev =>
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    };

    const toggleDay = (day: string) => {
        const d = day.toLowerCase();
        setSelectedDays(prev =>
            prev.includes(d) ? prev.filter(item => item !== d) : [...prev, d]
        );
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            await onSave({
                care_type: primaryType,
                also_open_to: alsoOpenTo,
                days_needed: selectedDays,
                start_time: isFlexible ? null : startTime,
                end_time: isFlexible ? null : endTime,
                duration_type: durationType,
                start_date: startDate || null,
                end_date: durationType === 'short-term' ? (endDate || null) : null,
                start_timeframe: durationType === 'ongoing' ? startTimeframe : null,
                is_active: true,
                status: careNeed?.status || 'open'
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
            <div className="bg-white rounded-[20px] max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl">

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

                    {/* Top Row: Care Type & Also Open To */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Care Type */}
                        <div>
                            <label className="block text-sm font-bold text-[#1e6b4e] mb-3 uppercase tracking-wide">
                                Care Type
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {CARE_TYPES.map(type => (
                                    <button
                                        type="button"
                                        key={type.value}
                                        onClick={() => setPrimaryType(type.value)}
                                        className={`
                                            px-3 py-2 rounded-[10px] text-sm font-medium text-left transition-all border
                                            ${primaryType === type.value
                                                ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                                                : 'bg-white text-[#546E5C] border-gray-200 hover:border-[#8bd7c7]'
                                            }
                                        `}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Also Open To */}
                        <div>
                            <label className="block text-sm font-bold text-[#1e6b4e] mb-1 uppercase tracking-wide">
                                Also Open To <span className="text-xs font-normal text-gray-500 normal-case">(optional)</span>
                            </label>
                            <p className="text-xs text-[#546E5C] mb-3">
                                Select other types you'd consider
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {CARE_TYPES
                                    .filter(type => type.value !== primaryType)
                                    .map(type => (
                                        <button
                                            type="button"
                                            key={type.value}
                                            onClick={() => toggleAlsoOpenTo(type.value)}
                                            className={`
                                                px-3 py-2 rounded-[10px] text-sm font-medium text-left transition-all border flex items-center gap-2
                                                ${alsoOpenTo.includes(type.value)
                                                    ? 'bg-[#d8f5e5] text-[#1e6b4e] border-[#1e6b4e]'
                                                    : 'bg-white text-[#546E5C] border-gray-200 hover:border-[#8bd7c7]'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-5 h-5 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-all
                                                ${alsoOpenTo.includes(type.value)
                                                    ? 'bg-[#1E6B4E] border-[#1E6B4E]'
                                                    : 'bg-[#fffaf5] border-gray-300'
                                                }
                                            `}>
                                                {alsoOpenTo.includes(type.value) && (
                                                    <div className="w-[6px] h-[10px] border-white border-b-2 border-r-2 transform rotate-45 -mt-[2px]" />
                                                )}
                                            </div>
                                            <span className="truncate">{type.label}</span>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 border-dashed"></div>

                    {/* Middle Row: Schedule & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Schedule */}
                        <div>
                            <label className="block text-sm font-bold text-[#1e6b4e] mb-3 uppercase tracking-wide">
                                Schedule
                            </label>
                            <div className="flex justify-between items-center gap-1">
                                {DAYS.map(day => (
                                    <div key={day} className="flex flex-col items-center gap-1">
                                        <span className="text-xs font-medium text-gray-500">{day[0]}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleDay(day.toLowerCase())}
                                            className={`
                                                w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm font-bold transition-all flex items-center justify-center border
                                                ${selectedDays.includes(day.toLowerCase())
                                                    ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                                                    : 'bg-white text-gray-400 border-gray-200 hover:border-[#8bd7c7]'
                                                }
                                            `}
                                        >
                                            {selectedDays.includes(day.toLowerCase()) && <Check className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Time */}
                        <div>
                            <label className="block text-sm font-bold text-[#1e6b4e] mb-3 uppercase tracking-wide flex justify-between items-center">
                                <span>Time</span>
                                <label className="flexible-checkbox" htmlFor="flexible-time">
                                    <input
                                        type="checkbox"
                                        id="flexible-time"
                                        checked={isFlexible}
                                        onChange={(e) => setIsFlexible(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <span className="checkbox-custom" />
                                    <span className="checkbox-label text-xs font-normal text-gray-500 normal-case">
                                        Flexible (no specific time)
                                    </span>
                                </label>
                            </label>

                            {!isFlexible ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 relative">
                                            <select
                                                id="start-time"
                                                name="start_time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full appearance-none bg-[#fffaf5] border-[1.5px] border-gray-300 rounded-lg px-3.5 py-2.5 font-[Comfortaa] text-sm text-[#1E6B4E] cursor-pointer focus:outline-none focus:border-[#8bd7c7] focus:ring-2 focus:ring-[#8bd7c7]/30 hover:border-[#8bd7c7] transition-all pr-9 disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231E6B4E' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'right 12px center'
                                                }}
                                            >
                                                {TIME_OPTIONS.map(opt => (
                                                    <option key={`start-${opt.value}`} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <span className="text-gray-400 font-medium">to</span>
                                        <div className="flex-1 relative">
                                            <select
                                                id="end-time"
                                                name="end_time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="w-full appearance-none bg-[#fffaf5] border-[1.5px] border-gray-300 rounded-lg px-3.5 py-2.5 font-[Comfortaa] text-sm text-[#1E6B4E] cursor-pointer focus:outline-none focus:border-[#8bd7c7] focus:ring-2 focus:ring-[#8bd7c7]/30 hover:border-[#8bd7c7] transition-all pr-9 disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231E6B4E' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'right 12px center'
                                                }}
                                            >
                                                {TIME_OPTIONS.map(opt => (
                                                    <option key={`end-${opt.value}`} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {/* Inline Validation Error */}
                                    {startTime >= endTime && (
                                        <p className="text-xs text-[#E07A5F] mt-1 pl-1">
                                            End time should be after start time
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 italic text-center">
                                    Flexible timing selected
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 border-dashed"></div>

                    {/* Bottom Row: Duration & Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-bold text-[#1e6b4e] mb-3 uppercase tracking-wide">
                                Duration
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`
                                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${durationType === 'ongoing' ? 'border-[#1e6b4e]' : 'border-gray-300 group-hover:border-[#8bd7c7]'}
                                    `}>
                                        {durationType === 'ongoing' && <div className="w-2.5 h-2.5 rounded-full bg-[#1e6b4e]" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="duration"
                                        value="ongoing"
                                        checked={durationType === 'ongoing'}
                                        onChange={() => setDurationType('ongoing')}
                                        className="sr-only"
                                    />
                                    <span className={`text-sm font-medium ${durationType === 'ongoing' ? 'text-[#1e6b4e]' : 'text-gray-600'}`}>Ongoing</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`
                                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${durationType === 'short-term' ? 'border-[#1e6b4e]' : 'border-gray-300 group-hover:border-[#8bd7c7]'}
                                    `}>
                                        {durationType === 'short-term' && <div className="w-2.5 h-2.5 rounded-full bg-[#1e6b4e]" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="duration"
                                        value="short-term"
                                        checked={durationType === 'short-term'}
                                        onChange={() => setDurationType('short-term')}
                                        className="sr-only"
                                    />
                                    <span className={`text-sm font-medium ${durationType === 'short-term' ? 'text-[#1e6b4e]' : 'text-gray-600'}`}>Short-term</span>
                                </label>
                            </div>
                        </div>

                        {/* Dates / Timeframe */}
                        <div>
                            <label className="block text-sm font-bold text-[#1e6b4e] mb-3 uppercase tracking-wide">
                                {durationType === 'ongoing' ? 'When do you need this?' : 'Dates (Range)'}
                            </label>

                            {durationType === 'ongoing' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'immediately', label: 'Immediately' },
                                        { value: 'within_week', label: 'Within a week' },
                                        { value: 'within_month', label: 'Within a month' },
                                        { value: 'flexible', label: 'Flexible' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setStartTimeframe(option.value)}
                                            className={`
                                                px-3 py-2 rounded-[10px] text-sm font-medium text-left transition-all border
                                                ${startTimeframe === option.value
                                                    ? 'bg-[#1e6b4e] text-white border-[#1e6b4e]'
                                                    : 'bg-white text-[#546E5C] border-gray-200 hover:border-[#8bd7c7]'
                                                }
                                            `}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]"
                                        />
                                    </div>
                                    <span className="text-gray-400 font-medium">to</span>
                                    <div className="flex-1">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            min={startDate}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e6b4e]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

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
