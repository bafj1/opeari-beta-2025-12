

interface ProfilePanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function ProfilePanel({ formData, setFormData, saving, onSave }: ProfilePanelProps) {
    const inputClass = "w-full p-3.5 rounded-xl border border-opeari-border/50 bg-white text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all duration-200 placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-2";

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-8 animate-fade-in max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>First Name</label>
                    <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className={inputClass}
                    />
                </div>
            </div>

            <div>
                <label className={labelClass}>Phone Number</label>
                <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Zip Code</label>
                    <input
                        type="text"
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Neighborhood</label>
                    <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        className={inputClass}
                        placeholder="e.g. Noe Valley"
                    />
                </div>
            </div>

            <div>
                <label className={labelClass}>Languages Spoken</label>
                <input
                    type="text"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    placeholder="English, Spanish, French..."
                    className={inputClass}
                />
            </div>

            <div>
                <label className={labelClass}>Bio / Introduction</label>
                <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={5}
                    className={inputClass}
                    placeholder="Tell your neighbors a bit about yourself..."
                />
            </div>

            <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-10 py-3.5 bg-opeari-heading text-white font-bold rounded-full hover:bg-opeari-green shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </form>
    );
}
