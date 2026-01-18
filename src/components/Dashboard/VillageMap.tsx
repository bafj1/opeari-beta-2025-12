// React import removed (unused)

export default function VillageMap() {
    return (
        <div className="relative w-full h-[300px] bg-[#fffaf5] rounded-card p-6 overflow-hidden shadow-card flex items-center justify-center group">
            {/* Map Background Pattern (CSS Grid) - very subtle */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#8BD7C7 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            {/* Decor Roads/Paths - Soft, curved, organic, abstract */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
                {/* Secondary Path - lighter */}
                <path
                    d="M-50 250 C 50 240, 150 280, 250 150 S 450 50, 500 80"
                    stroke="rgba(139, 215, 199, 0.2)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Main Path - soft mint */}
                <path
                    d="M-20 120 C 80 120, 180 80, 280 180 S 420 280, 480 250"
                    stroke="rgba(30, 107, 78, 0.05)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                />
            </svg>

            {/* Interactive Elements */}
            <div className="relative z-10 flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-button text-opeari-heading font-bold text-sm cursor-pointer hover:bg-opeari-mint/10 transition-colors border border-opeari-mint/30">
                    <div className="w-2.5 h-2.5 bg-[#b6e3f2] rounded-full"></div>
                    Families Nearby
                </div>
                <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-button text-opeari-heading font-bold text-sm cursor-pointer hover:bg-opeari-mint/10 transition-colors border border-opeari-mint/30">
                    <div className="w-2.5 h-2.5 bg-[#bfff73] rounded-full"></div>
                    Caregivers Open Soon
                </div>
            </div>

            {/* Location Marker - Soft Blue (Families) */}
            <div className="absolute bottom-12 left-12 w-10 h-10 bg-white rounded-full shadow-card flex items-center justify-center z-20 animate-[bounce_3s_infinite]">
                <div className="w-6 h-6 bg-[#b6e3f2] rounded-full border-2 border-white"></div>
            </div>

            {/* Location Marker - Soft Green (Caregivers) */}
            <div className="absolute top-16 right-24 w-8 h-8 bg-white rounded-full shadow-card flex items-center justify-center z-20 animate-[bounce_4s_infinite]">
                <div className="w-5 h-5 bg-[#bfff73] rounded-full border-2 border-white"></div>
            </div>
        </div>
    );
}
