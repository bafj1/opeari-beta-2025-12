import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../data/mockStore';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function NannyShare() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Vetting Gate Check
    useEffect(() => {
        async function checkVetting() {
            if (!user) return;
            const { data } = await supabase
                .from('members')
                .select('vetting_required, vetting_status')
                .eq('id', user.id)
                .single();

            if (data?.vetting_required && data?.vetting_status !== 'verified') {
                navigate('/verify');
            }
            setLoading(false);
        }
        checkVetting();
    }, [user, navigate]);

    // Local form state stores strings for inputs, converted to arrays on submit
    const [formData, setFormData] = useState({
        families: '',
        schedule: '',
        location: '',
        costSplit: '50/50',
        rules: ''
    });

    if (loading) return <div className="p-8 text-center text-[#1e6b4e]">Checking access...</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.createNannyShare({
                families: (formData.families as string).split(',').map(s => s.trim()),
                schedule: formData.schedule!,
                location: formData.location!,
                costSplit: formData.costSplit!,
                rules: formData.rules!,
            });
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container">
            <Helmet>
                <title>Opeari - Nanny Shares Made Simple</title>
                <meta name="description" content="Cut childcare costs by up to 40% without sacrificing quality. Find the perfect family to share a nanny with today." />

                {/* Open Graph */}
                <meta property="og:title" content="Opeari - Nanny Shares Made Simple" />
                <meta property="og:description" content="Cut childcare costs by up to 40% without sacrificing quality. Find the perfect family to share a nanny with today." />
                <meta property="og:image" content="https://opeari.com/opeari-village-hero.png" />
                <meta property="og:url" content="https://opeari.com/nanny-share" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Opeari - Nanny Shares Made Simple" />
                <meta name="twitter:description" content="Cut childcare costs by up to 40% without sacrificing quality. Find the perfect family to share a nanny with today." />
                <meta name="twitter:image" content="https://opeari.com/opeari-village-hero.png" />
            </Helmet>
            <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <h1>Nanny Share Builder</h1>
                <p style={{ marginBottom: '2rem' }}>Define the structure of your share to ensure fairness and clarity.</p>

                <form onSubmit={handleSubmit} className="wireframe-card">
                    <div className="form-group">
                        <label className="form-label">Who is in this share? (Family Names)</label>
                        <input
                            className="form-input"
                            placeholder="e.g. The Smiths, The Joneses"
                            value={formData.families}
                            onChange={e => setFormData({ ...formData, families: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Proposed Schedule</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            placeholder="e.g. Mon-Fri, 9am - 5pm"
                            value={formData.schedule}
                            onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Hosting Location</label>
                        <select
                            className="form-select"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        >
                            <option value="">Select...</option>
                            <option value="host-1">Family 1's House</option>
                            <option value="host-2">Family 2's House</option>
                            <option value="rotate">Rotating Weekly</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cost Split</label>
                        <select
                            className="form-select"
                            value={formData.costSplit}
                            onChange={e => setFormData({ ...formData, costSplit: e.target.value })}
                        >
                            <option value="50/50">50 / 50</option>
                            <option value="60/40">60 / 40 (differing hours)</option>
                            <option value="per-child">Per Child Ratio</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">House Rules / Notes</label>
                        <textarea
                            className="form-textarea"
                            rows={4}
                            placeholder="e.g. No screen time, organic snacks only..."
                            value={formData.rules}
                            onChange={e => setFormData({ ...formData, rules: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                        Create Share Draft
                    </button>
                </form>
            </div>
        </div>
    );
}
