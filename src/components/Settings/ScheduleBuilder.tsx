import { ScheduleGrid } from '../common/ScheduleGrid';
import { Check } from 'lucide-react';

interface ScheduleBuilderProps {
    schedule: Record<string, string[]>;
    onChange: (schedule: Record<string, string[]>) => void;
    flexible: boolean;
    onFlexibleChange: (flexible: boolean) => void;
    isCaregiver: boolean;
    disabled?: boolean;
}

export default function ScheduleBuilder({
    schedule,
    onChange,
    flexible,
    onFlexibleChange,
    isCaregiver,
    disabled = false
}: ScheduleBuilderProps) {

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-bold text-opeari-heading">Weekly Availability</h3>
                    <p className="text-sm text-gray-500">
                        {isCaregiver ? 'Tap the time blocks when you can work.' : 'Tap the time blocks you are available.'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <ScheduleGrid
                    value={schedule}
                    onChange={disabled ? () => { } : onChange}
                />
            </div>

            {/* Flexible Toggle */}
            <div
                onClick={() => !disabled && onFlexibleChange(!flexible)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${flexible ? 'border-[#1e6b4e] bg-[#f0faf4]' : 'border-gray-100 hover:border-gray-200 bg-white'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${flexible ? 'bg-[#1e6b4e] border-[#1e6b4e]' : 'bg-white border-gray-300'
                    }`}>
                    {flexible && <Check size={14} className="text-white" />}
                </div>
                <div>
                    <p className="font-semibold text-opeari-heading">My schedule is flexible</p>
                    <p className="text-sm text-[#1e6b4e]">
                        {isCaregiver ? 'Let families know you can adjust your hours' : 'Totally fine — many families start here'}
                    </p>
                </div>
            </div>
        </div>
    );
}
