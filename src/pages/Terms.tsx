import { Helmet } from 'react-helmet-async';


const Terms = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <>
            <Helmet>
                <title>Terms of Use | Opeari</title>
                <meta
                    name="description"
                    content="Terms of Use for Opeari (Beta). Read our guidelines for building a safe, trusted care network."
                />
            </Helmet>

            {/* Hero */}
            <section className="bg-[#fffaf5] px-6 py-16 md:py-20 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold text-[#1e6b4e] mb-6">Terms of Use</h1>
                    <p className="text-lg text-[#4A6163] max-w-2xl mx-auto">
                        Effective Date: {formattedDate}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="px-6 py-16 bg-white min-h-screen">
                <div className="max-w-3xl mx-auto space-y-12 text-[#4A6163] leading-relaxed">

                    {/* Welcome */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Welcome to Opeari</h2>
                        <p>
                            Opeari is a private platform designed to help families and caregivers organize care within their own trusted networks. By using Opeari, you agree to the terms below.
                        </p>
                    </section>

                    {/* What Opeari Is */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">What Opeari Is (and Isn’t)</h2>
                        <p className="mb-4">
                            Opeari provides tools to connect, coordinate, and manage care arrangements.
                        </p>
                        <p className="font-semibold mb-2">Opeari is not:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-4">
                            <li>A childcare agency</li>
                            <li>An employer or staffing service</li>
                            <li>A marketplace that hires or places caregivers</li>
                        </ul>
                        <p>
                            All care arrangements are made directly between users.
                        </p>
                    </section>

                    {/* User Responsibility */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">User Responsibility</h2>
                        <p className="font-semibold mb-2">You are solely responsible for:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-4">
                            <li>Choosing who you work with</li>
                            <li>Conducting interviews, reference checks, or background checks</li>
                            <li>Setting schedules, expectations, and compensation</li>
                            <li>Ensuring child safety and compliance with local laws</li>
                        </ul>
                        <p>
                            Opeari does not supervise, endorse, or guarantee any caregiver or family.
                        </p>
                    </section>

                    {/* Background Checks */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Background Checks & Verification</h2>
                        <p>
                            Any background checks or verification tools offered by Opeari are optional and provided for convenience only. Opeari does not guarantee the accuracy or completeness of third-party checks.
                        </p>
                    </section>

                    {/* Beta Disclaimer */}
                    <div className="bg-[#fffaf5] p-8 rounded-2xl border border-[#1e6b4e]/10">
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Beta Platform Disclaimer</h2>
                        <p className="mb-4">Opeari is currently in beta. This means:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Features may change or be removed</li>
                            <li>Bugs or interruptions may occur</li>
                            <li>Data and functionality may evolve as we improve the platform</li>
                        </ul>
                    </div>

                    {/* Liability */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Limitation of Liability</h2>
                        <p className="mb-4">
                            To the fullest extent permitted by law, Opeari is not liable for injuries, damages, disputes, or losses arising from care arrangements made through the platform.
                        </p>
                        <p className="font-bold text-[#1e6b4e]">
                            Use of Opeari is at your own risk.
                        </p>
                    </section>

                    {/* Termination */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Termination & Account Deletion</h2>
                        <p>
                            We may suspend or terminate access if these terms are violated or if use harms the community.
                        </p>
                        <p className="mt-4">
                            You may delete your account at any time by contacting us.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="pt-8 border-t border-[#1e6b4e]/10">
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Contact</h2>
                        <p>
                            Questions? Reach us at <a href="mailto:breada@opeari.com" className="text-[#1e6b4e] font-bold underline hover:opacity-80">breada@opeari.com</a>
                        </p>
                    </section>

                </div>
            </section>
        </>
    );
};

export default Terms;
