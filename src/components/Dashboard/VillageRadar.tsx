import { useNavigate } from 'react-router-dom';

export default function VillageRadar() {
    const navigate = useNavigate();

    return (
        <div className="bg-opeari-green text-white rounded-3xl p-6 relative overflow-hidden shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
            onClick={() => navigate('/build-your-village')}
        >
            {/* Background Radar Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="font-bold text-xl mb-1">Village Radar</h3>
                    <p className="text-white/80 text-sm max-w-xs">
                        We're constantly scanning for new families in [Your Neighborhood] that match your schedule.
                    </p>
                </div>

                <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 font-bold whitespace-nowrap group-hover:bg-white group-hover:text-opeari-green transition-colors">
                    View Network
                </div>
            </div>
        </div>
    );
}
