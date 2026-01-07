import { useState, useEffect } from 'react';
import { useViewer } from '../hooks/useViewer';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { WEEKDAYS } from '../lib/constants/careConstants';

// --- Types ---
interface Member {
    id: string;
    first_name: string;
    last_name: string;
    role: 'family' | 'caregiver'; // Explicit role check
    location: string;
    neighborhood: string;
    zip_code?: string;
    // photo_url: string; // Removing per prod schema
    bio: string;

    // Schedule
    schedule: Record<string, string[]>; // { dayId: [slotId, ...] }
    availability_days: string[];
    availability_blocks: string[];

    // Care
    care_types: string[];
    children_age_groups: string[];
    budget_tiers: string[];
    hourly_rate?: number;

    // Family specific
    kids: any[];
}

interface MatchResult {
    member: Member;
    score: number;
    overlapDays: string[];
    overlapBlocks: string[];
    distanceScore: number;
    reasons: string[];
}

// --- Helpers ---


// Helper removed: getScheduleOverlap (Unused in Preview Mode)

// Fallback: Calculate tag overlap if detailed schedule missing
const getTagOverlap = (myDays: string[], theirDays: string[]) => {
    const common = myDays.filter(d => theirDays.includes(d));
    // Map IDs to Short Names
    const commonNames = common.map(id => WEEKDAYS.find((w: { id: string; short: string }) => w.id === id)?.short || id);
    return { overlapDays: commonNames, overlapCount: common.length * 2 }; // Weight days roughly as 2 slots
};


export default function Matches() {
    const { viewer, loading: viewerLoading } = useViewer();
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (viewer) {
            fetchMatches();
        }
    }, [viewer]);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            if (!viewer) return;

            const myId = viewer.member.id;
            const myRole = viewer.member.role;
            // const mySchedule = viewer.member.schedule || {}; // Unused in preview matching
            const myDays = viewer.member.availability_days || [];
            const myZip = viewer.member.zip_code;

            // 1. Fetch Candidates
            //    Families see: Caregivers + Other Families
            //    Caregivers see: Families only
            //    STRICT PROD SCHEMA: id, first_name, role, neighborhood, zip_code, bio, ...
            let query = supabase.from('members_preview').select(`
        id, first_name, role, neighborhood, zip_code, bio,
        availability_days, availability_blocks,
        care_types, children_age_groups, num_kids, budget_tiers
      `).neq('id', myId);

            if (myRole === 'caregiver') {
                query = query.eq('role', 'family'); // Only see families
            } else {
                // Family sees everyone.
            }

            const { data: candidates, error } = await query;
            if (error) throw error;

            // 2. Rank & Score
            const ranked: MatchResult[] = (candidates || []).map((candidate: any) => {
                let score = 0;
                let reasons: string[] = [];
                let overlapDays: string[] = [];

                // --- A. Schedule Score (Primary) ---
                // Prefer detailed grid, fallback to tags

                // Use Tag Overlap primarily for preview candidates (since schedule might be empty)
                const overlap = getTagOverlap(myDays, candidate.availability_days || []);
                overlapDays = overlap.overlapDays;

                // Scoring: 10 pts per overlap day
                score += (overlapDays.length * 10);

                if (overlapDays.length > 0) {
                    reasons.push(`Overlaps on ${overlapDays.join(', ')}`);
                }

                // --- B. Location Score (Secondary) ---

                // 1. Zip Code (Stable Match) - Primary Location Check
                if (candidate.zip_code && myZip && candidate.zip_code === myZip) {
                    score += 15;
                    reasons.push('Same zip code');
                }
                // 2. Neighborhood (Display Match) - Secondary
                // STRICT: Both must be present, non-empty, and match when normalized.
                else if (candidate.neighborhood && viewer.member.neighborhood) {
                    const cNorm = candidate.neighborhood.trim().toLowerCase();
                    const vNorm = viewer.member.neighborhood.trim().toLowerCase();

                    if (cNorm.length > 0 && vNorm.length > 0 && cNorm === vNorm) {
                        score += 10;
                        reasons.push('Same neighborhood');
                    }
                }
                // NO PARTIAL/INCLUDES FALLBACK ALLOWED

                let distScore = (score >= 10 && reasons.some(r => r.includes('Same'))) ? 10 : 0;

                return {
                    member: candidate,
                    score,
                    overlapDays,
                    overlapBlocks: [], // Todo if needed
                    distanceScore: distScore,
                    reasons
                };
            });

            // 3. Sort
            // Descending score
            ranked.sort((a, b) => b.score - a.score);

            setMatches(ranked);

        } catch (err) {
            console.error('Match fetch error:', err);
        } finally {
            setLoading(false);
        }
    };


    if (viewerLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#1E6B4E] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#1E6B4E] font-medium animate-pulse">Finding your matches...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F5] pb-20">
            {/* Header */}
            <div className="bg-[#1E6B4E] text-white pt-8 pb-16 px-6 relative overflow-hidden">
                <div className="max-w-md mx-auto relative z-10 text-center">
                    <h1 className="text-3xl font-bold font-comfortaa mb-2">Your Matches</h1>
                    <p className="opacity-90 text-sm">Ranked by schedule & location compatibility.</p>
                </div>

                {/* Decor */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-0 left-10 w-32 h-32 rounded-full bg-yellow-300 blur-3xl"></div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-md mx-auto px-4 -mt-10 relative z-20 space-y-4">

                {matches.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <p className="text-gray-500">No strong matches found yet.</p>
                        <Link to="/settings" className="text-[#1E6B4E] font-bold mt-2 inline-block">Update your availability</Link>
                    </div>
                ) : (
                    matches.map((match) => (
                        <div key={match.member.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-[#1E6B4E]/5 relative overflow-hidden group">

                            {/* High Match Badge */}
                            {match.score > 30 && (
                                <div className="absolute top-0 right-0 bg-[#e0f2fe] text-[#0369a1] text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                    HIGH MATCH
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden relative border-2 border-white shadow-sm">
                                    {/* (match.member as any).photo_url check removed, always fallback or safe check */}
                                    <div className="w-full h-full flex items-center justify-center bg-[#1E6B4E]/10 text-[#1E6B4E] font-bold text-xl">
                                        {match.member.first_name[0]}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-[#1E6B4E] text-lg">
                                                {match.member.first_name} <span className="text-xs font-normal opacity-60 ml-1">{match.member.role === 'caregiver' ? 'Caregiver' : 'Family'}</span>
                                            </h3>
                                            <p className="text-xs text-gray-400 mb-2">
                                                {match.member.neighborhood || 'Nearby'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Primary Stat: Schedule */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {match.overlapDays.length > 0 ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E6B4E]/10 text-[#1E6B4E] text-xs font-bold rounded-full">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Matches: {match.overlapDays.join('/')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                                No schedule overlap
                                            </span>
                                        )}

                                        {/* Distance Badge if applicable */}
                                        {match.distanceScore > 0 && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                                                NEARBY
                                            </span>
                                        )}
                                    </div>

                                    {/* Explainability (Expandable-ish, or just inline for MVP) */}
                                    {match.reasons.length > 0 && (
                                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-3">
                                            <span className="font-semibold text-gray-700">Why:</span> {match.reasons.join('. ')}.
                                        </div>
                                    )}

                                    <Link
                                        to={`/profile/${match.member.id}`}
                                        className="block w-full text-center py-2 rounded-lg bg-[#FAF8F5] text-[#1E6B4E] font-bold text-sm border border-[#1E6B4E]/20 hover:bg-[#1E6B4E] hover:text-white transition-colors"
                                    >
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
