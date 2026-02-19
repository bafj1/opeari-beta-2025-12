import { useState, useEffect } from 'react';
import { ScheduleGrid } from '../common/ScheduleGrid';
import { TimePicker } from '../common/TimePicker';

interface ScheduleBuilderProps {
    schedule: Record<string, any>;
    onChange: (schedule: Record<string, any>) => void;
    flexible: boolean;
    onFlexibleChange: (flexible: boolean) => void;
    isCaregiver: boolean;
    disabled?: boolean;
}

export default function ScheduleBuilder({
    schedule,
    onChange,
    flexible,
    onFlexibleChange,
    isCaregiver,
    disabled = false
}: ScheduleBuilderProps) {

    // Normalize schedule format — DB may store new format: { days: [...], start_time, end_time }
    // But this component expects: { mon: { blocks: [...], start: '09:00', end: '17:00' }, ... }
    const normalizedSchedule = (() => {
        if (!schedule || typeof schedule !== 'object') return {};

        // Detect new format: has 'days' array key
        if (Array.isArray(schedule.days)) {
            const dayMap: Record<string, string> = {
                'Mon': 'mon', 'Tue': 'tue', 'Wed': 'wed', 'Thu': 'thu',
                'Fri': 'fri', 'Sat': 'sat', 'Sun': 'sun',
                'mon': 'mon', 'tue': 'tue', 'wed': 'wed', 'thu': 'thu',
                'fri': 'fri', 'sat': 'sat', 'sun': 'sun',
            };
            const startTime = schedule.start_time || '09:00:00';
            const endTime = schedule.end_time || '17:00:00';
            const startHour = parseInt(startTime.split(':')[0]);
            const endHour = parseInt(endTime.split(':')[0]);
            const blocks: string[] = [];
            if (startHour < 12 && endHour > 6) blocks.push('Morning');
            if (startHour < 17 && endHour > 12) blocks.push('Afternoon');
            if (endHour > 17 || startHour >= 17) blocks.push('Evening');

            const result: Record<string, any> = {};
            schedule.days.forEach((day: string) => {
                const key = dayMap[day] || day.toLowerCase().slice(0, 3);
                result[key] = { blocks, start: startTime, end: endTime };
            });
            return result;
        }

        // Old format — verify each value is an object with blocks
        const result: Record<string, any> = {};
        Object.entries(schedule).forEach(([key, value]: [string, any]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = value;
            } else if (Array.isArray(value)) {
                // Raw array of blocks without time metadata
                result[key] = { blocks: value, start: '09:00:00', end: '17:00:00' };
            }
        });
        return result;
    })();

    // Derived state for the grid (only blocks)
    const gridValue = Object.keys(normalizedSchedule).reduce((acc, day) => {
        if (normalizedSchedule[day]?.blocks?.length) {
            acc[day] = normalizedSchedule[day].blocks;
        }
        return acc;
    }, {} as Record<string, string[]>);

    const activeDays = Object.keys(normalizedSchedule).filter(day => normalizedSchedule[day]?.blocks?.length > 0);

    // Global Time State
    const [globalStartTime, setGlobalStartTime] = useState('09:00:00');
    const [globalEndTime, setGlobalEndTime] = useState('17:00:00');

    // Initialize global time from existing schedule on mount
    useEffect(() => {
        const firstDayWithTimes = Object.values(normalizedSchedule).find(
            (day: any) => day.start && day.end
        );
        if (firstDayWithTimes) {
            setGlobalStartTime(firstDayWithTimes.start);
            setGlobalEndTime(firstDayWithTimes.end);
        }
    }, []); // Run once on mount

    // Helper: Determine blocks from time range
    const getBlocksFromTimeRange = (start: string, end: string): string[] => {
        if (!start || !end) return [];

        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        const blocks: string[] = [];

        // Morning: 6am-12pm
        if (startHour < 12 && endHour > 6) blocks.push('Morning');
        // Afternoon: 12pm-5pm  
        if (startHour < 17 && endHour > 12) blocks.push('Afternoon');
        // Evening: 5pm-10pm
        if (endHour > 17 || startHour >= 17) blocks.push('Evening');

        return blocks;
    };

    // Update schedule when global time changes
    const updateScheduleWithTimes = (newStart: string, newEnd: string) => {
        const blocks = getBlocksFromTimeRange(newStart, newEnd);
        const newSchedule = { ...normalizedSchedule };

        // Update all active days with new time and derived blocks
        // We only key off active days to avoid adding days just by changing time
        activeDays.forEach(day => {
            newSchedule[day] = {
                ...newSchedule[day],
                blocks,
                start: newStart,
                end: newEnd
            };
        });

        onChange(newSchedule);
    };

    const handleGridChange = (newGridValue: Record<string, string[]>) => {
        const newSchedule = { ...normalizedSchedule };

        // 1. Remove days that are gone
        Object.keys(newSchedule).forEach(day => {
            if (!newGridValue[day]) {
                delete newSchedule[day];
            }
        });

        // 2. Update/Add days from grid
        Object.keys(newGridValue).forEach(day => {
            if (!newSchedule[day]) {
                // New day added - use global time
                newSchedule[day] = {
                    blocks: newGridValue[day],
                    start: globalStartTime,
                    end: globalEndTime
                };
            } else {
                // Existing day updated - keep time, update blocks
                // OR should we enforce global time? 
                // Prompt: "The global time range still applies — when you add a new day..."
                // Implies mainly for new days, but let's keep it consistent.
                newSchedule[day] = {
                    ...newSchedule[day],
                    blocks: newGridValue[day]
                };
            }
        });

        onChange(newSchedule);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-[#1e6b4e]">Weekly Availability</h3>
                    <p className="text-xs text-[#546E5C]">Tap the time blocks you are available.</p>
                </div>
            </div>

            {/* Global Time Range - Placed above grid for "Source of Truth" feel */}
            {!flexible && (
                <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h4 className="text-sm font-bold text-[#1e6b4e]">Typical Hours</h4>
                            <p className="text-xs text-[#546E5C]">When you generally need care (applies to all selected days)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <TimePicker
                            value={globalStartTime}
                            onChange={(val) => {
                                setGlobalStartTime(val);
                                updateScheduleWithTimes(val, globalEndTime);
                            }}
                            className="w-40"
                        />
                        <span className="text-[#546E5C] font-medium text-sm">to</span>
                        <TimePicker
                            value={globalEndTime}
                            onChange={(val) => {
                                setGlobalEndTime(val);
                                updateScheduleWithTimes(globalStartTime, val);
                            }}
                            className="w-40"
                        />
                    </div>
                    <p className="text-xs text-[#546E5C]/70 mt-3">
                        For specific one-time needs (date nights, events, travel), use Upcoming Events below.
                    </p>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <ScheduleGrid
                    value={gridValue}
                    onChange={disabled ? () => { } : handleGridChange}
                />
            </div>

            {/* Flexible Toggle */}
            <div
                onClick={() => !disabled && onFlexibleChange(!flexible)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${flexible ? 'border-[#1e6b4e] bg-[#f0faf4]' : 'border-gray-100 hover:border-gray-200 bg-white'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {/* Checkbox visual */}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${flexible ? 'bg-[#1e6b4e] border-[#1e6b4e]' : 'bg-white border-gray-300'
                    }`}>
                    {/* Simplified Check icon since we removed lucid-react import for Check if not used elsewhere, oh wait used in updated impports */}
                    <svg
                        className={`w-3.5 h-3.5 text-white ${flexible ? 'block' : 'hidden'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <p className="font-semibold text-opeari-heading text-sm">My schedule is flexible</p>
                    <p className="text-xs text-[#1e6b4e]">
                        {isCaregiver ? 'Let families know you can adjust your hours' : 'Totally fine — many families start here'}
                    </p>
                </div>
            </div>
        </div>
    );
}
