import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import { formatLocation } from '../lib/zipLookup'
import { logAlphaEvent } from '../lib/analytics'

interface Conversation {
  id: string
  other_member_id: string
  other_member_name: string
  other_member_location: string
  last_message: string
  last_message_at: string
  unread_count: number
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read: boolean
}

export default function Messages() {
  const { id: selectedMemberId } = useParams<{ id?: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [myMemberId, setMyMemberId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      if (!user) return

      // Get my member ID
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

      // Get all messages to/from me
      const { data: allMessages } = await supabase
        .from('messages')
        .select('*, sender:members!sender_id(id, first_name, location), receiver:members!receiver_id(id, first_name, location)')
        .or(`sender_id.eq.${member.id},receiver_id.eq.${member.id}`)
        .order('created_at', { ascending: false })

      if (allMessages) {
        // Group by conversation partner
        const conversationMap = new Map<string, Conversation>()

        for (const msg of allMessages) {
          const otherMember = msg.sender_id === member.id ? msg.receiver : msg.sender
          const otherMemberId = otherMember?.id

          if (!otherMemberId) continue

          if (!conversationMap.has(otherMemberId)) {
            // Count unread
            const unreadCount = allMessages.filter(
              m => m.sender_id === otherMemberId && m.receiver_id === member.id && !m.read
            ).length

            conversationMap.set(otherMemberId, {
              id: otherMemberId,
              other_member_id: otherMemberId,
              other_member_name: otherMember?.first_name || 'Family',
              other_member_location: otherMember?.location || '',
              last_message: msg.content,
              last_message_at: msg.created_at,
              unread_count: unreadCount,
            })
          }
        }

        const convList = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())

        setConversations(convList)

        // If a member ID is in URL, set that conversation active
        if (selectedMemberId) {
          const conv = convList.find(c => c.other_member_id === selectedMemberId)
          if (conv) {
            setActiveConversation(conv)
          } else {
            // Start new conversation - get member info
            const { data: otherMember } = await supabase
              .from('members')
              .select('id, first_name, location')
              .eq('id', selectedMemberId)
              .single()

            if (otherMember) {
              setActiveConversation({
                id: otherMember.id,
                other_member_id: otherMember.id,
                other_member_name: otherMember.first_name || 'Family',
                other_member_location: otherMember.location || '',
                last_message: '',
                last_message_at: '',
                unread_count: 0,
              })
            }
          }
        }
      }

      setLoading(false)
    }

    loadConversations()
  }, [user, selectedMemberId])

  // Load messages for active conversation
  useEffect(() => {
    async function loadMessages() {
      if (!activeConversation || !myMemberId) return

      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${myMemberId},receiver_id.eq.${activeConversation.other_member_id}),and(sender_id.eq.${activeConversation.other_member_id},receiver_id.eq.${myMemberId})`)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)

        // Mark as read
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('sender_id', activeConversation.other_member_id)
          .eq('receiver_id', myMemberId)
          .eq('read', false)

        // Update unread count in conversations list
        setConversations(prev => prev.map(c =>
          c.other_member_id === activeConversation.other_member_id
            ? { ...c, unread_count: 0 }
            : c
        ))
      }
    }

    loadMessages()
  }, [activeConversation, myMemberId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !myMemberId) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: myMemberId,
          receiver_id: activeConversation.other_member_id,
          content: newMessage.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // LOG SIGNAL
      logAlphaEvent('chat_initiated', {
        recipientId: activeConversation.other_member_id
      })

      // Add to messages
      setMessages(prev => [...prev, data])
      setNewMessage('')

      // Update conversations list
      setConversations(prev => {
        const updated = prev.map(c =>
          c.other_member_id === activeConversation.other_member_id
            ? { ...c, last_message: newMessage.trim(), last_message_at: new Date().toISOString() }
            : c
        )
        // Move to top
        updated.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        return updated
      })
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-opeari-bg flex items-center justify-center">
          <div className="text-opeari-heading font-semibold animate-pulse">Loading messages...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-opeari-bg">
        <div className="max-w-5xl mx-auto">
          <div className="flex h-[calc(100vh-60px)]">

            {/* Conversations List */}
            <div className={`w-full sm:w-80 bg-white border-r border-opeari-border flex flex-col ${activeConversation ? 'hidden sm:flex' : 'flex'
              }`}>
              <div className="p-4 border-b border-opeari-border">
                <h1 className="text-lg font-bold text-opeari-heading">Messages</h1>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length > 0 ? (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv)
                        navigate(`/messages/${conv.other_member_id}`)
                      }}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-opeari-bg transition-colors text-left ${activeConversation?.other_member_id === conv.other_member_id ? 'bg-opeari-mint' : ''
                        }`}
                    >
                      <div className="w-12 h-12 bg-opeari-mint rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-opeari-heading">
                          {conv.other_member_name?.charAt(0) || 'F'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-opeari-heading truncate">
                            {conv.other_member_name}
                          </h3>
                          <span className="text-xs text-opeari-text-secondary flex-shrink-0">
                            {conv.last_message_at && formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <p className="text-sm text-opeari-text-secondary truncate">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 bg-opeari-coral text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-opeari-mint rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-opeari-heading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-opeari-text mb-1">No messages yet</h3>
                    <p className="text-sm text-opeari-text-secondary mb-4">
                      Connect with families to start chatting
                    </p>
                    <Link
                      to="/build-your-village"
                      className="inline-block px-4 py-2 bg-opeari-green text-white font-semibold rounded-full text-sm"
                    >
                      Find families
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Chat View */}
            <div className={`flex-1 flex flex-col bg-opeari-bg ${activeConversation ? 'flex' : 'hidden sm:flex'
              }`}>
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-opeari-border p-4 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveConversation(null)
                        navigate('/messages')
                      }}
                      className="sm:hidden p-1 text-opeari-text-secondary hover:text-opeari-heading"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <Link
                      to={`/member/${activeConversation.other_member_id}`}
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <div className="w-10 h-10 bg-opeari-mint rounded-full flex items-center justify-center">
                        <span className="font-bold text-opeari-heading">
                          {activeConversation.other_member_name?.charAt(0) || 'F'}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-semibold text-opeari-heading">
                          {activeConversation.other_member_name}'s Family
                        </h2>
                        <p className="text-xs text-opeari-text-secondary">
                          {formatLocation(activeConversation.other_member_location)}
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-opeari-text-secondary">
                          Start the conversation with {activeConversation.other_member_name}!
                        </p>
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === myMemberId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${msg.sender_id === myMemberId
                              ? 'bg-opeari-green text-white rounded-br-md'
                              : 'bg-white text-opeari-text rounded-bl-md'
                              }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender_id === myMemberId ? 'text-white/70' : 'text-opeari-text-secondary'
                              }`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSend} className="bg-white border-t border-opeari-border p-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 border-2 border-opeari-border rounded-full focus:outline-none focus:border-opeari-green"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-2.5 bg-opeari-green text-white font-semibold rounded-full hover:bg-opeari-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? '...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-opeari-mint rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-10 h-10 text-opeari-heading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-text-primary">Select a conversation</h3>
                    <p className="text-sm text-opeari-text-secondary">
                      Choose a conversation from the list
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}