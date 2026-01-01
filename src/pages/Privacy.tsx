import { Helmet } from 'react-helmet-async';

const Privacy = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <>
            <Helmet>
                <title>Privacy Policy | Opeari</title>
                <meta
                    name="description"
                    content="Privacy Policy for Opeari (Beta). How we collect, use, and protect your data."
                />
            </Helmet>

            {/* Hero */}
            <section className="bg-[#fffaf5] px-6 py-16 md:py-20 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold text-[#1e6b4e] mb-6">Privacy Policy</h1>
                    <p className="text-lg text-[#4A6163] max-w-2xl mx-auto">
                        Effective Date: {formattedDate}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="px-6 py-16 bg-white min-h-screen">
                <div className="max-w-3xl mx-auto space-y-12 text-[#4A6163] leading-relaxed">

                    {/* Information We Collect */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Information We Collect</h2>
                        <p className="mb-2">We collect information you choose to provide, including:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Name</li>
                            <li>Email address</li>
                            <li>Profile information and preferences</li>
                        </ul>
                    </section>

                    {/* How We Use Your Information */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">How We Use Your Information</h2>
                        <p className="mb-2">We use your information to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Create and manage your account</li>
                            <li>Enable connections and communication</li>
                            <li>Improve the Opeari experience</li>
                        </ul>
                    </section>

                    {/* Cookies & Analytics */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Cookies & Analytics</h2>
                        <p>
                            Opeari may use basic analytics tools to understand how the platform is used and to improve functionality. These tools may collect anonymized usage data.
                        </p>
                    </section>

                    {/* Third-Party Services */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Third-Party Services</h2>
                        <p>
                            We use trusted third-party services (such as authentication, database, and email providers) to operate the platform. These providers only process data necessary to deliver their services.
                        </p>
                    </section>

                    {/* Data Sharing */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Data Sharing</h2>
                        <p className="mb-4">
                            We do not sell your personal data.
                        </p>
                        <p className="mb-2">Your information is shared only:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>With people you choose to connect with</li>
                            <li>With service providers required to operate Opeari</li>
                        </ul>
                    </section>

                    {/* Data Retention */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Data Retention</h2>
                        <p>
                            We retain your information while your account is active. You may request deletion of your data at any time.
                        </p>
                    </section>

                    {/* Data Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Data Security</h2>
                        <p>
                            We take reasonable steps to protect your information, but no system can guarantee complete security.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="pt-8 border-t border-[#1e6b4e]/10">
                        <h2 className="text-2xl font-bold text-[#1e6b4e] mb-4">Contact</h2>
                        <p>
                            Privacy questions? Email <a href="mailto:breada@opeari.com" className="text-[#1e6b4e] font-bold underline hover:opacity-80">breada@opeari.com</a>
                        </p>
                    </section>

                </div>
            </section>
        </>
    );
};

export default Privacy;
