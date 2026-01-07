
import { Link } from 'react-router-dom';
import { useViewer } from '../hooks/useViewer';
import Header from '../components/common/Header';

// Placeholder data since we don't have real "Village" agg yet
const WEEKLY_STATS = [
    { day: 'Mon', count: 2, active: true },
    { day: 'Tue', count: 0, active: false },
    { day: 'Wed', count: 4, active: true },
    { day: 'Thu', count: 1, active: true },
    { day: 'Fri', count: 3, active: true },
    { day: 'Sat', count: 0, active: false },
    { day: 'Sun', count: 0, active: false },
];

const SAMPLE_MATCHES = [
    { id: '1', name: 'Sarah', role: 'Family', overlap: 'Mon/Wed Afternoons', initials: 'S' },
    { id: '2', name: 'Elena', role: 'Caregiver', overlap: 'Tue/Thu Mornings', initials: 'E' },
    { id: '3', name: 'Mike', role: 'Family', overlap: 'Fri Evenings', initials: 'M' },
];



export default function Village() {
    const { viewer } = useViewer(); // Use viewer to ensure auth context, though data is placeholder

    return (
        <div className="min-h-screen bg-[#FAF8F5] pb-20">
            <Header />

            {/* A) Header Section */}
            <div className="bg-[#1E6B4E] text-white pt-10 pb-20 px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-3xl sm:text-4xl font-bold font-comfortaa mb-2">Your Village</h1>
                    <p className="opacity-90 text-sm sm:text-base max-w-lg">
                        A schedule-first view of your local support network. See who matches your rhythm.
                    </p>
                </div>

                {/* Abstract Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20 space-y-6">

                {/* B) Village at a Glance (Map Hero) */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#1E6B4E]/10 overflow-hidden relative group">
                    {/* Abstract Map Texture */}
                    <div className="h-48 bg-[#eef6f3] relative overflow-hidden">
                        {/* Map Dots/Clusters (Decor) */}
                        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#1E6B4E]/20 rounded-full"></div>
                        <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-[#1E6B4E]/30 rounded-full"></div>
                        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-[#1E6B4E]/20 rounded-full"></div>

                        {/* "You Are Here" Marker */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <div className="w-4 h-4 bg-[#1E6B4E] rounded-full ring-4 ring-white shadow-md z-10"></div>
                            <div className="w-24 h-24 bg-[#1E6B4E]/5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping-slow"></div>
                        </div>

                        {/* Overlay Text */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#1E6B4E] shadow-sm border border-[#1E6B4E]/10">
                            {viewer?.member?.neighborhood || 'Your Neighborhood'}
                        </div>
                    </div>
                </div>

                {/* C) This Week Schedule Preview */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#1E6B4E]/10">
                    <h2 className="text-[#1E6B4E] font-bold text-lg mb-4">This Week's Potential</h2>
                    <div className="grid grid-cols-7 gap-1 sm:gap-4">
                        {WEEKLY_STATS.map((day) => (
                            <div key={day.day} className="flex flex-col items-center">
                                <span className="text-xs font-medium text-[#4A6163] mb-2">{day.day}</span>
                                <div
                                    className={`w-full aspect-[4/5] sm:aspect-square rounded-xl flex flex-col items-center justify-center border transition-all ${day.active
                                        ? 'bg-[#d8f5e5] border-[#1E6B4E]/20 text-[#1E6B4E]'
                                        : 'bg-[#fafafa] border-transparent text-gray-300'
                                        }`}
                                >
                                    <span className="font-bold text-lg sm:text-xl">{day.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* D) Preview Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Care Matches */}
                    <div className="bg-[#fffaf5] p-6 rounded-2xl border border-[#F8C3B3] flex flex-col">
                        <div className="w-10 h-10 rounded-full bg-[#F8C3B3]/20 flex items-center justify-center mb-4 text-[#F8C3B3]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <h3 className="text-[#1E6B4E] font-bold text-lg mb-1">Care Matches</h3>
                        <p className="text-[#4A6163] text-sm mb-6 flex-grow">People who match your schedule and care preferences.</p>
                        <Link to="/matches" className="text-center w-full py-3 bg-[#1E6B4E] text-white font-bold rounded-xl hover:bg-[#165a41] transition-colors">
                            View Matches
                        </Link>
                    </div>

                    {/* 2. Nanny Shares */}
                    <div className="bg-white p-6 rounded-2xl border border-[#1E6B4E]/10 flex flex-col">
                        <div className="w-10 h-10 rounded-full bg-[#d8f5e5] flex items-center justify-center mb-4 text-[#1E6B4E]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h3 className="text-[#1E6B4E] font-bold text-lg mb-1">Nanny Shares</h3>
                        <p className="text-[#4A6163] text-sm mb-6 flex-grow">Families with overlapping needs for shared care.</p>
                        <Link to="/matches" className="text-center w-full py-3 bg-[#d8f5e5] text-[#1E6B4E] font-bold rounded-xl hover:bg-[#cbf0db] transition-colors">
                            Explore
                        </Link>
                    </div>

                    {/* 3. Backup Help */}
                    <div className="bg-white p-6 rounded-2xl border border-[#1E6B4E]/10 flex flex-col">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-[#1E6B4E] font-bold text-lg mb-1">Backup Help</h3>
                        <p className="text-[#4A6163] text-sm mb-6 flex-grow">Neighbors available when life happens.</p>
                        <Link to="/matches" className="text-center w-full py-3 border border-[#1E6B4E]/20 text-[#1E6B4E] font-bold rounded-xl hover:bg-gray-50 transition-colors">
                            Find Help
                        </Link>
                    </div>

                    {/* 4. Coming Soon (Grouped) */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300 flex flex-col justify-center items-center text-center opacity-70">
                        <span className="px-3 py-1 bg-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Coming Soon</span>
                        <p className="text-[#1E6B4E] font-bold mb-1">Classes, Tutors & Household</p>
                        <p className="text-[#4A6163] text-xs">Expanding your village support system.</p>
                    </div>
                </div>

                {/* E) Active Right Now (Optional) */}
                <div>
                    <h2 className="text-[#1E6B4E] font-bold text-lg mb-4">Active Right Now</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {SAMPLE_MATCHES.map(match => (
                            <div key={match.id} className="bg-white p-4 rounded-xl border border-[#1E6B4E]/5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#1E6B4E]/10 flex items-center justify-center text-[#1E6B4E] font-bold">
                                    {match.initials}
                                </div>
                                <div>
                                    <p className="text-[#1E6B4E] font-bold text-sm">{match.name}</p>
                                    <p className="text-[#4A6163] text-xs">{match.overlap}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
