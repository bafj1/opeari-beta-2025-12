import Button from '../common/Button'

interface SetupJourneyProps {
    firstName: string
    hasProfile: boolean
    hasBrowsed: boolean
    hasInvited: boolean
    daysActive?: number
}

export default function SetupJourney({ firstName, hasProfile, hasBrowsed, hasInvited, daysActive = 0 }: SetupJourneyProps) {
    // Determine Phase
    // < 3 days: Activation
    // 3-7 days: Stalled (The Dip)
    // > 7 days: Retention (Long Tail)
    const phase = daysActive < 3 ? 'activation' : daysActive < 7 ? 'stalled' : 'retention'

    // Dynamic Copy based on Phase
    let headline = `Let's get you set up, ${firstName}!`
    let subhead = "Complete these steps to activate your village."
    let primaryColor = "bg-opeari-mint/30"

    if (phase === 'stalled') {
        headline = "It's quiet... for now."
        subhead = "Your area is still growing. Be the seed and invite a trusted friend."
        primaryColor = "bg-orange-100" // subtle urgency
    } else if (phase === 'retention') {
        headline = "Still looking for care?"
        subhead = "Update your schedule to signal you're still active."
    }

    // Interactive Steps Logic
    const steps = [
        {
            id: 'profile',
            label: phase === 'retention' ? 'Update your schedule' : 'Complete your profile',
            description: phase === 'retention' ? 'Let neighbors know your current needs.' : 'Help neighbors get to know you.',
            done: phase === 'retention' ? false : hasProfile, // Force "not done" visual in retention to encourage update? Or just use Done but with action?
            // Let's keep it simple: In retention, if hasProfile is true, we show it as done but maybe add a "Refresh" CTA?
            // Actually, plan said "Ensure users have a reason to return". 
            // If I mark it undone, it drops progress. That feels bad. 
            // Let's keep it 'done' but change the label to 'Profile Active'. 
            // Wait, if 0 connections, they probably want to change something.
            // Let's just keep standard logic for now but change the COPY.
            link: '/settings'
        },
        {
            id: 'browse',
            label: 'Scout the village',
            description: 'Browse profiles and find 3 potential matches.',
            done: hasBrowsed,
            link: '/build-your-village'
        },
        {
            id: 'invite',
            label: 'Bring a friend',
            description: "It's better together. Invite one parent you trust.",
            done: hasInvited,
            link: '/invite',
            highlight: phase === 'stalled' && !hasInvited
        },
    ]

    const completedCount = steps.filter(s => s.done).length
    const progress = Math.round((completedCount / steps.length) * 100)

    return (
        <div className="bg-white rounded-2xl border-2 border-opeari-green/10 overflow-hidden mb-8">
            {/* Header */}
            <div className={`${primaryColor} p-6 border-b border-opeari-green/10 transition-colors`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-opeari-heading">{headline}</h2>
                        <p className="text-sm text-opeari-text-secondary">{subhead}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-opeari-heading">{progress}%</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-opeari-green transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Motivation Text */}
                <p className="text-xs text-opeari-heading/70 font-medium text-right">
                    {progress === 0 && "Let's get started."}
                    {progress === 33 && "You've taken the first step. Better than 50% of visitors."}
                    {progress === 66 && "You're winning! Only 1 step left."}
                    {progress === 100 && "All set! You're in the top 10% of prepared profiles."}
                </p>
            </div>

            {/* Steps */}
            <div className="p-6 space-y-4">
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${step.highlight
                            ? 'bg-orange-50 border-orange-200 shadow-sm'
                            : step.done
                                ? 'bg-opeari-mint/10 border-opeari-border'
                                : 'bg-white border-opeari-border hover:border-opeari-green/50'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-opeari-mint text-opeari-heading' : step.highlight ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {step.done ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <span>{index + 1}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-bold ${step.highlight ? 'text-orange-900' : step.done ? 'text-opeari-heading' : 'text-opeari-text'}`}>
                                {step.label} {step.highlight && <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">Priority</span>}
                            </h3>
                            <p className="text-sm text-opeari-text-secondary">
                                {step.description}
                            </p>
                        </div>
                        {!step.done && (
                            <Button
                                to={step.link}
                                variant={step.highlight ? 'primary' : 'secondary'}
                                size="sm"
                            >
                                {step.id === 'invite' ? 'Invite' : step.id === 'browse' ? 'Browse' : 'Start'}
                            </Button>
                        )}
                        {/* Allow re-doing profile in retention phase even if done? */}
                        {step.done && step.id === 'profile' && phase === 'retention' && (
                            <Button
                                to={step.link}
                                variant="secondary"
                                size="sm"
                            >
                                Update
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
