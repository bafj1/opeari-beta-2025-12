import { Link } from 'react-router-dom'


export function Footer() {
    return (
        <footer className="bg-cream border-t border-mint-dark/40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* Copyright */}
                    <div className="text-center md:text-left">
                        <Link to="/" className="inline-block mb-4 md:mb-0 hover:opacity-80 transition-opacity">
                            <img src="/logo.svg" alt="Opeari" className="h-10 opacity-90 grayscale hover:grayscale-0 transition-all" />
                        </Link>
                        <p className="text-sm text-text-muted mt-2">
                            © {new Date().getFullYear()} Opeari. All rights reserved.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 md:gap-8 flex-wrap justify-center">
                        <Link to="/about" className="text-sm text-text-muted hover:text-primary transition-colors">About</Link>
                        <Link to="/faq" className="text-sm text-text-muted hover:text-primary transition-colors">FAQ</Link>
                        <Link to="/privacy" className="text-sm text-text-muted hover:text-primary transition-colors">Privacy</Link>
                        <Link to="/terms" className="text-sm text-text-muted hover:text-primary transition-colors">Terms</Link>
                        <a href="mailto:hello@opeari.com" className="text-sm text-text-muted hover:text-primary transition-colors">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
