import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

export default function Accessibility() {
    return (
        <div className="min-h-screen bg-[#fffaf5] pt-32 pb-20 px-6">
            <Helmet>
                <title>Opeari - Accessibility Statement</title>
                <meta name="description" content="Accessibility statement for Opeari. We are committed to providing a website that is accessible to the widest possible audience." />
            </Helmet>

            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-[#1E6B4E] mb-8 font-[Comfortaa]">
                    Accessibility Statement
                </h1>

                <div className="space-y-8 text-[#5a6e5a] leading-relaxed">
                    <p className="text-lg">
                        Opeari is committed to providing a website that is accessible to the widest possible audience, regardless of technology or ability.
                    </p>

                    <section>
                        <h2 className="text-xl font-bold text-[#1E6B4E] mb-3 font-[Comfortaa]">Our Goal</h2>
                        <p>
                            We aim to follow WCAG 2.1 Level AA guidance and continuously improve the experience for all users. We believe that building a village means including everyone.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#1E6B4E] mb-3 font-[Comfortaa]">Ongoing Improvements</h2>
                        <p>
                            We regularly review key user flows (including the waitlist, login, and onboarding experiences) and address accessibility issues as they are identified. We test with keyboard navigation and screen readers to ensure our site works for everyone.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#1E6B4E] mb-3 font-[Comfortaa]">Need Help or Have Feedback?</h2>
                        <p className="mb-4">
                            If you experience difficulty using our site or have suggestions on how we can improve accessibility, please contact us and we’ll work with you to provide the information or service you need.
                        </p>
                        <Link
                            to="/contact"
                            className="inline-block px-6 py-3 bg-[#1E6B4E] text-white font-semibold rounded-xl hover:bg-[#165a40] transition-colors"
                        >
                            Contact Us
                        </Link>
                    </section>

                    <div className="pt-8 border-t border-[#e8e4de] text-sm text-[#1E6B4E]/70">
                        Last updated: January 1, 2026
                    </div>
                </div>
            </div>
        </div>
    )
}
