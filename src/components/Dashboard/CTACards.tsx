import { Link } from 'react-router-dom'

interface CTACardsProps {
  matchingFamiliesCount: number
  availableNowCount: number
}

export default function CTACards({ matchingFamiliesCount, availableNowCount }: CTACardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      {/* Build Your Village - NOW LINKS TO /build-your-village */}
      <Link
        to="/build-your-village"
        className="bg-white border-2 border-opeari-border rounded-2xl p-4 flex gap-3 items-start hover:border-opeari-green hover:-translate-y-0.5 hover:shadow-soft-lg transition-all"
      >
        <div className="w-10 h-10 bg-opeari-mint rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-opeari-heading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-opeari-heading mb-0.5">Build Your Village</h3>
          <p className="text-[12px] text-opeari-text-secondary mb-2">Find nanny shares and care shares</p>
          <span className="inline-block px-2.5 py-1 bg-opeari-mint rounded-full text-[11px] font-semibold text-opeari-heading">
            {matchingFamiliesCount} families match
          </span>
        </div>
      </Link>

      {/* Need Help Now */}
      <Link
        to="/matches?filter=care_now"
        className="bg-urgent-light border-2 border-urgent/30 rounded-2xl p-4 flex gap-3 items-start hover:border-urgent hover:-translate-y-0.5 hover:shadow-soft-lg transition-all"
      >
        <div className="w-10 h-10 bg-urgent/15 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-urgent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-urgent mb-0.5">Need Help Now</h3>
          <p className="text-[12px] text-opeari-text-secondary mb-2">Quick help from nearby parents</p>
          <span className="inline-block px-2.5 py-1 bg-urgent/10 rounded-full text-[11px] font-semibold text-urgent">
            {availableNowCount} available
          </span>
        </div>
      </Link>
    </div>
  )
}