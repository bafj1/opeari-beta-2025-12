import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Search } from 'lucide-react';
import { useViewer } from '../hooks/useViewer';
import { supabase } from '../lib/supabase';



export default function Village() {
    const { viewer, loading } = useViewer();
    const [stats, setStats] = useState({ incoming: 0, opportunities: 0, hasData: false });

    // Normalize role for robust checking
    const role = (viewer?.member?.role || '').toLowerCase().trim();
    const isFamily = role === 'family' || role === 'parent';
    const isCaregiver = role === 'caregiver' || role === 'provider';

    useEffect(() => {
        async function fetchSignals() {
            // Fetch if specific role matches OR if role is unknown/empty (fail safe)
            const fetchIncoming = !role || isFamily;
            const fetchOpportunities = !role || isCaregiver;

            const results = await Promise.allSettled([
                fetchIncoming ? supabase.rpc('get_incoming_interests') : Promise.resolve({ data: [], error: null }),
                fetchOpportunities ? supabase.rpc('get_opportunity_cards') : Promise.resolve({ data: [], error: null })
            ]);

            const newStats = { incoming: 0, opportunities: 0, hasData: false };

            // 1. Incoming Interests
            if (results[0].status === 'fulfilled' && !results[0].value.error) {
                const count = results[0].value.data?.length || 0;
                newStats.incoming = count;
            } else {
                console.error('Village: Failed to fetch incoming interests', results[0].status === 'rejected' ? results[0].reason : results[0].value.error);
            }

            // 2. Opportunities
            if (results[1].status === 'fulfilled' && !results[1].value.error) {
                const count = results[1].value.data?.length || 0;
                newStats.opportunities = count;
            } else {
                console.error('Village: Failed to fetch opportunities', results[1].status === 'rejected' ? results[1].reason : results[1].value.error);
            }

            newStats.hasData = newStats.incoming > 0 || newStats.opportunities > 0;
            setStats(newStats);
        }

        if (!loading) {
            fetchSignals();
        }
    }, [loading, role]);

    return (
        <div className="min-h-screen bg-opeari-bg pb-20 font-sans">

            {/* A) Header Section */}
            <div className="bg-[#1E6B4E] text-white pt-10 pb-20 px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-3xl sm:text-4xl font-bold font-comfortaa mb-2">Your Village</h1>
                    <p className="opacity-90 text-sm sm:text-base max-w-lg">
                        A schedule-first view of your local support network. See who matches your rhythm.
                    </p>
                </div>

                {/* Abstract Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 lg:px-6 -mt-10 relative z-20 space-y-6">

                {/* B) Village at a Glance (Map Hero) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                    {/* Abstract Map Texture */}
                    <div className="h-48 bg-stone-50 relative overflow-hidden">
                        {/* Map Dots/Clusters (Decor) */}
                        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-opeari-green/20 rounded-full"></div>
                        <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-opeari-green/30 rounded-full"></div>
                        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-opeari-green/20 rounded-full"></div>

                        {/* "You Are Here" Marker */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <div className="w-4 h-4 bg-opeari-green rounded-full ring-4 ring-white shadow-md z-10"></div>
                            <div className="w-24 h-24 bg-opeari-green/5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping-slow"></div>
                        </div>

                        {/* Overlay Text */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-opeari-heading shadow-sm border border-gray-200">
                            {viewer?.member?.neighborhood || 'Your Neighborhood'}
                        </div>
                    </div>
                </div>

                {/* C) Activity / Empty State */}
                {stats.hasData ? (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-opeari-green"></div>
                        <div className="w-12 h-12 bg-opeari-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-opeari-green">
                            <Activity size={24} />
                        </div>
                        <h2 className="text-opeari-heading font-bold text-lg mb-4">Latest Activity</h2>

                        <div className="space-y-3 mb-6">
                            {stats.incoming > 0 && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-lg text-sm font-medium text-gray-600 border border-stone-100">
                                    <span className="w-2 h-2 rounded-full bg-opeari-mint"></span>
                                    You have <strong>{stats.incoming}</strong> incoming interest{stats.incoming !== 1 ? 's' : ''}
                                </div>
                            )}
                            {stats.opportunities > 0 && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-lg text-sm font-medium text-gray-600 border border-stone-100">
                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                    You have <strong>{stats.opportunities}</strong> opportunit{stats.opportunities !== 1 ? 'ies' : 'y'} nearby
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                            <Link
                                to="/matches"
                                className="px-6 py-2 bg-opeari-heading text-white font-bold rounded-xl hover:bg-opeari-green text-sm transition-colors"
                            >
                                View activity
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Activity size={24} />
                        </div>
                        <h2 className="text-opeari-heading font-bold text-lg mb-2">No activity yet</h2>
                        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                            Once your village starts responding, you'll see updates here.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                to="/settings"
                                className="px-6 py-2 bg-opeari-heading text-white font-bold rounded-xl hover:bg-opeari-green text-sm transition-colors"
                            >
                                Complete your settings
                            </Link>
                            <Link
                                to="/profile"
                                className="px-6 py-2 bg-white text-gray-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 text-sm transition-colors"
                            >
                                View your profile
                            </Link>
                        </div>
                    </div>
                )}

                {/* D) Preview Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Care Matches */}
                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col">
                        <div className="w-10 h-10 rounded-full bg-opeari-peach/20 flex items-center justify-center mb-4 text-opeari-peach">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <h3 className="text-opeari-heading font-bold text-lg mb-1">Care Matches</h3>
                        <p className="text-gray-500 text-sm mb-6 flex-grow">People who match your schedule and care preferences.</p>
                        <Link to="/matches" className="text-center w-full py-3 bg-opeari-heading text-white font-bold rounded-xl hover:bg-opeari-green-dark transition-colors">
                            View Matches
                        </Link>
                    </div>

                    {/* 2. Nanny Shares */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col">
                        <div className="w-10 h-10 rounded-full bg-opeari-green/10 flex items-center justify-center mb-4 text-opeari-green">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h3 className="text-opeari-heading font-bold text-lg mb-1">Nanny Shares</h3>
                        <p className="text-gray-500 text-sm mb-6 flex-grow">Families with overlapping needs for shared care.</p>
                        <Link to="/matches" className="text-center w-full py-3 bg-opeari-green/10 text-opeari-heading font-bold rounded-xl hover:bg-opeari-green/20 transition-colors">
                            Explore
                        </Link>
                    </div>

                    {/* 3. Backup Help */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-opeari-heading font-bold text-lg mb-1">Backup Help</h3>
                        <p className="text-gray-500 text-sm mb-6 flex-grow">Neighbors available when life happens.</p>
                        <Link to="/matches" className="text-center w-full py-3 border border-gray-200 text-opeari-heading font-bold rounded-xl hover:bg-gray-50 transition-colors">
                            Find Help
                        </Link>
                    </div>

                    {/* 4. Coming Soon (Grouped) */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300 flex flex-col justify-center items-center text-center opacity-70">
                        <span className="px-3 py-1 bg-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Coming Soon</span>
                        <p className="text-opeari-heading font-bold mb-1">Classes, Tutors & Household</p>
                        <p className="text-gray-500 text-xs">Expanding your village support system.</p>
                    </div>
                </div>

                {/* E) Active Right Now (Empty State) */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Search size={24} />
                    </div>
                    <h2 className="text-opeari-heading font-bold text-lg mb-2">No matches yet</h2>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                        Start by telling us what you need so we can surface the right people.
                    </p>
                    <div className="flex justify-center flex-wrap gap-3">
                        <Link
                            to="/settings"
                            className="px-6 py-2 bg-opeari-heading text-white font-bold rounded-xl hover:bg-opeari-green text-sm transition-colors"
                        >
                            Complete your settings
                        </Link>
                        <Link
                            to="/profile"
                            className="px-6 py-2 bg-white text-gray-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 text-sm transition-colors"
                        >
                            View your profile
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
