import { Settings, Menu, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VillagePanelProps {
    connectionsStarted?: number;
    needsSelected?: number;
    availabilityAdded?: boolean;
}

export default function VillagePanel({
    connectionsStarted = 0,
    needsSelected = 0,
    availabilityAdded = false
}: VillagePanelProps) {
    return (
        <div className="bg-white rounded-[24px] p-6 shadow-card h-fit sticky top-6">
            {/* Header - Kept aligned but logo removed for calmness */}
            <div className="flex items-center justify-end mb-4">
                <div className="flex gap-3 text-opeari-text-secondary">
                    <Settings size={20} className="hover:text-opeari-heading cursor-pointer transition-colors" />
                    <Menu size={20} className="hover:text-opeari-heading cursor-pointer transition-colors" />
                </div>
            </div>

            <h2 className="text-xl font-bold text-opeari-heading mb-6">Your Village</h2>

            <div className="space-y-4">
                {/* Item 1: Connections - Show only if > 0 or hide entirely? User said: "Hide numeric zeros... Replace with promise-based copy" */}
                {connectionsStarted > 0 ? (
                    <div className="flex items-center justify-between p-3 rounded-[20px] bg-white shadow-card hover:bg-opeari-mint/10 transition-colors cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-stone-100 text-stone-600 rounded-full">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <span className="text-opeari-text font-bold text-sm">Connections started</span>
                        </div>
                        <span className="font-bold text-opeari-heading">{connectionsStarted}</span>
                    </div>
                ) : (
                    <div className="p-4 rounded-[20px] bg-stone-50 border border-stone-100/50 text-center">
                        <p className="text-xs text-stone-400 font-medium">Connections will appear here once you invite someone.</p>
                    </div>
                )}

                {/* Item 2: Needs selected - Hide if 0 */}
                {needsSelected > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-[20px] bg-white shadow-card hover:bg-opeari-mint/10 transition-colors cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-stone-100 text-stone-600 rounded-full">
                                <CheckCircle2 size={16} strokeWidth={2.5} />
                            </div>
                            <span className="text-opeari-text font-bold text-sm">Needs selected</span>
                        </div>
                        <span className="font-bold text-stone-300">{needsSelected}</span>
                    </div>
                )}

                {/* Item 3: Availability - Soft Pill */}
                <div className="flex items-center justify-between p-3 rounded-[20px] bg-white shadow-card hover:bg-stone-50 transition-colors group cursor-pointer border border-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-stone-100 text-stone-600 rounded-full">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <span className="text-opeari-text font-bold text-sm">Availability</span>
                    </div>
                    {availabilityAdded ? (
                        <span className="text-opeari-green font-bold text-sm">Added</span>
                    ) : (
                        <div className="flex items-center gap-1 text-opeari-text-secondary group-hover:text-opeari-text text-sm font-bold">
                            <span>Not added</span>
                            <ArrowRight size={14} strokeWidth={2.5} />
                        </div>
                    )}
                </div>
            </div>

            {/* Next Step Box (Dynamic) */}
            {!availabilityAdded && (
                <div className="mt-8 bg-amber-50 rounded-2xl p-5 border border-amber-100">
                    <h3 className="font-bold text-opeari-heading mb-1">Next step:</h3>
                    <Link to="/settings" className="flex items-center justify-between text-opeari-heading font-medium hover:text-opeari-green-dark hover:opacity-80 transition-all">
                        Add general availability
                        <ArrowRight size={16} />
                    </Link>
                </div>
            )}

            {availabilityAdded && connectionsStarted === 0 && (
                <div className="mt-8 bg-blue-50 rounded-2xl p-5 border border-blue-100">
                    <h3 className="font-bold text-opeari-heading mb-1">Next step:</h3>
                    <Link to="/search" className="flex items-center justify-between text-opeari-heading font-medium hover:text-blue-600 transition-colors">
                        Find someone to connect
                        <ArrowRight size={16} />
                    </Link>
                </div>
            )}

        </div>
    );
}
