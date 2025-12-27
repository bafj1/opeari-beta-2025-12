import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SignIn() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    // const navigate = useNavigate() // Unused for now as we just show message

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/dashboard`
            }
        })

        if (error) {
            setMessage(error.message)
        } else {
            setMessage('Check your email for the login link!')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center p-4 font-sans text-[#2F3E34]" style={{ fontFamily: "'Comfortaa', 'DM Sans', 'Inter', system-ui, sans-serif" }}>
            <div className="bg-white rounded-2xl shadow-[0_10px_15px_-3px_rgba(30,107,78,0.1),0_4px_6px_-2px_rgba(30,107,78,0.05)] p-8 max-w-md w-full border border-white/80">
                <div className="text-center mb-6">
                    <img
                        src="/images/opeari-welcome-green.png"
                        alt="Opeari mascot"
                        className="w-16 h-16 mx-auto mb-4 object-contain"
                    />
                    <h1 className="text-2xl font-bold text-[#1B4D3E] mb-2">Welcome back</h1>
                    <p className="text-[#546E5C]">Sign in to your Opeari account</p>
                </div>

                <form onSubmit={handleSignIn}>
                    <label className="block text-xs font-bold text-[#1B4D3E] uppercase tracking-wide mb-1.5 ">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-[#8BD7C7] rounded-xl text-[#2F3E34] focus:outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/10 transition-all placeholder:text-[#546E5C]/50 mb-6"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-[0_4px_6px_-1px_rgba(30,107,78,0.1),0_2px_4px_-1px_rgba(30,107,78,0.06)]
            ${loading ? 'bg-[#546E5C]/50 cursor-wait' : 'bg-[#1B4D3E] hover:bg-[#2D5A3D] hover:-translate-y-0.5'}`}
                    >
                        {loading ? 'Sending...' : 'Send Login Link'}
                    </button>
                </form>

                {message && (
                    <div className="mt-6 p-4 bg-[#f0faf4] border-l-4 border-[#1B4D3E] rounded-r-lg text-sm text-[#1B4D3E]">
                        {message}
                    </div>
                )}

                <p className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <a href="/waitlist" className="text-[#1B4D3E] font-bold hover:underline">Join the waitlist</a>
                </p>
            </div>
        </div>
    )
}
