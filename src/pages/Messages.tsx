import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Header from '../components/common/Header'
import { formatLocation } from '../lib/zipLookup'
import { logAlphaEvent } from '../lib/analytics'
import { createNotification } from '../lib/notifications'
import { MessageCircle } from 'lucide-react';

interface Conversation {
  id: string // conversation_id
  other_member_id: string
  other_member_name: string
  other_member_location: string
  last_message: string
  last_message_at: string
  unread_count: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
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
        .eq('id', user.id)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      setMyMemberId(member.id)

      // Get all conversations I am part of
      const { data: allConversations } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          participant_1:members!participant_1(id, first_name, neighborhood),
          participant_2:members!participant_2(id, first_name, neighborhood)
        `)
        .or(`participant_1.eq.${member.id},participant_2.eq.${member.id}`)
        .order('updated_at', { ascending: false })

      if (allConversations) {
        const convList: Conversation[] = []

        for (const conv of allConversations) {
          // Identify the other member
          const p1 = conv.participant_1 as any
          const p2 = conv.participant_2 as any
          const otherMember = p1.id === member.id ? p2 : p1

          if (!otherMember) continue

          // Fetch latest message for preview
          const { data: latestMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Count unread messages (where I am receiver = sender is NOT me, and read_at is null)
          // Since we don't have receiver_id on message, we infer: if sender != me, it's for me.
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', member.id)
            .is('read_at', null)

          convList.push({
            id: conv.id,
            other_member_id: otherMember.id,
            other_member_name: otherMember.first_name || 'Family',
            other_member_location: otherMember.neighborhood || '',
            last_message: latestMsg?.content || 'No messages yet',
            last_message_at: latestMsg?.created_at || conv.updated_at,
            unread_count: unreadCount || 0,
          })
        }

        // Sort by latest activity
        convList.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        setConversations(convList)

        // Handle selected member from URL
        if (selectedMemberId) {
          const existingConv = convList.find(c => c.other_member_id === selectedMemberId)
          if (existingConv) {
            setActiveConversation(existingConv)
          } else {
            // New conversation preview (optimistic)
            const { data: otherMember } = await supabase
              .from('members')
              .select('id, first_name, neighborhood')
              .eq('id', selectedMemberId)
              .single()

            if (otherMember) {
              setActiveConversation({
                id: 'new', // Placeholder
                other_member_id: otherMember.id,
                other_member_name: otherMember.first_name || 'Family',
                other_member_location: otherMember.neighborhood || '',
                last_message: '',
                last_message_at: new Date().toISOString(),
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

      let conversationId = activeConversation.id

      // If it's a new conversation, it might have been created by the other user check
      if (conversationId === 'new') {
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participant_1.eq.${myMemberId},participant_2.eq.${activeConversation.other_member_id}),and(participant_1.eq.${activeConversation.other_member_id},participant_2.eq.${myMemberId})`)
          .single()

        if (existing) {
          conversationId = existing.id
          // Update active conversation IDRef
          setActiveConversation(prev => prev ? ({ ...prev, id: existing.id }) : null)
        } else {
          setMessages([])
          return
        }
      }

      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)

        // Mark as read (set read_at = now where sender != me and read_at is null)
        const unreadMessages = data.filter(m => m.sender_id !== myMemberId && !m.read_at)

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .neq('sender_id', myMemberId)
            .is('read_at', null)

          // Update local state unread count
          setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
          ))
        }
      }
    }

    loadMessages()
  }, [activeConversation?.id, myMemberId]) // Depend on ID to reload if it changes from 'new'

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !myMemberId) return

    setSending(true)
    try {
      let conversationId = activeConversation.id

      // Create conversation if it doesn't exist
      if (conversationId === 'new') {
        // Double check if it exists (race condition)
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participant_1.eq.${myMemberId},participant_2.eq.${activeConversation.other_member_id}),and(participant_1.eq.${activeConversation.other_member_id},participant_2.eq.${myMemberId})`)
          .single()

        if (existing) {
          conversationId = existing.id
        } else {
          // Create new
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              participant_1: myMemberId,
              participant_2: activeConversation.other_member_id
            })
            .select()
            .single()

          if (createError) throw createError
          conversationId = newConv.id

          // Update active conversation state
          setActiveConversation(prev => prev ? ({ ...prev, id: newConv.id }) : null)
        }
      }

      // Insert message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: myMemberId,
          content: newMessage.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // LOG SIGNAL
      logAlphaEvent('chat_initiated', {
        recipientId: activeConversation.other_member_id
      })

      // NOTIFY RECIPIENT (Throttled)
      // Only notify if this is the first message OR last notification was > 5 min ago
      const { data: recentNotif } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('user_id', activeConversation.other_member_id)
        .eq('type', 'message')
        .eq('from_user_id', myMemberId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      if (!recentNotif || recentNotif.created_at < fiveMinAgo) {
        await createNotification({
          userId: activeConversation.other_member_id,
          type: 'message',
          title: 'New message',
          body: `New message from ${(await supabase.auth.getUser()).data.user?.user_metadata?.first_name || 'Neighbor'}`,
          fromUserId: myMemberId,
          link: `/messages/${myMemberId}`,
        });
      }

      // Add to messages list
      setMessages(prev => [...prev, data])
      setNewMessage('')

      // Update conversations list (move to top)
      setConversations(prev => {
        const existing = prev.find(c => c.other_member_id === activeConversation.other_member_id)

        let updatedList: Conversation[]
        if (existing) {
          // Update existing
          updatedList = prev.map(c =>
            c.other_member_id === activeConversation.other_member_id
              ? { ...c, last_message: newMessage.trim(), last_message_at: new Date().toISOString(), id: conversationId }
              : c
          )
        } else {
          // Add new to list
          const newConvItem: Conversation = {
            ...activeConversation,
            id: conversationId,
            last_message: newMessage.trim(),
            last_message_at: new Date().toISOString(),
            unread_count: 0
          }
          updatedList = [...prev, newConvItem]
        }

        return updatedList.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      })

    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return ''
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
        <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center">
          <div className="text-[#1E6B4E] font-semibold animate-pulse" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
            Loading messages...
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#fffaf5]" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex h-[calc(100vh-60px)]">

            {/* Conversations List */}
            <div className={`w-full sm:w-80 bg-white border-r border-[#E5E7EB] flex flex-col ${activeConversation ? 'hidden sm:flex' : 'flex'
              }`}>
              <div className="p-4 border-b border-[#E5E7EB]">
                <h1 className="text-lg font-bold text-[#1E6B4E]">Messages</h1>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.length > 0 ? (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv)
                        navigate(`/messages/${conv.other_member_id}`)
                      }}
                      className={`w-full p-4 flex items-start gap-3 transition-all rounded-xl hover:bg-[#f0faf6] text-left ${activeConversation?.other_member_id === conv.other_member_id
                        ? 'bg-[#f0faf6]'
                        : 'bg-white'
                        }`}
                    >
                      <div className="w-12 h-12 bg-[#8bd7c7]/20 rounded-full flex items-center justify-center flex-shrink-0 text-[#1E6B4E]">
                        <span className="text-lg font-bold">
                          {conv.other_member_name?.charAt(0) || 'F'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`truncate ${conv.unread_count > 0 ? 'font-bold text-[#1E6B4E]' : 'font-semibold text-[#1E6B4E]'}`}>
                            {conv.other_member_name}
                          </h3>
                          <span className="text-xs text-[#546E5C] flex-shrink-0">
                            {conv.last_message_at && formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-semibold text-[#1E6B4E]' : 'text-[#546E5C]'}`}>
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="w-2.5 h-2.5 bg-[#E07A5F] rounded-full ml-2 flex-shrink-0 self-center" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center flex flex-col items-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="font-semibold text-[#1E6B4E] mb-1">No messages yet</h3>
                    <p className="text-sm text-[#546E5C] mb-6">
                      Connect with families to start chatting
                    </p>
                    <Link
                      to="/village"
                      className="inline-block px-5 py-2.5 bg-[#8bd7c7] text-[#1E6B4E] font-bold rounded-full text-sm hover:bg-[#79c9b8] transition-colors"
                    >
                      Browse Your Village
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Chat View */}
            <div className={`flex-1 flex flex-col bg-[#fffaf5] ${activeConversation ? 'flex' : 'hidden sm:flex'
              }`}>
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-[#E5E7EB] p-4 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setActiveConversation(null)
                        navigate('/messages')
                      }}
                      className="sm:hidden p-1 text-[#546E5C] hover:text-[#1E6B4E]"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <Link
                      to={`/member/${activeConversation.other_member_id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 bg-[#8bd7c7]/20 rounded-full flex items-center justify-center text-[#1E6B4E]">
                        <span className="font-bold">
                          {activeConversation.other_member_name?.charAt(0) || 'F'}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-bold text-[#1E6B4E]">
                          {activeConversation.other_member_name}'s Family
                        </h2>
                        <p className="text-xs text-[#546E5C]">
                          {formatLocation(activeConversation.other_member_location)}
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fffaf5]">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-[#546E5C]">
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
                              ? 'bg-[#1E6B4E] text-white rounded-br-md shadow-sm'
                              : 'bg-white text-[#1E6B4E] border border-gray-100 rounded-bl-md shadow-sm'
                              }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-[10px] mt-1 text-right ${msg.sender_id === myMemberId ? 'text-white/70' : 'text-[#8bd7c7]'
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
                  <form onSubmit={handleSend} className="bg-white border-t border-[#E5E7EB] p-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 bg-[#f0faf6] border border-[#8bd7c7]/30 rounded-full focus:outline-none focus:border-[#8bd7c7] focus:ring-1 focus:ring-[#8bd7c7] text-[#1E6B4E] placeholder:text-[#546E5C]/60"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-2.5 bg-[#8bd7c7] text-[#1E6B4E] font-bold rounded-full hover:bg-[#79c9b8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? '...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-[#fffaf5]">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="font-semibold text-[#1E6B4E] mb-1">Select a conversation</h3>
                    <p className="text-sm text-[#546E5C]">
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