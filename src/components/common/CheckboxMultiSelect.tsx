
interface CheckboxMultiSelectProps {
    label: string;
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    helperText?: string;
    columns?: 1 | 2;
}

export default function CheckboxMultiSelect({
    label,
    options,
    selected,
    onChange,
    helperText,
    columns = 2
}: CheckboxMultiSelectProps) {

    const handleToggle = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(s => s !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div className="mb-6">
            <label className="block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-3">
                {label}
            </label>

            {helperText && (
                <p className="text-xs text-gray-500 mb-3 -mt-1">{helperText}</p>
            )}

            <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {options.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none
                ${isSelected
                                    ? 'border-opeari-green/30 bg-opeari-green/5'
                                    : 'border-transparent hover:bg-gray-50'
                                }`}
                        >
                            <div
                                className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-opeari-green border-opeari-green' : 'bg-white border-gray-300'}`}
                            >
                                {isSelected && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>

                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => handleToggle(option.value)}
                            />

                            <span className={`text-sm font-medium leading-tight ${isSelected ? 'text-opeari-heading' : 'text-gray-600'}`}>
                                {option.label}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
