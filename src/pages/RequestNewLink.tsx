
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RequestNewLink() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'not_found' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch('/.netlify/functions/request-new-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim() })
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
            } else if (data.reason === 'not_found') {
                setStatus('not_found');
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error('Request link error:', err);
            setStatus('error');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxWidth: '420px',
                width: '100%',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #2D5A3D 0%, #4A7C59 100%)',
                    padding: '32px',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '40px' }}>🍐</span>
                    <h1 style={{ color: 'white', fontSize: '24px', margin: '12px 0 0 0' }}>Opeari</h1>
                </div>

                {/* Content */}
                <div style={{ padding: '40px 32px' }}>
                    {status === 'idle' || status === 'loading' ? (
                        <>
                            <h2 style={{ color: '#2D5A3D', fontSize: '24px', margin: '0 0 12px 0', textAlign: 'center' }}>
                                Need a new invite link?
                            </h2>
                            <p style={{ color: '#666', textAlign: 'center', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                                No worries — it happens! Enter your email and we'll send you a fresh link.
                            </p>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    disabled={status === 'loading'}
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        fontSize: '16px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        marginBottom: '16px',
                                        boxSizing: 'border-box',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: 'white',
                                        background: status === 'loading' ? '#9CA3AF' : '#4A7C59',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: status === 'loading' ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {status === 'loading' ? 'Sending...' : 'Send Me a New Link'}
                                </button>
                            </form>
                        </>
                    ) : status === 'success' ? (
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '48px' }}>✅</span>
                            <h2 style={{ color: '#2D5A3D', fontSize: '24px', margin: '16px 0 12px 0' }}>
                                Check your inbox!
                            </h2>
                            <p style={{ color: '#666', lineHeight: '1.5', margin: '0 0 8px 0' }}>
                                We sent a new invite link to:
                            </p>
                            <p style={{ color: '#2D5A3D', fontWeight: '600', margin: '0 0 16px 0' }}>
                                {email}
                            </p>
                            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px 0' }}>
                                It'll expire in 24 hours.<br />
                                Still nothing? Check spam or try again.
                            </p>
                            <Link
                                to="/"
                                style={{
                                    display: 'inline-block',
                                    padding: '12px 24px',
                                    color: '#4A7C59',
                                    border: '2px solid #4A7C59',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: '600'
                                }}
                            >
                                Back to Home
                            </Link>
                        </div>
                    ) : status === 'not_found' ? (
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '48px' }}>🤔</span>
                            <h2 style={{ color: '#2D5A3D', fontSize: '24px', margin: '16px 0 12px 0' }}>
                                We couldn't find your invite
                            </h2>
                            <p style={{ color: '#666', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                                This email isn't in our approved list yet. This could mean:
                            </p>
                            <ul style={{
                                textAlign: 'left',
                                color: '#666',
                                lineHeight: '1.8',
                                paddingLeft: '20px',
                                margin: '0 0 24px 0'
                            }}>
                                <li>You haven't applied yet</li>
                                <li>Your application is still being reviewed</li>
                                <li>You used a different email</li>
                            </ul>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link
                                    to="/waitlist"
                                    style={{
                                        padding: '12px 20px',
                                        color: 'white',
                                        background: '#4A7C59',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontWeight: '600'
                                    }}
                                >
                                    Join the Waitlist
                                </Link>
                                <button
                                    onClick={() => setStatus('idle')}
                                    style={{
                                        padding: '12px 20px',
                                        color: '#4A7C59',
                                        background: 'white',
                                        border: '2px solid #4A7C59',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Try Different Email
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '48px' }}>😕</span>
                            <h2 style={{ color: '#2D5A3D', fontSize: '24px', margin: '16px 0 12px 0' }}>
                                Something went wrong
                            </h2>
                            <p style={{ color: '#666', margin: '0 0 24px 0' }}>
                                Please try again or contact us for help.
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                style={{
                                    padding: '12px 24px',
                                    color: 'white',
                                    background: '#4A7C59',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(status === 'idle' || status === 'loading') && (
                    <div style={{
                        borderTop: '1px solid #e5e7eb',
                        padding: '20px 32px',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
                            Haven't applied yet?{' '}
                            <Link to="/waitlist" style={{ color: '#4A7C59', fontWeight: '600' }}>
                                Join the waitlist →
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
