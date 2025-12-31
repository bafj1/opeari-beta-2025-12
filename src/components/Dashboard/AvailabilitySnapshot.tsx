import { Link } from 'react-router-dom';
import { Calendar, Edit2, Check } from 'lucide-react';

export default function AvailabilitySnapshot() {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Calendar size={20} className="text-[#1e6b4e]" />
                    Your Availability
                </h2>
                <Link
                    to="/settings?tab=schedule"
                    className="text-sm font-semibold text-[#1e6b4e] hover:bg-[#1e6b4e]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                    <Edit2 size={14} />
                    Edit
                </Link>
            </div>

            {/* Visual Schedule Grid */}
            <div className="mb-6">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-xs font-bold text-gray-400 uppercase tracking-wide">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2 h-24">
                    {/* Mock Blocks for M-W-F */}
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                        // Mock pattern: Mon/Tue/Wed/Fri (0,1,2,4) available
                        const isAvailable = [0, 1, 2, 4].includes(i);
                        return (
                            <div key={i} className="flex flex-col gap-1 h-full">
                                {isAvailable ? (
                                    <div className="flex-1 bg-[#d8f5e5] rounded-md border border-[#1e6b4e]/20 flex flex-col items-center justify-center group cursor-default transition-all hover:bg-[#1e6b4e] hover:border-[#1e6b4e]">
                                        <span className="text-[10px] font-bold text-[#1e6b4e] group-hover:text-white">8-4</span>
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        <Check size={12} strokeWidth={3} /> Nanny Share
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                        <Check size={12} strokeWidth={3} /> Full-time
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
                        $28-35/hr
                    </span>
                </div>
            </div>
        </div>
    );
}
