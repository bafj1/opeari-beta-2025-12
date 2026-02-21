// DashboardMatchCard — V2: Warm avatar, one signal, single CTA, no schedule dots
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const COLORS = {
    green: '#1E6B4E',
    teal: '#8bd7c7',
    coral: '#F8C3B3',
    warmWhite: '#fffaf5',
    mint: '#d8f5e5',
    darkText: '#2d3a35',
    mutedText: '#6b7f76',
};

function DashboardMatchCard({ match, viewerId: _viewerId }: { match: any; viewerId: string }) {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(false);

    // Role
    const role = match.role || 'parent';
    const isCaregiver = role === 'caregiver';
    const isParent = role === 'family' || role === 'parent';
    const roleLabel = isCaregiver ? 'Caregiver' : isParent ? 'Parent' : 'Both';

    // Role-based colors
    const roleBadgeBg = isCaregiver ? COLORS.coral : isParent ? COLORS.mint : COLORS.teal;
    const roleBadgeText = isCaregiver ? '#9B4D3A' : COLORS.green;
    const avatarGradient = isCaregiver
        ? `linear-gradient(135deg, ${COLORS.coral} 0%, #f5a08a 50%, #f0c4b8 100%)`
        : isParent
            ? `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.teal} 100%)`
            : `linear-gradient(135deg, ${COLORS.teal} 0%, ${COLORS.coral} 100%)`;
    const avatarShadow = isCaregiver
        ? 'rgba(248,195,179,0.4)' : 'rgba(139,215,199,0.4)';

    const barColor = isCaregiver
        ? `linear-gradient(90deg, ${COLORS.coral}, #f5a08a)`
        : `linear-gradient(90deg, ${COLORS.mint}, ${COLORS.teal})`;

    // Display
    const displayName = match.display_name || match.first_name || 'Member';
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const score = match.match_score || 0;

    // Care types (max 2)
    const careTypes = (match.care_types || []).slice(0, 2).map((ct: string) =>
        ct.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    );

    // Signal line — pick the most useful context
    const overlapDays = match.schedule_overlap || match.overlap_days || 0;
    const distance = match.distance_miles != null
        ? (Number(match.distance_miles) < 1 ? '<1' : Math.round(Number(match.distance_miles)).toString())
        : null;
    const neighborhood = match.neighborhood;

    let signal = '';
    if (overlapDays > 0) {
        signal = `${overlapDays} day${overlapDays > 1 ? 's' : ''} of schedule overlap`;
    } else if (neighborhood) {
        signal = `${neighborhood}${distance ? ` · ${distance} mi away` : ''}`;
    } else if (distance) {
        signal = `${distance} mi away`;
    } else {
        signal = 'New to your area';
    }

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: hovered
                    ? '0 4px 24px rgba(30,107,78,0.14)'
                    : '0 2px 12px rgba(30,107,78,0.08)',
                overflow: 'hidden',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                transform: hovered ? 'translateY(-2px)' : 'none',
                cursor: 'pointer',
                fontFamily: 'Comfortaa, sans-serif',
                height: '100%',
                display: 'flex',
                flexDirection: 'column' as const,
            }}
            onClick={() => navigate(`/member/${match.member_id}`)}
        >
            {/* Role gradient bar */}
            <div style={{ height: 4, background: barColor }} />

            <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' as const }}>
                {/* Avatar + Name + Role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    {/* Warm gradient avatar with photo or initials */}
                    <div
                        style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: match.avatar_url ? undefined : avatarGradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 18,
                            color: isCaregiver ? COLORS.green : '#fff',
                            flexShrink: 0,
                            boxShadow: `0 2px 8px ${avatarShadow}`,
                            overflow: 'hidden',
                        }}
                    >
                        {match.avatar_url ? (
                            <img
                                src={match.avatar_url}
                                alt={displayName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            initials
                        )}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.darkText, marginBottom: 4 }}>
                            {displayName}
                        </div>
                        <span
                            style={{
                                display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                                background: roleBadgeBg, color: roleBadgeText,
                                fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
                            }}
                        >
                            {roleLabel}
                        </span>
                    </div>
                </div>

                {/* Signal line */}
                <div style={{ fontSize: 13, color: COLORS.mutedText, marginBottom: 14, lineHeight: 1.5 }}>
                    {signal}
                </div>

                {/* Care type pills */}
                {careTypes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {careTypes.map((ct: string, i: number) => (
                            <span
                                key={ct + i}
                                style={{
                                    padding: '3px 10px', borderRadius: 12,
                                    background: COLORS.warmWhite,
                                    border: `1px solid ${COLORS.mint}`,
                                    fontSize: 11, color: COLORS.green, fontWeight: 500,
                                }}
                            >
                                {ct}
                            </span>
                        ))}
                    </div>
                )}

                {/* Match score + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 700 }}>
                        {score}% match
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/member/${match.member_id}`); }}
                        style={{
                            fontSize: 12, fontWeight: 600,
                            background: COLORS.green, color: '#fff',
                            border: 'none', borderRadius: 20,
                            padding: '7px 18px', cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            opacity: hovered ? 1 : 0.9,
                            fontFamily: 'Comfortaa, sans-serif',
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
