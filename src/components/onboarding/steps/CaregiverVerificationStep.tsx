import { ShieldCheck } from 'lucide-react';
import { StepHeader } from '../components/WizardUI';

export default function CaregiverVerificationStep() {
    return (
        <div className="space-y-6 animate-fade-in text-center">
            <StepHeader
                title="Trust & Safety"
                subtitle="We're building a safe village for everyone."
            />

            <div className="flex justify-center my-8">
                <div className="bg-green-50 p-6 rounded-full">
                    <ShieldCheck size={64} className="text-opeari-green" />
                </div>
            </div>

            <div className="space-y-4 text-gray-600 max-w-sm mx-auto">
                <p>
                    Because you'll be working with children, we require a background check for all caregivers on Opeari.
                </p>
                <p>
                    Once you complete your profile, our team will review your information and reach out with next steps for verification.
                </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 mt-8">
                <p>Status: <span className="font-semibold text-opeari-dark">Pending Submission</span></p>
            </div>
        </div>
    );
}
