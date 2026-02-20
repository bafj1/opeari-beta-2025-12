interface DayToggleListProps {
    days: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label?: string;
}

export default function DayToggleList({ days, selected, onChange, label }: DayToggleListProps) {
    const toggle = (val: string) => {
        if (selected.includes(val)) {
            onChange(selected.filter(d => d !== val));
        } else {
            onChange([...selected, val]);
        }
    };

    return (
        <div className="space-y-3">
            {label && <label className="block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide">{label}</label>}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {days.map(d => {
                    const isSelected = selected.includes(d.value);
                    return (
                        <button
                            key={d.value}
                            type="button"
                            onClick={() => toggle(d.value)}
                            className={`
                                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                ${isSelected
                                    ? 'bg-opeari-green text-white shadow-md scale-105'
                                    : 'bg-white border border-[#8bd7c7]/30 text-gray-500 hover:border-opeari-green/30 hover:bg-green-50/50'
                                }
                            `}
                        >
                            {d.label[0]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
