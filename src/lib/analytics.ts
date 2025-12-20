/*
 * CLOSED ALPHA ANALYTICS
 * Light instrumentation to observe user behavior.
 * Currently logs to Console.
 * TODO: Connect to backend or PostHog in Phase 7.
 */

// Define event types for type safety
export type AlphaEventName =
    | 'setup_journey_complete'
    | 'request_to_chat_click'
    | 'chat_initiated'
    | 'invite_link_generated'
    | 'profile_view'
    | 'system_signal_shown' // For the "Network Pulse" validation

interface AnalyticsPayload {
    [key: string]: any
}

export function logAlphaEvent(name: AlphaEventName, payload?: AnalyticsPayload) {
    // 1. Console Log for Dev/Demo
    console.log(`%c[ALPHA_SIGNAL] ${name}`, 'background: #1e6b4e; color: #bada55; padding: 2px 4px; border-radius: 2px;', payload || {})

    // 2. Placeholder for potential DB Insert (e.g. Supabase RPC)
    // if (supabase) { ... }
}
