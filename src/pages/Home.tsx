
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import Button from '../components/common/Button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-20 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 bg-cream">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* Left - Text block */}
            <div className="text-center lg:text-left lg:max-w-[480px] lg:flex-shrink-0">
              {/* Main tagline - Removed italics per system update */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.1] mb-6 text-primary">
                <span className="block">Flexible care,</span>
                <span className="block">perfectly paired.</span>
              </h1>

              {/* Sub-tagline */}
              <p className="text-lg sm:text-xl mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed font-light text-text-muted">
                Childcare that fits your life—not the other way around.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  to="/waitlist"
                  variant="primary"
                  size="lg"
                  className="px-8"
                >
                  Join the Waitlist
                </Button>

                <Button
                  to="/how-it-works"
                  variant="secondary"
                  size="lg"
                  className="px-8"
                >
                  See How It Works
                </Button>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="flex justify-center lg:justify-end lg:flex-1 lg:mr-4">
              <img
                src="/opeari-village-hero.png"
                alt="Families sharing childcare"
                className="w-full max-w-[280px] sm:max-w-[380px] lg:max-w-[420px] xl:max-w-[480px] drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sound Familiar? */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-12 text-primary">
            Sound familiar?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            <PainPointCard text="Nanny calls out sick. Again." />
            <PainPointCard text="Work trip next week. No backup plan." />
            <PainPointCard text="Want a nanny share but don't know where to start." />
            <PainPointCard text="Just need more options that actually fit your life." />
          </div>

          <p className="text-center text-lg max-w-2xl mx-auto text-text-muted">
            You're not alone. <span className="font-semibold text-primary">Opeari connects you with families nearby looking for the same support you are.</span>
          </p>
        </div>
      </section>

      {/* FIND → MATCH → CONNECT */}
      <section className="py-20 sm:py-24 bg-mint">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3 text-primary">
            How it works
          </h2>
          <p className="text-center text-lg mb-14 text-text-muted">
            Three simple steps to finding your village
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
            <StepCard
              image="/opeari-explore.png"
              step="1"
              title="Find"
              description="Discover families nearby who need care when you do"
            />
            <StepCard
              image="/opeari-match.png"
              step="2"
              title="Match"
              description="We show you why each family could be the right fit"
            />
            <StepCard
              image="/opeari-happy.png"
              step="3"
              title="Connect"
              description="Build your village and share care together"
            />
          </div>
        </div>
      </section>

      {/* Why Families Love Opeari */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14 text-primary">
            Why families love Opeari
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CalendarIcon />}
              iconBg="bg-mint"
              title="Flexible Schedules"
              description="Find care that works with your calendar, not against it"
            />
            <FeatureCard
              icon={<HomeIcon />}
              iconBg="bg-coral"
              title="Local Community"
              description="Connect with families in your neighborhood"
            />
            <FeatureCard
              icon={<PiggyBankIcon />}
              iconBg="bg-[#FEF3C7]"
              title="Share Costs"
              description="Split nanny costs with compatible families"
            />
            <FeatureCard
              icon={<PlaneIcon />}
              iconBg="bg-mint"
              title="Travel Support"
              description="Find backup care when you're away from home"
            />
            <FeatureCard
              icon={<HeartHandIcon />}
              iconBg="bg-coral"
              title="Trusted Network"
              description="Every family is verified and vouched for"
            />
            <FeatureCard
              icon={<ShieldIcon />}
              iconBg="bg-[#FEF3C7]"
              title="Safe & Secure"
              description="Your family's privacy is our priority"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 bg-cream">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">
            Ready to find your village?
          </h2>
          <p className="text-lg mb-10 text-text-muted">
            Join families building flexible childcare together.
          </p>
          <Button
            to="/waitlist"
            variant="primary"
            size="lg"
            className="px-12 text-lg"
          >
            Join the Waitlist
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// Step Card
function StepCard({ image, step, title, description }: {
  image: string
  step: string
  title: string
  description: string
}) {
  return (
    <div className="text-center p-8 rounded-2xl transition-all cursor-default hover:bg-white hover:shadow-card-hover hover:-translate-y-1">
      <div className="w-36 h-36 mx-auto mb-5 flex items-center justify-center">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold mb-4 bg-coral text-primary">
        {step}
      </div>
      <h3 className="text-xl font-bold mb-2 text-primary">{title}</h3>
      <p className="text-sm leading-relaxed max-w-[200px] mx-auto text-text-muted">{description}</p>
    </div>
  )
}

// Feature Card
function FeatureCard({ icon, iconBg, title, description }: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
}) {
  // Handle arbitary hex backgrounds if needed (like the yellow), otherwise use the class
  const isHex = iconBg.startsWith('#');
  const style = isHex ? { backgroundColor: iconBg } : {};
  const className = `w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${!isHex ? iconBg : ''}`;

  return (
    <div className="p-7 rounded-2xl transition-all bg-cream hover:bg-mint hover:shadow-card hover:-translate-y-1 border border-transparent hover:border-mint-dark">
      <div className={className} style={style}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2 text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  )
}

// Pain Point Card
function PainPointCard({ text }: { text: string }) {
  return (
    <div className="p-5 rounded-xl bg-cream border border-mint-dark/50">
      <p className="text-sm font-medium text-text-muted">{text}</p>
    </div>
  )
}

// Icons
function CalendarIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function PiggyBankIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function HeartHandIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}