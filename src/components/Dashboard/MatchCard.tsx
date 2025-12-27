import type { Match } from './types'

interface MatchCardProps {
  match: Match
  onConnect: (matchId: string) => void
  onSave: (matchId: string) => void
  isPreview?: boolean
}

export default function MatchCard({ match, onConnect, onSave, isPreview = true }: MatchCardProps) {
  const { family, kids, compatibility_reasons, mutual_connections, is_available_now, is_new, is_best_match, connection_status, connection_initiated_by_me } = match

  const kidsDisplay = kids.map(kid => {
    if (isPreview) {
      return `${kid.age}yo`
    }
    return `${kid.name} (${kid.age})`
  }).join(', ')

  const lookingForLabels: Record<string, string> = {
    nanny_share: 'Nanny Share',
    care_share: 'Care Share',
    backup_care: 'Backup Care',
  }
  const lookingFor = family.looking_for
    .map(item => lookingForLabels[item] || item)
    .join(', ')

  const experienceLabels: Record<string, string> = {
    experienced: 'Nanny share experience',
    currently_in_one: 'In a nanny share',
    new_to_it: 'New to nanny sharing',
  }

  // Determine button state
  const getButtonConfig = () => {
    if (connection_status === 'accepted') {
      return { text: '✓ Connected', disabled: true, className: 'bg-opeari-mint text-opeari-heading border-2 border-opeari-green' }
    }
    if (connection_status === 'pending') {
      if (connection_initiated_by_me) {
        return { text: 'Request Sent', disabled: true, className: 'bg-gray-100 text-opeari-text-secondary' }
      } else {
        return { text: 'Accept Request', disabled: false, className: 'bg-opeari-coral text-opeari-heading' }
      }
    }
    return { text: 'Connect', disabled: false, className: 'bg-opeari-green text-white hover:bg-opeari-green-dark' }
  }

  const buttonConfig = getButtonConfig()

  return (
    <div className={`p-5 border-b border-opeari-border last:border-b-0 ${is_best_match ? 'border-l-4 border-l-opeari-green bg-gradient-to-r from-opeari-mint/30 to-transparent' : ''}`}>
      {/* Top Row */}
      <div className="flex gap-4 mb-3">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl bg-opeari-coral/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-8 h-8 text-opeari-heading/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              {is_best_match && (
                <span className="inline-block px-2 py-0.5 bg-opeari-coral text-opeari-heading text-[10px] font-bold rounded mb-1">
                  ★ BEST MATCH
                </span>
              )}
              <h3 className="text-[15px] font-bold text-opeari-text">
                {isPreview ? family.name.split(' ')[0] : family.name}
              </h3>
              <p className="text-[12px] text-opeari-text-secondary">
                {family.neighborhood} {!isPreview && `· ${family.distance_miles} mi`}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              {connection_status === 'accepted' && (
                <span className="px-2 py-0.5 bg-opeari-mint text-opeari-heading text-[10px] font-bold rounded">
                  CONNECTED
                </span>
              )}
              {is_available_now && !connection_status && (
                <span className="px-2 py-0.5 bg-opeari-green/10 text-opeari-heading text-[10px] font-bold rounded">
                  AVAILABLE
                </span>
              )}
              {is_new && (
                <span className="text-opeari-coral text-[11px] font-semibold">NEW</span>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-opeari-text-secondary">
            {mutual_connections.length > 0 && !isPreview && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                In {mutual_connections[0].family_name}'s village
              </span>
            )}
            {family.nanny_share_experience && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-opeari-heading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {experienceLabels[family.nanny_share_experience] || family.nanny_share_experience}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compatibility Reasons */}
      {compatibility_reasons.length > 0 && (
        <div className="bg-opeari-mint/50 rounded-lg px-3 py-2 mb-3">
          <p className="text-[12px] text-opeari-heading">
            <svg className="w-3 h-3 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {compatibility_reasons.join(', ')}
          </p>
        </div>
      )}

      {/* Kids & Looking For */}
      <div className="text-[13px] text-opeari-text-secondary mb-2">
        {kids.length > 0 && (
          <span>{isPreview ? `Kids: ${kidsDisplay}` : kidsDisplay}</span>
        )}
        {lookingFor && (
          <span> · Looking for <span className="font-semibold text-opeari-heading">{lookingFor}</span></span>
        )}
      </div>

      {/* Bio - only show if connected */}
      {!isPreview && family.bio && (
        <p className="text-[13px] text-opeari-text-secondary italic mb-4">
          "{family.bio}"
        </p>
      )}

      {/* Preview hint or pending status */}
      {isPreview && !connection_status && (
        <p className="text-[12px] text-opeari-text-secondary italic mb-4">
          Connect to see full profile
        </p>
      )}

      {connection_status === 'pending' && !connection_initiated_by_me && (
        <p className="text-[12px] text-opeari-coral font-medium mb-4">
          This family wants to connect with you!
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onConnect(match.id)}
          disabled={buttonConfig.disabled}
          className={`flex-1 py-2.5 text-[13px] font-bold rounded-full transition-colors ${buttonConfig.className} disabled:cursor-default`}
        >
          {buttonConfig.text}
        </button>
        <button
          onClick={() => onSave(match.id)}
          className="w-11 h-11 flex items-center justify-center border-2 border-opeari-border rounded-full hover:border-opeari-green hover:text-opeari-heading transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}