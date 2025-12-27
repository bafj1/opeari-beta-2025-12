import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader, Input, InfoBanner } from '../components/WizardUI';

interface LocationStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
}

export default function LocationStep({ data, updateData }: LocationStepProps) {
    return (
        <div className="space-y-5 animate-fade-in">
            <StepHeader title="Let's start building your village." subtitle="First, where are you located?" />

            <Input
                label="First Name"
                value={data.firstName}
                onChange={(v: any) => updateData('firstName', v)}
                required
                placeholder="e.g. Sarah"
            />

            <Input
                label="Zip Code"
                value={data.zipCode}
                onChange={(v: any) => updateData('zipCode', v)}
                required
                placeholder="e.g. 94110"
                maxLength={5}
            />

            <Input
                label="Neighborhood"
                value={data.neighborhood}
                onChange={(v: any) => updateData('neighborhood', v)}
                placeholder="(Optional)"
                subtext="Helpful for local matches & carpools"
            />

            <InfoBanner>
                Opeari connects families for shared care, backup help, and community — not strangers from the internet.
            </InfoBanner>
        </div>
    );
}
