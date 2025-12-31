import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Star, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AvailabilitySnapshot from './AvailabilitySnapshot';
import ProfileStrength from './ProfileStrength';

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

    return (
        <div className="min-h-screen bg-[#f8f9fa] pb-20">
            {/* Header / Hero */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Avatar Circle */}
                        <div className="w-10 h-10 rounded-full bg-[#1e6b4e] text-white flex items-center justify-center font-bold text-lg">
                            {firstName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-opeari-heading leading-tight">Welcome back, {firstName}</h1>
                            {/* Capacity Toggle Inline */}
                            <div className="flex items-center gap-2 mt-0.5">
                                <button
                                    onClick={() => setAcceptingMatches(!acceptingMatches)}
                                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${acceptingMatches
                                        ? 'text-[#1e6b4e]'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${acceptingMatches ? 'bg-[#1e6b4e] animate-pulse' : 'bg-gray-400'}`} />
                                    {acceptingMatches ? 'Accepting New Families' : 'Fully Booked'}
                                </button>
                                <span className="text-gray-300">|</span>
                                <Link to="/settings" className="text-xs text-gray-400 hover:text-gray-600">Profile</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN (Matches & Availability) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* HERO: AVAILABILITY SNAPSHOT */}
                    <AvailabilitySnapshot />

                    {/* MATCHES SECTION (Locked/Gated) */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Star className="text-yellow-400 fill-yellow-400 shadow-sm" size={20} />
                            Your Matched Families
                        </h2>

                        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            {/* Header inside card */}
                            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Lock size={16} className="text-[#1e6b4e]" />
                                    {MOCK_MATCH_COUNT} families match your schedule & rate
                                </h3>
                            </div>

                            {/* Locked Overlay */}
                            {bgCheckStatus !== 'cleared' && (
                                <div className="absolute inset-0 top-14 z-20 backdrop-blur-sm bg-white/40 flex flex-col items-center justify-center text-center p-6">
                                    <div className="max-w-md bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform translate-y-4">
                                        <div className="w-12 h-12 bg-[#f0faf4] rounded-full flex items-center justify-center mx-auto mb-4 text-[#1e6b4e]">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-opeari-heading mb-2">
                                            Complete background check to connect
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                            Families trust Opeari because every caregiver is verified.
                                            One check unlocks all matches for a full year.
                                        </p>
                                        <Link
                                            to="/settings?tab=verification"
                                            className="w-full block bg-[#1e6b4e] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#155d42] transition-all transform hover:scale-[1.02]"
                                        >
                                            Complete Background Check
                                        </Link>
                                        <p className="text-xs text-gray-400 mt-3 font-medium">Verification flow coming soon</p>
                                    </div>
                                </div>
                            )}

                            {/* Teaser Cards (Blurred content behind) */}
                            <div className={`p-6 space-y-4 ${bgCheckStatus !== 'cleared' ? 'filter blur-md select-none opacity-40' : ''}`}>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 border rounded-xl bg-white shadow-sm">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        </div>
                                        <div className="h-8 w-24 bg-gray-200 rounded-full" />
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
                        <div className="bg-[#f2fcf7] rounded-2xl p-6 border border-[#1e6b4e]/10">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-10 h-10 bg-[#1e6b4e] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1e6b4e]">Your Trusted Bench</h3>
                                    <p className="text-xs text-[#1e6b4e]/80 mt-1 leading-relaxed">
                                        Families value caregivers with reliable backup.
                                        Invite a friend you'd trust to cover for you.
                                    </p>
                                </div>
                            </div>
                            <button className="w-full bg-white text-[#1e6b4e] font-bold py-2.5 rounded-xl border border-[#1e6b4e]/20 shadow-sm hover:bg-green-50 transition-colors text-sm">
                                Invite a Caregiver
                            </button>
                        </div>

                        {/* 2. Refer Families ($) */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-50 to-transparent rounded-bl-full -mr-4 -mt-4" />
                            <h3 className="font-bold text-gray-800 mb-2 relative z-10">Know a family who needs care?</h3>
                            <p className="text-sm text-gray-500 mb-4 relative z-10">
                                Refer a family to Opeari and earn <span className="font-bold text-[#1e6b4e] bg-[#d8f5e5] px-1 rounded">$25</span> when they book.
                            </p>
                            <button className="text-sm font-bold text-[#1e6b4e] hover:underline flex items-center gap-1 group-hover:gap-2 transition-all">
                                Refer a Family <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
