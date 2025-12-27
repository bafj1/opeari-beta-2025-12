import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'

type Step = 1 | 2 | 3 | 4 | 5

interface Kid {
  name: string
  birth_month: number | ''
  birth_year: number | ''
}

interface ScheduleSlot {
  day: number
  time: 'morning' | 'afternoon'
}

// NEW: Nanny situation options
const NANNY_SITUATION_OPTIONS = [
  {
    id: 'have_nanny',
    title: 'I have a nanny to share',
    subtitle: 'Looking for families to join on her open days',
    icon: '👩‍👧'
  },
  {
    id: 'seeking_share',
    title: 'I want to join a nanny share',
    subtitle: 'Looking for a family who already has a nanny',
    icon: '🔍'
  },
  {
    id: 'no_nanny',
    title: "I don't have a nanny yet",
    subtitle: 'Open to co-ops, care trades, or finding one together',
    icon: '🤝'
  },
]

const LOOKING_FOR_OPTIONS = [
  { id: 'nanny_share', label: 'Nanny Share', desc: 'Share a nanny with another family' },
  { id: 'care_share', label: 'Care Share / Co-op', desc: 'Trade childcare with other parents' },
  { id: 'backup_care', label: 'Backup Care', desc: 'Emergency or last-minute help' },
]

// NEW: Additional things they're open to
const OPEN_TO_OPTIONS = [
  { id: 'rideshares', label: 'Rideshares', desc: 'School pickup, activity transport' },
  { id: 'playdates', label: 'Playdates', desc: 'Social time for kids' },
  { id: 'weekend_swaps', label: 'Weekend Swaps', desc: 'Trade weekend time' },
]

const EXPERIENCE_OPTIONS = [
  { id: 'currently_in_one', label: "I'm currently in a nanny share" },
  { id: 'have_done_before', label: "I've done this before" },
  { id: 'new_to_it', label: "I'm new to this" },
]

const TIMELINE_OPTIONS = [
  { id: 'asap', label: 'As soon as possible' },
  { id: '1_3_months', label: 'In 1-3 months' },
  { id: '3_6_months', label: 'In 3-6 months' },
  { id: 'just_exploring', label: 'Just exploring' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const TIMES: Array<'morning' | 'afternoon'> = ['morning', 'afternoon']

const PARENTING_STYLES = [
  'Routine-oriented', 'Go with the flow', 'Outdoorsy', 'Screen-limited',
  'Montessori-inspired', 'Attachment parenting', 'Bilingual household'
]

const INTERESTS = [
  'Arts & crafts', 'Music', 'Outdoor play', 'Reading', 'Sports',
  'Science/STEM', 'Animals', 'Cooking', 'Dance', 'Swimming'
]

export default function ProfileWizard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [location, setLocation] = useState('')
  const [kids, setKids] = useState<Kid[]>([{ name: '', birth_month: '', birth_year: '' }])
  const [expecting, setExpecting] = useState(false)

  // Step 3 - Enhanced
  const [nannySituation, setNannySituation] = useState('')
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [openTo, setOpenTo] = useState<string[]>([])
  const [experience, setExperience] = useState('')
  const [timeline, setTimeline] = useState('')

  // Step 4
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [irregularSchedule, setIrregularSchedule] = useState(false)
  const [scheduleNotes, setScheduleNotes] = useState('')

  // Step 5
  const [bio, setBio] = useState('')
  const [parentingStyle, setParentingStyle] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      setLoading(true)

      try {
        const { data: member } = await supabase
          .from('members')
          .select('*, kids(*)')
          .eq('user_id', user.id)
          .single()

        if (member) {
          setFirstName(member.first_name || '')
          setLastName(member.last_name || '')
          setLocation(member.location || '')
          setBio(member.bio || '')
          setNannySituation(member.nanny_situation || '')
          setLookingFor(member.looking_for || [])
          setOpenTo(member.open_to || [])
          setExperience(member.nannyshare_experience || '')
          setTimeline(member.care_timeline || '')
          setParentingStyle(member.parenting_style || [])
          setInterests(member.interests || [])
          setIrregularSchedule(member.irregular_schedule || false)
          setScheduleNotes(member.schedule_notes || '')
          setExpecting(member.expecting || false)

          if (member.kids?.length > 0) {
            setKids(member.kids.map((k: any) => ({
              name: k.name || '',
              birth_month: k.birth_month || '',
              birth_year: k.birth_year || '',
            })))
          }

          // Load schedule from member_schedule table
          const { data: scheduleData } = await supabase
            .from('member_schedule')
            .select('*')
            .eq('member_id', member.id)

          if (scheduleData) {
            setSchedule(scheduleData.map(s => ({
              day: s.day_of_week,
              time: s.time_slot as 'morning' | 'afternoon'
            })))
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const toggleLookingFor = (id: string) => {
    setLookingFor(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleOpenTo = (id: string) => {
    setOpenTo(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSchedule = (day: number, time: 'morning' | 'afternoon') => {
    const exists = schedule.some(s => s.day === day && s.time === time)
    if (exists) {
      setSchedule(prev => prev.filter(s => !(s.day === day && s.time === time)))
    } else {
      setSchedule(prev => [...prev, { day, time }])
    }
  }

  const isScheduleSelected = (day: number, time: 'morning' | 'afternoon') => {
    return schedule.some(s => s.day === day && s.time === time)
  }

  const toggleParentingStyle = (style: string) => {
    setParentingStyle(prev =>
      prev.includes(style) ? prev.filter(x => x !== style) : [...prev, style]
    )
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(x => x !== interest) : [...prev, interest]
    )
  }

  const addKid = () => {
    setKids(prev => [...prev, { name: '', birth_month: '', birth_year: '' }])
  }

  const updateKid = (index: number, field: keyof Kid, value: string | number) => {
    const updated = [...kids]
    updated[index] = { ...updated[index], [field]: value }
    setKids(updated)
  }

  const removeKid = (index: number) => {
    if (kids.length > 1) {
      setKids(prev => prev.filter((_, i) => i !== index))
    }
  }

  const saveProgress = async (currentStep: Step) => {
    if (!user) return
    setSaving(true)

    try {
      // Get member ID first
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) return // Should verify error handling here, but fail-safe for now

      const updates: any = {
        updated_at: new Date().toISOString(),
      }

      // Step 1: Basic Info
      if (currentStep === 1) {
        Object.assign(updates, {
          first_name: firstName,
          last_name: lastName,
          location: location,
        })
      }

      // Step 2: Kids
      if (currentStep === 2) {
        Object.assign(updates, {
          expecting: expecting
        })
        // Handle kids relation below
      }

      // Step 3: Needs
      if (currentStep === 3) {
        Object.assign(updates, {
          nanny_situation: nannySituation,
          looking_for: lookingFor,
          open_to: openTo,
          nannyshare_experience: experience,
          care_timeline: timeline,
        })
      }

      // Step 4: Schedule
      if (currentStep === 4) {
        Object.assign(updates, {
          irregular_schedule: irregularSchedule,
          schedule_notes: scheduleNotes,
        })
        // Handle schedule relation below
      }

      // Step 5: Bio/Style (saved on submit usually, but good to have)
      if (currentStep === 5) {
        Object.assign(updates, {
          bio: bio,
          parenting_style: parentingStyle,
          interests: interests,
        })
      }

      // Perform main update
      if (Object.keys(updates).length > 1) {
        const { error: updateError } = await supabase
          .from('members')
          .update(updates)
          .eq('user_id', user.id)

        if (updateError) throw updateError
      }

      // Handle Relations
      if (currentStep === 2) {
        // Delete existing kids
        await supabase.from('kids').delete().eq('member_id', member.id)

        // Insert current kids
        const kidsToInsert = kids
          .filter(k => k.name.trim() !== '')
          .map(k => ({
            member_id: member.id,
            name: k.name,
            birth_month: k.birth_month || null,
            birth_year: k.birth_year || null,
          }))

        if (kidsToInsert.length > 0) {
          const { error: kidsError } = await supabase.from('kids').insert(kidsToInsert)
          if (kidsError) throw kidsError
        }
      }

      if (currentStep === 4) {
        // Delete existing schedule
        await supabase.from('member_schedule').delete().eq('member_id', member.id)

        // Insert current schedule
        if (schedule.length > 0) {
          const scheduleToInsert = schedule.map(s => ({
            member_id: member.id,
            day_of_week: s.day,
            time_slot: s.time,
          }))

          const { error: scheduleError } = await supabase
            .from('member_schedule')
            .insert(scheduleToInsert)

          if (scheduleError) throw scheduleError
        }
      }

    } catch (err) {
      console.error('Error saving progress:', err)
      // We don't block navigation on save error to avoid trapping users, 
      // but we log it. Could add toast here.
    } finally {
      setSaving(false)
    }
  }

  const validateStep = (): boolean => {
    setError('')

    switch (step) {
      case 1:
        if (!firstName.trim()) {
          setError('First name is required')
          return false
        }
        if (!location.trim()) {
          setError('Location is required')
          return false
        }
        return true
      case 2:
        const hasKid = kids.some(k => k.name.trim() !== '')
        if (!hasKid && !expecting) {
          setError('Please add at least one child or check "We\'re expecting"')
          return false
        }
        return true
      case 3:
        if (!nannySituation) {
          setError('Please select your situation')
          return false
        }
        if (lookingFor.length === 0) {
          setError('Please select at least one thing you\'re looking for')
          return false
        }
        return true
      case 4:
        return true
      case 5:
        return true
      default:
        return true
    }
  }

  const nextStep = async () => {
    if (validateStep()) {
      await saveProgress(step)
      setStep(prev => (prev + 1) as Step)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(prev => (prev - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    setError('')

    try {
      // Get member ID
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) throw new Error('Member not found')

      // Update member profile
      const { error: memberError } = await supabase
        .from('members')
        .update({
          first_name: firstName,
          last_name: lastName,
          location: location,
          bio: bio,
          nanny_situation: nannySituation,
          looking_for: lookingFor,
          open_to: openTo,
          nannyshare_experience: experience,
          care_timeline: timeline,
          parenting_style: parentingStyle,
          interests: interests,
          irregular_schedule: irregularSchedule,
          schedule_notes: scheduleNotes,
          expecting: expecting,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (memberError) throw memberError

      // Update kids
      await supabase
        .from('kids')
        .delete()
        .eq('member_id', member.id)

      const kidsToInsert = kids
        .filter(k => k.name.trim() !== '')
        .map(k => ({
          member_id: member.id,
          name: k.name,
          birth_month: k.birth_month || null,
          birth_year: k.birth_year || null,
        }))

      if (kidsToInsert.length > 0) {
        const { error: kidsError } = await supabase
          .from('kids')
          .insert(kidsToInsert)

        if (kidsError) throw kidsError
      }

      // Update schedule
      await supabase
        .from('member_schedule')
        .delete()
        .eq('member_id', member.id)

      if (schedule.length > 0) {
        const scheduleToInsert = schedule.map(s => ({
          member_id: member.id,
          day_of_week: s.day,
          time_slot: s.time,
        }))

        const { error: scheduleError } = await supabase
          .from('member_schedule')
          .insert(scheduleToInsert)

        if (scheduleError) throw scheduleError
      }

      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-opeari-bg flex items-center justify-center">
          <div className="text-opeari-heading font-semibold animate-pulse">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-opeari-bg py-8 px-4">
        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-opeari-green' : 'bg-opeari-border'
                  }`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-opeari-border shadow-sm">

            {/* Step 1: About You */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-opeari-heading mb-2">Let's get started</h2>
                  <p className="text-opeari-text-secondary">Tell us a bit about yourself</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-opeari-text mb-2">
                      First name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-opeari-bg border-2 border-opeari-border rounded-xl focus:outline-none focus:border-opeari-green transition-colors"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-opeari-text mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-opeari-bg border-2 border-opeari-border rounded-xl focus:outline-none focus:border-opeari-green transition-colors"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-opeari-text mb-2">
                    Where do you live? *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-opeari-bg border-2 border-opeari-border rounded-xl focus:outline-none focus:border-opeari-green transition-colors"
                    placeholder="Neighborhood or zip code"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Kids */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-opeari-heading mb-2">Your little ones</h2>
                  <p className="text-opeari-text-secondary">This helps us find age-compatible matches</p>
                </div>

                {kids.map((kid, index) => (
                  <div key={index} className="p-4 bg-opeari-bg rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-opeari-heading text-sm">Child {index + 1}</span>
                      {kids.length > 1 && (
                        <button
                          onClick={() => removeKid(index)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={kid.name}
                      onChange={(e) => updateKid(index, 'name', e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-opeari-border rounded-xl focus:outline-none focus:border-opeari-green transition-colors"
                      placeholder="Name or nickname"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={kid.birth_month}
                        onChange={(e) => updateKid(index, 'birth_month', e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full px-4 py-3 bg-white border-2 border-opeari-border rounded-xl focus:outline-none focus:border-opeari-green transition-colors"
                      >
                        <option value="">Month</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                      <select
                        value={kid.birth_year}
                        onChange={(e) => updateKid(index, 'birth_year', e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full px-4 py-3 bg-white border-2 border-opeari-border rounded-xl focus:outline-none focus:border-opeari-green transition-colors"
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - i
                          return <option key={year} value={year}>{year}</option>
                        })}
                      </select>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addKid}
                  className="w-full py-3 border-2 border-dashed border-opeari-border rounded-xl text-opeari-heading font-semibold hover:bg-opeari-mint transition-colors"
                >
                  + Add another child
                </button>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expecting}
                    onChange={(e) => setExpecting(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-opeari-border text-opeari-green focus:ring-opeari-green"
                  />
                  <span className="text-opeari-text">We're expecting</span>
                </label>
              </div>
            )}

            {/* Step 3: What You're Looking For (ENHANCED) */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-opeari-heading mb-2">What are you looking for?</h2>
                  <p className="text-opeari-text-secondary">This helps us show you the right matches</p>
                </div>

                {/* NEW: Nanny situation */}
                <div>
                  <label className="block text-sm font-semibold text-opeari-text mb-3">
                    Your situation *
                  </label>
                  <div className="space-y-3">
                    {NANNY_SITUATION_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setNannySituation(option.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${nannySituation === option.id
                          ? 'border-opeari-green bg-opeari-mint'
                          : 'border-opeari-border hover:border-opeari-green/50 bg-white'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <div className="font-semibold text-opeari-text">{option.title}</div>
                            <div className="text-sm text-opeari-text-secondary">{option.subtitle}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Looking for */}
                <div>
                  <label className="block text-sm font-semibold text-opeari-text mb-3">
                    I'm interested in... *
                  </label>
                  <div className="space-y-2">
                    {LOOKING_FOR_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleLookingFor(option.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${lookingFor.includes(option.id)
                          ? 'border-opeari-green bg-opeari-mint'
                          : 'border-opeari-border hover:border-opeari-green/50 bg-white'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-opeari-text">{option.label}</div>
                            <div className="text-sm text-opeari-text-secondary">{option.desc}</div>
                          </div>
                          {lookingFor.includes(option.id) && (
                            <div className="w-6 h-6 rounded-full bg-opeari-green flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* NEW: Also open to */}
                <div>
                  <label className="block text-sm font-semibold text-opeari-text mb-3">
                    Also open to (optional)
                  </label>
                  <div className="space-y-2">
                    {OPEN_TO_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleOpenTo(option.id)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${openTo.includes(option.id)
                          ? 'border-opeari-coral bg-opeari-bg-secondary'
                          : 'border-opeari-border hover:border-opeari-coral/50 bg-white'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-opeari-text">{option.label}</span>
                            <span className="text-sm text-opeari-text-secondary ml-2">— {option.desc}</span>
                          </div>
                          {openTo.includes(option.id) && (
                            <div className="w-5 h-5 rounded-full bg-opeari-coral flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience & Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-opeari-text mb-3">
                      Experience level
                    </label>
                    <div className="space-y-2">
                      {EXPERIENCE_OPTIONS.map(option => (
                        <label
                          key={option.id}
                          className={`block p-3 rounded-xl border-2 cursor-pointer transition-all ${experience === option.id
                            ? 'border-opeari-green bg-opeari-mint'
                            : 'border-opeari-border hover:border-opeari-green/50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="experience"
                            checked={experience === option.id}
                            onChange={() => setExperience(option.id)}
                            className="sr-only"
                          />
                          <span className="text-opeari-text text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-opeari-text mb-3">
                      Timeline
                    </label>
                    <div className="space-y-2">
                      {TIMELINE_OPTIONS.map(option => (
                        <label
                          key={option.id}
                          className={`block p-3 rounded-xl border-2 cursor-pointer transition-all ${timeline === option.id
                            ? 'border-opeari-green bg-opeari-mint'
                            : 'border-opeari-border hover:border-opeari-green/50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="timeline"
                            checked={timeline === option.id}
                            onChange={() => setTimeline(option.id)}
                            className="sr-only"
                          />
                          <span className="text-opeari-text text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Schedule */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-opeari-heading mb-2">Your ideal schedule</h2>
                  <p className="text-opeari-text-secondary">When do you need care? (Optional)</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-24"></th>
                        {DAYS.map((day) => (
                          <th key={day} className="text-center text-sm font-semibold text-opeari-text p-2">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIMES.map(time => (
                        <tr key={time}>
                          <td className="text-sm text-opeari-text-secondary py-2 pr-3">
                            {time === 'morning' ? 'Morning' : 'Afternoon'}
                          </td>
                          {DAYS.map((day, dayIndex) => (
                            <td key={`${day}-${time}`} className="p-1">
                              <button
                                type="button"
                                onClick={() => toggleSchedule(dayIndex, time)}
                                className={`w-full h-12 rounded-lg border-2 transition-all ${isScheduleSelected(dayIndex, time)
                                  ? 'border-opeari-green bg-opeari-green text-white'
                                  : 'border-opeari-border bg-opeari-bg hover:border-opeari-green/50'
                                  }`}
                              >
                                {isScheduleSelected(dayIndex, time) && '✓'}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={irregularSchedule}
                    onChange={(e) => setIrregularSchedule(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-opeari-border text-opeari-green focus:ring-opeari-green"
                  />
                  <span className="text-opeari-text">My schedule changes — I'll work out specifics later</span>
                </label>

                <div>
                  <label className="block text-sm font-semibold text-opeari-text mb-2">
                    Anything else about your schedule?
                  </label>
                  <textarea
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-opeari-bg border-2 border-opeari-border rounded-xl focus:outline-none focus:border-opeari-green transition-colors resize-none"
                    rows={3}
                    placeholder="e.g., Flexible on Fridays, need early drop-off..."
                  />
                </div>
              </div>
            )}

            {/* Step 5: About Your Family */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-opeari-heading mb-2">Almost done!</h2>
                  <p className="text-opeari-text-secondary">Help families get to know you (optional)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-opeari-text mb-2">
                    About your family
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 bg-opeari-bg border-2 border-opeari-border rounded-xl focus:outline-none focus:border-opeari-green transition-colors resize-none"
                    rows={4}
                    placeholder="What should other families know about you?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-opeari-text mb-3">
                    Parenting style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PARENTING_STYLES.map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleParentingStyle(style)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${parentingStyle.includes(style)
                          ? 'bg-opeari-green text-white'
                          : 'bg-opeari-bg text-opeari-text hover:bg-opeari-mint border border-opeari-border'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-opeari-text mb-3">
                    Your kids love...
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${interests.includes(interest)
                          ? 'bg-opeari-coral text-white'
                          : 'bg-opeari-bg text-opeari-text hover:bg-opeari-peach/30 border border-opeari-border'
                          }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-opeari-border">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  disabled={saving}
                  className="px-6 py-3 text-opeari-heading font-semibold hover:bg-opeari-bg rounded-full transition-colors disabled:opacity-50"
                  type="button"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  onClick={nextStep}
                  disabled={saving}
                  className="px-8 py-3 bg-opeari-green text-white font-semibold rounded-full hover:bg-opeari-green-dark transition-colors shadow-md disabled:opacity-70 disabled:cursor-wait"
                  type="button"
                >
                  {saving ? 'Saving...' : 'Continue'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-8 py-3 bg-opeari-green text-white font-semibold rounded-full hover:bg-opeari-green-dark transition-colors shadow-md disabled:opacity-70 disabled:cursor-wait"
                  type="button"
                >
                  {saving ? 'Saving Profile...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}