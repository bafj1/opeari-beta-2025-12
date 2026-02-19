import { useViewer } from '../../hooks/useViewer';

export default function SafetyVerificationPanel() {
    const { viewer } = useViewer();
    const emailVerified = !!viewer?.user?.email_confirmed_at || !!viewer?.member?.email;

    const comingBadge = (
        <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '12px',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '11px',
            fontWeight: 600,
        }}>
            Coming Soon
        </span>
    );

    return (
        <div style={{ maxWidth: '640px' }}>
            {/* Verification Status */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(139,215,199,0.3)',
                padding: '24px',
                marginBottom: '20px',
            }}>
                <h3 style={{ color: '#1e6b4e', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                    Verification Status
                </h3>
                <p style={{ color: '#5f7c6b', fontSize: '13px', marginBottom: '20px' }}>
                    Build trust with your village through verification.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Email — Real */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        backgroundColor: emailVerified ? '#f0fdf4' : '#fafafa',
                        border: emailVerified ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                backgroundColor: emailVerified ? '#1e6b4e' : '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e6b4e' }}>Email Verification</p>
                                <p style={{ fontSize: '12px', color: '#5f7c6b' }}>
                                    {emailVerified ? 'Verified' : 'Not verified'}
                                </p>
                            </div>
                        </div>
                        {emailVerified && (
                            <span style={{
                                padding: '3px 10px', borderRadius: '12px',
                                backgroundColor: '#d8f5e5', color: '#1e6b4e',
                                fontSize: '11px', fontWeight: 600,
                            }}>
                                Complete
                            </span>
                        )}
                    </div>

                    {/* Phone — Coming Soon */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '12px',
                        backgroundColor: '#fafafa', border: '1px solid #e5e7eb',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                backgroundColor: '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                    <line x1="12" y1="18" x2="12.01" y2="18" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Phone Verification</p>
                                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Adds an extra layer of trust</p>
                            </div>
                        </div>
                        {comingBadge}
                    </div>

                    {/* Background Check — Coming Soon */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '12px',
                        backgroundColor: '#fafafa', border: '1px solid #e5e7eb',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                backgroundColor: '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Background Check</p>
                                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Professional verification via Checkr</p>
                            </div>
                        </div>
                        {comingBadge}
                    </div>

                    {/* ID Verification — Coming Soon */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '12px',
                        backgroundColor: '#fafafa', border: '1px solid #e5e7eb',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                backgroundColor: '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>ID Verification</p>
                                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Government ID confirmation</p>
                            </div>
                        </div>
                        {comingBadge}
                    </div>
                </div>
            </div>

            {/* Trust Tiers Info */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(139,215,199,0.3)',
                padding: '24px',
                marginBottom: '20px',
            }}>
                <h3 style={{ color: '#1e6b4e', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                    How Trust Works on Opeari
                </h3>
                <p style={{ color: '#5f7c6b', fontSize: '13px', marginBottom: '20px' }}>
                    We're building a trust system so you can feel confident about your village connections.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        { tier: '1', title: 'Basic', desc: 'Email verified, profile completed', active: true },
                        { tier: '2', title: 'Verified', desc: 'Phone and ID confirmed', active: false },
                        { tier: '3', title: 'Trusted', desc: 'Background check completed', active: false },
                        { tier: '4', title: 'Village Endorsed', desc: 'Positive community interactions', active: false },
                    ].map(t => (
                        <div key={t.tier} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                backgroundColor: t.active ? '#1e6b4e' : '#e5e7eb',
                                color: t.active ? 'white' : '#9ca3af',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: 700, flexShrink: 0,
                            }}>
                                {t.tier}
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: t.active ? '#1e6b4e' : '#6b7280' }}>
                                    {t.title} {t.active && '(You are here)'}
                                </p>
                                <p style={{ fontSize: '12px', color: '#9ca3af' }}>{t.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


        </div>
    );
}
