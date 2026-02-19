interface PreferenceRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
}

export default function PreferenceRow({ label, description, checked, onChange }: PreferenceRowProps) {
    return (
        <div
            onClick={onChange}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-opeari-mint/10 transition-colors border-b border-opeari-mint/20 last:border-0 cursor-pointer group"
        >
            <div className="flex-1 pr-4">
                <div className="font-semibold text-opeari-heading group-hover:text-opeari-green transition-colors">
                    {label}
                </div>
                {description && (
                    <div className="text-sm text-opeari-text-secondary mt-0.5">{description}</div>
                )}
            </div>

            <div
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${checked
                    ? 'bg-opeari-green border-opeari-green'
                    : 'border-opeari-mint hover:border-opeari-green bg-white'
                    }`}
            >
                {checked && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
        </div>
    );
}
