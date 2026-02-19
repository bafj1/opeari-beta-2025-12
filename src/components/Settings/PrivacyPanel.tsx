interface PrivacyPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

export default function PrivacyPanel({ formData, setFormData, saving, onSave }: PrivacyPanelProps) {
    const toggleStyle = (enabled: boolean): React.CSSProperties => ({
        position: 'relative',
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: enabled ? '#1e6b4e' : '#d1d5db',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
        border: 'none',
    });

    const toggleKnobStyle = (enabled: boolean): React.CSSProperties => ({
        position: 'absolute',
        top: '2px',
        left: enabled ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'white',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    });

    const toggleField = (field: string) => {
        setFormData({ ...formData, [field]: !formData[field] });
    };

    const privacyItems = [
        {
            field: 'privacy_show_full_name',
            title: 'Show Full Name',
            desc: 'Display your first and last name. If hidden, others see your first name and last initial (e.g., "Breada F.").',
        },
        {
            field: 'privacy_show_location',
            title: 'Show Neighborhood & City',
            desc: 'Display your neighborhood and city (e.g., "Manhattan Beach") on your profile. Your exact address and zip code are never shared.',
        },
        {
            field: 'privacy_show_phone',
            title: 'Show Phone Number',
            desc: 'Allow connected members to see your phone number. Hidden by default.',
        },
        {
            field: 'privacy_appear_in_search',
            title: 'Appear in Discovery',
            desc: 'Allow your profile to appear in search results and the Discover page. Turning this off hides you from new matches.',
        },
    ];

    return (
        <div style={{ maxWidth: '640px' }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(139,215,199,0.3)',
                padding: '24px',
                marginBottom: '20px',
            }}>
                <h3 style={{ color: '#1e6b4e', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                    Privacy Controls
                </h3>
                <p style={{ color: '#5f7c6b', fontSize: '13px', marginBottom: '24px' }}>
                    Control what information is visible to other members.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {privacyItems.map(item => (
                        <div key={item.field} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '16px',
                            padding: '12px 0',
                            borderBottom: '1px solid #f3f4f6',
                        }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e6b4e', marginBottom: '2px' }}>
                                    {item.title}
                                </p>
                                <p style={{ fontSize: '12px', color: '#5f7c6b', lineHeight: '1.4' }}>
                                    {item.desc}
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={!!formData[item.field]}
                                aria-label={item.title}
                                onClick={() => toggleField(item.field)}
                                style={toggleStyle(!!formData[item.field])}
                            >
                                <div style={toggleKnobStyle(!!formData[item.field])} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <button
                    type="button"
                    onClick={() => onSave()}
                    disabled={saving}
                    style={{
                        marginTop: '24px',
                        padding: '10px 28px',
                        borderRadius: '24px',
                        backgroundColor: '#1e6b4e',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '14px',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                        transition: 'opacity 0.2s',
                    }}
                >
                    {saving ? 'Saving...' : 'Save Privacy Settings'}
                </button>
            </div>

            {/* Info Note */}
            <div style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #bbf7d0',
            }}>
                <p style={{ fontSize: '12px', color: '#1e6b4e', lineHeight: '1.5' }}>
                    Your privacy matters. Unconnected members can only see your first name, role, and neighborhood on the Discover page. Full profile details are only visible after you accept a connection.
                </p>
            </div>
        </div>
    );
}
