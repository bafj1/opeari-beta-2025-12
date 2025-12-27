import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { User, Check, ChevronDown, Eye, EyeOff, MessageSquare, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'

// --- Types & Constants ---

interface Child {
    id: string
    firstName: string
    nickname: string
    age: string
    month?: string
}

interface OnboardingData {
    firstName: string
    lastName: string
    email: string
    zipCode: string
    neighborhood: string
    careOptions: string[]
    specificNeeds?: string
    scheduleFlexible: boolean
    schedule: Record<string, string[]>
    kids: Child[]
    expecting: boolean
    expectingTiming?: string
    password?: string
    userIntent?: 'seeking' | 'providing' | null
}

const INITIAL_DATA: OnboardingData = {
    firstName: '',
    lastName: '',
    email: '',
    zipCode: '',
    neighborhood: '',
    careOptions: [],
    scheduleFlexible: true,
    schedule: {},
    kids: [],
    expecting: false,
    expectingTiming: '',
    password: '',
    userIntent: null
}



const EXPECTING_TIMING_OPTIONS = [
    'Within the next few months',
    'Later this year',
    'Early next year',
    'Just found out!'
]

const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: 18 }, (_, i) => (CURRENT_YEAR - i).toString())

const STEPS = [
    { id: 0, img: '/opeari-welcome-green.png', text: "What brings you to Opeari? Start by telling us what you're looking for." },
    { id: 1, img: '/opeari-welcome-green.png', text: "You're early — and that matters. Early families help shape how Opeari grows in their neighborhood." },
    { id: 2, img: '/opeari-explore.png', text: "No pressure. Just possibilities. We'll figure out what works together." },
    { id: 3, img: '/opeari-happy.png', text: "Flexibility is the whole point. Most families don't have a fixed schedule — and that's okay." },
    { id: 4, img: '/opeari-connect.png', text: "Your family. Your village. We match based on what matters to you." },
    { id: 5, img: '/opeari-proud.png', text: "Almost there. Save your progress so you can come back anytime." },
]

// --- Main Component ---

export default function Onboarding() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
    const [hostingInterest, setHostingInterest] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showSomethingElseInput, setShowSomethingElseInput] = useState(false)

    // Auth Check
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setData(prev => ({
                    ...prev,
                    email: session.user.email || '',
                    firstName: session.user.user_metadata?.first_name || '',
                    lastName: session.user.user_metadata?.last_name || ''
                }))
            }
        }
        checkUser()
    }, [])

    // Confetti on Success
    useEffect(() => {
        if (showSuccess) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4A7C59', '#E8B4A0', '#F5E6D3', '#8FBC8F'] // Brand colors
            })
        }
    }, [showSuccess])

    const updateData = (field: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const toggleCareOption = (id: string) => {
        let newOptions = [...data.careOptions]
        if (id === 'exploring') {
            newOptions = newOptions.includes('exploring') ? [] : ['exploring']
        } else {
            if (newOptions.includes('exploring')) newOptions = []
            if (newOptions.includes(id)) {
                newOptions = newOptions.filter(i => i !== id)
            } else {
                newOptions.push(id)
            }
        }
        updateData('careOptions', newOptions)
    }

    const toggleSomethingElse = () => {
        setShowSomethingElseInput(!showSomethingElseInput)
        if (!showSomethingElseInput && data.careOptions.includes('exploring')) {
            updateData('careOptions', [])
        }
    }

    const isStepValid = () => {
        switch (step) {
            case 0: return !!data.userIntent
            case 1: return !!(data.firstName?.trim() && data.zipCode?.trim() && data.zipCode.length === 5)
            case 2: return data.careOptions.length > 0 || showSomethingElseInput
            case 3: return true
            case 4: return true
            case 5: return !!(data.password && data.password.length >= 8 && data.password === passwordConfirm)
            default: return true
        }
    }

    const nextStep = () => {
        if (!isStepValid()) return
        setStep(prev => prev + 1)
        window.scrollTo(0, 0)
    }

    const prevStep = () => {
        setStep(prev => prev - 1)
        window.scrollTo(0, 0)
    }

    const handleFinish = async () => {
        setLoading(true)
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser && data.password) {
                await supabase.auth.updateUser({ password: data.password })
            }

            if (!authUser) throw new Error('No user session found')

            const userPayload = {
                first_name: data.firstName,
                last_name: data.lastName || '',
                zip_code: data.zipCode,
                address: data.neighborhood,
                role: 'parent',
                care_types: data.careOptions,
                schedule_preferences: JSON.stringify({
                    flexible: data.scheduleFlexible,
                    grid: data.schedule
                }),
                is_flexible: data.scheduleFlexible,
                num_kids: data.kids.length,
                kids_ages: data.kids.map(k => parseInt(k.age) || 0),
                bio: `Looking for: ${data.careOptions.join(', ')}`,
                timeline: 'asap',
                profile_complete: true,
                other_needs: showSomethingElseInput ? data.specificNeeds : null,
                just_exploring: data.careOptions.includes('exploring'),
                metadata: {
                    expecting: data.expecting,
                    expecting_timing: data.expectingTiming,
                },
                user_intent: data.userIntent
            }

            const { error } = await supabase
                .from('users')
                .upsert({ id: authUser.id, ...userPayload })

            if (error) throw error
            setShowSuccess(true)
        } catch (err) {
            console.error('Save error:', err)
            setShowSuccess(true)
        } finally {
            setLoading(false)
        }
    }

    // --- Render Logic ---

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-4 font-sans text-gray-800">
                <div className="bg-white rounded-3xl shadow-[0_20px_25px_-5px_rgba(30,107,78,0.1),0_10px_10px_-5px_rgba(30,107,78,0.04)] p-8 max-w-md w-full text-center animate-fade-in relative overflow-hidden">
                    <div className="w-32 h-32 mx-auto mb-6">
                        <img src="/opeari-match.png" alt="Welcome" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#1B4D3E] mb-4">
                        Welcome to the village, {data.firstName}!
                    </h1>
                    <div className="space-y-4 text-gray-600 mb-8">
                        <p>You're early — and that matters.</p>
                        <p>Built by parents, for parents — no algorithms, no marketplaces.</p>
                        <p className="font-medium text-[#1B4D3E]">Just families and caregivers pairing up intentionally.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-[#1B4D3E] text-white py-4 rounded-xl font-bold hover:bg-[#2D5A3D] transition-transform hover:-translate-y-0.5 shadow-[0_10px_15px_-3px_rgba(30,107,78,0.1),0_4px_6px_-2px_rgba(30,107,78,0.05)]"
                    >
                        Go to My Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const currentStepConfig = STEPS.find(s => s.id === step) || STEPS[0]

    return (
        <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-0 md:p-6" style={{ fontFamily: "'Comfortaa', sans-serif" }}>

            <div className="w-full max-w-6xl md:h-[min(800px,90vh)] bg-white md:rounded-3xl md:shadow-[0_25px_50px_-12px_rgba(30,107,78,0.25)] overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-0">

                {/* LEFT PANEL */}
                <div className="hidden md:flex md:w-[40%] bg-[#FDF8F3] border-r border-[#E8DCC8] flex-col items-center justify-center p-12 text-center relative transition-all duration-500">
                    <div className="absolute top-8 left-8">
                        <span className="font-bold text-[#1B4D3E] text-xl tracking-tight">Opeari</span>
                    </div>
                    <div className="w-64 h-64 mb-8 transition-opacity duration-500">
                        <img
                            key={`img-${step}`}
                            src={currentStepConfig.img}
                            alt={`Step ${step}`}
                            className="w-full h-full object-contain animate-fade-in"
                        />
                    </div>
                    <p key={`txt-${step}`} className="text-xl text-[#3D5C4A] font-medium leading-relaxed animate-fade-in">
                        {currentStepConfig.text}
                    </p>
                </div>

                {/* RIGHT PANEL */}
                <div className="w-full md:w-[60%] flex flex-col h-full bg-white relative">

                    {/* Progress Bar */}
                    <div className="h-1 bg-gray-100 w-full">
                        <div
                            className="h-full bg-[#1B4D3E] transition-all duration-500"
                            style={{ width: `${(step / 6) * 100}%` }}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-12">
                        <div className="max-w-xl mx-auto space-y-8 min-h-[50vh]">

                            {/* Mobile Step 1 Illustration */}
                            {step === 1 && (
                                <div className="md:hidden flex justify-center mb-4">
                                    <img src="/opeari-welcome-green.png" alt="Welcome" className="w-32 h-32 object-contain" />
                                </div>
                            )}

                            {/* Active Step Headers */}
                            {step === 0 && <StepHeader title="What brings you to Opeari?" subtitle="Select what fits you best" />}
                            {step === 1 && <StepHeader title="Let's start building your village." subtitle="First, where are you located?" />}
                            {step === 2 && <StepHeader title="What would be helpful right now?" subtitle="Choose any that apply — most families pick 2-3." />}
                            {step === 3 && <StepHeader title="Your Schedule" subtitle="Just a rough idea." />}
                            {step === 4 && <StepHeader title="Tell us about your family" subtitle="This helps us match you with families whose kids would actually play well together." />}
                            {step === 5 && <StepHeader title="Save your spot in the village" subtitle="Create a password so you can come back anytime." />}

                            {/* STEP 0: INTENT */}
                            {step === 0 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div
                                            onClick={() => updateData('userIntent', 'seeking')}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-start gap-3 ${data.userIntent === 'seeking' ? 'border-[#1B4D3E] bg-[#f0faf4]' : 'border-gray-200 bg-white hover:border-[#8bd7c7]'}`}
                                        >
                                            <div className={`p-3 rounded-full flex items-center justify-center ${data.userIntent === 'seeking' ? 'bg-[#1B4D3E] text-white' : 'bg-[#fffaf5] text-[#1e6b4e]'}`}>
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#1B4D3E]">I'm looking for childcare</h3>
                                                <p className="text-xs text-gray-500 mt-1">Find nanny shares, backup care, and trusted support</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => updateData('userIntent', 'providing')}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-start gap-3 ${data.userIntent === 'providing' ? 'border-[#1B4D3E] bg-[#f0faf4]' : 'border-gray-200 bg-white hover:border-[#8bd7c7]'}`}
                                        >
                                            <div className={`p-3 rounded-full flex items-center justify-center ${data.userIntent === 'providing' ? 'bg-[#1B4D3E] text-white' : 'bg-[#fffaf5] text-[#1e6b4e]'}`}>
                                                <Check size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#1B4D3E]">I provide childcare</h3>
                                                <p className="text-xs text-gray-500 mt-1">Connect with families who need help</p>
                                            </div>
                                        </div>
                                    </div>

                                    {data.userIntent === 'seeking' && (
                                        <div className="animate-fade-in pt-2">
                                            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#e8f5f0] cursor-pointer hover:bg-[#d8f5e5] transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={hostingInterest}
                                                    onChange={(e) => setHostingInterest(e.target.checked)}
                                                    className="w-5 h-5 rounded border-gray-300 text-[#1B4D3E] focus:ring-[#1B4D3E]"
                                                />
                                                <span className="text-sm font-medium text-[#1B4D3E]">I'm open to hosting care at my home sometimes</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 1: LOCATION */}
                            {step === 1 && (
                                <div className="space-y-5 animate-fade-in">
                                    <Input label="First Name" value={data.firstName} onChange={(v: any) => updateData('firstName', v)} required placeholder="e.g. Sarah" />
                                    <Input label="Zip Code" value={data.zipCode} onChange={(v: any) => updateData('zipCode', v)} required placeholder="e.g. 94110" maxLength={5} />
                                    <Input label="Neighborhood" value={data.neighborhood} onChange={(v: any) => updateData('neighborhood', v)} placeholder="(Optional)" subtext="Helpful for local matches & carpools" />
                                    <InfoBanner>Opeari connects families for shared care, backup help, and community — not strangers from the internet.</InfoBanner>
                                </div>
                            )}

                            {/* STEP 2: NEEDS */}
                            {step === 2 && (
                                <div className="space-y-6 animate-fade-in">

                                    {/* Find Support */}
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-[#1B4D3E] text-lg">Find Support</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="findSupportInterests">
                                            {[
                                                { id: 'nannyshare', label: 'Nanny Share', desc: 'Split costs with another family' },
                                                { id: 'backup-care', label: 'Backup Care', desc: 'Sick days & emergencies' },
                                                { id: 'babysitter', label: 'Babysitter', desc: 'Date nights & occasional help' },
                                                { id: 'school-pickups', label: 'School Pickups', desc: 'Drop-off & pickup help' },
                                                { id: 'playdates', label: 'Playdates', desc: 'Connect kids with friends' },
                                                { id: 'travel-care', label: 'Travel / Au Pair', desc: 'Vacation & live-in care' }
                                            ].map(opt => (
                                                <SelectionCard
                                                    key={opt.id}
                                                    icon={Check}
                                                    label={opt.label}
                                                    desc={opt.desc}
                                                    selected={data.careOptions.includes(opt.id)}
                                                    onClick={() => toggleCareOption(opt.id)}
                                                    isCheckboxStyle={true}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Offer Support */}
                                    <div className="space-y-3 mt-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-[#1B4D3E] text-lg">Offer Support</h3>
                                            <span className="text-xs text-gray-400 uppercase tracking-wide">Optional</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="offerSupportInterests">
                                            {[
                                                { id: 'offer-backup', label: 'Backup Care', desc: 'Help in emergencies' },
                                                { id: 'offer-pickups', label: 'School Pickups', desc: 'Share driving duties' },
                                                { id: 'host-share', label: 'Host Nanny Share', desc: 'Host at your home' },
                                                { id: 'care-exchange', label: 'Care Exchange', desc: 'Trade hours with neighbors' }
                                            ].map(opt => (
                                                <SelectionCard
                                                    key={opt.id}
                                                    icon={Check}
                                                    label={opt.label}
                                                    desc={opt.desc}
                                                    selected={data.careOptions.includes(opt.id)}
                                                    onClick={() => toggleCareOption(opt.id)}
                                                    isCheckboxStyle={true}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <SelectionCard
                                            icon={MessageSquare}
                                            label="Something else"
                                            desc="Tell us what you need"
                                            selected={showSomethingElseInput}
                                            onClick={toggleSomethingElse}
                                            isCheckboxStyle={true}
                                        />
                                    </div>

                                    {showSomethingElseInput && (
                                        <div className="animate-fade-in">
                                            <textarea
                                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B4D3E] focus:outline-none placeholder:text-gray-400 text-sm"
                                                rows={3}
                                                placeholder="What specific situation are you navigating?"
                                                value={data.specificNeeds || ''}
                                                onChange={(e) => updateData('specificNeeds', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: SCHEDULE */}
                            {step === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div
                                        onClick={() => updateData('scheduleFlexible', !data.scheduleFlexible)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${data.scheduleFlexible ? 'border-[#1B4D3E] bg-[#f0faf4]' : 'border-gray-200'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${data.scheduleFlexible ? 'bg-[#1B4D3E] border-[#1B4D3E]' : 'border-gray-300'}`}>
                                            {data.scheduleFlexible && <Check size={14} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#1B4D3E]">My schedule is flexible</p>
                                            <p className="text-sm text-gray-500">Totally fine — many families start here</p>
                                        </div>
                                    </div>

                                    {/* Grid - Dimmed if flexible, but still interactive */}
                                    <div className={`transition-all duration-300 ${data.scheduleFlexible ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}>
                                        <ScheduleGrid
                                            value={data.schedule}
                                            onChange={(v: any) => updateData('schedule', v)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: FAMILY */}
                            {step === 4 && (
                                <div className="space-y-6 animate-fade-in">
                                    {data.kids.map((kid, idx) => (
                                        <div key={kid.id} className="p-5 bg-white border border-gray-200 rounded-xl relative shadow-sm">
                                            <button
                                                onClick={() => {
                                                    const updatedKids = [...data.kids]
                                                    updatedKids.splice(idx, 1)
                                                    updateData('kids', updatedKids)
                                                }}
                                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                                            >✕</button>
                                            <h4 className="font-bold text-[#1B4D3E] mb-3 uppercase tracking-wide text-xs">Child {idx + 1}</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Input label="First Name" value={kid.firstName} onChange={(v: any) => {
                                                    const updatedKids = [...data.kids]; updatedKids[idx].firstName = v; updateData('kids', updatedKids)
                                                }} />
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1B4D3E] uppercase tracking-wide mb-1.5">Year Born</label>
                                                    <div className="relative">
                                                        <select value={kid.age} onChange={e => {
                                                            const updatedKids = [...data.kids]; updatedKids[idx].age = e.target.value; updateData('kids', updatedKids)
                                                        }} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white appearance-none">
                                                            <option value="" disabled>Select</option>
                                                            {BIRTH_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Updated Add Child Button Style */}
                                    <button onClick={() => updateData('kids', [...data.kids, { id: Math.random().toString(), firstName: '', nickname: '', age: '' }])} className="w-full py-3 border-2 border-dashed border-[#8bd7c7] text-[#1e6b4e] font-bold rounded-xl hover:bg-[#e8f5f0] hover:border-[#1e6b4e] transition-all">+ Add Child</button>

                                    {/* Expecting */}
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${data.expecting ? 'border-[#1B4D3E] bg-[#f0faf4]' : 'border-gray-200'}`}>
                                            <input type="checkbox" checked={data.expecting} onChange={e => updateData('expecting', e.target.checked)} className="sr-only" />
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${data.expecting ? 'bg-[#1B4D3E] border-[#1B4D3E]' : 'border-gray-300'}`}>{data.expecting && <Check size={14} className="text-white" />}</div>
                                            <div>
                                                <p className="font-semibold text-[#1B4D3E]">We're expecting</p>
                                                <p className="text-sm text-gray-500">We'll include you in future matching</p>
                                            </div>
                                        </label>
                                        {data.expecting && (
                                            <div className="mt-3 animate-fade-in">
                                                <label className="block text-xs font-bold text-[#1B4D3E] uppercase tracking-wide mb-1.5">When is baby arriving?</label>
                                                <div className="relative">
                                                    <select value={data.expectingTiming || ''} onChange={e => updateData('expectingTiming', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white appearance-none text-sm">
                                                        <option value="" disabled>Select one...</option>
                                                        {EXPECTING_TIMING_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: PASSWORD */}
                            {step === 5 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="relative">
                                        <Input
                                            label="Password"
                                            type={showPassword ? "text" : "password"}
                                            value={data.password}
                                            onChange={(v: any) => updateData('password', v)}
                                            required
                                            placeholder="At least 8 characters"
                                            subtext="Must be at least 8 characters"
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[34px] text-gray-400">
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        value={passwordConfirm}
                                        onChange={(v: any) => setPasswordConfirm(v)}
                                        required
                                        placeholder="••••••••"
                                    />
                                    {/* Fix Blue Banner -> Mint Banner */}
                                    <div className="bg-[#e8f5f0] text-[#1e6b4e] border-l-4 border-[#8bd7c7] p-4 rounded-lg text-sm flex gap-3">
                                        <span className="text-lg">ℹ️</span>
                                        <p>You'll use <strong>{data.email}</strong> and this password to sign in and access your village.</p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Footer */}
                            <div className="pt-8 mt-4 border-t border-gray-100 flex gap-4">
                                {step > 0 && (
                                    <button onClick={prevStep} className="px-6 py-4 font-bold text-[#1B4D3E] bg-[#f0faf4] rounded-xl hover:bg-[#e1f5e9] transition-colors">
                                        Back
                                    </button>
                                )}

                                <button
                                    onClick={step === 5 ? handleFinish : nextStep}
                                    disabled={!isStepValid() || loading}
                                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg text-white shadow-[0_10px_15px_-3px_rgba(30,107,78,0.1),0_4px_6px_-2px_rgba(30,107,78,0.05)] transition-all flex items-center justify-center gap-2
                                        ${!isStepValid() || loading ? 'bg-[#e0e0e0] text-[#9e9e9e] cursor-not-allowed shadow-none' : 'bg-[#1e6b4e] hover:bg-[#155a3e] hover:-translate-y-0.5'}
                                    `}
                                >
                                    {loading ? 'Saving...' : step === 5 ? (
                                        <>Complete Setup <ArrowRight size={20} /></>
                                    ) : 'Next'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    )
}

// --- Sub Components ---

const StepHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1B4D3E] mb-2">{title}</h2>
        <p className="text-gray-500">{subtitle}</p>
    </div>
)

const Input = ({ label, value, onChange, type = 'text', required, placeholder, subtext, maxLength }: any) => (
    <div className="w-full">
        <label className="block text-xs font-bold text-[#1B4D3E] uppercase tracking-wide mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B4D3E] focus:outline-none focus:border-transparent transition-all" placeholder={placeholder} maxLength={maxLength} />
        {subtext && <p className="text-[11px] text-gray-500 mt-1">{subtext}</p>}
    </div>
)

const InfoBanner = ({ children }: any) => (
    <div className="bg-[#f0faf4] border-l-4 border-[#1B4D3E] p-4 rounded-r-lg">
        <p className="text-[#1B4D3E] text-sm leading-relaxed">{children}</p>
    </div>
)

const SelectionCard = ({ icon: Icon, label, desc, selected, onClick, isCheckboxStyle }: any) => (
    <div onClick={onClick} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden min-h-[60px] ${selected ? 'border-[#1B4D3E] bg-[#f0faf4] shadow-sm' : 'border-gray-200 bg-white hover:border-[#8bd7c7] hover:shadow-sm'}`}>
        {isCheckboxStyle ? (
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#1B4D3E] border-[#1B4D3E]' : 'border-gray-300'}`}>
                {selected && <Check size={14} className="text-white" />}
            </div>
        ) : (
            <div className={`p-2.5 rounded-lg flex-shrink-0 transition-colors ${selected ? 'bg-[#1B4D3E] text-white' : 'bg-[#F5F1EB] text-[#1B4D3E]'}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1B4D3E] text-[14px] truncate">{label}</p>
            <p className="text-xs text-gray-500 leading-tight line-clamp-2">{desc}</p>
        </div>
        {selected && !isCheckboxStyle && <div className="absolute top-2 right-2"><Check size={16} className="text-[#1B4D3E]" /></div>}
    </div>
)

// --- Schedule Grid with Quick Select ---

const ScheduleGrid = ({ value, onChange }: any) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const times = ['Morning', 'Afternoon', 'Evening']

    const toggle = (day: string, time: string) => {
        const dayLower = day.toLowerCase()
        const current = value[dayLower] || []
        const newSchedule = { ...value }
        if (current.includes(time)) {
            newSchedule[dayLower] = current.filter((t: string) => t !== time)
        } else {
            newSchedule[dayLower] = [...current, time]
        }
        onChange(newSchedule)
    }

    const QUICK_SELECTS = [
        { label: 'M-F 9-5', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Morning', 'Afternoon'] },
        { label: 'Mornings', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Morning'] },
        { label: 'Afternoons', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Afternoon'] },
        { label: 'Evenings', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], times: ['Evening'] },
        { label: 'Weekends', days: ['Sat', 'Sun'], times: ['Morning', 'Afternoon', 'Evening'] },
    ]

    const handleQuickSelect = (q: any) => {
        const freshSchedule: Record<string, string[]> = {};

        // Select preset (Replace logic)
        for (const d of q.days) {
            const dayLower = d.toLowerCase()
            freshSchedule[dayLower] = [...q.times]
        }

        onChange(freshSchedule)
    }

    const clearAll = () => onChange({})

    return (
        <div className="space-y-4">
            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2">
                {QUICK_SELECTS.map(q => (
                    <button
                        key={q.label}
                        onClick={() => handleQuickSelect(q)}
                        className="px-4 py-2 bg-[#e8f5f0] text-[#1e6b4e] border border-[#8bd7c7] rounded-full text-sm font-bold hover:bg-[#d8f5e5] hover:border-[#1e6b4e] transition-all"
                    >
                        {q.label}
                    </button>
                ))}
                <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-sm font-bold hover:bg-gray-100 hover:text-gray-700 transition-all"
                >
                    Clear All
                </button>
            </div>

            <div className="border border-gray-200 rounded-xl p-2 md:p-4 bg-white overflow-x-auto">
                <div className="min-w-[400px] grid grid-cols-[auto_repeat(7,1fr)] gap-y-2 gap-x-1 text-center text-xs">
                    <div />
                    {days.map(d => <div key={d} className="font-bold text-[#1B4D3E] py-2">{d}</div>)}

                    {times.map(time => (
                        <React.Fragment key={time}>
                            <div className="text-left font-medium text-gray-400 self-center text-[11px] pr-2">{time}</div>
                            {days.map(day => {
                                const isSel = value[day.toLowerCase()]?.includes(time)
                                return (
                                    <button
                                        key={`${day}-${time}`}
                                        onClick={() => toggle(day, time)}
                                        className={`h-9 rounded-lg border transition-all 
                                            ${isSel
                                                ? 'bg-[#d8f5e5] border-[#1e6b4e] border-2 shadow-inner'
                                                : 'bg-gray-50 border-gray-100 hover:bg-[#e8f5f0] hover:border-[#8bd7c7]'}
                                        `}
                                    />
                                )
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}
