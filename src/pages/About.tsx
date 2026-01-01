import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Helmet } from 'react-helmet-async'

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
      <Helmet>
        <title>Opeari - About Us</title>
        <meta name="description" content="We're reimagining childcare to be more flexible, affordable, and community-driven. It takes a village—we help you build yours." />

        {/* Open Graph */}
        <meta property="og:title" content="Opeari - About Us" />
        <meta property="og:description" content="We're reimagining childcare to be more flexible, affordable, and community-driven. It takes a village—we help you build yours." />
        <meta property="og:image" content="https://opeari.com/opeari-proud.png" />
        <meta property="og:url" content="https://opeari.com/about" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Opeari - About Us" />
        <meta name="twitter:description" content="We're reimagining childcare to be more flexible, affordable, and community-driven. It takes a village—we help you build yours." />
        <meta name="twitter:image" content="https://opeari.com/opeari-proud.png" />
      </Helmet>
      {/* Hero - Warm white with illustration */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20 lg:pt-44 lg:pb-24" style={{ backgroundColor: COLORS.cream }}>
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

      {/* The Story - Concise & Warm */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: 'white' }}>
        <div className="max-w-3xl mx-auto px-6">
          <h2 style={{ color: COLORS.primary }} className="text-3xl sm:text-4xl font-bold mb-8 text-center">
            Why we're here
          </h2>

          <div className="prose prose-lg mx-auto text-center" style={{ color: COLORS.textMuted }}>
            <p className="mb-6 leading-relaxed">
              Parenting wasn't meant to be done alone. Yet somewhere along the way, we traded our villages for isolation.
            </p>
            <p className="mb-8 leading-relaxed">
              <span className="font-semibold" style={{ color: COLORS.primary }}>Opeari exists to bring the village back.</span> We connect families who live near each other to share care, cover gaps, and build the kind of trust that makes raising kids a little lighter.
            </p>
            <p className="leading-relaxed">
              No agencies. No algorithms. Just neighbors helping neighbors.
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