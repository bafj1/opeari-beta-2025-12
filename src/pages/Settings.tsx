import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import ScheduleGrid from '../components/common/ScheduleGrid'
import {
  NANNY_SITUATION_OPTIONS,
  LOOKING_FOR_OPTIONS,
  OPEN_TO_OPTIONS,
  PARENTING_VALUES,
  TIMELINE_OPTIONS,
  PET_OPTIONS,
  COMMON_ALLERGIES,
  GENDER_OPTIONS,
  calculateKidAge,
} from '../lib/Constants'

type Schedule = Record<string, string[]>

interface Kid {
  id?: string
  first_name: string
  gender: string | null
  birth_month: number | ''
  birth_year: number | ''
  allergies: string[]
  notes: string
  isNew?: boolean
}

interface ProfileData {
  first_name: string
  last_name: string
  location: string
  neighborhood: string
  photo_url: string | null
  bio: string
  tagline: string
  nanny_situation: string
  looking_for: string[]
  open_to: string[]
  care_timeline: string
  schedule: Schedule
  schedule_flexible: boolean
  schedule_notes: string
  pets: string[]
  household_notes: string
  parenting_style: string[]
}

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'kids', label: 'Kids' },
  { id: 'account', label: 'Account' },
]

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
}

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const activeTab = searchParams.get('tab') || 'profile'
  const [memberId, setMemberId] = useState('')

  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    location: '',
    neighborhood: '',
    photo_url: null,
    bio: '',
    tagline: '',
    nanny_situation: '',
    looking_for: [],
    open_to: [],
    care_timeline: '',
    schedule: {},
    schedule_flexible: false,
    schedule_notes: '',
    pets: [],
    household_notes: '',
    parenting_style: [],
  })

  const [kids, setKids] = useState<Kid[]>([])
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadProfile()
  }, [user])

  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }, [])

  async function loadProfile() {
    try {
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (error) throw error

      setMemberId(member.id)
      setEmail(user!.email || '')

      setProfile({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        location: member.location || '',
        neighborhood: member.neighborhood || '',
        photo_url: member.photo_url || null,
        bio: member.bio || '',
        tagline: member.tagline || '',
        nanny_situation: member.nanny_situation || '',
        looking_for: member.looking_for || [],
        open_to: member.open_to || [],
        care_timeline: member.care_timeline || '',
        schedule: member.schedule || {},
        schedule_flexible: member.schedule_flexible || false,
        schedule_notes: member.schedule_notes || '',
        pets: member.pets || [],
        household_notes: member.household_notes || '',
        parenting_style: member.parenting_style || [],
      })

      const { data: kidsData } = await supabase
        .from('kids')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: true })

      if (kidsData) {
        setKids(kidsData.map(k => ({
          id: k.id,
          first_name: k.first_name || k.name || '',
          gender: k.gender || null,
          birth_month: k.birth_month || '',
          birth_year: k.birth_year || '',
          allergies: k.allergies || [],
          notes: k.notes || '',
        })))
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      showMessage('Failed to load profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  function showMessage(text: string, type: 'success' | 'error') {
    setSaveMessage({ text, type })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  async function saveAll() {
    if (!memberId) return

    setSaving(true)
    try {
      const { error: profileError } = await supabase
        .from('members')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          location: profile.location,
          neighborhood: profile.neighborhood,
          bio: profile.bio,
          tagline: profile.tagline,
          nanny_situation: profile.nanny_situation,
          looking_for: profile.looking_for,
          open_to: profile.open_to,
          care_timeline: profile.care_timeline,
          schedule: profile.schedule,
          schedule_flexible: profile.schedule_flexible,
          schedule_notes: profile.schedule_notes,
          pets: profile.pets,
          household_notes: profile.household_notes,
          parenting_style: profile.parenting_style,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)

      if (profileError) throw profileError

      for (const kid of kids) {
        if (kid.id && !kid.isNew) {
          await supabase
            .from('kids')
            .update({
              first_name: kid.first_name,
              gender: kid.gender,
              birth_month: kid.birth_month || null,
              birth_year: kid.birth_year || null,
              allergies: kid.allergies,
              notes: kid.notes,
            })
            .eq('id', kid.id)
        } else if (kid.first_name) {
          const { data: newKid } = await supabase
            .from('kids')
            .insert({
              member_id: memberId,
              first_name: kid.first_name,
              name: kid.first_name,
              gender: kid.gender,
              birth_month: kid.birth_month || null,
              birth_year: kid.birth_year || null,
              allergies: kid.allergies,
              notes: kid.notes,
            })
            .select()
            .single()

          if (newKid) {
            setKids(prev => prev.map(k =>
              k === kid ? { ...k, id: newKid.id, isNew: false } : k
            ))
          }
        }
      }

      setHasChanges(false)
      showMessage('Saved!', 'success')
    } catch (err) {
      console.error('Save error:', err)
      showMessage('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  function addKid() {
    setKids(prev => [...prev, {
      first_name: '',
      gender: null,
      birth_month: '',
      birth_year: '',
      allergies: [],
      notes: '',
      isNew: true,
    }])
    setHasChanges(true)
  }

  function updateKid(index: number, field: keyof Kid, value: any) {
    setKids(prev => prev.map((k, i) => i === index ? { ...k, [field]: value } : k))
    setHasChanges(true)
  }

  function toggleKidAllergy(index: number, allergy: string) {
    setKids(prev => prev.map((k, i) =>
      i === index
        ? { ...k, allergies: toggleArrayItem(k.allergies, allergy) }
        : k
    ))
    setHasChanges(true)
  }

  async function removeKid(index: number) {
    const kid = kids[index]
    if (kid.id && !kid.isNew) {
      await supabase.from('kids').delete().eq('id', kid.id)
    }
    setKids(prev => prev.filter((_, i) => i !== index))
    showMessage('Removed', 'success')
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error')
      return
    }
    if (newPassword.length < 8) {
      showMessage('Minimum 8 characters', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setShowPasswordForm(false)
      setNewPassword('')
      setConfirmPassword('')
      showMessage('Password updated!', 'success')
    } catch (err) {
      showMessage('Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-opeari-mint flex items-center justify-center">
          <div className="text-opeari-heading font-semibold animate-pulse">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      {/* MINT BACKGROUND - Not white */}
      <div className="min-h-screen bg-opeari-mint/10 pb-24">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-opeari-heading">Settings</h1>
            <Link to="/profile" className="text-sm text-opeari-coral font-semibold hover:underline">
              View Profile →
            </Link>
          </div>

          {/* Mobile Tab Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 sm:hidden">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 border transition-colors ${activeTab === tab.id
                  ? 'bg-opeari-heading text-white border-transparent'
                  : 'bg-opeari-bg text-opeari-heading border-opeari-border hover:bg-opeari-mint/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6">

            {/* Desktop Sidebar */}
            <div className="hidden sm:block">
              <div className="bg-opeari-bg rounded-2xl border border-opeari-border p-2 sticky top-20">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSearchParams({ tab: tab.id })}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id
                      ? 'bg-opeari-coral/20 text-opeari-coral'
                      : 'text-opeari-heading hover:bg-opeari-mint/30'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content - CREAM background, not white */}
            <div className="min-w-0">

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="bg-opeari-bg rounded-2xl border border-opeari-border p-5">
                    <h2 className="text-lg font-bold text-opeari-heading mb-4">Basic Info</h2>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-opeari-heading mb-1">First Name</label>
                        <input
                          type="text"
                          value={profile.first_name}
                          onChange={(e) => updateProfile({ first_name: e.target.value })}
                          className="w-full px-4 py-3 border border-opeari-border rounded-xl text-base bg-white focus:outline-none focus:border-opeari-coral"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-opeari-heading mb-1">Last Name</label>
                        <input
                          type="text"
                          value={profile.last_name}
                          onChange={(e) => updateProfile({ last_name: e.target.value })}
                          className="w-full px-3 py-2.5 border border-opeari-border rounded-xl text-sm bg-white focus:outline-none focus:border-opeari-coral"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-opeari-heading mb-1">ZIP Code</label>
                        <input
                          type="text"
                          value={profile.location}
                          onChange={(e) => updateProfile({ location: e.target.value })}
                          maxLength={5}
                          className="w-full px-3 py-2.5 border border-opeari-border rounded-xl text-sm bg-white focus:outline-none focus:border-opeari-coral"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-opeari-heading mb-1">Neighborhood</label>
                        <input
                          type="text"
                          value={profile.neighborhood}
                          onChange={(e) => updateProfile({ neighborhood: e.target.value })}
                          placeholder="e.g., Manhattan Beach"
                          className="w-full px-3 py-2.5 border border-opeari-border rounded-xl text-sm bg-white focus:outline-none focus:border-opeari-coral"
                        />
                      </div>
                    </div>

                    {/* Care Description - Highlighted */}
                    <div className="mb-4 p-4 bg-opeari-bg-secondary rounded-xl">
                      <label className="block text-sm font-semibold text-opeari-heading mb-2">
                        What are you looking for?
                      </label>
                      <input
                        type="text"
                        value={profile.tagline}
                        onChange={(e) => updateProfile({ tagline: e.target.value })}
                        placeholder="e.g., Looking for Tue/Thu afternoon care partner"
                        maxLength={120}
                        className="w-full px-4 py-3 border-2 border-opeari-coral rounded-xl text-sm bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-opeari-heading mb-1">About Your Family</label>
                      <p className="text-xs text-opeari-text-secondary mb-2">Share what matters: your work schedule, childcare needs, parenting style, or what you're hoping to find.</p>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => updateProfile({ bio: e.target.value })}
                        placeholder="Example: Working parents with a toddler seeking consistent, flexible childcare. Looking to share costs with a like-minded family and build lasting community connections."
                        rows={4}
                        className="w-full px-3 py-2.5 border border-opeari-border rounded-xl text-sm bg-white focus:outline-none focus:border-opeari-coral resize-none"
                      />
                    </div>
                  </div>

                  {/* Care Needs */}
                  <div className="bg-opeari-bg rounded-2xl border border-opeari-border p-5">
                    <h2 className="text-lg font-bold text-opeari-heading mb-4">Care Needs</h2>

                    {/* Situation */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-opeari-heading mb-2">Your Situation</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {NANNY_SITUATION_OPTIONS.map(option => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateProfile({ nanny_situation: option.id })}
                            className={`p-3 rounded-xl text-left border-2 transition-all ${profile.nanny_situation === option.id
                              ? 'bg-opeari-coral/15 border-opeari-coral'
                              : 'bg-white border-opeari-border'
                              }`}
                          >
                            <span className={`block text-sm font-medium ${profile.nanny_situation === option.id ? 'text-opeari-coral' : 'text-opeari-heading'
                              }`}>
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Looking For - CORAL PILLS */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-opeari-heading mb-2">Looking For</label>
                      <div className="flex flex-wrap gap-2">
                        {LOOKING_FOR_OPTIONS.map(option => {
                          const isSelected = profile.looking_for.includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => updateProfile({
                                looking_for: toggleArrayItem(profile.looking_for, option.id)
                              })}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${isSelected
                                ? 'bg-opeari-coral text-white border-transparent'
                                : 'bg-opeari-bg text-opeari-heading border-opeari-border hover:bg-opeari-mint/30'
                                }`}
                            >
                              {isSelected && '✓ '}{option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Open To */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-opeari-heading mb-2">Also Open To</label>
                      <div className="flex flex-wrap gap-2">
                        {OPEN_TO_OPTIONS.map(option => {
                          const isSelected = profile.open_to.includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => updateProfile({
                                open_to: toggleArrayItem(profile.open_to, option.id)
                              })}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${isSelected
                                ? 'bg-opeari-coral text-white border-transparent'
                                : 'bg-opeari-bg text-opeari-heading border-opeari-border hover:bg-opeari-mint/30'
                                }`}
                            >
                              {isSelected && '✓ '}{option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Parenting Vibe */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-opeari-heading mb-2">Parenting Vibe</label>
                      <div className="flex flex-wrap gap-2">
                        {PARENTING_VALUES.map(option => {
                          const isSelected = profile.parenting_style.includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => updateProfile({
                                parenting_style: toggleArrayItem(profile.parenting_style, option.id)
                              })}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 border ${isSelected
                                ? 'bg-opeari-green text-white border-transparent'
                                : 'bg-opeari-bg text-opeari-heading border-opeari-green'
                                }`}
                            >
                              {isSelected && '✓ '}{option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-opeari-heading mb-2">Timeline</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {TIMELINE_OPTIONS.map(option => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateProfile({ care_timeline: option.id })}
                            className={`p-3 rounded-xl text-center border-2 transition-all ${profile.care_timeline === option.id
                              ? 'bg-opeari-coral/15 border-opeari-coral'
                              : 'bg-white border-opeari-border'
                              }`}
                          >
                            <span className={`text-sm font-medium ${profile.care_timeline === option.id ? 'text-opeari-coral' : 'text-opeari-heading'
                              }`}>
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pets */}
                    <div>
                      <label className="block text-sm font-medium text-opeari-heading mb-2">Pets</label>
                      <div className="flex flex-wrap gap-2">
                        {PET_OPTIONS.map(option => {
                          const isSelected = profile.pets.includes(option.id)
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                if (option.id === 'none') {
                                  updateProfile({ pets: ['none'] })
                                } else {
                                  updateProfile({
                                    pets: toggleArrayItem(profile.pets.filter(p => p !== 'none'), option.id)
                                  })
                                }
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${isSelected
                                ? 'bg-opeari-coral text-white border-transparent'
                                : 'bg-opeari-bg text-opeari-heading border-opeari-border hover:bg-opeari-mint/30'
                                }`}
                            >
                              {isSelected && '✓ '}{option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCHEDULE TAB */}
              {activeTab === 'schedule' && (
                <div className="bg-opeari-bg rounded-2xl border border-opeari-border p-5">
                  <h2 className="text-lg font-bold text-opeari-heading mb-1">Your Schedule</h2>
                  <p className="text-sm text-opeari-green mb-6">When do you need childcare?</p>

                  <ScheduleGrid
                    schedule={profile.schedule}
                    onChange={(schedule) => updateProfile({ schedule })}
                    flexible={profile.schedule_flexible}
                    onFlexibleChange={(flexible) => updateProfile({ schedule_flexible: flexible })}
                  />

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-opeari-heading mb-2">Schedule Notes</label>
                    <textarea
                      value={profile.schedule_notes}
                      onChange={(e) => updateProfile({ schedule_notes: e.target.value })}
                      placeholder="Any additional details..."
                      rows={2}
                      className="w-full px-3 py-2.5 border border-opeari-border rounded-xl text-sm bg-white focus:outline-none focus:border-opeari-coral resize-none"
                    />
                  </div>
                </div>
              )}

              {/* KIDS TAB */}
              {activeTab === 'kids' && (
                <div className="bg-opeari-bg rounded-2xl border border-opeari-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-opeari-heading">Kids</h2>
                      <p className="text-sm text-opeari-green">Add your children</p>
                    </div>
                    <button
                      type="button"
                      onClick={addKid}
                      className="px-4 py-2 font-semibold rounded-full text-sm bg-opeari-coral text-opeari-heading"
                    >
                      + Add Child
                    </button>
                  </div>

                  {kids.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-opeari-border rounded-xl">
                      <p className="text-opeari-text-secondary mb-2">No children added yet</p>
                      <button type="button" onClick={addKid} className="font-medium hover:underline text-opeari-coral">
                        Add your first child
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {kids.map((kid, index) => (
                        <div key={kid.id || `new-${index}`} className="border border-opeari-border rounded-xl p-4 bg-white">
                          {/* Kid Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-opeari-coral/20">
                                <span className="font-bold text-base text-opeari-coral">
                                  {kid.first_name ? kid.first_name.charAt(0).toUpperCase() : '?'}
                                </span>
                              </div>
                              <span className="font-semibold text-opeari-heading">
                                {kid.first_name || 'New Child'}
                              </span>
                              {kid.birth_month && kid.birth_year && (
                                <span className="text-xs text-opeari-text-secondary bg-opeari-mint px-2 py-0.5 rounded-full">
                                  {calculateKidAge(kid.birth_month as number, kid.birth_year as number)}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeKid(index)}
                              className="text-xs hover:underline text-opeari-coral"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Name + Birthday */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div>
                              <label className="block text-xs text-opeari-text-secondary mb-1">Name</label>
                              <input
                                type="text"
                                value={kid.first_name}
                                onChange={(e) => updateKid(index, 'first_name', e.target.value)}
                                className="w-full px-3 py-2 border border-opeari-border rounded-lg text-sm focus:outline-none focus:border-opeari-coral"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-opeari-text-secondary mb-1">Month</label>
                              <select
                                value={kid.birth_month}
                                onChange={(e) => updateKid(index, 'birth_month', e.target.value ? parseInt(e.target.value) : '')}
                                className="w-full px-2 py-2 border border-opeari-border rounded-lg text-sm focus:outline-none focus:border-opeari-coral bg-white"
                              >
                                <option value="">-</option>
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                                  <option key={month} value={i + 1}>{month}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-opeari-text-secondary mb-1">Year</label>
                              <select
                                value={kid.birth_year}
                                onChange={(e) => updateKid(index, 'birth_year', e.target.value ? parseInt(e.target.value) : '')}
                                className="w-full px-2 py-2 border border-opeari-border rounded-lg text-sm focus:outline-none focus:border-opeari-coral bg-white"
                              >
                                <option value="">-</option>
                                {Array.from({ length: 18 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Gender */}
                          <div className="mb-3">
                            <label className="block text-xs text-opeari-text-secondary mb-1">Gender (optional)</label>
                            <div className="flex gap-2">
                              {GENDER_OPTIONS.map(option => {
                                const isSelected = kid.gender === option.id
                                return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => updateKid(index, 'gender', isSelected ? null : option.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isSelected
                                      ? 'bg-opeari-coral text-white border-transparent'
                                      : 'bg-opeari-bg text-opeari-heading border-opeari-border hover:bg-opeari-mint/30'
                                      }`}
                                  >
                                    {isSelected && '✓ '}{option.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* ALLERGIES - CORAL WHEN SELECTED */}
                          <div className="mb-3">
                            <label className="block text-xs text-opeari-text-secondary mb-1">
                              Allergies <span className="font-medium text-opeari-coral">*important</span>
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {COMMON_ALLERGIES.map(allergy => {
                                const isSelected = kid.allergies.includes(allergy.id)
                                return (
                                  <button
                                    key={allergy.id}
                                    type="button"
                                    onClick={() => toggleKidAllergy(index, allergy.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 border transition-colors ${isSelected
                                      ? 'bg-opeari-coral text-white border-opeari-coral'
                                      : 'bg-opeari-bg text-opeari-heading border-opeari-border hover:bg-opeari-mint/30'
                                      }`}
                                  >
                                    {isSelected && '✓ '}{allergy.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-xs text-opeari-text-secondary mb-1">Notes</label>
                            <input
                              type="text"
                              value={kid.notes}
                              onChange={(e) => updateKid(index, 'notes', e.target.value)}
                              placeholder="Special considerations..."
                              className="w-full px-3 py-2 border border-opeari-border rounded-lg text-sm focus:outline-none focus:border-opeari-coral"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACCOUNT TAB */}
              {activeTab === 'account' && (
                <div className="space-y-4">
                  <div className="bg-opeari-bg rounded-2xl border border-opeari-border p-5">
                    <h3 className="font-semibold text-opeari-heading mb-4">Account</h3>
                    <div>
                      <label className="block text-xs text-opeari-text-secondary mb-1">Email</label>
                      <div className="flex items-center gap-3">
                        <span className="text-opeari-heading">{email}</span>
                        <span className="text-xs text-white bg-opeari-heading px-2 py-0.5 rounded-full">Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-opeari-bg rounded-2xl border border-opeari-border p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-opeari-heading">Password</h3>
                      {!showPasswordForm && (
                        <button onClick={() => setShowPasswordForm(true)} className="text-sm font-medium hover:underline text-opeari-coral">
                          Change
                        </button>
                      )}
                    </div>

                    {showPasswordForm ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-opeari-text-secondary mb-1">New Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-3 py-2.5 border border-opeari-border rounded-xl text-sm focus:outline-none focus:border-opeari-coral pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-opeari-text-secondary mb-1">Confirm</label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2.5 border border-opeari-border rounded-xl text-sm focus:outline-none focus:border-opeari-coral"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}
                            className="flex-1 py-2.5 border border-opeari-border rounded-xl text-opeari-heading text-sm font-medium hover:bg-opeari-bg-secondary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={changePassword}
                            disabled={saving}
                            className="flex-1 py-2.5 bg-opeari-coral text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-opeari-coral/90"
                          >
                            {saving ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-opeari-text-secondary">••••••••</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Save Button - MORE PROMINENT with dark green text */}
        {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-opeari-bg-secondary border-t-2 border-opeari-coral p-4 shadow-xl z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-opeari-heading">You have unsaved changes</p>
              <button
                onClick={saveAll}
                disabled={saving}
                className="px-8 py-3 font-bold rounded-full disabled:opacity-50 shadow-lg text-base bg-opeari-coral text-opeari-heading hover:bg-opeari-coral/90"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
        {saveMessage && (
          <div
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 text-white ${saveMessage.type === 'success' ? 'bg-opeari-heading' : 'bg-opeari-coral'
              }`}
          >
            {saveMessage.text}
          </div>
        )}
      </div >
    </>
  )
}