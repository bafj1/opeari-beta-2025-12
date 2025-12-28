import { Eye, EyeOff } from 'lucide-react';
import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader, Input } from '../components/WizardUI';

interface AccountStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
    passwordConfirm: string;
    setPasswordConfirm: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: boolean) => void;
}

export default function AccountStep({ data, updateData, passwordConfirm, setPasswordConfirm, showPassword, setShowPassword }: AccountStepProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader title="Save your spot in the village" subtitle="Create a password so you can come back anytime." />

            <div className="relative">
                <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={data.password}
                    onChange={(v: any) => updateData('password', v)}
                    required
                    placeholder="At least 8 characters"
                    subtext="Must be at least 8 characters"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[34px] text-gray-400">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <Input
                label="Confirm Password"
                type="password"
                value={passwordConfirm}
                onChange={(v: any) => setPasswordConfirm(v)}
                required
                placeholder="••••••••"
            />

            <div className="bg-[#e8f5f0] text-[#1e6b4e] border-l-4 border-opeari-mint p-4 rounded-lg text-sm">
                <p>You'll use <strong>{data.email}</strong> and this password to sign in and access your village.</p>
            </div>
        </div>
    );
}
