

interface DashboardHeaderProps {
    firstName: string;
    loading?: boolean;
    familyCount?: number;
    newMatchesCount?: number;
}

export default function DashboardHeader({ firstName, loading, familyCount = 0, newMatchesCount = 0 }: DashboardHeaderProps) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-opeari-heading mb-2">
                {timeGreeting}, {firstName || 'Neighbor'}.
            </h1>
            <p className="text-gray-500 text-lg mb-6">
                Your village is active today.
            </p>

            <div className="flex flex-wrap gap-4">
                <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-opeari-green animate-pulse" />
                    <span className="text-sm font-semibold text-gray-700">
                        {loading ? '...' : familyCount} Families Nearby
                    </span>
                </div>
                {newMatchesCount > 0 && (
                    <div className="bg-opeari-peach/20 px-4 py-2 rounded-full shadow-sm border border-opeari-peach/50 flex items-center gap-2">
                        <span className="text-sm font-bold text-[#e08e70]">
                            {newMatchesCount} New Matches
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
}
