import { useState, useEffect } from 'react';
import { Bell, Mail } from 'lucide-react';
import SettingsCard from './SettingsCard';

interface NotificationsPanelProps {
    formData: any;
    setFormData: (data: any) => void;
    saving: boolean;
    onSave: () => void;
}

// Inline toggle component to avoid SettingsToggle styling issues
function Toggle({ label, description, checked, onChange, disabled = false }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderRadius: '12px',
            border: '2px solid rgba(139,215,199,0.3)',
            backgroundColor: 'white',
            opacity: disabled ? 0.6 : 1,
        }}>
            <div style={{ flex: 1, marginRight: '16px' }}>
                <p style={{ fontWeight: 600, color: '#1E6B4E', fontSize: '14px', margin: 0, fontFamily: 'Comfortaa, sans-serif' }}>
                    {label}
                </p>
                <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0 0', lineHeight: 1.4 }}>
                    {description}
                </p>
            </div>
            <button
                type="button"
                onClick={() => !disabled && onChange(!checked)}
                style={{
                    width: '48px',
                    height: '28px',
                    borderRadius: '14px',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                    backgroundColor: checked ? '#1E6B4E' : '#D1D5DB',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '3px',
                    transition: 'left 0.2s',
                    left: checked ? '23px' : '3px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
            </button>
        </div>
    );
}

export default function NotificationsPanel({ formData, setFormData, saving, onSave }: NotificationsPanelProps) {
    // Initialize notification prefs with simplified defaults
    const [prefs, setPrefs] = useState(() => {
        return formData.notification_prefs || {
            in_app: {
                new_connections: true,
                messages: true,
                village_updates: true,
            },
            email: {
                weekly_summary: true,
                connection_alerts: true,
                newsletter: false,
                product_updates: true,
            },
        };
    });

    // Update formData whenever prefs change
    useEffect(() => {
        setFormData({ ...formData, notification_prefs: prefs });
    }, [prefs]);

    // Generic toggle handlers
    const updateInApp = (key: string, value: boolean) => {
        setPrefs((prev: any) => ({ ...prev, in_app: { ...prev.in_app, [key]: value } }));
    };

    const updateEmail = (key: string, value: boolean) => {
        setPrefs((prev: any) => ({ ...prev, email: { ...prev.email, [key]: value } }));
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-6 pb-8 max-w-3xl">

            {/* === IN-APP NOTIFICATIONS === */}
            <SettingsCard title="Notifications" description="Control what appears in your notification feed" icon={Bell}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Toggle
                        label="New Connections"
                        description="When someone sends you a connection request or accepts yours"
                        checked={prefs.in_app?.new_connections ?? true}
                        onChange={(val) => updateInApp('new_connections', val)}
                    />
                    <Toggle
                        label="Messages"
                        description="New messages from your village connections"
                        checked={prefs.in_app?.messages ?? true}
                        onChange={(val) => updateInApp('messages', val)}
                    />
                    <Toggle
                        label="Village Updates"
                        description="When new families or caregivers join your neighborhood"
                        checked={prefs.in_app?.village_updates ?? true}
                        onChange={(val) => updateInApp('village_updates', val)}
                    />
                </div>
            </SettingsCard>

            {/* === EMAIL PREFERENCES === */}
            <SettingsCard title="Email Preferences" description="Choose what emails you receive from Opeari" icon={Mail}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Toggle
                        label="Weekly Summary"
                        description="Your week in review, delivered every Monday morning"
                        checked={prefs.email?.weekly_summary ?? true}
                        onChange={(val) => updateEmail('weekly_summary', val)}
                    />
                    <Toggle
                        label="Connection & Message Alerts"
                        description="Get emailed when you receive a new connection request or message"
                        checked={prefs.email?.connection_alerts ?? true}
                        onChange={(val) => updateEmail('connection_alerts', val)}
                    />
                    <Toggle
                        label="Newsletter & Tips"
                        description="Parenting tips, community stories, and inspiration"
                        checked={prefs.email?.newsletter ?? false}
                        onChange={(val) => updateEmail('newsletter', val)}
                    />
                    <Toggle
                        label="Product Updates"
                        description="New features and improvements to Opeari"
                        checked={prefs.email?.product_updates ?? true}
                        onChange={(val) => updateEmail('product_updates', val)}
                    />
                </div>

                {/* Email note */}
                <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(139,215,199,0.1)',
                    border: '1px solid rgba(139,215,199,0.2)',
                }}>
                    <p style={{ color: '#6B7280', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                        You can unsubscribe from any email by clicking the link at the bottom of the message.
                        We'll always send essential account and security emails.
                    </p>
                </div>
            </SettingsCard>

            {/* === FOOTER === */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '16px',
            }}>
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '12px 32px',
                        backgroundColor: '#1E6B4E',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '50px',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.5 : 1,
                        fontSize: '14px',
                        fontFamily: 'Comfortaa, sans-serif',
                        transition: 'all 0.2s',
                    }}
                >
                    {saving ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </form>
    );
}
