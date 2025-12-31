import { ShieldCheck } from 'lucide-react';

export default function VerificationTab() {
    return (
        <div className="bg-opeari-bg rounded-2xl border border-opeari-border p-5">
            <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-green-100 text-[#1e6b4e] rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-opeari-heading">Background Check & Verification</h2>
                    <p className="text-sm text-opeari-text-secondary">
                        Build trust with families by verifying your identity and history.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-opeari-border rounded-xl p-6 text-center">
                <h3 className="font-bold text-gray-800 mb-2">Ready to stand out?</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    Verified caregivers get 3x more responses and unlock full access to matched families.
                </p>
                <div className="space-y-3">
                    <button
                        className="bg-[#1e6b4e] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#155d42] transition-colors shadow-sm w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled
                    >
                        Start Background Check
                    </button>
                    <p className="text-xs text-[#1e6b4e] font-medium bg-[#1e6b4e]/10 py-1 px-3 rounded-full inline-block">
                        Integration coming soon
                    </p>
                </div>
                <p className="text-xs text-gray-400 mt-4">Background check provider coming soon</p>
            </div>
        </div>
    );
}
