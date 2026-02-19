interface RadioCardGroupProps {
    options: { value: string; label: string }[];
    selectedValue: string; // Enforce single select
    onChange: (value: string) => void;
    label?: string;
}

export default function RadioCardGroup({ options, selectedValue, onChange, label }: RadioCardGroupProps) {
    return (
        <div className="space-y-3">
            {label && <label className="block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide">{label}</label>}
            <div className="space-y-2">
                {options.map(opt => {
                    const isSelected = selectedValue === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            className={`
                                w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group
                                ${isSelected
                                    ? 'bg-green-50/50 border-opeari-green ring-1 ring-opeari-green shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-opeari-green/30 hover:shadow-sm'
                                }
                            `}
                        >
                            <span className={`font-bold text-sm ${isSelected ? 'text-opeari-heading' : 'text-gray-600'}`}>
                                {opt.label}
                            </span>
                            <div className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                ${isSelected ? 'border-opeari-green bg-white' : 'border-gray-300 group-hover:border-gray-400'}
                            `}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-opeari-green" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
