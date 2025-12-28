import { Link } from 'react-router-dom'
import { Calendar, Home as HomeIcon, PiggyBank, Plane, Shield, Lock } from 'lucide-react'

// --- LOCAL COMPONENTS ---

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group">
      {/* Increased icon container size and spacing per polish request */}
      <div className="w-14 h-14 bg-[#F8C3B3]/30 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#F8C3B3]/50 transition-colors">
        {/* Slightly larger icon */}
        <div className="[&>svg]:w-7 [&>svg]:h-7 text-[#1E6B4E]">
          {icon}
        </div>
      </div>
      <h3 className="text-[#1E6B4E] font-semibold mb-3 text-lg">{title}</h3>
      <p className="text-[#1E6B4E]/70 text-sm sm:text-base leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ number, image, title, description }: { number: string, image: string, title: string, description: string }) {
  return (
    <div className="text-center group">
      <div className="relative mb-6 inline-block">
        <div className="absolute inset-0 bg-[#8bd7c7]/10 rounded-full scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
        <img
          src={image}
          alt={title}
          className="w-24 h-24 sm:w-32 sm:h-32 mx-auto object-contain relative z-10 hover:-translate-y-1 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[#8bd7c7] text-sm font-bold tracking-widest uppercase mb-2">{number}</span>
        <h3 className="text-[#1E6B4E] text-xl font-semibold mb-3">{title}</h3>
        <p className="text-[#1E6B4E]/70 text-sm sm:text-base leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>
    </div>
  )
}

type PainPointVariant = 'coral' | 'mint' | 'yellow' | 'neutral';

function PainPointCard({ title, variant = 'neutral' }: { title: string, variant?: PainPointVariant }) {
  // Define subtle tint colors for hover states
  const hoverStyles = {
    coral: 'hover:bg-[#F8C3B3]/10 hover:border-[#F8C3B3]/50',
    mint: 'hover:bg-[#8bd7c7]/10 hover:border-[#8bd7c7]/50',
    yellow: 'hover:bg-[#F9E3D2]/30 hover:border-[#F9E3D2]', // Peach/Yellow tone
    neutral: 'hover:bg-gray-50 hover:border-[#1E6B4E]/30',
  };

  return (
    <div className={`bg-white rounded-xl p-6 border border-[#e8e4de] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex items-center justify-center text-center ${hoverStyles[variant]}`}>
      <p className="text-[#1E6B4E] text-base font-medium">{title}</p>
    </div>
  )
}

// --- MAIN PAGE ---

export default function Home() {
  return (
    <main className="bg-[#fffaf5] font-sans min-h-screen">

      {/* 
        SECTION 1: HERO 
        Layout: Split Content / Image
      */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1E6B4E] leading-[1.1] mb-6 font-display">
                Flexible care, <br />
                <span className="text-[#1E6B4E]">perfectly paired.</span>
              </h1>

              <p className="text-lg sm:text-xl text-[#1E6B4E]/70 mb-10 max-w-xl mx-auto lg:mx-0">
                Childcare that fits your life — not the other way around. Opeari helps parents build flexible, local care with people they trust.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/waitlist"
                  className="inline-flex items-center justify-center h-12 sm:h-14 px-8 rounded-full bg-[#F8C3B3] text-[#1E6B4E] font-semibold hover:bg-[#f0b5a5] hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Join the Waitlist
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center justify-center h-12 sm:h-14 px-8 rounded-full border-2 border-[#1E6B4E] text-[#1E6B4E] font-semibold hover:bg-[#1E6B4E]/5 transition-all duration-300"
                >
                  See How It Works
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex-1 w-full max-w-[500px] lg:max-w-none relative">
              {/* Removed white card wrapper. Applied floating animation directly. */}
              <div className="animate-float">
                <img
                  src="/opeari-village-hero.png"
                  alt="Opeari Village"
                  className="w-full h-auto drop-shadow-xl" // Added drop-shadow for depth without card
                  loading="eager"
                />
              </div>
              {/* Decorative blobs */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#8bd7c7]/10 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 
        SECTION 2: PAIN POINTS
        "Sound familiar?"
      */}
      <section className="py-20 sm:py-24 bg-white/50 border-y border-[#e8e4de]/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E6B4E] mb-4">Sound familiar?</h2>
            <p className="text-[#1E6B4E]/70 text-lg">Parenting wasn't meant to be done alone.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <PainPointCard title="Nanny calls out sick. Again." variant="coral" />
            <PainPointCard title="Work trip next week. No backup." variant="mint" />
            <PainPointCard title="Want a nanny share but don't know who to ask." variant="yellow" />
            <PainPointCard title="Just need more options that actually fit." variant="neutral" />
          </div>

          <p className="text-center text-[#1E6B4E]/70 mt-12 max-w-2xl mx-auto text-sm sm:text-base">
            Opeari connects you with nearby families who need the same support you do.
          </p>
        </div>
      </section>

      {/* 
        SECTION 3: HOW IT WORKS
        "Three simple steps"
      */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E6B4E] mb-4">How it works</h2>
            <p className="text-[#1E6B4E]/70 text-lg">Three simple steps to finding your village.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            <StepCard
              number="STEP 1"
              image="/opeari-explore.png"
              title="Find"
              description="Discover families nearby who need care when you do."
            />
            <StepCard
              number="STEP 2"
              image="/opeari-match.png"
              title="Match"
              description="We connect you based on schedule, values, and parenting styles."
            />
            <StepCard
              number="STEP 3"
              image="/opeari-happy.png"
              title="Connect"
              description="Build your village, split costs, and share care together."
            />
          </div>
        </div>
      </section>

      {/* 
        SECTION 4: FEATURES
        "Why families love Opeari"
      */}
      <section className="py-20 sm:py-24 bg-white border-y border-[#e8e4de]/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E6B4E] mb-16 text-center">Why families love Opeari</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 lg:gap-y-12">
            <FeatureCard
              icon={<Calendar className="w-6 h-6 text-[#1E6B4E]" />}
              title="Flexible Schedules"
              description="Find care that works with your calendar, not against it. Odd hours? No problem."
            />
            <FeatureCard
              icon={<HomeIcon className="w-6 h-6 text-[#1E6B4E]" />}
              title="Local Community"
              description="Connect with families in your actual neighborhood, so help is just a walk away."
            />
            <FeatureCard
              icon={<PiggyBank className="w-6 h-6 text-[#1E6B4E]" />}
              title="Share Costs"
              description="Split nanny costs with compatible families and save up to 40% on childcare."
            />
            <FeatureCard
              icon={<Plane className="w-6 h-6 text-[#1E6B4E]" />}
              title="Travel Support"
              description="Find trusted backup care even when you're away from home on business."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-[#1E6B4E]" />}
              title="Trusted Network"
              description="Every family is verified and vouched for. Safety is our foundation."
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6 text-[#1E6B4E]" />}
              title="Safe & Secure"
              description="Your family's privacy is our priority. You control what you share."
            />
          </div>
        </div>
      </section>

      {/* 
        SECTION 5: FINAL CTA
      */}
      <section className="py-24 sm:py-32 bg-[#1E6B4E]/5 relative overflow-hidden">
        {/* Background pear decoration */}
        <img
          src="/pears-entering.png"
          alt=""
          className="absolute -bottom-10 -left-10 w-48 opacity-20 pointer-events-none"
        />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-[#1E6B4E] mb-6">Ready to find your village?</h2>
          <p className="text-lg sm:text-xl text-[#1E6B4E]/70 mb-10">
            Join families building flexible childcare together.
          </p>
          <Link
            to="/waitlist"
            className="inline-flex items-center justify-center h-12 sm:h-14 px-8 rounded-full bg-[#F8C3B3] text-[#1E6B4E] font-semibold hover:bg-[#f0b5a5] hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Join the Waitlist
          </Link>
        </div>
      </section>

    </main>
  )
}