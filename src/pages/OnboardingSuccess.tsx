import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import {
    calculateOverlap,
    calculateCompatibility,
    getMatchReasons,
    type UserProfile,
    type FamilyMatch
} from '../lib/matching'

function getMatchLabel(score: number) {
    if (score >= 80) return 'Strong Match'
    if (score >= 60) return 'Good Match'
    return 'New Match'
}

export default function OnboardingSuccess() {
    const { user } = useAuth()


    // State
    const [phase, setPhase] = useState<'loading' | 'analyzing' | 'reveal'>('loading')
    const [loadingText, setLoadingText] = useState('Initializing...')
    const [matches, setMatches] = useState<FamilyMatch[]>([])
    const [matchCount, setMatchCount] = useState(0)
    const [userFirstName, setUserFirstName] = useState('')

    useEffect(() => {
        // Sequence the animation
        const runSequence = async () => {
            setLoadingText('Building your village...')
            await new Promise(r => setTimeout(r, 2000))

            // 3. Fetch Data (Real logic)
            if (user) {
                await loadMatches()
            }

            // 4. Reveal
            setPhase('reveal')
        }

        runSequence()
    }, [user])

    async function loadMatches() {
        if (!user) return
        try {
            const { data: myProfile } = await supabase.from('members').select('*').eq('user_id', user.id).single()
            if (!myProfile) return

            setUserFirstName(myProfile.first_name)

            const profile: UserProfile = {
                id: myProfile.id,
                schedule: myProfile.schedule || {},
                location: myProfile.location || '',
                neighborhood: myProfile.neighborhood || '',
                nanny_situation: myProfile.nanny_situation || '',
                kids: myProfile.kids || [],
                invited_by: myProfile.invited_by,
                care_timeline: myProfile.care_timeline
            }

            // Normal Family-to-Family Matching or Family-to-Caregiver
            const { data: allMembers } = await supabase.from('members').select('*').neq('id', myProfile.id)
            if (allMembers) {
                const processed = processMatches(profile, allMembers)
                setMatches(processed)
                setMatchCount(allMembers.length)
            }
        } catch (err) {
            // If fetching members failed, try caregiver checks or handle "Providing" intent
            console.error(err)
            await checkCaregiverFallback() // Simple fallback to show families if I am a caregiver
        }
    }

    async function checkCaregiverFallback() {
        if (!user) return
        // Minimal logic: If I am not in 'members', I might be in 'caregiver_profiles'. 
        // For MVP reveal, just show me "Families nearby" (all members).
        const { data: allMembers } = await supabase.from('members').select('*')
        if (allMembers) {
            setMatchCount(allMembers.length)
            // Mock "match based on location" since we don't have caregiver profile object fully typed here yet
            // Just show top 3 for Reveal
            const processed = allMembers.map(m => ({
                ...m,
                compatibility: 85, // Generic high score for demo
                matchReasons: [{ icon: 'location', text: 'Nearby Family', highlight: true }],
                overlapDays: []
            }) as any as FamilyMatch).slice(0, 3)
            setMatches(processed)
            setUserFirstName('Caregiver') // Or fetch from auth metadata if available
        }
    }

    function processMatches(profile: UserProfile, candidates: any[]) {
        return candidates.map(member => {
            const overlap = calculateOverlap(profile.schedule, member.schedule || {})
            const match: FamilyMatch = {
                id: member.id,
                first_name: member.first_name || 'Family',
                location: member.location || '',
                neighborhood: member.neighborhood || '',
                photo_url: member.photo_url,
                nanny_situation: member.nanny_situation || '',
                care_timeline: member.care_timeline || '',
                schedule: member.schedule || {},
                kids: member.kids || [],
                invited_by: member.invited_by,
                overlapDays: overlap.days,
                matchReasons: [],
                compatibility: 0
            }
            match.matchReasons = getMatchReasons(profile, match)
            match.compatibility = calculateCompatibility(match.matchReasons, overlap.percentage)
            return match
        }).sort((a, b) => b.compatibility - a.compatibility).slice(0, 3)
    }

    // --- RENDER ---

    if (phase === 'loading' || phase === 'analyzing') {
        return (
            <div className="fixed inset-0 bg-[#d8f5e5] z-50 flex flex-col items-center justify-center overflow-hidden">
                {/* Radar Animation */}
                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 bg-[#1e6b4e]/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute inset-4 bg-[#1e6b4e]/20 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                    <div className="absolute inset-8 bg-[#1e6b4e]/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
                    <div className="relative z-10 bg-white p-4 rounded-full shadow-lg">
                        <img src="/logo.svg" alt="Opeari" className="w-12 h-12" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-[#1e6b4e] mb-2 animate-pulse transition-all duration-500">
                    {loadingText}
                </h2>
            </div>
        )
    }

    // --- CAREGIVER VIEW ---
    console.log('Success: User Metadata:', user?.user_metadata)
    const isCaregiver = user?.user_metadata?.intent === 'providing'

    if (phase === 'reveal' && isCaregiver) {
        return (
            <div className="min-h-screen bg-[#f0faf4] pb-20">
                <Header />
                {/* Caregiver Hero */}
                <div className="pt-8 pb-12 px-4 text-center bg-[#1e6b4e] rounded-b-[40px] shadow-lg relative overflow-hidden">
                    <div className="mb-6 inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-white text-sm font-medium border border-white/30">
                        Profile Created
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                        Welcome to the village,<br />{userFirstName}!
                    </h1>
                    <p className="text-white/90 text-lg max-w-md mx-auto">
                        Your profile is live. Next step: Verification.
                    </p>
                </div>

                {/* Status Card */}
                <div className="px-4 -mt-8 relative z-10 max-w-lg mx-auto">
                    <div className="bg-white rounded-2xl p-8 shadow-xl text-center border border-[#1e6b4e]/10">
                        <div className="w-16 h-16 bg-[#d8f5e5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#1e6b4e]">
                            <Sprout size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[#1e6b4e] mb-2">You're ready to connect.</h3>
                        <p className="text-gray-600 mb-6">
                            Complete your background check to unlock matches with local families.
                        </p>

                        <Link to="/dashboard" className="block w-full bg-[#1e6b4e] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#155d42] transition-colors flex items-center justify-center gap-2">
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // --- EXISTING FAMILY VIEW ---
    return (
        <div className="min-h-screen bg-[#d8f5e5] pb-20">
            <Header />

            {/* Celebration Hero */}
            <div className="pt-8 pb-12 px-4 text-center bg-[#1e6b4e] rounded-b-[40px] shadow-lg relative overflow-hidden">
                {/* Confetti / Decor */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-4 h-4 bg-white rounded-full" />
                    <div className="absolute top-20 right-20 w-3 h-3 bg-[#F8C3B3] rounded-full" />
                    <div className="absolute bottom-10 left-1/3 w-6 h-6 bg-white rounded-full opacity-50" />
                </div>

                <div className="mb-6 inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-white text-sm font-medium border border-white/30">
                    You're in.
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                    Welcome home,<br />{userFirstName}!
                </h1>
                <p className="text-white/90 text-lg max-w-md mx-auto">
                    {matches.length > 0
                        ? <>We found <strong className="text-[#F8C3B3]">{matches.length} recommended neighbors</strong>.</>
                        : "Your village is forming in this neighborhood."
                    }
                </p>
            </div>

            {/* The Reveal Cards */}
            <div className="px-4 -mt-8 relative z-10 max-w-lg mx-auto space-y-4">

                {matches.map((match, i) => (
                    <div
                        key={match.id}
                        className="bg-white rounded-2xl p-5 shadow-xl border border-[#1e6b4e]/10 transform transition-all hover:-translate-y-1 duration-300 animate-slide-up"
                        style={{ animationDelay: `${i * 150}ms` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-[#d8f5e5] flex items-center justify-center text-2xl border-2 border-white shadow-sm overflow-hidden">
                                    {match.photo_url ? (
                                        <img src={match.photo_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{match.first_name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-[#1e6b4e]">{match.first_name}'s Family</h3>
                                    <p className="text-sm text-gray-500">{match.neighborhood || 'Nearby'}</p>
                                </div>
                            </div>
                            <div className="bg-[#1e6b4e] text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                                {getMatchLabel(match.compatibility)}
                            </div>
                        </div>

                        {/* Reasons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {match.matchReasons.map((r, idx) => (
                                <span key={idx} className="bg-[#d8f5e5] text-[#1e6b4e] text-xs font-semibold px-2 py-1 rounded-md">
                                    {r.text}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-2">
                            <Link to={`/member/${match.id}`} className="flex-1 bg-[#F8C3B3] hover:bg-[#faa890] text-[#1e6b4e] py-2.5 rounded-xl font-bold text-center transition-colors">
                                View Profile
                            </Link>
                        </div>
                    </div>
                ))}

                {/* Empty State: Founder's Welcome */}
                {matches.length === 0 && (
                    <div className="bg-white rounded-2xl p-8 shadow-xl text-center border-2 border-dashed border-[#1e6b4e]/20">
                        <div className="w-16 h-16 bg-[#d8f5e5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#1e6b4e]">
                            <Sprout size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-[#1e6b4e] mb-2">You're one of the first in {userFirstName || 'your neighborhood'}!</h3>
                        <p className="text-gray-600 mb-6">
                            Your village is just getting started. Invite a neighbor to grow it faster.
                        </p>
                        <Link to="/invite" className="block w-full bg-[#1e6b4e] text-white py-3 rounded-xl font-bold shadow-lg hover:bg-[#155d42] transition-colors">
                            Invite a Neighbor
                        </Link>
                    </div>
                )}

                <div className="pt-4 pb-8 space-y-3">
                    <Link
                        to="/build-your-village"
                        className="block w-full bg-white border-2 border-[#1e6b4e] text-[#1e6b4e] py-4 rounded-xl font-bold text-center hover:bg-[#f0faf4] transition-colors shadow-sm"
                    >
                        See All Neighbors ({matchCount})
                    </Link>

                    <Link
                        to="/dashboard"
                        className="block text-center text-[#1e6b4e]/70 font-semibold text-sm hover:underline"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
