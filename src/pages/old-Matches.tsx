import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import Toast from '../components/common/Toast'
import MatchCard from '../components/Dashboard/MatchCard'
import FilterPills from '../components/Dashboard/FilterPills'
import CTACards from '../components/Dashboard/CTACards'
import type { Match, FilterType } from '../components/Dashboard/types'

interface Connection {
  id: string
  member_id: string
  connected_member_id: string
  status: string
}

export default function Matches() {
  const { user } = useAuth()
  const [localMatches, setLocalMatches] = useState<Match[]>([])
  const [travelMatches, setTravelMatches] = useState<Match[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [currentMemberId, setCurrentMemberId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Fetch matches and connections
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        const { data: currentMember } = await supabase
          .from('members')
          .select('id, location')
          .eq('user_id', user.id)
          .single()

        if (!currentMember) {
          setLoading(false)
          return
        }

        setCurrentMemberId(currentMember.id)
        const userZipPrefix = currentMember.location?.match(/\d{3}/)?.[0] || ''

        const { data: userConnections } = await supabase
          .from('connections')
          .select('*')
          .or(`member_id.eq.${currentMember.id},connected_member_id.eq.${currentMember.id}`)

        setConnections(userConnections || [])

        const { data: members, error } = await supabase
          .from('members')
          .select(`*, kids (*)`)
          .neq('user_id', user.id)
          .eq('onboarding_complete', true)

        if (error) {
          console.error('Error fetching members:', error)
          return
        }

        const local: Match[] = []
        const travel: Match[] = []

          ; (members || []).forEach((member) => {
            const currentYear = new Date().getFullYear()
            const kidsWithAges = (member.kids || []).map((kid: any) => ({
              id: kid.id,
              name: kid.name,
              age: kid.birth_year ? currentYear - kid.birth_year : kid.age || 0,
              interests: kid.interests || [],
            }))

            const displayName = member.first_name || 'A Family'

            const compatibilityReasons: string[] = []
            if (member.looking_for?.includes('nanny_share')) {
              compatibilityReasons.push('Looking for nanny share')
            }
            if (member.looking_for?.includes('care_share')) {
              compatibilityReasons.push('Open to care sharing')
            }
            if (member.looking_for?.includes('backup_care')) {
              compatibilityReasons.push('Available for backup care')
            }

            const connection = (userConnections || []).find(
              (c: Connection) =>
                (c.member_id === currentMember.id && c.connected_member_id === member.id) ||
                (c.connected_member_id === currentMember.id && c.member_id === member.id)
            )

            const match: Match = {
              id: member.id,
              family: {
                id: member.id,
                name: displayName,
                neighborhood: member.location || 'Nearby',
                distance_miles: 0,
                bio: member.bio || '',
                looking_for: member.looking_for || [],
                nanny_share_experience: member.nannyshare_experience || 'new_to_it',
              },
              kids: kidsWithAges,
              compatibility_reasons: compatibilityReasons.length > 0
                ? compatibilityReasons
                : ['New to Opeari'],
              mutual_connections: [],
              is_available_now: member.care_timeline === 'asap',
              is_new: isNewMember(member.created_at),
              is_best_match: false,
              connection_status: connection?.status || null,
              connection_initiated_by_me: connection?.member_id === currentMember.id,
            }

            const memberZipPrefix = member.location?.match(/\d{3}/)?.[0] || ''
            const isLocal = memberZipPrefix === userZipPrefix || memberZipPrefix === ''

            if (isLocal) {
              match.family.distance_miles = Math.round((Math.random() * 3 + 0.2) * 10) / 10
              local.push(match)
            } else {
              match.family.distance_miles = Math.round(Math.random() * 500 + 50)
              travel.push(match)
            }
          })

        if (local.length > 0) {
          local[0].is_best_match = true
        }

        setLocalMatches(local)
        setTravelMatches(travel)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  function isNewMember(createdAt: string): boolean {
    const created = new Date(createdAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return created > weekAgo
  }

  const filterMatches = (matches: Match[]) => {
    return matches.filter(match => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'care_now') return match.is_available_now
      return match.family.looking_for.includes(activeFilter)
    })
  }

  const filteredLocal = filterMatches(localMatches)
  const filteredTravel = filterMatches(travelMatches)

  const allMatches = [...localMatches, ...travelMatches]
  const newFamiliesCount = allMatches.filter(m => m.is_new).length
  const matchingFamiliesCount = localMatches.length
  const availableNowCount = allMatches.filter(m => m.is_available_now).length

  const handleConnect = async (matchId: string) => {
    if (!currentMemberId) {
      setToast({ message: 'Please complete your profile first', type: 'error' })
      return
    }

    try {
      const existingConnection = connections.find(
        c => (c.member_id === currentMemberId && c.connected_member_id === matchId) ||
          (c.connected_member_id === currentMemberId && c.member_id === matchId)
      )

      if (existingConnection) {
        if (existingConnection.status === 'pending' && existingConnection.connected_member_id === currentMemberId) {
          const { error } = await supabase
            .from('connections')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', existingConnection.id)

          if (error) throw error

          setConnections(prev => prev.map(c =>
            c.id === existingConnection.id ? { ...c, status: 'accepted' } : c
          ))
          updateMatchConnectionStatus(matchId, 'accepted')
          setToast({ message: "Connected! You can now see their full profile.", type: 'success' })
        } else {
          setToast({ message: 'Connection request already sent!', type: 'info' })
        }
        return
      }

      const { data, error } = await supabase
        .from('connections')
        .insert({
          member_id: currentMemberId,
          connected_member_id: matchId,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Send email notification
      const { data: recipientData } = await supabase
        .from('members')
        .select('email, first_name')
        .eq('id', matchId)
        .single()

      const { data: senderData } = await supabase
        .from('members')
        .select('first_name')
        .eq('id', currentMemberId)
        .single()

      if (recipientData?.email) {
        try {
          await fetch('/.netlify/functions/send-connection-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientEmail: recipientData.email,
              recipientName: recipientData.first_name || '',
              senderName: senderData?.first_name || 'A family',
            }),
          })
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError)
        }
      }

      setConnections(prev => [...prev, data])
      updateMatchConnectionStatus(matchId, 'pending', true)
      setToast({ message: "Connection request sent! They'll be notified.", type: 'success' })
    } catch (err: any) {
      console.error('Error connecting:', err)
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
    }
  }

  const updateMatchConnectionStatus = (matchId: string, status: string, initiatedByMe = false) => {
    const updateFn = (matches: Match[]) =>
      matches.map(m => m.id === matchId
        ? { ...m, connection_status: status, connection_initiated_by_me: initiatedByMe }
        : m
      )

    setLocalMatches(updateFn)
    setTravelMatches(updateFn)
  }

  const handleSave = (matchId: string) => {
    console.log('Save:', matchId)
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-opeari-bg">
        <div className="max-w-5xl mx-auto px-5 py-5">
          <div className="bg-white rounded-xl px-4 py-3 mb-5">
            <p className="text-[13px] text-opeari-text-secondary">
              {newFamiliesCount > 0 ? (
                <>
                  <span className="font-bold text-opeari-heading">{newFamiliesCount} new {newFamiliesCount === 1 ? 'family' : 'families'}</span> near you this week
                </>
              ) : (
                <span className="text-opeari-text-secondary">Finding families near you...</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
            <div className="space-y-5">
              <CTACards
                matchingFamiliesCount={matchingFamiliesCount}
                availableNowCount={availableNowCount}
              />

              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-opeari-border flex flex-wrap justify-between items-center gap-3">
                  <h2 className="text-base font-bold text-opeari-heading">Your Matches</h2>
                  <FilterPills
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-opeari-text-secondary">
                      <div className="animate-pulse">Finding your matches...</div>
                    </div>
                  ) : filteredLocal.length > 0 ? (
                    filteredLocal.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onConnect={handleConnect}
                        onSave={handleSave}
                        isPreview={match.connection_status !== 'accepted'}
                      />
                    ))
                  ) : localMatches.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-opeari-text-secondary mb-2">No local families found yet.</p>
                      <p className="text-sm text-opeari-text-secondary">
                        Invite friends to grow your village!
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-opeari-text-secondary">
                      No matches found for this filter.
                    </div>
                  )}
                </div>
              </div>

              {travelMatches.length > 0 && (
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-opeari-border">
                    <h2 className="text-base font-bold text-opeari-heading">Travel Matches</h2>
                    <p className="text-[12px] text-opeari-text-secondary mt-1">
                      Families in other areas — great for trips or relocating
                    </p>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredTravel.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onConnect={handleConnect}
                        onSave={handleSave}
                        isPreview={match.connection_status !== 'accepted'}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-opeari-border">
                  <h3 className="text-[14px] font-bold text-opeari-text">Nearby</h3>
                </div>
                <div className="h-[180px] bg-opeari-mint flex items-center justify-center text-opeari-text-secondary text-sm">
                  Map coming soon
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 text-center">
                <h3 className="text-[14px] font-bold text-opeari-heading mb-1">Grow Your Village</h3>
                <p className="text-[12px] text-opeari-text-secondary mb-4 leading-relaxed">
                  Know a family who'd be a great fit? Invite them to Opeari.
                </p>
                <button className="w-full py-2.5 text-[13px] font-bold bg-opeari-mint text-opeari-heading border-2 border-opeari-green rounded-full hover:bg-opeari-green hover:text-white transition-colors">
                  Invite Friends
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[14px] font-bold text-opeari-heading">My Village</h3>
                  <a href="/village" className="text-[11px] font-semibold text-opeari-green hover:underline">
                    View →
                  </a>
                </div>
                <div className="bg-opeari-bg border-2 border-dashed border-opeari-border rounded-xl p-4 text-center">
                  <p className="text-[12px] text-opeari-text-secondary leading-relaxed">
                    Connect with families to start building your trusted village.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}