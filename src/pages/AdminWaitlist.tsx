
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
    // Enriched on frontend
    position?: number
}

export default function AdminWaitlist() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
    const [processing, setProcessing] = useState<string | null>(null)
    const [secret, setSecret] = useState('')
    const [inputSecret, setInputSecret] = useState('')
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

    // On mount, check if secret is already stored
    useEffect(() => {
        const stored = sessionStorage.getItem('adminWaitlistSecret')
        if (stored) {
            setSecret(stored)
        }
    }, [])

    // Fetch when secret is present
    useEffect(() => {
        if (secret) {
            fetchEntries()
        }
    }, [secret])

    const fetchEntries = async () => {
        setLoading(true)
        try {
            const res = await fetch('/.netlify/functions/get-waitlist', {
                headers: { 'x-admin-secret': secret, 'Cache-Control': 'no-cache' }
            })
            if (res.status === 401) {
                setToast({ message: 'Incorrect Secret. Please try again.', type: 'error' })
                setSecret('')
                sessionStorage.removeItem('adminWaitlistSecret')
                setLoading(false)
                return
            }
            if (!res.ok) throw new Error('Failed to fetch')
            const rawData = await res.json() || []

            // Calculate "Queue Position" based on absolute Join Date (Oldest = #1)
            // We sort by date ascending first
            const sortedByDate = [...rawData].sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )

            // Assign positions (1-based)
            const withPositions = sortedByDate.map((entry, index) => ({
                ...entry,
                position: index + 1
            }))

            // Sort by newest first for the Dashboard View (so you see new requests at top)
            const dashboardView = withPositions.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            setEntries(dashboardView)
        } catch (err) {
            console.error('Error fetching waitlist:', err)
            // setToast({ message: 'Error fetching data', type: 'error' })
        }
        setLoading(false)
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputSecret) return
        setSecret(inputSecret)
        sessionStorage.setItem('adminWaitlistSecret', inputSecret)
    }

    const handleApprove = async (entry: WaitlistEntry) => {
        if (!confirm(`Approve ${entry.first_name}? This will SEND the Welcome Email.`)) return

        setProcessing(entry.id)
        try {
            const res = await fetch('/.netlify/functions/approve-waitlist-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': secret
                },
                body: JSON.stringify({ id: entry.id, email: entry.email, firstName: entry.first_name })
            })

            const data = await res.json()

            if (res.ok && data.ok) {
                setToast({ message: `Approved ${entry.first_name}! Email sent.`, type: 'success' })
                fetchEntries()
            } else {
                throw new Error(data.error || 'Failed to approve')
            }
        } catch (err: any) {
            console.error('Approval error:', err)
            setToast({ message: err.message || 'Error approving user', type: 'error' })
        }
        setProcessing(null)
    }

    const handleReject = async (entry: WaitlistEntry) => {
        if (!confirm(`Reject ${entry.first_name}? Status will change to 'rejected'. No email sent.`)) return

        setProcessing(entry.id)
        try {
            const res = await fetch('/.netlify/functions/reject-waitlist-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': secret
                },
                body: JSON.stringify({ id: entry.id })
            })

            const data = await res.json()

            if (res.ok && data.ok) {
                setToast({ message: `Marked ${entry.first_name} as Rejected.`, type: 'info' })
                fetchEntries()
            } else {
                throw new Error(data.error || 'Failed to reject')
            }
        } catch (err: any) {
            console.error('Reject error:', err)
            setToast({ message: err.message || 'Error rejecting user', type: 'error' })
        }
        setProcessing(null)
    }

    const filteredEntries = entries.filter(e => {
        if (filter === 'all') return true
        return (e.status || 'pending') === filter
    })

    // Login UI
    if (!secret) {
        return (
            <div className="min-h-screen bg-[#f8fdf8] flex items-center justify-center p-4">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#eef6f6] max-w-md w-full text-center">
                    <h1 className="text-2xl font-headers font-bold text-text-dark mb-2">Admin Access</h1>
                    <p className="text-text-muted mb-6">Enter the NETLIFY_ADMIN_SECRET to continue.</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Enter Secret"
                            value={inputSecret}
                            onChange={(e) => setInputSecret(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-bold">Unlock Dashboard</button>
                    </form>
                    <div className="mt-4">
                        <Link to="/" className="text-sm text-text-muted hover:text-primary">← Back to Home</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fdf8]">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="bg-white border-b border-[#eef6f6] sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-2xl font-headers font-bold text-primary">🍐 Opeari Admin</Link>
                        <span className="bg-[#e8f4ec] text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Beta V2</span>
                    </div>
                    <div>
                        <button onClick={() => { setSecret(''); sessionStorage.removeItem('adminWaitlistSecret') }} className="text-sm text-text-muted hover:text-primary">Log Out</button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats / Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-headers font-bold text-text-dark">Waitlist Requests</h1>
                        <p className="text-text-muted mt-1">Founding member approvals & management.</p>
                    </div>

                    <div className="flex bg-white rounded-lg p-1 border border-[#eef6f6] shadow-sm">
                        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === 'pending' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-gray-50'}`}>Pending</button>
                        <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === 'approved' ? 'bg-green-600 text-white shadow-sm' : 'text-text-muted hover:bg-gray-50'}`}>Approved</button>
                        <button onClick={() => setFilter('rejected')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === 'rejected' ? 'bg-red-500 text-white shadow-sm' : 'text-text-muted hover:bg-gray-50'}`}>Rejected</button>
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${filter === 'all' ? 'bg-gray-600 text-white shadow-sm' : 'text-text-muted hover:bg-gray-50'}`}>All</button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#eef6f6] overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-text-muted">Loading entries...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f0faf4] border-b border-[#eef6f6]">
                                    <tr>
                                        <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">#</th>
                                        <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Date</th>
                                        <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Name</th>
                                        <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Email</th>
                                        <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Type</th>
                                        <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Referral</th>
                                        <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider">Status</th>
                                        <th className="p-4 font-bold text-primary text-sm uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eef6f6]">
                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id} className={`transition-colors ${entry.status === 'rejected' ? 'bg-gray-50 opacity-60' : 'hover:bg-[#fcfdfd]'}`}>
                                            <td className="p-4 text-primary font-bold">#{entry.position}</td>
                                            <td className="p-4 text-text-muted text-sm whitespace-nowrap">
                                                {new Date(entry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                            </td>
                                            <td className="p-4 font-bold text-text-dark">{entry.first_name} {entry.last_name}</td>
                                            <td className="p-4 text-text-muted font-mono text-sm">{entry.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${entry.user_type === 'caregiver' ? 'bg-purple-100 text-purple-700' :
                                                        entry.user_type === 'parent' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {entry.user_type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[#8faaaa]">{entry.referral_source}</td>
                                            <td className="p-4">
                                                {entry.status === 'approved' && <span className="text-green-600 font-bold text-sm">✓ Approved</span>}
                                                {entry.status === 'rejected' && <span className="text-red-500 font-bold text-xs">Rejected</span>}
                                                {(!entry.status || entry.status === 'pending') && <span className="text-yellow-600 font-bold text-sm bg-yellow-50 px-2 py-1 rounded">Pending</span>}
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                {entry.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleReject(entry)} disabled={!!processing}
                                                            className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg font-bold text-xs border border-red-200"
                                                        >
                                                            {processing === entry.id ? '...' : 'Reject'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(entry)} disabled={!!processing}
                                                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-xs"
                                                        >
                                                            {processing === entry.id ? '...' : 'Approve'}
                                                        </button>
                                                    </div>
                                                )}
                                                {entry.status === 'approved' && (
                                                    <button onClick={() => handleApprove(entry)} className="text-xs text-text-muted hover:underline">Resend Email</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredEntries.length === 0 && (
                                        <tr><td colSpan={8} className="p-8 text-center text-[#8faaaa]">No entries found.</td></tr>
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
