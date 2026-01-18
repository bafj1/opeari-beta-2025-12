import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Star, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AvailabilitySnapshot from './AvailabilitySnapshot';
import ProfileStrength from './ProfileStrength';
import CaregiverOpportunities from './CaregiverOpportunities';

// Mock Data for MVP
const MOCK_MATCH_COUNT = 3;
const MOCK_PROFILE_STRENGTH = 65;

export default function CaregiverDashboard() {
    const { user } = useAuth();
    const [acceptingMatches, setAcceptingMatches] = useState(true);
    // const [bgCheckStatus, setBgCheckStatus] = useState<'not_started' | 'pending' | 'cleared'>('not_started');
    const bgCheckStatus = 'not_started' as 'not_started' | 'pending' | 'cleared'; // Hardcoded for MVP visual

    // Derived State
    const firstName = user?.user_metadata?.first_name || 'Neighbor';

    // Data Wiring: Fetch Caregiver Profile
    useEffect(() => {
        async function loadCaregiverProfile() {
            if (!user) return;

            console.log('CaregiverDashboard: Fetching profile for', user.id);

            const { data, error } = await supabase
                .from('caregiver_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('CaregiverDashboard: Error fetching profile', error);
            } else if (data) {
                console.log('CaregiverDashboard: Profile loaded successfully', data);
            } else {
                console.warn('CaregiverDashboard: No profile found (managed by Dashboard routing?)');
            }
        }
        loadCaregiverProfile();
    }, [user]);

    return (
        <div className="min-h-screen bg-opeari-bg pb-20 font-sans">

            {/* Minimal Header Placeholder */}
            <div className="w-full h-16 bg-transparent mb-4"></div>

            <main className="max-w-6xl mx-auto px-4 lg:px-6">
                {/* Intro Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-opeari-green text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                            {firstName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-opeari-heading tracking-tight">Welcome back, {firstName}</h1>
                            {/* Capacity Toggle Inline */}
                            <div className="flex items-center gap-3 mt-1.5">
                                <button
                                    onClick={() => setAcceptingMatches(!acceptingMatches)}
                                    className={`flex items-center gap-2 text-sm font-bold transition-all ${acceptingMatches
                                        ? 'text-opeari-green'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${acceptingMatches ? 'bg-opeari-green animate-pulse' : 'bg-gray-400'}`} />
                                    {acceptingMatches ? 'Accepting New Families' : 'Fully Booked'}
                                </button>
                                <span className="text-gray-300">|</span>
                                <Link to="/settings" className="text-sm text-gray-400 hover:text-gray-600 font-medium">Edit Profile</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN (Matches & Availability) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* NEW: OPPORTUNITIES FEED */}
                        <CaregiverOpportunities />

                        {/* HERO: AVAILABILITY SNAPSHOT */}
                        <AvailabilitySnapshot />

                        {/* MATCHES SECTION (Locked/Gated) */}
                        <section>
                            <h2 className="text-lg font-bold text-opeari-heading mb-4 flex items-center gap-2 text-lg">
                                <Star className="text-yellow-400 fill-yellow-400 shadow-sm" size={20} />
                                Your Matched Families
                            </h2>

                            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                {/* Header inside card */}
                                <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Lock size={16} className="text-opeari-green" />
                                        {MOCK_MATCH_COUNT} families match your schedule & rate
                                    </h3>
                                </div>

                                {/* Locked Overlay */}
                                {bgCheckStatus !== 'cleared' && (
                                    <div className="absolute inset-0 top-14 z-20 backdrop-blur-sm bg-white/40 flex flex-col items-center justify-center text-center p-6">
                                        <div className="max-w-md bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform translate-y-4">
                                            <div className="w-12 h-12 bg-opeari-bg rounded-full flex items-center justify-center mx-auto mb-4 text-opeari-green">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <h3 className="text-lg font-bold text-opeari-heading mb-2">
                                                Complete background check to connect
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                                Families trust Opeari because every caregiver is verified.
                                                One check unlocks all matches for a full year.
                                            </p>
                                            <button
                                                disabled
                                                className="w-full block bg-gray-200 text-gray-500 px-6 py-3 rounded-xl font-bold shadow-none cursor-not-allowed"
                                            >
                                                Complete Background Check
                                            </button>
                                            <p className="text-xs text-gray-400 mt-3 font-medium">Verification system upgrades in progress.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Teaser Cards (Blurred content behind) */}
                                <div className={`p-6 space-y-4 ${bgCheckStatus !== 'cleared' ? 'filter blur-md select-none opacity-40' : ''}`}>
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-100 rounded w-1/3" />
                                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                                            </div>
                                            <div className="h-8 w-24 bg-gray-100 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN (Profile & Community) */}
                    <div className="space-y-8">

                        {/* PROFILE STRENGTH */}
                        <ProfileStrength strength={MOCK_PROFILE_STRENGTH} />

                        {/* REFERRALS: BENCH & FAMILIES */}
                        <div className="space-y-4">

                            {/* 1. Trusted Bench (Backup) */}
                            <div className="bg-opeari-green/5 rounded-2xl p-6 border border-opeari-green/10">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-10 h-10 bg-opeari-green rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-opeari-heading">Your Trusted Bench</h3>
                                        <p className="text-xs text-opeari-heading/80 mt-1 leading-relaxed">
                                            Families value caregivers with reliable backup.
                                            Invite a friend you'd trust to cover for you.
                                        </p>
                                    </div>
                                </div>
                                <button className="w-full bg-white text-opeari-heading font-bold py-2.5 rounded-xl border border-opeari-green/20 shadow-sm hover:bg-green-50 transition-colors text-sm">
                                    Invite a Caregiver
                                </button>
                            </div>

                            {/* 2. Refer Families ($) */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden group">

                                <h3 className="font-bold text-gray-800 mb-2 relative z-10 text-sm uppercase tracking-wide">Grow the Community</h3>
                                <p className="text-sm text-gray-500 mb-4 relative z-10">
                                    Know a family looking for care? Refer them to Opeari and earn <span className="font-bold text-opeari-heading">$25</span>.
                                </p>
                                <button className="text-sm font-bold text-gray-600 hover:text-opeari-green hover:underline flex items-center gap-1 transition-all">
                                    Refer a Family <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
