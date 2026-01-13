import { Link } from 'react-router-dom';
import { Calendar, Edit2, Check } from 'lucide-react';
import { useViewer } from '../../hooks/useViewer';

export default function AvailabilitySnapshot() {
    const { viewer } = useViewer();
    const profile = viewer?.caregiverProfile;

    // Safety check - if loading or no profile, show empty state or skeleton
    // For now we'll just render empty if no data
    const days = profile?.availability_days || [];
    const blocks = profile?.availability_blocks || [];
    const rate = profile?.hourly_rate;

    const rateString = rate ? `$${rate}/hr` : 'Rate not set';

    const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    // Helper to format blocks for display (mini)
    // simplistic mapping: if has 'morning' -> 'AM', 'afternoon' -> 'PM', etc.
    const getTimeLabel = () => {
        if (blocks.length === 0) return '---';
        if (blocks.length === 4) return '24h';
        if (blocks.includes('morning') && blocks.includes('afternoon')) return 'Day';
        if (blocks.includes('evening')) return 'Eve';
        return 'Avail';
    };

    const timeLabel = getTimeLabel();

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Calendar size={20} className="text-[#1e6b4e]" />
                    Your Availability
                </h2>
                <Link
                    to="/settings"
                    className="text-sm font-semibold text-[#1e6b4e] hover:bg-[#1e6b4e]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                    <Edit2 size={14} />
                    Edit
                </Link>
            </div>

            {/* Visual Schedule Grid */}
            <div className="mb-6">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {DAYS_ORDER.map(d => (
                        <div key={d} className="text-xs font-bold text-gray-400 uppercase tracking-wide">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2 h-24">
                    {DAYS_ORDER.map((day) => {
                        const isAvailable = days.includes(day);
                        return (
                            <div key={day} className="flex flex-col gap-1 h-full">
                                {isAvailable ? (
                                    <div className="flex-1 bg-[#d8f5e5] rounded-md border border-[#1e6b4e]/20 flex flex-col items-center justify-center group cursor-default transition-all hover:bg-[#1e6b4e] hover:border-[#1e6b4e]">
                                        <span className="text-[10px] font-bold text-[#1e6b4e] group-hover:text-white">{timeLabel}</span>
                                    </div>
                                ) : (
                                    <div className="flex-1 bg-gray-50 rounded-md border border-gray-100 border-dashed" />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Preferences Tags */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Open to:</span>
                <div className="flex gap-2">
                    {/* Dynamic Rate Tag */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                        {rateString}
                    </span>

                    {/* Placeholder Logic for Care Types (mock for now as care_types are on Member, not Profile in some schemas) 
                        Actually, care types can be inferred or we just show a static 'Nanny Share' if valid.
                        Let's just show 'Flexible' to match general vibe if we don't fetch types here.
                    */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        <Check size={12} strokeWidth={3} /> Flexible
                    </span>
                </div>
            </div>
        </div>
    );
}
