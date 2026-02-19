import React from 'react';

interface SettingsCardProps {
    title?: React.ReactNode;
    description?: string;
    icon?: React.ElementType;
    headerAction?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export default function SettingsCard({
    title,
    description,
    icon: Icon,
    children,
    className = '',
    headerAction
}: SettingsCardProps) {
    return (
        <div className={`p-6 border border-opeari-mint/30 rounded-2xl bg-white shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-opeari-green" />}
                    <div>
                        {typeof title === 'string' ? (
                            <h3 className="text-lg font-semibold text-opeari-heading">{title}</h3>
                        ) : (
                            title
                        )}
                        {description && (
                            <p className="text-sm text-opeari-text-secondary mt-0.5">{description}</p>
                        )}
                    </div>
                </div>
                {headerAction && <div className="ml-auto">{headerAction}</div>}
            </div>

            {children}
        </div>
    );
}
