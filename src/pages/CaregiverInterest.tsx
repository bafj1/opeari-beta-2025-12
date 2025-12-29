import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function CaregiverInterest() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        zip: '',
        role: '',
        experience: '',
        notes: ''
    });

    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'duplicate' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        const { error } = await supabase
            .from('caregiver_interest')
            .insert([formData]);

        if (error) {
            console.error('Error submitting caregiver interest:', error);
            if (error.code === '23505') { // Unique violation
                setStatus('duplicate');
            } else {
                setStatus('error');
            }
        } else {
            setStatus('success');
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-opeari-bg flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-card p-8 max-w-md w-full text-center animate-fade-in relative overflow-hidden">
                    <div className="text-[#1e6b4e] mb-6 flex justify-center">
                        <CheckCircle size={64} />
                    </div>
                    <h1 className="text-3xl font-bold text-opeari-heading mb-4">
                        You're on the list!
                    </h1>
                    <div className="space-y-4 text-gray-600 mb-8">
                        <p>Thanks — we're invite-only right now. If there's a fit nearby, you'll hear from us soon.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-opeari-bg flex items-center justify-center p-0 md:p-6" style={{ fontFamily: "'Comfortaa', sans-serif" }}>
            <div className="w-full max-w-6xl md:h-[min(800px,90vh)] bg-white md:rounded-3xl md:shadow-[0_25px_50px_-12px_rgba(30,107,78,0.25)] overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-0">

                {/* LEFT PANEL */}
                <div className="hidden md:flex md:w-[40%] bg-opeari-bg flex-col items-center justify-center p-12 text-center relative transition-all duration-500 border-none">
                    <div className="mb-6 w-56 h-56">
                        <img
                            src="/opeari-match.png"
                            alt="Caregiver Interest"
                            className="w-full h-full object-contain animate-fade-in"
                        />
                    </div>
                    <p className="text-xl text-[#1e6b4e] font-medium leading-relaxed animate-fade-in whitespace-pre-line">
                        Great caregivers make great villages. Let's connect you with families who need you.
                    </p>
                </div>

                {/* RIGHT PANEL - FORM */}
                <div className="w-full md:w-[60%] flex flex-col h-full bg-white relative overflow-y-auto">
                    <div className="flex-1 p-6 md:p-12">
                        <div className="max-w-xl mx-auto space-y-6">

                            <div>
                                <h1 className="text-3xl font-bold text-opeari-heading mb-2">Want to provide care through Opeari?</h1>
                                <p className="text-gray-500">We're currently invite-only for caregivers. Share a few details and we'll reach out if there's a fit nearby.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700 ml-1">First Name</label>
                                        <input
                                            required
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#1e6b4e] focus:ring-2 focus:ring-[#8bd7c7] outline-none transition-all"
                                            placeholder="Jane"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Last Name</label>
                                        <input
                                            required
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#1e6b4e] focus:ring-2 focus:ring-[#8bd7c7] outline-none transition-all"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#1e6b4e] focus:ring-2 focus:ring-[#8bd7c7] outline-none transition-all"
                                        placeholder="jane@example.com"
                                    />
                                    {status === 'duplicate' && (
                                        <p className="text-sm text-[#1e6b4e] mt-1 flex items-center gap-1">
                                            <CheckCircle size={14} /> Looks like you're already on the list — we'll be in touch.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 ml-1">ZIP Code</label>
                                    <input
                                        required
                                        name="zip"
                                        value={formData.zip}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#1e6b4e] focus:ring-2 focus:ring-[#8bd7c7] outline-none transition-all"
                                        placeholder="12345"
                                        pattern="[0-9]{5}"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Role</label>
                                    <select
                                        required
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#1e6b4e] focus:ring-2 focus:ring-[#8bd7c7] outline-none transition-all bg-white"
                                    >
                                        <option value="">Select a role...</option>
                                        <option value="Professional nanny">Professional nanny</option>
                                        <option value="Babysitter">Babysitter</option>
                                        <option value="Parent with extra capacity">Parent with extra capacity</option>
                                        <option value="College student">College student</option>
                                        <option value="Retired / empty-nester">Retired / empty-nester</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Experience</label>
                                    <select
                                        required
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#1e6b4e] focus:ring-2 focus:ring-[#8bd7c7] outline-none transition-all bg-white"
                                    >
                                        <option value="">Years of experience...</option>
                                        <option value="New">New</option>
                                        <option value="1–2 years">1–2 years</option>
                                        <option value="3–5 years">3–5 years</option>
                                        <option value="5–10 years">5–10 years</option>
                                        <option value="10+ years">10+ years</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#1e6b4e] focus:ring-2 focus:ring-[#8bd7c7] outline-none transition-all h-24"
                                        placeholder="Anything you want us to know?"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={status === 'submitting'}
                                        className="w-full bg-[#1e6b4e] text-white py-4 rounded-xl font-bold hover:bg-[#154d38] transition-all hover:-translate-y-0.5 shadow-button hover:shadow-button-hover disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {status === 'submitting' ? 'Saving...' : 'Join caregiver early access'}
                                    </button>
                                    <p className="text-xs text-gray-400 text-center mt-3">
                                        We'll never share your info.
                                    </p>
                                </div>
                                {status === 'error' && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Something went wrong. Please try again.
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
