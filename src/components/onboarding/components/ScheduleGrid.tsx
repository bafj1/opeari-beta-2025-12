import React from 'react';

interface ScheduleGridProps {
    value: Record<string, string[]>;
    onChange: (val: Record<string, string[]>) => void;
}

export const ScheduleGrid = ({ value, onChange }: ScheduleGridProps) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const times = ['Morning', 'Afternoon', 'Evening'];

    const toggle = (day: string, time: string) => {
        const dayLower = day.toLowerCase();
        const current = value[dayLower] || [];
        const newSchedule = { ...value };
        if (current.includes(time)) {
            newSchedule[dayLower] = current.filter((t: string) => t !== time);
        } else {
            newSchedule[dayLower] = [...current, time];
        }
        onChange(newSchedule);
    };

    const QUICK_SELECTS = [
        { label: 'M-F 9-5', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Morning', 'Afternoon'] },
        { label: 'Mornings', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Morning'] },
        { label: 'Afternoons', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Afternoon'] },
        { label: 'Evenings', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Evening'] },
        { label: 'Weekends', days: ['Sat', 'Sun'], times: ['Morning', 'Afternoon', 'Evening'] },
    ];

    const handleQuickSelect = (q: any) => {
        const newSchedule = { ...value };
        let isFullySelected = true;

        // Check if currently fully selected
        for (const d of q.days) {
            const dayLower = d.toLowerCase();
            const currentTimes = newSchedule[dayLower] || [];
            if (q.times.some((t: string) => !currentTimes.includes(t))) {
                isFullySelected = false;
                break;
            }
        }

        // Toggle logic
        for (const d of q.days) {
            const dayLower = d.toLowerCase();
            const currentTimes = newSchedule[dayLower] || [];

            if (isFullySelected) {
                // Remove
                newSchedule[dayLower] = currentTimes.filter((t: string) => !q.times.includes(t));
            } else {
                // Add (Union) - ensure unique
                const combined = [...currentTimes, ...q.times];
                newSchedule[dayLower] = combined.filter((item, index) => combined.indexOf(item) === index);
            }
        }

        onChange(newSchedule);
    };

    const clearAll = () => onChange({});

    return (
        <div className="space-y-4">
            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2">
                {QUICK_SELECTS.map(q => (
                    <button
                        key={q.label}
                        onClick={() => handleQuickSelect(q)}
                        className="px-4 py-2 bg-[#e8f5f0] text-opeari-green border border-opeari-mint rounded-full text-sm font-bold hover:bg-[#d8f5e5] hover:border-opeari-green transition-all"
                    >
                        {q.label}
                    </button>
                ))}
                <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-[#fffaf5] text-opeari-text-secondary border border-opeari-border rounded-full text-sm font-bold hover:bg-opeari-mint/20 hover:text-opeari-heading transition-all"
                >
                    Clear All
                </button>
            </div>

            <div className="border border-gray-200 rounded-xl p-2 md:p-4 bg-white overflow-x-auto">
                <div className="min-w-[400px] grid grid-cols-[auto_repeat(7,1fr)] gap-y-2 gap-x-1 text-center text-xs">
                    <div />
                    {days.map(d => <div key={d} className="font-bold text-opeari-heading py-2">{d}</div>)}

                    {times.map(time => (
                        <React.Fragment key={time}>
                            <div className="text-left font-medium text-gray-400 self-center text-[11px] pr-2">{time}</div>
                            {days.map(day => {
                                const isSel = value[day.toLowerCase()]?.includes(time);
                                return (
                                    <button
                                        key={`${day}-${time}`}
                                        onClick={() => toggle(day, time)}
                                        className={`h-9 rounded-lg border transition-all 
                                            ${isSel
                                                ? 'bg-[#d8f5e5] border-opeari-green border-2 shadow-inner'
                                                : 'bg-gray-50 border-gray-100 hover:bg-[#e8f5f0] hover:border-opeari-mint'}
                                        `}
                                    />
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};
