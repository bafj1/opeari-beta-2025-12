import { MapPin } from 'lucide-react';

interface MatchProfile {
    id: string;
    name: string;
    role: 'Parent' | 'Caregiver' | 'Both';
    avatarColor: string; // quick aesthetic hack until we have real avatars
    badgeText: string;
    badgeType: 'schedule' | 'open' | 'verified';
    tags: string[];
}

interface VillageResultsProps {
    matches: MatchProfile[];
}

export default function VillageResults({ matches }: VillageResultsProps) {
    // If no matches, show true empty state
    if (!matches || matches.length === 0) {
        return (
            <div className="w-full bg-white/50 p-8 rounded-card flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-opeari-bg rounded-full flex items-center justify-center mb-4 text-opeari-text-secondary">
                    <MapPin size={24} />
                </div>
                <h3 className="font-bold text-opeari-heading font-comfortaa">No matches yet</h3>
                <p className="text-opeari-text-secondary text-sm mt-1 max-w-xs">
                    Try selecting more needs or inviting neighbors to grow your village.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full bg-white/50 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-opeari-heading">People near you who might fit</h2>
                <div className="flex gap-2 text-opeari-coral">
                    <span className="w-6 h-6 rounded-full bg-opeari-peach/20 flex items-center justify-center text-xs font-bold">{matches.length}</span>
                    <span className="text-opeari-text-secondary"><MapPin size={20} /></span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match) => (
                    <div key={match.id} className="bg-white rounded-card p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer group">
                        {/* Illustration Area */}
                        <div className={`h-28 ${match.avatarColor} rounded-image mb-4 relative overflow-hidden flex items-end justify-center`}>
                            {/* Abstract Avatar Placeholder */}
                            <div className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-sm mb-[-20px] shadow-sm"></div>
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <h3 className="font-bold text-opeari-heading text-lg">{match.name}</h3>
                                <span className="text-opeari-text-secondary text-sm">— {match.role}</span>
                            </div>

                            <p className="text-xs font-medium text-opeari-text pb-3 border-b border-opeari-border/50">
                                {match.badgeText}
                            </p>

                            <div className="pt-3">
                                <button className="w-full py-2 bg-opeari-peach hover:bg-opeari-peach/90 text-opeari-heading text-sm font-bold rounded-button shadow-button transition-all transform active:scale-95">
                                    View connection
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
