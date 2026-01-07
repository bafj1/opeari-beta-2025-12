import { useNavigate } from 'react-router-dom';

interface VillageRadarProps {
    location?: string;
    intel?: any;
}

export default function VillageRadar({ location, intel }: VillageRadarProps) {
    const navigate = useNavigate();
    const locationText = location ? ` in ${location}` : '';

    // Default / Loading State
    let title = "Village Radar";
    let desc = `We're constantly scanning for new families${locationText} that match your schedule.`;

    // Active Intel State (n >= 5)
    if (intel?.status === 'active') {
        title = "Community Pulse";

        const NEED_LABELS: Record<string, string> = {
            'nanny-share': 'Nanny Share',
            'part-time-nanny': 'Part-Time Nanny',
            'trusted-babysitter': 'Trusted Babysitter',
            'backup-care': 'Backup Care',
            'carpool': 'Carpool & School Runs',
            'helper': 'Helper at Home',
            'live-in': 'Live-In / Travel Care',
            'something-else': 'Something else',
        };

        const rawNeed = intel.top_needs?.[0];
        const topNeed = NEED_LABELS[rawNeed] || rawNeed || 'Care';
        desc = `${intel.cohort_size} families active${locationText}. Top request: ${topNeed}.`;
    }
    // Seed State (n < 5)
    else if (intel?.status === 'seed') {
        title = "Village Radar";
        desc = `You're early! ${intel.cohort_size || 0} families found${locationText}. We're scanning for matches.`;
    }

    return (
        <div className="bg-opeari-green text-white rounded-3xl p-6 relative overflow-hidden shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
            onClick={() => navigate('/build-your-village')}
        >
            {/* Background Radar Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="font-bold text-xl mb-1">{title}</h3>
                    <p className="text-white/80 text-sm max-w-xs">
                        {desc}
                    </p>
                </div>

                <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 font-bold whitespace-nowrap group-hover:bg-white group-hover:text-opeari-green transition-colors">
                    View Network
                </div>
            </div>
        </div>
    );
}
