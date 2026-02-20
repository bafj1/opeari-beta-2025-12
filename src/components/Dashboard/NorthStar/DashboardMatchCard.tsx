// DashboardMatchCard — Top Matches card design for the Family Dashboard

const COLORS = {
    primary: '#1E6B4E',
    teal: '#8bd7c7',
    coral: '#F8C3B3',
    mint: '#d8f5e5',
    bg: '#f0faf4',
    textMuted: '#546E5C',
    border: 'rgba(139,215,199,0.2)',
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_MAP: Record<string, number> = {
    monday: 0, mon: 0,
    tuesday: 1, tue: 1,
    wednesday: 2, wed: 2,
    thursday: 3, thu: 3,
    friday: 4, fri: 4,
    saturday: 5, sat: 5,
    sunday: 6, sun: 6,
};

interface DashboardMatchCardProps {
    memberId: string;
    name: string;
    role: string;
    neighborhood?: string;
    matchScore: number;
    distance: number;
    avatarUrl?: string;
    availabilityDays?: string[];
    careTypes?: string[];
    connectionStatus: 'none' | 'pending' | 'accepted';
    isConnecting?: boolean;
    onConnect: () => void;
    onViewProfile: () => void;
    onMessage?: (id: string, name: string) => void;
}

export default function DashboardMatchCard({
    memberId,
    name,
    role,
    neighborhood,
    matchScore,
    distance,
    avatarUrl,
    availabilityDays,
    careTypes,
    connectionStatus,
    isConnecting,
    onConnect,
    onViewProfile,
    onMessage,
}: DashboardMatchCardProps) {
    const roleLabel = role === 'caregiver' ? 'Caregiver' : 'Parent';
    const roleColor = role === 'caregiver' ? COLORS.coral : COLORS.mint;
    const roleTextColor = role === 'caregiver' ? '#9B4D3A' : COLORS.primary;

    // Convert availability_days strings to day indices
    const scheduleDayIndices = (availabilityDays || []).map(d => DAY_MAP[d.toLowerCase()]).filter(i => i !== undefined);

    // Format care types for display
    const displayCareTypes = (careTypes || []).slice(0, 2).map(ct => {
        return ct.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    });

    const isConnected = connectionStatus === 'accepted';
    const isPending = connectionStatus === 'pending';

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 20,
                border: `2px solid ${COLORS.border}`,
                overflow: 'hidden',
                fontFamily: 'Comfortaa, sans-serif',
                width: '100%',
            }}
        >
            {/* Top gradient banner */}
            <div
                style={{
                    height: 6,
                    background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.teal})`,
                }}
            />

            <div style={{ padding: '20px 24px' }}>
                {/* Row 1: Avatar + Info + Score */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {/* Avatar */}
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: avatarUrl ? `url(${avatarUrl}) center/cover no-repeat` : COLORS.mint,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: 24,
                            border: `2px solid ${COLORS.teal}40`,
                        }}
                    >
                        {avatarUrl ? null : '🌿'}
                    </div>

                    {/* Name + Role + Location */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                                style={{
                                    fontSize: 17,
                                    fontWeight: 700,
                                    color: COLORS.primary,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {name}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: roleTextColor,
                                    background: roleColor + '40',
                                    padding: '2px 10px',
                                    borderRadius: 20,
                                    letterSpacing: 0.3,
                                }}
                            >
                                {roleLabel}
                            </span>
                            <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                                {neighborhood || 'Nearby'} · {distance < 1 ? '<1' : distance} mi
                            </span>
                        </div>
                    </div>

                    {/* Match Score Badge */}
                    <div
                        style={{
                            background: COLORS.primary,
                            color: '#fff',
                            borderRadius: 12,
                            padding: '6px 12px',
                            fontSize: 13,
                            fontWeight: 700,
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {matchScore}% Match
                    </div>
                </div>

                {/* Row 2: Schedule + Care Types */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: `1px solid ${COLORS.border}`,
                    }}
                >
                    {/* Schedule days */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {DAYS.map((day, i) => {
                            const isMatch = scheduleDayIndices.includes(i);
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background: isMatch ? COLORS.primary : COLORS.bg,
                                        color: isMatch ? '#fff' : COLORS.textMuted + '80',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>

                    {/* Care type pills */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {displayCareTypes.map((ct, i) => (
                            <span
                                key={i}
                                style={{
                                    fontSize: 10,
                                    color: COLORS.textMuted,
                                    background: COLORS.bg,
                                    padding: '3px 8px',
                                    borderRadius: 8,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {ct}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Row 3: Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    {isConnected ? (
                        <>
                            <button
                                type="button"
                                onClick={() => onMessage?.(memberId, name)}
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: COLORS.primary + '15',
                                    color: COLORS.primary,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: 'Comfortaa, sans-serif',
                                    cursor: 'pointer',
                                }}
                            >
                                Message
                            </button>
                            <button
                                type="button"
                                onClick={onViewProfile}
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: 12,
                                    border: `1.5px solid ${COLORS.teal}50`,
                                    background: 'transparent',
                                    color: COLORS.primary,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: 'Comfortaa, sans-serif',
                                    cursor: 'pointer',
                                }}
                            >
                                View Profile
                            </button>
                        </>
                    ) : isPending ? (
                        <>
                            <button
                                type="button"
                                disabled
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: 12,
                                    border: `1.5px solid ${COLORS.teal}40`,
                                    background: COLORS.bg,
                                    color: COLORS.textMuted,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: 'Comfortaa, sans-serif',
                                    cursor: 'default',
                                    opacity: 0.7,
                                }}
                            >
                                Pending
                            </button>
                            <button
                                type="button"
                                onClick={onViewProfile}
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: 12,
                                    border: `1.5px solid ${COLORS.teal}50`,
                                    background: 'transparent',
                                    color: COLORS.primary,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: 'Comfortaa, sans-serif',
                                    cursor: 'pointer',
                                }}
                            >
                                View Profile
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onConnect}
                                disabled={isConnecting}
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: COLORS.primary,
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    fontFamily: 'Comfortaa, sans-serif',
                                    cursor: isConnecting ? 'wait' : 'pointer',
                                    opacity: isConnecting ? 0.6 : 1,
                                }}
                            >
                                {isConnecting ? 'Sending...' : 'Connect'}
                            </button>
                            <button
                                type="button"
                                onClick={onViewProfile}
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: 12,
                                    border: `1.5px solid ${COLORS.teal}50`,
                                    background: 'transparent',
                                    color: COLORS.primary,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: 'Comfortaa, sans-serif',
                                    cursor: 'pointer',
                                }}
                            >
                                View Profile
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
