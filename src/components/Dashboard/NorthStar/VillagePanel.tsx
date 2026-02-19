import { ChevronRight, TrendingUp, Users } from 'lucide-react';

export const VillagePanel = () => {
    return (
        <div className="bg-[#FAF9F6] rounded-[24px] p-6 border border-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-serif text-lg text-opeari-heading">Inside your village</h2>
                <button className="text-opeari-text-secondary hover:text-opeari-green transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold">•••</span>
                    </div>
                </button>
            </div>

            <div className="bg-white rounded-[20px] p-5 shadow-sm mb-6 border border-opeari-border/20">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#E3EEE9] rounded-xl text-[#1E6B4E]">
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-serif text-opeari-heading leading-none">23</div>
                        <div className="text-xs text-opeari-text-secondary">people in your trusted circle</div>
                    </div>
                </div>

                {/* Face Pile Mockup */}
                <div className="flex -space-x-2 overflow-hidden mb-3 pl-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200" />
                    ))}
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-[#F3F4F6] flex items-center justify-center text-[10px] font-bold text-gray-500">
                        +19
                    </div>
                </div>

                <button className="text-sm font-semibold text-opeari-heading flex items-center hover:underline">
                    View village <ChevronRight size={14} className="ml-1" />
                </button>
            </div>

            {/* Community Signals */}
            <div className="space-y-3">
                <h3 className="font-serif text-md text-opeari-heading">Community Signals</h3>
                <CommunitySignals />
            </div>

        </div>
    );
}

export const CommunitySignals = () => {
    return (
        <div className="flex flex-col gap-3">
            <div className="bg-white/60 p-3 rounded-xl border border-white/50 flex gap-3 items-start">
                <div className="p-1.5 bg-[#E3EEE9]/50 rounded-lg text-[#1E6B4E] mt-0.5">
                    <Users size={14} />
                </div>
                <div>
                    <p className="text-sm text-opeari-text leading-snug">
                        <span className="font-bold">3 families nearby</span> are exploring a nanny share.
                    </p>
                </div>
            </div>

            <div className="bg-white/60 p-3 rounded-xl border border-white/50 flex gap-3 items-start">
                <div className="p-1.5 bg-[#FEF9E7] rounded-lg text-[#9A8C21] mt-0.5">
                    <TrendingUp size={14} />
                </div>
                <div>
                    <p className="text-sm text-opeari-text leading-snug">
                        Popular after school tutor among families like yours.
                    </p>
                </div>
            </div>
        </div>
    )
}
