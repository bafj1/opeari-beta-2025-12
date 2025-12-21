import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const logoImg = '/logo.svg'

interface WaitlistEntry {
    id: string
    created_at: string
    email: string
    first_name: string
    last_name: string
    zip_code: string
    role: string            // 'family' | 'caregiver' | 'both'
    status?: 'approved' | 'rejected' | 'pending'
    position?: number
    hear_about_us?: string  // 'friend', 'social_media', etc
    referred_by?: string    // Contains the Name (e.g. "Breada")
    linkedin_url?: string
    looking_for?: string[]  // Contains "Why Join" reason
    urgency?: string
}

export default function AdminWaitlist() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
    const [secret, setSecret] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authError, setAuthError] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Check session on mount
    useEffect(() => {
        const storedSecret = sessionStorage.getItem('admin_secret')
        if (storedSecret) {
            setSecret(storedSecret)
            fetchEntries(storedSecret)
        }
    }, [])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        fetchEntries(secret)
    }

    const fetchEntries = async (adminSecret: string) => {
        setLoading(true)
        setAuthError('')
        try {
            const response = await fetch('/.netlify/functions/get-waitlist', {
                headers: { 'x-admin-secret': adminSecret }
            })

            if (response.status === 401) {
                setAuthError('Invalid Secret')
                setIsAuthenticated(false)
                sessionStorage.removeItem('admin_secret')
            } else if (response.ok) {
                const data = await response.json()
                setIsAuthenticated(true)
                sessionStorage.setItem('admin_secret', adminSecret)

                // Sort: Oldest first (to determine queue position)
                // Then reverse for display (newest first)
                const rawData = data || []
                const sortedByDate = [...rawData].sort((a: any, b: any) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )

                const withPositions = sortedByDate.map((entry: any, index: number) => ({
                    ...entry,
                    position: index + 1
                }))

                const dashboardView = withPositions.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )

                setEntries(dashboardView)
            } else {
                throw new Error('Failed to fetch')
            }
        } catch (err) {
            console.error(err)
            setAuthError('Error connecting to server')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (entry: WaitlistEntry) => {
        if (!confirm(`Approve ${entry.first_name}? This will send them an invite email.`)) return

        try {
            const res = await fetch('/.netlify/functions/approve-waitlist-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': secret
                },
                body: JSON.stringify({
                    id: entry.id,
                    email: entry.email,
                    firstName: entry.first_name
                })
            })

            if (res.ok) {
                alert('User Approved & Email Sent!')
                fetchEntries(secret) // Refresh
            } else {
                alert('Approval failed')
            }
        } catch (err) {
            console.error(err)
            alert('Error approving user')
        }
    }

    const handleReject = async (entry: WaitlistEntry) => {
        if (!confirm(`Reject ${entry.first_name}?`)) return

        try {
            const res = await fetch('/.netlify/functions/reject-waitlist-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': secret
                },
                body: JSON.stringify({ id: entry.id })
            })

            if (res.ok) {
                fetchEntries(secret)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const toggleRow = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null)
        } else {
            setExpandedId(id)
        }
    }

    // Helper to format Role/Type
    const formatRole = (role: string) => {
        switch (role) {
            case 'family': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">Find Care</span>
            case 'caregiver': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Give Care</span>
            case 'both': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">Both</span>
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{role}</span>
        }
    }

    // Helper to format Referral
    const formatReferral = (source?: string, name?: string) => {
        if (!source && !name) {
            return (
                <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                    No referral
                </span>
            )
        }

        // Handle "No Referral" explicit value if DB stores it that way
        if (source === 'no_referral' || source === '') {
            return (
                <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                    No referral
                </span>
            )
        }

        let label = source?.replace(/_/g, ' ') || 'Unknown'// e.g. social_media -> social media
        if (label === 'friend') label = 'Friend'
        if (label === 'parent group') label = 'Parent Grp'
        if (label === 'referral code') label = 'Code' // if source was 'referral_code'
        if (label === 'search') label = 'Google'

        return (
            <div className="flex flex-col text-xs">
                <span className="font-semibold text-text-muted capitalize">{label}</span>
                {name && <span className="text-primary italic">Referred by: {name}</span>}
            </div>
        )
    }

    const filteredEntries = filter === 'all'
        ? entries
        : entries.filter(e => (e.status || 'pending') === filter)

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center p-4">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#c8e6d9]">
                    <div className="flex justify-center mb-6">
                        <img src={logoImg} alt="Opeari" className="h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1e6b4e] mb-6 text-center">Admin Access</h2>
                    {authError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{authError}</div>}
                    <input
                        type="password"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        placeholder="Enter Admin Secret"
                        className="w-full p-3 border border-[#c8e6d9] rounded-lg mb-4 focus:ring-2 focus:ring-[#1e6b4e] focus:outline-none"
                        autoFocus
                    />
                    <button type="submit" disabled={loading} className="w-full bg-[#1e6b4e] text-white py-3 rounded-lg font-bold hover:bg-[#154a36] transition-colors">
                        {loading ? 'Verifying...' : 'Login'}
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fffaf5] p-8 max-md:p-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/"><img src={logoImg} alt="Opeari" className="h-10" /></Link>
                        <h1 className="text-2xl font-bold text-[#1e6b4e]">Waitlist Admin</h1>
                    </div>
                    <div className="flex gap-2">
                        {['pending', 'approved', 'rejected', 'all'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${filter === f
                                        ? 'bg-[#1e6b4e] text-white'
                                        : 'bg-white text-[#527a6a] hover:bg-[#d8f5e5]'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('admin_secret')
                                setIsAuthenticated(false)
                                setSecret('')
                            }}
                            className="ml-4 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#eef6f6] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f0faf4] border-b border-[#eef6f6]">
                                <tr>
                                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">#</th>
                                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Date</th>
                                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Name</th>
                                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Email</th>
                                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Zip</th>
                                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Type</th>
                                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Referral</th>
                                    <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eef6f6]">
                                {filteredEntries.map((entry) => (
                                    <>
                                        <tr
                                            key={entry.id}
                                            className={`transition-colors cursor-pointer ${entry.status === 'rejected' ? 'bg-gray-50 opacity-60' : 'hover:bg-[#fcfdfd]'} ${expandedId === entry.id ? 'bg-[#f0faf4]' : ''}`}
                                            onClick={() => toggleRow(entry.id)}
                                        >
                                            <td className="p-4 text-primary font-bold">#{entry.position}</td>
                                            <td className="p-4 text-text-muted text-sm whitespace-nowrap">
                                                <div className="font-bold">{new Date(entry.created_at).toLocaleDateString()}</div>
                                                <div className="text-xs opacity-70">{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="p-4 font-medium text-primary">
                                                {entry.first_name} {entry.last_name}
                                                {entry.status === 'approved' && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase tracking-wider font-bold">Approved</span>}
                                            </td>
                                            <td className="p-4 text-text-muted text-sm">{entry.email}</td>
                                            <td className="p-4 text-text-muted text-sm font-mono">{entry.zip_code}</td>
                                            <td className="p-4">
                                                {formatRole(entry.role)}
                                            </td>
                                            <td className="p-4">
                                                {formatReferral(entry.hear_about_us, entry.referred_by)}
                                            </td>
                                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                {(!entry.status || entry.status === 'pending') && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleReject(entry)}
                                                            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(entry)}
                                                            className="px-3 py-1.5 text-xs font-bold text-white bg-[#1e6b4e] hover:bg-[#154a36] rounded-md transition-colors shadow-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                )}
                                                {entry.status === 'approved' && (
                                                    <button onClick={() => handleApprove(entry)} className="text-xs text-text-muted hover:underline">Resend Invite</button>
                                                )}
                                                {entry.status === 'rejected' && (
                                                    <span className="text-xs text-red-400 italic">Rejected</span>
                                                )}
                                            </td>
                                        </tr>
                                        {/* Expandable Detail Row */}
                                        {expandedId === entry.id && (
                                            <tr className="bg-[#f8fdfb]">
                                                <td colSpan={8} className="p-0">
                                                    <div className="p-6 grid grid-cols-3 gap-8 text-sm animate-in slide-in-from-top-1 duration-200 border-b border-[#eef6f6]">
                                                        <div>
                                                            <h4 className="font-bold text-[#1e6b4e] mb-2 uppercase tracking-wider text-xs">Application Details</h4>
                                                            <div className="mb-2">
                                                                <span className="text-text-muted inline-block w-20">Timeline:</span>
                                                                <span className={`font-medium ${!entry.urgency ? 'text-gray-400 italic' : ''}`}>
                                                                    {entry.urgency || 'Not provided'}
                                                                </span>
                                                            </div>
                                                            <div className="mb-2">
                                                                <div className="text-text-muted mb-1">Why Join:</div>
                                                                {entry.looking_for && entry.looking_for[0] ? (
                                                                    <p className="p-3 bg-white border border-[#eef6f6] rounded-lg text-gray-700 italic text-xs leading-relaxed">
                                                                        "{entry.looking_for[0]}"
                                                                    </p>
                                                                ) : (
                                                                    <span className="text-gray-400 italic text-xs">Not provided</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-[#1e6b4e] mb-2 uppercase tracking-wider text-xs">Verify Identity</h4>
                                                            <div className="mb-2">
                                                                {entry.linkedin_url ? (
                                                                    <a href={entry.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.784 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                                                        View LinkedIn Profile
                                                                    </a>
                                                                ) : (
                                                                    <div className="text-gray-400 italic flex items-center gap-1">
                                                                        <svg className="w-4 h-4 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.784 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                                                        No LinkedIn provided
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-4"><span className="text-text-muted">Referral ID:</span> <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded select-all">{entry.id.split('-')[0]}...</span></div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-[#1e6b4e] mb-2 uppercase tracking-wider text-xs">Admin Actions</h4>
                                                            <div className="flex flex-col gap-2">
                                                                <button onClick={() => handleApprove(entry)} className="text-left px-3 py-2 bg-gray-50 hover:bg-green-50 text-green-700 rounded transition-colors text-xs font-bold border border-transparent hover:border-green-200">
                                                                    Currently: {entry.status ? entry.status.toUpperCase() : 'PENDING'}
                                                                </button>
                                                                <div className="text-xs text-gray-400 mt-2">
                                                                    Joined: {new Date(entry.created_at).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                                {filteredEntries.length === 0 && (
                                    <tr><td colSpan={8} className="p-8 text-center text-[#8faaaa]">No entries found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
