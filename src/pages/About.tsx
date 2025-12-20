import { Link } from 'react-router-dom'
import { useState } from 'react'

// Colors
const COLORS = {
  primary: '#1e6b4e',
  primaryDark: '#155a3e',
  coral: '#F8C3B3',
  coralHover: '#f5a08a',
  mint: '#d8f5e5',
  mintDark: '#8bd7c7',
  cream: '#fffaf5',
  textMuted: '#4A6163',
}

export default function About() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.cream }}>
      {/* Navigation */}
      <header style={{ backgroundColor: COLORS.cream, borderBottom: `1px solid ${COLORS.mintDark}40` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Opeari" className="h-12 sm:h-14" style={{ minHeight: '48px' }} />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {['About', 'How It Works', 'FAQ'].map((item) => (
              <Link 
                key={item}
                to={item === 'How It Works' ? '/how-it-works' : `/${item.toLowerCase()}`}
                style={{ color: item === 'About' ? COLORS.coral : COLORS.primary }}
                className="font-medium hover:opacity-70 transition-opacity"
              >
                {item}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/login"
              style={{ color: COLORS.primary }}
              className="font-semibold hover:opacity-70 transition-opacity hidden sm:block"
            >
              Login
            </Link>
            <Link
              to="/waitlist"
              className="px-5 py-2 text-sm text-white font-semibold rounded-full transition-all hover:opacity-90"
              style={{ backgroundColor: COLORS.primary }}
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Warm white with illustration */}
      <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: COLORS.cream }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div className="text-center lg:text-left">
              <h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{ color: COLORS.primary }}
              >
                It takes a village.
                <br />
                <span style={{ color: COLORS.primary }}>Let's help you build yours.</span>
              </h1>
              <p 
                className="text-lg sm:text-xl"
                style={{ color: COLORS.textMuted }}
              >
                Childcare reimagined for modern parents—flexible, shared, community-powered.
              </p>
            </div>
            
            {/* Right - Illustration */}
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/opeari-proud.png" 
                alt="Opeari pear mascot" 
                className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 object-contain"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(248,195,179,0.3))' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Story - Better hierarchy with subheaders */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: 'white' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 style={{ color: COLORS.primary }} className="text-2xl sm:text-3xl font-bold mb-10">
            The story
          </h2>
          
          {/* The Problem */}
          <div className="mb-10">
            <p 
              className="text-sm font-semibold uppercase tracking-wide mb-3"
              style={{ color: COLORS.coral }}
            >
              The problem
            </p>
            <p className="text-lg leading-relaxed" style={{ color: COLORS.textMuted }}>
              Childcare shouldn't feel like solving a puzzle with missing pieces.
            </p>
          </div>
          
          {/* The Reality */}
          <div className="mb-10">
            <p 
              className="text-sm font-semibold uppercase tracking-wide mb-3"
              style={{ color: COLORS.coral }}
            >
              The reality
            </p>
            <p className="leading-relaxed mb-4" style={{ color: COLORS.textMuted }}>
              Your nanny calls out sick. School closes… again. A work trip pops up. You want a nanny share but have no idea where to start.
            </p>
            <p className="leading-relaxed" style={{ color: COLORS.textMuted }}>
              So you ask a friend. Or a neighbor. Or a Facebook group that hasn't been active since 2019.
            </p>
          </div>
          
          {/* The Insight */}
          <div 
            className="p-8 rounded-2xl mb-10"
            style={{ backgroundColor: `${COLORS.coral}15`, borderLeft: `4px solid ${COLORS.coral}` }}
          >
            <p className="text-lg leading-relaxed" style={{ color: COLORS.textMuted }}>
              Meanwhile? <span style={{ color: COLORS.primary }} className="font-semibold">Dozens of parents around you are looking for the exact same thing.</span> We just weren't connected.
            </p>
          </div>
          
          {/* The Why */}
          <div>
            <p 
              className="text-sm font-semibold uppercase tracking-wide mb-3"
              style={{ color: COLORS.coral }}
            >
              Why we built Opeari
            </p>
            <p className="text-xl font-semibold leading-relaxed" style={{ color: COLORS.primary }}>
              To make the village real again.
            </p>
          </div>
        </div>
      </section>

      {/* What We Believe - Mint as subtle accent */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: COLORS.cream }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 
            className="text-2xl sm:text-3xl font-bold text-center mb-14"
            style={{ color: COLORS.primary }}
          >
            What we believe
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BeliefCard 
              title="Flexibility is freedom"
              description="Life shifts. Care should too. We help families co-create care that adapts—not the other way around."
              accent={COLORS.mint}
            />
            <BeliefCard 
              title="Trust is everything"
              description="Care works best when it starts with people you know, or people your people know."
              accent={`${COLORS.coral}30`}
            />
            <BeliefCard 
              title="Sharing makes sense"
              description="Nanny shares, backup swaps, carpools. Lower cost, higher connection, more support."
              accent={`${COLORS.coral}30`}
            />
            <BeliefCard 
              title="Parents know best"
              description="We're not here to tell you how to parent—just to help you find the people who make parenting easier."
              accent={COLORS.mint}
            />
          </div>
        </div>
      </section>

      {/* The Name - Mint accent stripe */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: COLORS.mint }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="mb-6">
              <img 
                src="/opeari-idea.png" 
                alt="Opeari pear" 
                className="w-32 h-32 mx-auto object-contain"
              />
            </div>
            
            <h2 
              className="text-2xl sm:text-3xl font-bold mb-6"
              style={{ color: COLORS.primary }}
            >
              Why "Opeari"?
            </h2>
            
            <p 
              className="text-lg leading-relaxed"
              style={{ color: COLORS.textMuted }}
            >
              A small nod to <span style={{ color: COLORS.primary }} className="font-semibold">au pair</span>. 
              A little wink to <span style={{ color: COLORS.primary }} className="font-semibold">pairing</span> families. 
              And a pear designed to flex with your ever-changing needs.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24" style={{ backgroundColor: COLORS.primary }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to build your village?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            We're starting intentionally, one community at a time. Be one of the first to join.
          </p>
          <Link
            to="/waitlist"
            className="inline-block px-10 py-4 text-lg font-semibold rounded-full transition-all hover:shadow-xl hover:scale-105"
            style={{ backgroundColor: COLORS.coral, color: COLORS.primary }}
          >
            Join the Waitlist
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'white', borderTop: `1px solid ${COLORS.mintDark}40` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              © 2025 Opeari
            </p>
            
            <div className="flex items-center gap-8 text-sm">
              <Link to="/about" style={{ color: COLORS.textMuted }} className="hover:opacity-70 transition-opacity">About</Link>
              <Link to="/how-it-works" style={{ color: COLORS.textMuted }} className="hover:opacity-70 transition-opacity">How It Works</Link>
              <Link to="/faq" style={{ color: COLORS.textMuted }} className="hover:opacity-70 transition-opacity">FAQ</Link>
              <Link to="/privacy" style={{ color: COLORS.textMuted }} className="hover:opacity-70 transition-opacity">Privacy</Link>
              <a href="mailto:hello@opeari.com" style={{ color: COLORS.textMuted }} className="hover:opacity-70 transition-opacity">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Belief Card Component with accent color
function BeliefCard({ title, description, accent }: { title: string; description: string; accent: string }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="p-7 rounded-2xl transition-all"
      style={{ 
        backgroundColor: isHovered ? accent : 'white',
        border: `1px solid ${COLORS.mintDark}40`,
        transform: isHovered ? 'translateY(-4px)' : 'none',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.06)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="text-lg font-bold mb-3" style={{ color: COLORS.primary }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>{description}</p>
    </div>
  )
}