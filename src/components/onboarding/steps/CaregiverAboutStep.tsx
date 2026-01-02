import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader, Input, PhoneInput } from '../components/WizardUI';

interface CaregiverAboutStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
}

export default function CaregiverAboutStep({ data, updateData }: CaregiverAboutStepProps) {
    return (
        <div className="space-y-4 animate-fade-in">
            <StepHeader
                title="Let's build your profile."
                subtitle="First, tell us a little about yourself."
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="First Name"
                    value={data.firstName}
                    onChange={(v: any) => updateData('firstName', v)}
                    required
                    placeholder="Jane"
                />
                <Input
                    label="Last Name"
                    value={data.lastName}
                    onChange={(v: any) => updateData('lastName', v)}
                    required
                    placeholder="Doe"
                />
            </div>

            <PhoneInput
                label="Phone Number"
                value={data.phone}
                onChange={(val: string) => updateData('phone', val)}
                required
            />




            <Input
                label="Zip Code"
                value={data.zipCode}
                onChange={(v: any) => updateData('zipCode', v)}
                required
                placeholder="94110"
                maxLength={5}
            />

            <div className="bg-[#f0faf4] border-l-4 border-opeari-heading p-3 rounded-r-lg mt-4">
                <p className="text-opeari-heading text-xs leading-relaxed">
                    We verify all caregivers to keep our community safe. Your phone number is only used for verification.
                </p>
            </div>
        </div >
    );
}
