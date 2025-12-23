import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// --- Types ---

interface Child {
    id: string // temporary FE id
    firstName: string
    nickname: string
    age: string // Storing as string of year (e.g. "2023")
}

interface OnboardingData {
    // Step 1: Basic
    firstName: string
    lastName: string
    email: string
    zipCode: string
    neighborhood: string

    // Step 2: Situation
    situation: string // 'have_nanny' | 'want_to_join' | 'no_nanny'

    // Step 3: Looking For
    careTypes: string[]
    alsoOpenTo: string[]

    // Step 4: Schedule
    scheduleFlexible: boolean
    schedule: Record<string, string[]> // e.g. { mon: ['AM'], tue: ['PM'] }

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
    scheduleFlexible: false,
    schedule: {},
    kids: [],
    timeline: ''
}

// --- Constants & Options ---

// Situation: Updated UX text
const SITUATION_OPTIONS = [
    { value: 'have_nanny', label: 'I have childcare to share', desc: 'Looking for families to share costs or swap time' },
    { value: 'want_to_join', label: "I'm looking for childcare help", desc: 'Want to join a share, co-op, or find backup care' },
    { value: 'no_nanny', label: "I'm open to connecting", desc: 'Exploring options - co-ops, trades, or finding care together' }
]

const CARE_TYPE_OPTIONS = [
    { value: 'nanny_share', label: 'Nanny Share', desc: 'Share a nanny with another family' },
    { value: 'care_coop', label: 'Care Co-op', desc: 'Trade childcare with other parents' },
    { value: 'backup_care', label: 'Backup Care', desc: 'Emergency or last-minute help' }
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

// Generate last 18 years for child birth year dropdown
const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: 18 }, (_, i) => (CURRENT_YEAR - i).toString())

// --- Main Component ---

export default function Onboarding() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [user, setUser] = useState<any>(null)

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
        setError('')
        switch (currentStep) {
            case 1:
                if (!data.firstName) { setError('First Name is required'); return false }
                if (!data.zipCode) { setError('Zip Code is required'); return false }
                if (data.zipCode.length !== 5) { setError('Zip Code must be 5 digits'); return false }
                // Email is required if not auth'd
                if (!user && !data.email) { setError('Email is required'); return false }
                return true
            case 2:
                if (!data.situation) { setError('Please select your situation'); return false }
                return true
            case 3:
                if (data.careTypes.length === 0) { setError('Please select at least one care type'); return false }
                return true
            case 5:
                for (const k of data.kids) {
                    if (!k.firstName) { setError('Child first name is required'); return false }
                    if (!k.age) { setError('Child birth year is required'); return false }
                }
                return true
            case 6:
                if (!data.timeline) { setError('Please select a timeline'); return false }
                return true
            default:
                return true
        }
    }

    // Data Handlers
    const updateData = (field: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }))
        setError('')
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
        if (!validateStep(6)) return
        setLoading(true)
        setError('')

        try {
            let userId = user?.id

            // Prepare Payload
            const userPayload = {
                first_name: data.firstName,
                last_name: data.lastName,
                zip_code: data.zipCode,
                address: data.neighborhood, // 'neighborhood' -> 'address' column
                role: 'parent',
                care_types: data.careTypes,
                also_open_to: data.alsoOpenTo,
                schedule_flexible: data.scheduleFlexible,
                schedule_preferences: JSON.stringify(data.schedule),
                num_kids: data.kids.length,
                kids_ages: data.kids.map(k => parseInt(k.age) || 0), // approximated by birth year? Or store year directly in kids table
                bio: data.situation,
                timeline: data.timeline,
                profile_complete: true
            }

            if (userId) {
                const { error: profileError } = await supabase
                    .from('users')
                    .upsert({
                        id: userId,
                        ...userPayload
                    })

                if (profileError) {
                    console.error('Supabase User Error:', profileError)
                    throw profileError
                }
            } else {
                // Should not happen if auth is enforced, but safe fallback
                console.warn('No user ID found, data not saved to DB but onboarding completing.')
            }

            // Save Kids
            if (data.kids.length > 0 && userId) {
                const kidsPayload = data.kids.map(k => ({
                    parent_id: userId,
                    first_name: k.firstName,
                    nickname: k.nickname,
                    age: parseInt(k.age) // Storing year as "age"? or actual age? App logic implies 'Age (or year)' was input. Let's store Year as int.
                }))

                // Note: This logic assumes 'kids' table has 'age' column as int.
                const { error: kidsError } = await supabase
                    .from('kids')
                    .upsert(kidsPayload) // upsert might fail without ID, but for new kids it inserts

                if (kidsError) {
                    console.error('Supabase Kids Error:', kidsError)
                    // Non-blocking error for now? Or throw?
                    // throw kidsError 
                }
            }

            // Success & Redirect
            navigate('/dashboard')
        } catch (err: any) {
            console.error('Error saving profile:', err)
            setError(err.message || 'Failed to save profile')
            setLoading(false)
        }
    }

    // --- Render Steps ---

    const renderStep = () => {
        switch (step) {
            case 1: return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#1B4D3E]">Let's get started</h2>
                    <p className="text-base text-gray-600">Tell us a bit about yourself.</p>

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
                            subtext="We use this to match you."
                        />
                        <Input
                            label="Neighborhood"
                            value={data.neighborhood}
                            onChange={(v: string) => updateData('neighborhood', v)}
                            placeholder="(Optional)"
                            subtext="Helps us find families nearby."
                        />
                    </div>
                </div>
            )
            case 2: return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#1B4D3E]">Your Situation</h2>
                    <p className="text-base text-gray-600">What best describes your childcare needs?</p>

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
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#1B4D3E]">What are you looking for?</h2>
                    <p className="text-base text-gray-600">Select all that apply.</p>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium uppercase tracking-wide text-[#527a6a] mb-3">Care Types</h3>
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
                            <h3 className="text-sm font-medium uppercase tracking-wide text-[#527a6a] mb-3">Also Open To</h3>
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
                    </div>
                </div>
            )
            case 4: return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#1B4D3E]">Your Schedule</h2>
                    <p className="text-base text-gray-600">When do you typically need care?</p>

                    <div className="flex items-center gap-3 mb-4 p-4 bg-white border border-[#c8e6d9] rounded-xl hover:bg-[#f0faf4] transition-colors cursor-pointer"
                        onClick={() => updateData('scheduleFlexible', !data.scheduleFlexible)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${data.scheduleFlexible ? 'bg-[#1B4D3E] border-[#1B4D3E]' : 'border-[#1B4D3E]'}`}>
                            {data.scheduleFlexible && <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white rotate-[-45deg] mb-0.5" />}
                        </div>
                        <span className="text-[#1B4D3E] font-medium">My schedule is flexible - I'll work out specifics later</span>
                    </div>

                    {!data.scheduleFlexible && (
                        <div className="bg-white p-6 rounded-xl border border-[#c8e6d9] shadow-sm">
                            <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-3 text-center text-sm">
                                {/* Header Row */}
                                <div className="w-16" /> {/* Spacer for labels */}
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                                    <div key={d} className="font-bold text-[#1B4D3E] py-1">{d}</div>
                                ))}

                                {/* Morning Row */}
                                <div className="text-left font-bold text-[#527a6a] text-xs self-center">Morning<br /><span className="font-normal opacity-75">7am-12pm</span></div>
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
                                <div className="text-left font-bold text-[#527a6a] text-xs self-center">Afternoon<br /><span className="font-normal opacity-75">12pm-6pm</span></div>
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
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#1B4D3E]">Your Kids</h2>
                    <p className="text-base text-gray-600">Tell us who needs care (or who you're caring for).</p>

                    {data.kids.map((kid, idx) => (
                        <div key={kid.id} className="p-5 bg-white border border-[#c8e6d9] rounded-xl relative shadow-sm">
                            <button
                                onClick={() => {
                                    const newKids = [...data.kids]
                                    newKids.splice(idx, 1)
                                    updateData('kids', newKids)
                                }}
                                className="absolute top-3 right-3 text-red-400 hover:text-red-700 font-bold transition-colors"
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
                                    <label className="block text-xs font-bold text-[#527a6a] uppercase tracking-wide mb-1.5">
                                        Year Born
                                    </label>
                                    <select
                                        value={kid.age || ''}
                                        onChange={(e) => {
                                            const newKids = [...data.kids]
                                            newKids[idx].age = e.target.value
                                            updateData('kids', newKids)
                                        }}
                                        className="w-full px-4 py-3 border border-[#c8e6d9] rounded-xl text-[#1B4D3E] bg-white focus:outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/10 transition-all cursor-pointer appearance-none"
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
                        className="w-full py-3 border-2 border-dashed border-[#c8e6d9] text-[#1B4D3E] font-bold rounded-xl hover:bg-[#e8f5ee] hover:border-[#1B4D3E] transition-all"
                    >
                        + Add Child
                    </button>
                </div>
            )
            case 6: return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#1B4D3E]">Almost done!</h2>
                    <p className="text-base text-gray-600">When are you hoping to start?</p>

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

    return (
        <div className="min-h-screen bg-[#F5F1EB] flex flex-col items-center py-10 px-4 font-sans text-gray-800">
            {/* Progress */}
            <div className="w-full max-w-md mb-8">
                <div className="h-2 bg-[#d8e8e0] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#1B4D3E] transition-all duration-500 ease-out"
                        style={{ width: `${(step / 6) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs font-bold text-[#527a6a] mt-2 uppercase tracking-wider">
                    <span>Step {step} of 6</span>
                    <span>{Math.round((step / 6) * 100)}% Complete</span>
                </div>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_24px_rgba(27,77,62,0.08)] p-8 border border-white/80">
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-6 border border-red-100 flex items-center">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                {renderStep()}

                {/* Actions */}
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
                        disabled={loading}
                        className={`flex-1 py-3 text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(27,77,62,0.2)] transition-all 
                        ${loading ? 'bg-[#4A7C59] cursor-wait' : 'bg-[#1B4D3E] hover:bg-[#154a36] hover:-translate-y-0.5'}`}
                    >
                        {loading ? 'Saving...' : step === 6 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- Sub-Components ---

const Input = ({ label, value, onChange, type = 'text', required, placeholder, subtext }: any) => (
    <div className="w-full">
        <label className="block text-xs font-bold text-[#527a6a] uppercase tracking-wide mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#c8e6d9] rounded-xl text-[#1B4D3E] focus:outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/10 transition-all placeholder:text-gray-300"
            placeholder={placeholder}
        />
        {subtext && <p className="text-[10px] text-[#527a6a] mt-1 opacity-80">{subtext}</p>}
    </div>
)

const SelectionCard = ({ label, desc, selected, onClick }: any) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden
        ${selected
                ? 'border-[#1B4D3E] bg-[#f0faf4] shadow-sm'
                : 'border-[#e0e0e0] bg-white hover:border-[#c8e6d9] hover:shadow-sm'
            }`}
    >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
            ${selected ? 'border-[#1B4D3E] bg-[#1B4D3E]' : 'border-gray-300'}`}
        >
            {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
        </div>
        <div>
            <div className={`font-bold text-[15px] ${selected ? 'text-[#1B4D3E]' : 'text-gray-700'}`}>{label}</div>
            {desc && <div className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</div>}
        </div>
    </div>
)
