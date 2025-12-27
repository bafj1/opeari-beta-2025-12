import { Link } from 'react-router-dom'
import { useState } from 'react'
import Button from './common/Button'

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="relative z-50 bg-opeari-bg border-b border-opeari-border overflow-visible">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center mr-8 focus:outline-none opacity-100 hover:opacity-80 transition-opacity">
                    <img src="/logo.svg" alt="Opeari" className="h-11 sm:h-12 min-h-[44px]" />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {['About', 'FAQ'].map((item) => (
                        <Link
                            key={item}
                            to={`/${item.toLowerCase()}`}
                            className="text-sm font-medium text-opeari-text-secondary hover:text-opeari-heading transition-colors focus:outline-none focus:text-opeari-heading"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Button
                        to="/login"
                        variant="tertiary"
                        className="font-semibold text-opeari-heading"
                    >
                        Login
                    </Button>
                    <Button
                        to="/waitlist"
                        variant="primary"
                        size="md"
                    >
                        Join Waitlist
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 rounded-lg text-opeari-heading hover:bg-opeari-mint/50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-opeari-bg shadow-card border-t border-opeari-border/20 py-4 px-6 flex flex-col gap-4">
                    <Link to="/about" className="text-lg font-medium text-opeari-heading" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                    <Link to="/faq" className="text-lg font-medium text-opeari-heading" onClick={() => setIsMobileMenuOpen(false)}>FAQ</Link>
                    <div className="h-px bg-opeari-border/20 my-1" />
                    <Link to="/login" className="text-lg font-medium text-opeari-heading" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>

                    <Button
                        to="/waitlist"
                        variant="secondary"
                        fullWidth
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Join Waitlist
                    </Button>
                </div>
            )}
        </header>
    )
}
