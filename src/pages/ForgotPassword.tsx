import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Helmet } from 'react-helmet-async'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/dashboard`,
            })
            if (error) {
                console.error('Reset error:', error)
                // We intentionally do not show the error to the user to prevent email enumeration
            }
        } catch (err) {
            console.error('Unexpected error:', err)
        } finally {
            // Always show success state for security
            setLoading(false)
            setSuccess(true)
        }
    }

    return (
        <main className="min-h-screen bg-[#fffaf5] flex">
            <Helmet>
                <title>Forgot Password | Opeari</title>
                <meta name="description" content="Reset your Opeari password." />
            </Helmet>

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#1E6B4E] to-[#2d7a5e] p-12 pt-12 flex-col justify-between text-white relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute bottom-40 left-10 w-24 h-24 bg-white/5 rounded-full" />

                <div className="relative z-10">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 mb-12 hover:opacity-90 transition-opacity">
                        <img src="/icon.svg" alt="Opeari" className="w-8 h-8 block" style={{ filter: 'brightness(0) invert(1)' }} />
                        <span className="text-xl font-bold text-white">Opeari</span>
                    </Link>

                    <h2 className="text-3xl font-bold mb-4" style={{ color: '#F9E3D2' }}>
                        Don't worry, it happens.
                    </h2>
                    <p className="text-white text-opacity-90 text-lg">
                        We'll help you get back to your village in no time.
                    </p>
                </div>

                {/* Mascot */}
                <img src="/opeari-welcome-green.png" alt="Opeari mascot" className="w-40 h-40 object-contain self-center opacity-90" />
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-[#fffaf5] p-6">
                <nav className="absolute top-0 right-0 w-full flex justify-end items-center gap-8 p-6 pr-8">
                    <Link to="/login" className="text-sm text-[#1e6b4e] font-medium hover:underline">Back to Login</Link>
                </nav>

                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e8e4de] p-8 mt-12 lg:mt-0">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[#1E6B4E] mb-2">Forgot your password?</h1>
                        <p className="text-[#5a6e5a]">No worries — it happens. Enter your email and we'll send a reset link.</p>
                    </div>

                    {success ? (
                        <div className="bg-green-50 border border-green-200 text-[#1e6b4e] px-6 py-6 rounded-xl text-center animate-in fade-in duration-300">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="font-bold text-lg mb-2">Check your email</p>
                            <p className="text-sm opacity-90 mb-6">If an account exists for <span className="font-semibold">{email}</span>, you'll receive a reset link shortly.</p>
                            <Link to="/login" className="block w-full py-3 bg-[#1E6B4E] text-white font-semibold rounded-xl hover:bg-[#165a40] transition-colors">
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[#1E6B4E] mb-2">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-[#8bd7c7] text-[#1E6B4E] placeholder-[#9ca3af] focus:outline-none focus:border-[#1E6B4E] focus:ring-2 focus:ring-[#1E6B4E]/20 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-[#1E6B4E] text-white font-semibold rounded-xl hover:bg-[#165a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {loading ? 'Sending link...' : 'Send reset link'}
                            </button>
                            <div className="text-center">
                                <Link to="/login" className="text-sm text-[#5a6e5a] hover:text-[#1E6B4E] font-medium">Cancel</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </main>
    )
}
