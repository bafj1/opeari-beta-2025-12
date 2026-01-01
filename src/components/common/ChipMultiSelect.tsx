

interface Option {
    value: string;
    label: string;
}

interface ChipMultiSelectProps {
    label?: string;
    options: Option[];
    selected: string[]; // Array of values
    onChange: (values: string[]) => void;
    disabled?: boolean;
}

export default function ChipMultiSelect({
    label,
    options,
    selected = [],
    onChange,
    disabled = false
}: ChipMultiSelectProps) {

    // Ensure selected is always an array (resilience)
    const safeSelected = Array.isArray(selected) ? selected : [];

    const toggleOption = (value: string) => {
        if (disabled) return;

        if (safeSelected.includes(value)) {
            // Remove
            onChange(safeSelected.filter(v => v !== value));
        } else {
            // Add
            onChange([...safeSelected, value]);
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">
                    {label}
                </label>
            )}
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = safeSelected.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button" // Prevent form submittion
                            onClick={() => toggleOption(option.value)}
                            disabled={disabled}
                            className={`
                                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                                ${isSelected
                                    ? 'bg-[#1E6B4E] text-white border-[#1E6B4E] shadow-sm'
                                    : 'bg-white text-[#1E6B4E] border-[#1E6B4E]/20 hover:border-[#1E6B4E]/50 hover:bg-[#1E6B4E]/5'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
