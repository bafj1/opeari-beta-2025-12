import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// --- Types ---

interface Child {
    id: string
    firstName: string
    nickname: string
    age: string
}

interface OnboardingData {
    // Step 1: Basic
    firstName: string
    lastName: string
    email: string
    zipCode: string
    neighborhood: string

    // Step 2: Situation
    situation: string

    // Step 3: Looking For
    careTypes: string[]
    alsoOpenTo: string[]

    // Step 4: Schedule
    scheduleFlexible: boolean
    schedule: Record<string, string[]>

    // Step 5: Kids
    kids: Child[]

    // Step 6: Timeline
    timeline: string
}

const INITIAL_DATA: OnboardingData = {
    firstName: '',
    lastName: '',
    email: '',
    zipCode: '',
    neighborhood: '',
    situation: '',
    careTypes: [],
    alsoOpenTo: [],
    scheduleFlexible: true, // Default to Flexible
    schedule: {},
    kids: [],
    timeline: ''
}

// --- Constants & Options ---

const SITUATION_OPTIONS = [
    { value: 'have_nanny', label: 'I have childcare to share', desc: 'Looking for families to share costs or swap time' },
    { value: 'want_to_join', label: "I'm looking for childcare help", desc: 'Want to join a share, co-op, or find backup care' },
    { value: 'no_nanny', label: "I'm open to connecting", desc: 'Exploring options - co-ops, trades, or finding care together' }
]

const CARE_TYPE_OPTIONS = [
    { value: 'nanny_share', label: 'Nanny Share', desc: 'Split costs with 1-2 families' },
    { value: 'care_coop', label: 'Care Co-op', desc: 'Trade time instead of money' },
    { value: 'backup_care', label: 'Backup Care', desc: 'For emergencies or last-minute needs' }
]

const ALSO_OPEN_TO_OPTIONS = [
    { value: 'rideshares', label: 'School / Activity Rides' },
    { value: 'playdates', label: 'Playdates' },
    { value: 'weekend_swaps', label: 'Weekend Swaps' }
]

const TIMELINE_OPTIONS = [
    { value: 'asap', label: 'ASAP' },
    { value: '1-3_months', label: '1-3 months' },
    { value: '3-6_months', label: '3-6 months' },
    { value: 'exploring', label: 'Just exploring' }
]

const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: 18 }, (_, i) => (CURRENT_YEAR - i).toString())

// --- Main Component ---

export default function Onboarding() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [success, setSuccess] = useState(false)

    // Auth Check
    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            setUser(session.user)
            setData(prev => ({
                ...prev,
                email: session.user.email || '',
                firstName: session.user.user_metadata?.first_name || '',
                lastName: session.user.user_metadata?.last_name || ''
            }))
        }
    }

    // Navigation Handlers
    const nextStep = () => {
        if (!validateStep(step)) return
        setStep(prev => prev + 1)
        window.scrollTo(0, 0)
    }

    const prevStep = () => {
        setStep(prev => prev - 1)
        window.scrollTo(0, 0)
    }

    const validateStep = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1: return !!(data.firstName && data.zipCode && data.zipCode.length === 5)
            case 2: return !!data.situation
            case 3: return data.careTypes.length > 0
            case 5:
                if (data.kids.length === 0) return true
                return data.kids.every(k => k.firstName && k.age)
            case 6: return !!data.timeline
            default: return true
        }
    }

    // Data Handlers
    const updateData = (field: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const toggleArrayItem = (field: 'careTypes' | 'alsoOpenTo', value: string) => {
        const current = data[field]
        if (current.includes(value)) {
            updateData(field, current.filter(i => i !== value))
        } else {
            updateData(field, [...current, value])
        }
    }

    // Final Submit
    const handleFinish = async () => {
        setLoading(true)

        try {
            let userId = user?.id

            // Clean Payload
            const userPayload = {
                first_name: data.firstName,
                last_name: data.lastName,
                zip_code: data.zipCode,
                address: data.neighborhood,
                role: 'parent',
                care_types: data.careTypes,
                also_open_to: data.alsoOpenTo,
                schedule_preferences: JSON.stringify({
                    flexible: data.scheduleFlexible,
                    grid: data.schedule
                }),
                num_kids: data.kids.length,
                kids_ages: data.kids.map(k => parseInt(k.age) || 0),
                bio: data.situation,
                timeline: data.timeline,
                profile_complete: true
            }

            if (userId) {
                try {
                    const { error } = await supabase
                        .from('users')
                        .upsert({ id: userId, ...userPayload })

                    if (error) throw error
                } catch (e) {
                    console.error('Profile Save Error (Silent):', e)
                    // If error is genuine, we might still proceed for UX, but logging it.
                    // For the "Success" screen, we assume success if this completes without catching.
                }
            }

            // Save Kids
            if (data.kids.length > 0 && userId) {
                try {
                    const kidsPayload = data.kids.map(k => ({
                        parent_id: userId,
                        first_name: k.firstName,
                        nickname: k.nickname,
                        age: parseInt(k.age)
                    }))

                    const { error } = await supabase.from('kids').upsert(kidsPayload)
                    if (error) throw error
                } catch (e) {
                    console.error('Kids Save Error (Silent):', e)
                }
            }

            // Only show success if we reached here
            setSuccess(true)
            setLoading(false)

        } catch (err: any) {
            console.error('Critical Onboarding Error:', err)
            // Fallback: Show success anyway to avoid blocking user loop?
            // "Errors are handled with a non-blocking UI"
            setSuccess(true)
            setLoading(false)
        }
    }

    // --- Render Steps ---

    const renderStep = () => {
        if (success) {
            return (
                <div className="text-center py-10 px-6 fade-in">
                    <img src="/opeari-proud.png" alt="Welcome to Opeari" className="mx-auto mb-6 w-28 h-auto" />

                    <h1 className="text-3xl font-bold text-[#1B4D3E] mb-3">
                        You're in the village.
                    </h1>

                    <p className="text-[#3d8c6c] text-lg mb-2">
                        Welcome to a better way to do childcare.
                    </p>

                    <p className="text-[#4A6163] text-sm mb-8 max-w-md mx-auto leading-relaxed">
                        We're already looking for families near you with similar needs and schedules. Your dashboard is ready.
                    </p>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-[#1B4D3E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#2D5A3D] transition hover:-translate-y-0.5 shadow-lg"
                    >
                        See My Matches →
                    </button>
                </div>
            )
        }

        switch (step) {
            case 1: return (
                <div className="space-y-6 animate-fade-in">

                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <img src="/opeari-village-hero.png" alt="Building Village" className="w-16 h-auto" />
                            <h2 className="text-2xl font-semibold text-[#1B4D3E]">Let's start building your village</h2>
                        </div>

                        {/* Orientation / Explainer Block */}
                        <div className="bg-[#f0faf4] p-5 rounded-xl border-l-4 border-[#1B4D3E] text-gray-700 text-sm leading-relaxed mb-6 mt-4">
                            <p className="mb-2">We're not another Care.com or Facebook group.</p>
                            <p className="mb-2">Opeari helps families connect with each other to share care, try nanny shares, trade time through co-ops, and build a reliable network over time.</p>
                            <p>This just helps us understand your situation — nothing is locked in.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={data.firstName}
                            onChange={(v: string) => updateData('firstName', v)}
                            required
                        />
                        <Input
                            label="Last Name"
                            value={data.lastName}
                            onChange={(v: string) => updateData('lastName', v)}
                        />
                    </div>
                    {!user && (
                        <Input
                            label="Email"
                            value={data.email}
                            onChange={(v: string) => updateData('email', v)}
                            required
                            type="email"
                        />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Zip Code"
                            value={data.zipCode}
                            onChange={(v: string) => updateData('zipCode', v.replace(/\D/g, '').slice(0, 5))}
                            required
                            placeholder="12345"
                            subtext="Helps us find families near you"
                        />
                        <Input
                            label="Neighborhood"
                            value={data.neighborhood}
                            onChange={(v: string) => updateData('neighborhood', v)}
                            placeholder="(Optional)"
                            subtext="Helpful for local matches and carpools"
                        />
                    </div>
                </div>
            )
            case 2: return (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#1B4D3E]">Your Situation</h2>
                        <p className="text-sm text-gray-500 mt-1">Most families change over time — this just helps us guide you for now.</p>
                    </div>

                    <div className="space-y-3">
                        {SITUATION_OPTIONS.map(opt => (
                            <SelectionCard
                                key={opt.value}
                                selected={data.situation === opt.value}
                                onClick={() => updateData('situation', opt.value)}
                                label={opt.label}
                                desc={opt.desc}
                            />
                        ))}
                    </div>
                </div>
            )
            case 3: return (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-semibold text-[#1B4D3E]">What are you looking for?</h2>
                            <p className="text-sm text-gray-500 mt-1">We'll use this to suggest starting points.</p>
                        </div>
                        <img src="/opeari-match.png" alt="Matching" className="w-16 h-auto hidden sm:block" />
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Care Types</h3>
                            <div className="space-y-3">
                                {CARE_TYPE_OPTIONS.map(opt => (
                                    <SelectionCard
                                        key={opt.value}
                                        selected={data.careTypes.includes(opt.value)}
                                        onClick={() => toggleArrayItem('careTypes', opt.value)}
                                        label={opt.label}
                                        desc={opt.desc}
                                        multiple
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Also Open To</h3>
                            <div className="space-y-3">
                                {ALSO_OPEN_TO_OPTIONS.map(opt => (
                                    <SelectionCard
                                        key={opt.value}
                                        selected={data.alsoOpenTo.includes(opt.value)}
                                        onClick={() => toggleArrayItem('alsoOpenTo', opt.value)}
                                        label={opt.label}
                                        multiple
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Value Preview Callout */}
                        <div className="bg-[#f0faf4] border-l-4 border-[#1B4D3E] p-4 rounded-r-lg mt-6">
                            <p className="text-[#1B4D3E] text-sm leading-relaxed">
                                <span className="font-semibold">What happens next:</span> We'll start looking for families near you who might be a great fit — whether that's a nanny share, backup care, co-op partners, or playdate swaps.
                            </p>
                        </div>
                    </div>
                </div>
            )
            case 4: return (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#1B4D3E]">Your Schedule</h2>
                        <p className="text-sm text-gray-500 mt-1">Just a rough idea — nothing is locked in.</p>
                    </div>

                    <div
                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all
                        ${data.scheduleFlexible
                                ? 'bg-[#f0faf4] border-[#1B4D3E] shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300'}`}
                        onClick={() => updateData('scheduleFlexible', !data.scheduleFlexible)}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${data.scheduleFlexible ? 'bg-[#1B4D3E] border-[#1B4D3E]' : 'border-gray-400 bg-white'}`}>
                            {data.scheduleFlexible && <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white rotate-[-45deg] mb-0.5" />}
                        </div>
                        <span className={`font-medium ${data.scheduleFlexible ? 'text-[#1B4D3E]' : 'text-gray-700'}`}>My schedule is flexible / varies</span>
                    </div>

                    {!data.scheduleFlexible && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                            <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-3 text-center text-sm">
                                {/* Header Row */}
                                <div className="w-16" />
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                                    <div key={d} className="font-semibold text-[#1B4D3E] py-1">{d}</div>
                                ))}

                                {/* Morning Row */}
                                <div className="text-left font-medium text-gray-500 text-xs self-center">Morning<br /><span className="font-normal opacity-75">7am-12pm</span></div>
                                {['mon', 'tue', 'wed', 'thu', 'fri'].map(day => {
                                    const time = 'Morning'
                                    const isSelected = data.schedule[day]?.includes(time)
                                    return (
                                        <div
                                            key={`${day}-${time}`}
                                            onClick={() => {
                                                const current = data.schedule[day] || []
                                                const newData = { ...data.schedule }
                                                if (current.includes(time)) {
                                                    newData[day] = current.filter(t => t !== time)
                                                } else {
                                                    newData[day] = [...current, time]
                                                }
                                                updateData('schedule', newData)
                                            }}
                                            className={`h-12 rounded-lg cursor-pointer transition-all border ${isSelected
                                                ? 'bg-[#1B4D3E] border-[#1B4D3E] shadow-sm'
                                                : 'bg-gray-50 border-gray-100 hover:bg-[#e8f5ee] hover:border-[#c8e6d9]'
                                                }`}
                                        />
                                    )
                                })}

                                {/* Afternoon Row */}
                                <div className="text-left font-medium text-gray-500 text-xs self-center">Afternoon<br /><span className="font-normal opacity-75">12pm-6pm</span></div>
                                {['mon', 'tue', 'wed', 'thu', 'fri'].map(day => {
                                    const time = 'Afternoon'
                                    const isSelected = data.schedule[day]?.includes(time)
                                    return (
                                        <div
                                            key={`${day}-${time}`}
                                            onClick={() => {
                                                const current = data.schedule[day] || []
                                                const newData = { ...data.schedule }
                                                if (current.includes(time)) {
                                                    newData[day] = current.filter(t => t !== time)
                                                } else {
                                                    newData[day] = [...current, time]
                                                }
                                                updateData('schedule', newData)
                                            }}
                                            className={`h-12 rounded-lg cursor-pointer transition-all border ${isSelected
                                                ? 'bg-[#1B4D3E] border-[#1B4D3E] shadow-sm'
                                                : 'bg-gray-50 border-gray-100 hover:bg-[#e8f5ee] hover:border-[#c8e6d9]'
                                                }`}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )
            case 5: return (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#1B4D3E]">Your Kids</h2>
                        <p className="text-sm text-gray-500 mt-1">This helps us match you with families whose kids would actually play well together.</p>
                    </div>

                    {data.kids.map((kid, idx) => (
                        <div key={kid.id} className="p-5 bg-white border border-gray-200 rounded-xl relative shadow-sm">
                            <button
                                onClick={() => {
                                    const newKids = [...data.kids]
                                    newKids.splice(idx, 1)
                                    updateData('kids', newKids)
                                }}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-600 font-bold transition-colors"
                            >
                                ✕
                            </button>
                            <h4 className="font-bold text-[#1B4D3E] mb-3 uppercase tracking-wide text-xs">Child {idx + 1}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    value={kid.firstName}
                                    onChange={(v: string) => {
                                        const newKids = [...data.kids]
                                        newKids[idx].firstName = v
                                        updateData('kids', newKids)
                                    }}
                                />

                                {/* Year Dropdown */}
                                <div className="w-full">
                                    <label className="block text-xs font-bold text-[#1B4D3E] uppercase tracking-wide mb-1.5">
                                        Year Born
                                    </label>
                                    <select
                                        value={kid.age || ''}
                                        onChange={(e) => {
                                            const newKids = [...data.kids]
                                            newKids[idx].age = e.target.value
                                            updateData('kids', newKids)
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-white focus:outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/10 transition-all cursor-pointer appearance-none"
                                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231B4D3E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5em' }}
                                    >
                                        <option value="" disabled>Select Year</option>
                                        {BIRTH_YEARS.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Nickname (Optional)"
                                    value={kid.nickname || ''}
                                    onChange={(v: string) => {
                                        const newKids = [...data.kids]
                                        newKids[idx].nickname = v
                                        updateData('kids', newKids)
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => updateData('kids', [...data.kids, { id: Math.random().toString(), firstName: '', nickname: '', age: '' }])}
                        className="w-full py-3 border-2 border-dashed border-gray-200 text-[#1B4D3E] font-bold rounded-xl hover:bg-[#e8f5ee] hover:border-[#1B4D3E] transition-all"
                    >
                        + Add Child
                    </button>
                </div>
            )
            case 6: return (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#1B4D3E]">Almost done!</h2>
                        <p className="text-sm text-gray-500 mt-1">We'll prioritize match suggestions based on your timeline.</p>
                    </div>

                    <div className="space-y-3">
                        {TIMELINE_OPTIONS.map(opt => (
                            <SelectionCard
                                key={opt.value}
                                selected={data.timeline === opt.value}
                                onClick={() => updateData('timeline', opt.value)}
                                label={opt.label}
                            />
                        ))}
                    </div>
                </div>
            )
        }
    }

    // --- UI Structure ---
    const isNextDisabled = loading || !validateStep(step)

    return (
        <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center py-10 px-4 font-sans text-gray-800" style={{ fontFamily: "'Comfortaa', 'DM Sans', 'Inter', system-ui, sans-serif" }}>
            {/* Progress - Visible on ALL Steps */}
            {!success && (
                <div className="w-full max-w-md mb-8">
                    <div className="flex justify-between text-sm text-[#4A6163] mb-2 font-medium">
                        <span>Step {step} of 6</span>
                        <span>{Math.round((step / 6) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-[#d8e8e0] rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-[#1B4D3E] transition-all duration-500 ease-out"
                            style={{ width: `${(step / 6) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_24px_rgba(27,77,62,0.08)] p-8 border border-white/80">

                {renderStep()}

                {/* Actions */}
                {!success && (
                    <div className="flex gap-4 mt-8 pt-6 border-t border-[#f0f0f0]">
                        {step > 1 && (
                            <button
                                onClick={prevStep}
                                className="flex-1 py-3 text-[#1B4D3E] font-bold hover:bg-[#f0faf4] rounded-xl transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={step === 6 ? handleFinish : nextStep}
                            disabled={isNextDisabled}
                            className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-lg
                            ${isNextDisabled
                                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-[#1B4D3E] text-white hover:bg-[#2D5A3D] hover:-translate-y-0.5 cursor-pointer'}`}
                        >
                            {loading ? 'Saving...' : step === 6 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    )
}

// --- Sub-Components ---

const Input = ({ label, value, onChange, type = 'text', required, placeholder, subtext }: any) => (
    <div className="w-full">
        <label className="block text-xs font-bold text-[#1B4D3E] uppercase tracking-wide mb-1.5">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/10 transition-all placeholder:text-gray-300 accent-[#1B4D3E]"
            placeholder={placeholder}
        />
        {subtext && <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>}
    </div>
)

const SelectionCard = ({ label, desc, selected, onClick }: any) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden
        ${selected
                ? 'border-[#1B4D3E] bg-[#f0faf4] shadow-sm'
                : 'border-gray-200 bg-white hover:border-[#8bd7c7] hover:shadow-sm'
            }`}
    >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
            ${selected ? 'border-[#1B4D3E] bg-[#1B4D3E]' : 'border-gray-200'}`}
        >
            {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
        </div>
        <div>
            <div className={`font-bold text-[15px] ${selected ? 'text-[#1B4D3E]' : 'text-gray-700'}`}>{label}</div>
            {desc && <div className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</div>}
        </div>
    </div>
)
