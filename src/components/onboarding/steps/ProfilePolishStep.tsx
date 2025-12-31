import type { OnboardingData } from '../OnboardingTypes';
import { StepHeader } from '../components/WizardUI';


interface ProfilePolishStepProps {
    data: OnboardingData;
    updateData: (field: keyof OnboardingData, value: any) => void;
    onNext: () => void; // Need to trigger next step
}



export default function ProfilePolishStep({ data, updateData, onNext }: ProfilePolishStepProps) {
    // Photo upload removed for Beta

    return (
        <div className="space-y-6 animate-fade-in">
            <StepHeader
                title="Welcome to the neighborhood!"
                subtitle="A photo helps neighbors say hello."
            />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* LEFT COLUMN: INPUTS */}
                <div className="flex-1 space-y-8">

                    {/* AVATAR / PHOTO SECTION */}
                    <div>
                        <label className="block text-sm font-bold text-opeari-heading uppercase tracking-wide mb-3">
                            Profile Picture
                        </label>

                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                            <div className="w-20 h-20 mx-auto bg-opeari-mint rounded-full flex items-center justify-center text-3xl text-opeari-heading font-bold mb-3 border-4 border-white shadow-sm">
                                {data.firstName?.charAt(0) || '?'}
                            </div>
                            <p className="text-sm text-gray-500">
                                Your initials will be used until photo uploads are available.
                            </p>
                        </div>
                    </div>

                    {/* BIO SECTION */}
                    <div>
                        <label className="block text-sm font-bold text-opeari-heading uppercase tracking-wide mb-3">
                            Your Family Bio
                        </label>

                        <div className="relative">
                            <textarea
                                value={data.bio}
                                onChange={(e) => updateData('bio', e.target.value)}
                                placeholder="Tell us a bit about your family..."
                                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-opeari-green focus:outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-center">
                        <button
                            onClick={() => {
                                updateData('skipped', true);
                                onNext();
                            }}
                            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Skip to Dashboard
                        </button>
                    </div>
                </div>


                {/* RIGHT COLUMN: PREVIEW CARD */}
                <div className="hidden lg:block w-80 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-card p-4 border border-gray-100 sticky top-4 transform rotate-1 transition-transform hover:rotate-0">
                        <div className="text-center mb-4 relative">
                            <div className="w-24 h-24 mx-auto bg-opeari-mint rounded-full flex items-center justify-center text-5xl overflow-hidden border-4 border-white shadow-lg">
                                {data.photoUrl ? (
                                    <img src={data.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{data.avatarId || data.firstName?.charAt(0) || '?'}</span>
                                )}
                            </div>
                            {/* Match Badge Preview */}
                            <div className="absolute top-0 right-4 bg-opeari-green text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                98% Match
                            </div>
                        </div>

                        <h3 className="text-center font-bold text-lg text-opeari-heading">
                            {data.firstName ? `${data.firstName}'s Family` : 'Your Family'}
                        </h3>
                        <p className="text-center text-sm text-gray-400 mb-4">
                            {data.neighborhood || 'Neighborhood'}
                        </p>

                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic h-32 overflow-hidden relative">
                            "{data.bio || 'Your bio will appear here...'}"
                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-50 to-transparent" />
                        </div>

                        <div className="mt-4 flex gap-2">
                            <div className="flex-1 bg-opeari-peach h-8 rounded-lg opacity-50" />
                            <div className="w-8 h-8 bg-opeari-mint rounded-lg opacity-50" />
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        This is how neighbors will see you
                    </p>
                </div>
            </div>
        </div >
    );
}
