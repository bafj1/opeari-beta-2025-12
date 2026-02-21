// DashboardMatchCard — Exact spec for Top Matches on the Family Dashboard
import { useNavigate } from 'react-router-dom';

function DashboardMatchCard({ match, viewerId: _viewerId }: { match: any; viewerId: string }) {
    const navigate = useNavigate();

    // Determine role display
    const role = match.role || 'parent';
    const isCaregiver = role === 'caregiver';
    const isParent = role === 'family' || role === 'parent';
    const roleLabel = isCaregiver ? 'Caregiver' : isParent ? 'Parent' : 'Both';

    // Role-based badge colors
    const roleBadgeBg = isCaregiver ? '#F8C3B3' : isParent ? '#d8f5e5' : '#8bd7c7';
    const roleBadgeText = isCaregiver ? '#9B4D3A' : '#1E6B4E';

    // Schedule days
    const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const matchDays = match.availability_days || [];

    // Care type formatting
    const careTypes = (match.care_types || []).slice(0, 2).map((ct: string) =>
        ct.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    );

    // Display name
    const displayName = match.display_name || match.first_name || 'Member';

    // Distance
    const distance = match.distance_miles != null
        ? (Number(match.distance_miles) < 1 ? '<1' : Math.round(Number(match.distance_miles)).toString())
        : '?';

    // Match score
    const score = match.match_score || 0;

    return (
        <div
            className="bg-white rounded-[20px] border-2 overflow-hidden"
            style={{ borderColor: 'rgba(139,215,199,0.2)', fontFamily: 'Comfortaa, sans-serif' }}
        >
            {/* Top gradient accent */}
            <div
                className="h-1.5"
                style={{
                    background: isCaregiver
                        ? 'linear-gradient(90deg, #F8C3B3, #E8A090)'
                        : 'linear-gradient(90deg, #1E6B4E, #8bd7c7)'
                }}
            />

            <div className="p-5">
                {/* Row 1: Avatar + Info + Score */}
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{
                            background: isCaregiver ? '#FFF0EB' : '#d8f5e5',
                            border: '2px solid rgba(139,215,199,0.3)'
                        }}
                    >
                        {match.avatar_url ? (
                            <img
                                src={match.avatar_url}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl" style={{ color: '#1E6B4E' }} aria-hidden="true">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E6B4E" strokeWidth="2">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M20 21a8 8 0 10-16 0" />
                                </svg>
                            </span>
                        )}
                    </div>

                    {/* Name + Role + Location */}
                    <div className="flex-1 min-w-0">
                        <p
                            className="text-[17px] font-bold truncate"
                            style={{ color: '#1E6B4E' }}
                        >
                            {displayName}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                                style={{ background: roleBadgeBg, color: roleBadgeText }}
                            >
                                {roleLabel}
                            </span>
                            <span className="text-xs" style={{ color: '#546E5C' }}>
                                {match.neighborhood || 'Nearby'} · {distance} mi
                            </span>
                        </div>
                    </div>

                    {/* Match Score */}
                    <div
                        className="flex-shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-bold text-white"
                        style={{ background: '#1E6B4E' }}
                        role="status"
                        aria-label={`${score} percent match`}
                    >
                        {score}% Match
                    </div>
                </div>

                {/* Row 2: Schedule + Care Types */}
                <div
                    className="flex items-center justify-between mt-4 pt-3.5"
                    style={{ borderTop: '1px solid rgba(139,215,199,0.2)' }}
                >
                    {/* Schedule days */}
                    <div className="flex gap-1" role="group" aria-label="Schedule availability">
                        {DAYS.map((day, i) => {
                            const isMatch = matchDays.includes(DAY_KEYS[i]);
                            return (
                                <div
                                    key={DAY_KEYS[i]}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors"
                                    style={{
                                        background: isMatch ? '#8bd7c7' : '#f0faf4',
                                        color: isMatch ? '#1E6B4E' : 'rgba(84,110,92,0.35)',
                                    }}
                                    aria-label={`${DAY_KEYS[i]}${isMatch ? ' - available' : ''}`}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>

                    {/* Care type pills */}
                    <div className="flex gap-1 flex-wrap justify-end">
                        {careTypes.map((ct: string, i: number) => (
                            <span
                                key={ct + i}
                                className="text-[10px] px-2 py-0.5 rounded-lg whitespace-nowrap"
                                style={{ color: '#546E5C', background: '#f0faf4' }}
                            >
                                {ct}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Row 3: Action Buttons */}
                <div className="flex gap-2 mt-3.5">
                    <button
                        onClick={() => navigate(`/messages`)}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E6B4E]"
                        style={{
                            background: 'rgba(30,107,78,0.08)',
                            color: '#1E6B4E',
                            fontFamily: 'Comfortaa, sans-serif',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Message
                    </button>
                    <button
                        onClick={() => navigate(`/member/${match.member_id}`)}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E6B4E]"
                        style={{
                            background: 'transparent',
                            color: '#1E6B4E',
                            fontFamily: 'Comfortaa, sans-serif',
                            border: '1.5px solid rgba(139,215,199,0.35)',
                            cursor: 'pointer',
                        }}
                    >
                        View Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DashboardMatchCard;
