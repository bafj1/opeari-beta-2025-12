
interface SettingsToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function SettingsToggle({ label, description, checked, onChange }: SettingsToggleProps) {
    return (
        <div
            onClick={() => onChange(!checked)}
            className={`flex items-center justify-between p-4 border-2 rounded-[20px] transition-all cursor-pointer ${checked
                    ? 'border-opeari-green bg-opeari-mint/20'
                    : 'border-opeari-mint/30 hover:border-opeari-green bg-white'
                }`}
        >
            <div className="flex-1 pr-4">
                <div className={`text-sm font-semibold ${checked ? 'text-opeari-green' : 'text-opeari-heading'}`}>{label}</div>
                {description && (
                    <p className={`text-xs mt-0.5 ${checked ? 'text-opeari-green/80' : 'text-opeari-text-secondary'}`}>{description}</p>
                )}
            </div>
            <button
                type="button"
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-opeari-green' : 'bg-opeari-mint/40'}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}
