import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Toast from '../components/ui/Toast'

interface WaitlistEntry {
    id: string
    created_at: string
    first_name: string
    last_name: string
    email: string
    user_type: string
    status: string
    referral_source: string
}

export default function AdminWaitlist() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
    const [processing, setProcessing] = useState<string | null>(null)
    const [secret, setSecret] = useState('')
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

    useEffect(() => {
        const stored = sessionStorage.getItem('adminWaitlistSecret')
        if (stored) {
            setSecret(stored)
        } else {
            const input = window.prompt('Enter NETLIFY_ADMIN_SECRET:')
            if (input) {
                setSecret(input)
                sessionStorage.setItem('adminWaitlistSecret', input)
            } else {
                window.location.href = '/' // Redirect if cancelled
            }
        }
    }, [])

    const fetchEntries = async () => {
        if (!secret) return // Don't fetch until we have a secret

        setLoading(true)
        try {
            const res = await fetch('/.netlify/functions/get-waitlist', {
                headers: { 'x-admin-secret': secret }
            })
            if (res.status === 401) {
                setToast({ message: 'Unauthorized. Check secret.', type: 'error' })
                sessionStorage.removeItem('adminWaitlistSecret')
                setTimeout(() => window.location.reload(), 2000)
                return
            }
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setEntries(data || [])
        } catch (err) {
            console.error('Error fetching waitlist:', err)
            // setToast({ message: 'Error fetching data', type: 'error' })
        }
        setLoading(false)
    }

    useEffect(() => {
        if (secret) fetchEntries()
    }, [secret])

    const handleApprove = async (id: string) => {
        setProcessing(id)
        try {
            const res = await fetch('/.netlify/functions/approve-waitlist-user', {
                method: 'POST',
                headers: { 'x-admin-secret': secret },
                body: JSON.stringify({ id })
            })
            const data = await res.json()

            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to approve')
            }

            // Optimistic update
            setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e))
            setToast({ message: 'User approved!', type: 'success' })
        } catch (err: any) {
            setToast({ message: 'Error approving: ' + err.message, type: 'error' })
        }
        setProcessing(null)
    }

    const filteredEntries = entries.filter(e => {
        if (filter === 'all') return true
        if (filter === 'pending') return e.status === 'pending' || !e.status // Treat null as pending
        return e.status === filter
    })

    // Simple styling reusing existing colors
    return (
        <div className="min-h-screen bg-[#fffaf5] p-8 font-[Comfortaa] text-[#1e6b4e]">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Waitlist Admin</h1>
                        <p className="text-[#527a6a]">Manage and approve waitlist applicants.</p>
                    </div>
                    <Link to="/" className="text-sm underline hover:text-[#154a36]">Back to Home</Link>
                </header>

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {(['pending', 'approved', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-bold capitalize transition-colors ${filter === f
                                ? 'bg-[#1e6b4e] text-white'
                                : 'bg-white border border-[#c8e6d9] text-[#527a6a] hover:bg-[#d8f5e5]'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#c8e6d9] overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-[#527a6a]">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#f0f9f4] text-[#1e6b4e] font-bold border-b border-[#c8e6d9]">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Source</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f9f4]">
                                    {filteredEntries.map(entry => (
                                        <tr key={entry.id} className="hover:bg-[#fafdfb]">
                                            <td className="p-4 text-[#527a6a]">
                                                {new Date(entry.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-semibold">
                                                {entry.first_name} {entry.last_name}
                                            </td>
                                            <td className="p-4 text-[#527a6a]">{entry.email}</td>
                                            <td className="p-4 capitalize">{entry.user_type}</td>
                                            <td className="p-4 text-[#8faaaa]">{entry.referral_source}</td>
                                            <td className="p-4">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${entry.status === 'approved'
                                                    ? 'bg-[#d8f5e5] text-[#1e6b4e]'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {entry.status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {entry.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleApprove(entry.id)}
                                                        disabled={!!processing}
                                                        className="bg-[#1e6b4e] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#154a36] disabled:opacity-50"
                                                    >
                                                        {processing === entry.id ? '...' : 'Approve'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredEntries.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-[#8faaaa]">
                                                No entries found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
