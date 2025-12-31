
import type { OnboardingData } from '../components/onboarding/OnboardingTypes';

export function determineVettingRequirements(data: OnboardingData, hostingInterest: boolean): { vetting_required: boolean, vetting_types: string[] } {
    const vetting_types: string[] = [];

    // 1. Check direct hosting interest checkbox (IntentStep)
    if (hostingInterest) {
        vetting_types.push('host');
    }

    // 2. Check "Offer Support" or "Host" options in Care Needs / Work Types
    // IDs from CareNeedsStep.tsx:
    // 'host-share', 'care-exchange', 'offer-pickups', 'offer-backup'
    const TRIGGER_OPTIONS = [
        'host-share',
        'care-exchange',
        'offer-pickups',
        'offer-backup'
    ];

    const hasTriggerOption = data.careOptions.some(opt => TRIGGER_OPTIONS.includes(opt));
    if (hasTriggerOption) {
        if (data.careOptions.includes('host-share')) vetting_types.push('host-share');
        if (data.careOptions.includes('care-exchange')) vetting_types.push('care-exchange');
        if (data.careOptions.includes('offer-pickups')) vetting_types.push('offer-pickups');
        if (data.careOptions.includes('offer-backup')) vetting_types.push('offer-backup');
    }

    // 3. Check "I provide childcare" intent (IntentStep)
    // Providing care automatically requires vetting, but that flow usually goes to /caregiver-interest.
    // However, if they land here somehow, we flag it.
    if (data.userIntent === 'caregiver') {
        vetting_types.push('provider');
    }

    // Deduplicate types
    const uniqueTypes = [...new Set(vetting_types)];

    return {
        vetting_required: uniqueTypes.length > 0,
        vetting_types: uniqueTypes
    };
}
