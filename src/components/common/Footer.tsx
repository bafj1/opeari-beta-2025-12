import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="bg-[#fffaf5] border-t border-[#e8e4de]">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <img src="/icon.svg" alt="" className="h-6 w-6" />
                        <span className="text-[#1E6B4E] font-semibold">Opeari</span>
                    </div>

                    {/* Links */}
                    <nav className="flex items-center gap-6 text-sm">
                        <Link to="/about" className="text-[#1E6B4E] hover:opacity-70 transition-opacity">
                            About
                        </Link>
                        <Link to="/faq" className="text-[#1E6B4E] hover:opacity-70 transition-opacity">
                            FAQ
                        </Link>
                        <Link to="/privacy" className="text-[#1E6B4E] hover:opacity-70 transition-opacity">
                            Privacy
                        </Link>
                        <Link to="/terms" className="text-[#1E6B4E] hover:opacity-70 transition-opacity">
                            Terms
                        </Link>
                    </nav>

                    {/* Copyright */}
                    <p className="text-[#1E6B4E]/60 text-sm">
                        © 2025 Opeari
                    </p>
                </div>
            </div>
        </footer>
    )
}
