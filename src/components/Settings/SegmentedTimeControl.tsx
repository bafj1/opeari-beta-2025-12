interface SegmentedTimeControlProps {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label?: string;
}

export default function SegmentedTimeControl({ options, selected, onChange, label }: SegmentedTimeControlProps) {
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
            <div className="grid grid-cols-2 gap-3">
                {options.map(opt => {
                    const isSelected = selected.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggle(opt.value)}
                            className={`
                                py-3 px-4 rounded-xl text-sm font-bold transition-all border
                                ${isSelected
                                    ? 'bg-opeari-green text-white border-opeari-green shadow-sm'
                                    : 'bg-white border-[#8bd7c7]/30 text-gray-600 hover:border-opeari-green/30 hover:bg-green-50/30'
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
