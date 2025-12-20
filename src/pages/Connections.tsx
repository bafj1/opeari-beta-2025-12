import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import Toast from '../components/common/Toast'
import { formatLocation } from '../lib/zipLookup'

interface ConnectionRequest {
  id: string
  member_id: string
  connected_member_id: string
  status: string
  created_at: string
  member: {
    id: string
    first_name: string
    location: string
    tagline: string
    nanny_situation: string
  }
}

interface AcceptedConnection {
  id: string
  other_member: {
    id: string
    first_name: string
    location: string
  }
  connected_at: string
}

export default function Connections() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [_, setMyMemberId] = useState('')
  const [pendingReceived, setPendingReceived] = useState<ConnectionRequest[]>([])
  const [pendingSent, setPendingSent] = useState<ConnectionRequest[]>([])
  const [accepted, setAccepted] = useState<AcceptedConnection[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    async function loadConnections() {
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      setMyMemberId(member.id)

      // Get pending requests received (others want to connect with me)
      const { data: received } = await supabase
        .from('connections')
        .select('*, member:members!member_id(id, first_name, location, tagline, nanny_situation)')
        .eq('connected_member_id', member.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (received) {
        setPendingReceived(received as ConnectionRequest[])
      }

      // Get pending requests sent (I want to connect with others)
      const { data: sent } = await supabase
        .from('connections')
        .select('*, member:members!connected_member_id(id, first_name, location, tagline, nanny_situation)')
        .eq('member_id', member.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (sent) {
        setPendingSent(sent as ConnectionRequest[])
      }

      // Get accepted connections
      const { data: connections } = await supabase
        .from('connections')
        .select('*')
        .or(`member_id.eq.${member.id},connected_member_id.eq.${member.id}`)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false })

      if (connections) {
        const otherMemberIds = connections.map(c =>
          c.member_id === member.id ? c.connected_member_id : c.member_id
        )

        const { data: members } = await supabase
          .from('members')
          .select('id, first_name, location')
          .in('id', otherMemberIds)

        const acceptedWithMembers = connections.map(c => {
          const otherId = c.member_id === member.id ? c.connected_member_id : c.member_id
          return {
            id: c.id,
            other_member: members?.find(m => m.id === otherId) || { id: otherId, first_name: 'Family', location: '' },
            connected_at: c.updated_at,
          }
        })

        setAccepted(acceptedWithMembers)
      }

      setLoading(false)
    }

    loadConnections()
  }, [user])

  const handleAccept = async (connectionId: string) => {
    setProcessing(connectionId)
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', connectionId)

      if (error) throw error

      // Move from pending to accepted
      const request = pendingReceived.find(r => r.id === connectionId)
      if (request) {
        setPendingReceived(prev => prev.filter(r => r.id !== connectionId))
        setAccepted(prev => [{
          id: connectionId,
          other_member: {
            id: request.member.id,
            first_name: request.member.first_name,
            location: request.member.location,
          },
          connected_at: new Date().toISOString(),
        }, ...prev])
      }

      setToast({ message: 'Connection accepted!', type: 'success' })
    } catch (err) {
      console.error('Error accepting:', err)
      setToast({ message: 'Failed to accept', type: 'error' })
    } finally {
      setProcessing(null)
    }
  }

  const handleDecline = async (connectionId: string) => {
    setProcessing(connectionId)
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'declined' })
        .eq('id', connectionId)

      if (error) throw error

      setPendingReceived(prev => prev.filter(r => r.id !== connectionId))
      setToast({ message: 'Request declined', type: 'success' })
    } catch (err) {
      console.error('Error declining:', err)
      setToast({ message: 'Failed to decline', type: 'error' })
    } finally {
      setProcessing(null)
    }
  }

  const handleCancel = async (connectionId: string) => {
    setProcessing(connectionId)
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId)

      if (error) throw error

      setPendingSent(prev => prev.filter(r => r.id !== connectionId))
      setToast({ message: 'Request cancelled', type: 'success' })
    } catch (err) {
      console.error('Error cancelling:', err)
      setToast({ message: 'Failed to cancel', type: 'error' })
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

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
        <div className="max-w-3xl mx-auto px-5 py-6">

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-primary">Connections</h1>
            <Link
              to="/dashboard"
              className="text-sm text-text-secondary hover:text-primary"
            >
              ← Back
            </Link>
          </div>

          {/* Pending Received */}
          {pendingReceived.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-coral rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {pendingReceived.length}
                </span>
                Requests for You
              </h2>
              <div className="space-y-3">
                {pendingReceived.map(request => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl border-2 border-coral/30 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <Link
                        to={`/member/${request.member.id}`}
                        className="w-14 h-14 bg-mint rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary transition-colors group"
                      >
                        <span className="text-xl font-bold text-primary group-hover:text-white">
                          {request.member.first_name?.charAt(0) || 'F'}
                        </span>
                      </Link>
                      <div className="flex-1">
                        <Link
                          to={`/member/${request.member.id}`}
                          className="font-bold text-primary hover:underline"
                        >
                          {request.member.first_name}'s Family
                        </Link>
                        <p className="text-sm text-text-secondary">
                          {formatLocation(request.member.location)}
                        </p>
                        {request.member.tagline && (
                          <p className="text-sm text-text-secondary mt-1 italic">
                            "{request.member.tagline}"
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-2">
                          Sent {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={processing === request.id}
                        className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        {processing === request.id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDecline(request.id)}
                        disabled={processing === request.id}
                        className="flex-1 py-2.5 bg-white text-text-secondary font-semibold rounded-full border-2 border-border hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Sent */}
          {pendingSent.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-text-secondary mb-4">
                Awaiting Response
                <span className="text-sm font-normal text-text-muted ml-2">
                  ({pendingSent.length})
                </span>
              </h2>
              <div className="space-y-3">
                {pendingSent.map(request => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <Link
                        to={`/member/${request.member.id}`}
                        className="w-12 h-12 bg-cream rounded-full flex items-center justify-center flex-shrink-0 hover:bg-mint transition-colors"
                      >
                        <span className="text-lg font-bold text-text-secondary">
                          {request.member.first_name?.charAt(0) || 'F'}
                        </span>
                      </Link>
                      <div className="flex-1">
                        <Link
                          to={`/member/${request.member.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {request.member.first_name}'s Family
                        </Link>
                        <p className="text-sm text-text-secondary">
                          {formatLocation(request.member.location)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancel(request.id)}
                        disabled={processing === request.id}
                        className="px-4 py-1.5 text-sm text-text-muted hover:text-red-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Connections */}
          <div>
            <h2 className="text-lg font-bold text-primary mb-4">
              Your Village
              <span className="text-sm font-normal text-text-muted ml-2">
                ({accepted.length} connections)
              </span>
            </h2>

            {accepted.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accepted.map(conn => (
                  <div
                    key={conn.id}
                    className="bg-white rounded-xl border border-border p-4 flex items-center gap-4"
                  >
                    <Link
                      to={`/member/${conn.other_member.id}`}
                      className="w-12 h-12 bg-mint rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary transition-colors group"
                    >
                      <span className="text-lg font-bold text-primary group-hover:text-white">
                        {conn.other_member.first_name?.charAt(0) || 'F'}
                      </span>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/member/${conn.other_member.id}`}
                        className="font-semibold text-primary hover:underline block truncate"
                      >
                        {conn.other_member.first_name}'s Family
                      </Link>
                      <p className="text-sm text-text-secondary truncate">
                        {formatLocation(conn.other_member.location)}
                      </p>
                    </div>
                    <Link
                      to={`/messages/${conn.other_member.id}`}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-mint rounded-full transition-colors"
                      title="Message"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <div className="w-16 h-16 bg-mint rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="font-semibold text-text-primary mb-1">Your village starts here</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Connect with local families to swap care.
                </p>
                <Link
                  to="/build-your-village"
                  className="inline-block px-6 py-2.5 bg-primary text-white font-semibold rounded-full text-sm"
                >
                  Find Local Families
                </Link>
              </div>
            )}
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