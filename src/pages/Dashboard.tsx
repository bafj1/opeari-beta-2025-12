import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import SetupJourney from '../components/Dashboard/SetupJourney'

interface Connection {
  id: string
  other_member?: {
    id: string
    first_name: string
    location: string
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const [matchCount, setMatchCount] = useState(0)
  const [availableNow, setAvailableNow] = useState(0)
  const [connections, setConnections] = useState<Connection[]>([])
  const [pendingRequests, setPendingRequests] = useState(0)

  // Setup Journey State
  const [hasProfile, setHasProfile] = useState(false)
  const [hasSentRequests, setHasSentRequests] = useState(false)
  const [daysActive, setDaysActive] = useState(0)
  const [newMemberCount, setNewMemberCount] = useState(0)
  const [hasInvited, setHasInvited] = useState(false)
  const [isSetupMode, setIsSetupMode] = useState(false)

  useEffect(() => {
    async function loadDashboard() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data: member } = await supabase
          .from('members')
          .select('id, first_name, bio, neighborhood, referral_count, created_at')
          .eq('user_id', user.id)
          .single()

        if (!member) {
          setLoading(false)
          return
        }

        setFirstName(member.first_name || 'Neighbor')
        setProfile(member)

        // Calculate Days Active
        const m = member as any
        const createdAt = m.created_at ? new Date(m.created_at) : new Date()
        const diffTime = Math.abs(new Date().getTime() - createdAt.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setDaysActive(diffDays)

        // Check Profile Completion (Bio + Neighborhood)
        setHasProfile(!!(member.bio && member.neighborhood))

        // Check Referrals
        setHasInvited((member.referral_count || 0) > 0)

        // Get match count
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .neq('user_id', user.id)
          .eq('onboarding_complete', true)

        setMatchCount(count || 0)

        // Get available now count
        const { count: availableCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .neq('user_id', user.id)
          .eq('care_timeline', 'asap')

        setAvailableNow(availableCount || 0)

        // Get recent joins (Network Pulse)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: newCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .neq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString())

        setNewMemberCount(newCount || 0)

        // Get connections
        const { data: myConnections } = await supabase
          .from('connections')
          .select('*')
          .or(`member_id.eq.${member.id},connected_member_id.eq.${member.id}`)
          .eq('status', 'accepted')
          .limit(6)

        // Get SENT requests (to verify "Scout" step)
        const { count: sentCount } = await supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .eq('status', 'pending')

        setHasSentRequests((sentCount || 0) > 0)

        if (myConnections && myConnections.length > 0) {
          const otherMemberIds = myConnections.map(c =>
            c.member_id === member.id ? c.connected_member_id : c.member_id
          )

          const { data: otherMembers } = await supabase
            .from('members')
            .select('id, first_name, location')
            .in('id', otherMemberIds)

          const connectionsWithMembers = myConnections.map(c => {
            const otherId = c.member_id === member.id ? c.connected_member_id : c.member_id
            return { ...c, other_member: otherMembers?.find(m => m.id === otherId) }
          })

          setConnections(connectionsWithMembers)
          setIsSetupMode(false) // Has connections, so not in setup mode
        } else {
          setIsSetupMode(true) // No connections, activate setup mode
        }

        // Get pending requests (Incoming)
        const { count: pendingCount } = await supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('connected_member_id', member.id)
          .eq('status', 'pending')

        setPendingRequests(pendingCount || 0)

      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [user])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-primary font-semibold animate-pulse">Loading...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-cream">
        <div className="max-w-5xl mx-auto px-5 py-6">

          {/* Greeting (Only show if NOT in setup mode, or maybe always?) 
              Design Strategy: "The Dashboard IS the Onboarding". 
              SetupJourney has its own header. So hide standard greeting if setup mode.
           */}
          {!isSetupMode && (
            <div className="mb-6">
              <h1 className="text-xl font-bold text-primary mb-2">
                Hey, {firstName}!
              </h1>
              {/* Network Pulse Signal */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-mint/10 border border-mint/20 rounded-full">
                <span className="text-lg">{newMemberCount > 5 ? '🔥' : '🌱'}</span>
                <span className="text-sm font-medium text-primary/80">
                  {newMemberCount > 5
                    ? `${newMemberCount} new families joined recently`
                    : `You are a Pioneer in ${profile?.neighborhood || 'your area'}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Pending Requests Alert */}
          {pendingRequests > 0 && (
            <Link
              to="/connections"
              className="block mb-6 p-4 bg-coral/10 border border-coral/30 rounded-xl hover:bg-coral/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center">
                  <span className="text-coral font-bold">{pendingRequests}</span>
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {pendingRequests} connection {pendingRequests === 1 ? 'request' : 'requests'}
                  </p>
                  <p className="text-sm text-text-secondary">Tap to review</p>
                </div>
              </div>
            </Link>
          )}

          {/* SETUP JOURNEY (Zero Data State) */}
          {isSetupMode ? (
            <SetupJourney
              firstName={firstName}
              hasProfile={hasProfile}
              hasBrowsed={hasSentRequests} // Proxied by "Has Sent Requests"
              hasInvited={hasInvited}
              daysActive={daysActive}
            />
          ) : (
            <>
              {/* Main CTAs - Use standard dashboard if Setup is done */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Link
                  to="/build-your-village"
                  className="bg-white border-2 border-primary rounded-xl p-5 hover:bg-mint hover:-translate-y-0.5 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-mint rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                      <svg className="w-6 h-6 text-primary group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">Find Matches</h3>
                      <p className="text-sm text-text-secondary">{matchCount} families nearby</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/build-your-village?filter=asap"
                  className="bg-white border-2 border-urgent/30 rounded-xl p-5 hover:border-urgent hover:-translate-y-0.5 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-urgent/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-urgent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-urgent">Need Help Now</h3>
                      <p className="text-sm text-text-secondary">{availableNow} available</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* My Village */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex justify-between items-center">
                  <h2 className="font-bold text-primary">My Village</h2>
                  <span className="text-sm text-text-muted">{connections.length} connections</span>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {connections.map(conn => (
                      <Link
                        key={conn.id}
                        to={`/member/${conn.other_member?.id}`}
                        className="text-center group"
                      >
                        <div className="w-14 h-14 bg-mint rounded-full mx-auto mb-2 flex items-center justify-center group-hover:bg-primary transition-colors">
                          <span className="text-lg font-bold text-primary group-hover:text-white transition-colors">
                            {conn.other_member?.first_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-text-primary truncate">
                          {conn.other_member?.first_name || 'Family'}
                        </p>
                      </Link>
                    ))}

                    {/* Add more */}
                    <Link
                      to="/build-your-village"
                      className="text-center group"
                    >
                      <div className="w-14 h-14 border-2 border-dashed border-border rounded-full mx-auto mb-2 flex items-center justify-center group-hover:border-primary transition-colors">
                        <span className="text-xl text-text-muted group-hover:text-primary transition-colors">+</span>
                      </div>
                      <p className="text-sm font-medium text-text-muted group-hover:text-primary transition-colors">
                        Add
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quick Actions Row - Show in Setup Mode too? 
              Strategy: Yes, Invite/Profile/Settings are relevant to setup. Messages maybe not.
              Let's hide Messages if IsSetupMode.
          */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <Link
              to="/invite"
              className="bg-white rounded-xl p-4 border border-border hover:border-primary hover:shadow-sm transition-all text-center"
            >
              <div className="w-10 h-10 bg-mint rounded-lg mx-auto mb-2 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-primary">Invite</p>
            </Link>

            <Link
              to="/profile"
              className="bg-white rounded-xl p-4 border border-border hover:border-primary hover:shadow-sm transition-all text-center"
            >
              <div className="w-10 h-10 bg-mint rounded-lg mx-auto mb-2 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-primary">Profile</p>
            </Link>

            {!isSetupMode && (
              <Link
                to="/messages"
                className="bg-white rounded-xl p-4 border border-border hover:border-primary hover:shadow-sm transition-all text-center"
              >
                <div className="w-10 h-10 bg-mint rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-primary">Messages</p>
              </Link>
            )}

            <Link
              to="/settings"
              className="bg-white rounded-xl p-4 border border-border hover:border-primary hover:shadow-sm transition-all text-center"
            >
              <div className="w-10 h-10 bg-mint rounded-lg mx-auto mb-2 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-primary">Settings</p>
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}