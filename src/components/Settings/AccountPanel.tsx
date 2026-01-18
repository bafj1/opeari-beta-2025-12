

interface AccountPanelProps {
    displayEmail: string;
}

export default function AccountPanel({ displayEmail }: AccountPanelProps) {
    const labelClass = "block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-2";

    return (
        <div className="space-y-10 animate-fade-in max-w-2xl">
            <div>
                <label className={labelClass}>Email Address</label>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-lg text-opeari-heading font-medium">{displayEmail}</div>
                    <span className="text-xs font-bold px-3 py-1 bg-gray-200 text-gray-500 rounded-full uppercase tracking-wider">Verified</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 px-1">Contact support to change your email address.</p>
            </div>

            <div className="pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-opeari-heading mb-4">Security</h3>
                <button
                    onClick={() => window.location.href = '/forgot-password'}
                    className="px-6 py-3 bg-white border border-opeari-border text-opeari-heading font-bold rounded-full hover:bg-opeari-mint/10 hover:border-opeari-green/30 transition-all"
                >
                    Reset Password
                </button>
            </div>

            <div className="pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
                <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button
                    onClick={() => alert('Please contact support to verify identity and delete account.')}
                    className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-full hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                >
                    Delete Account
                </button>
            </div>
        </div>
    );
}
