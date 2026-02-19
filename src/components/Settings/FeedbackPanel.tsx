export default function FeedbackPanel() {
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
                    Share Feedback
                </h3>
                <p style={{ color: '#5f7c6b', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                    We're building Opeari with our community. Your input directly shapes what we build next. Whether it's a bug, a feature idea, or something that frustrated you, we want to hear it.
                </p>
                <a
                    href="mailto:breada@opeari.com?subject=Opeari%20Feedback"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '24px',
                        backgroundColor: '#1e6b4e',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '14px',
                        textDecoration: 'none',
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Email Us
                </a>
            </div>

            {/* What to share */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(139,215,199,0.3)',
                padding: '24px',
            }}>
                <h3 style={{ color: '#1e6b4e', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                    What we'd love to hear about
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { color: '#E07A5F', text: 'Bugs or things that feel broken' },
                        { color: '#1e6b4e', text: 'Feature ideas or improvements' },
                        { color: '#8bd7c7', text: "What's working well for you" },
                        { color: '#F8C3B3', text: 'Anything confusing or frustrating' },
                    ].map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            backgroundColor: '#fafafa',
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: item.color,
                                flexShrink: 0,
                            }} />
                            <p style={{ fontSize: '13px', color: '#374151' }}>{item.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
