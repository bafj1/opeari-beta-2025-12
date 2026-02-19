
interface TimePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function TimePicker({ label, value, onChange, className = '' }: TimePickerProps) {
    // Generate time options in 15-minute increments from 6:00 AM to 10:45 PM
    const options: { display: string; value: string }[] = [];
    for (let h = 6; h <= 22; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
            const period = h >= 12 ? 'PM' : 'AM';
            const display = `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
            const val = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            options.push({ display, value: val });
        }
    }

    // Normalize stored value (might have :00 seconds suffix)
    const normalizedValue = value?.substring(0, 5) || '';

    return (
        <div className={`flex-1 ${className}`}>
            {label && (
                <label className="block text-xs font-semibold text-[#1e6b4e] mb-1">{label}</label>
            )}
            <select
                value={normalizedValue}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#1e6b4e] appearance-none cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-[#1e6b4e] focus:border-[#1e6b4e]
                    hover:border-[#8bd7c7] transition-colors"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231e6b4e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px',
                }}
            >
                <option value="">Select time</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.display}</option>
                ))}
            </select>
        </div>
    );
}
