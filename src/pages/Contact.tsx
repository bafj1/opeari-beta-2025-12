import { Helmet } from 'react-helmet-async'

export default function Contact() {
    return (
        <div className="min-h-screen bg-[#fffaf5] pt-32 pb-20 px-6">
            <Helmet>
                <title>Opeari - Contact Us</title>
                <meta name="description" content="Contact Opeari support. We're here to help you build your childcare village." />
            </Helmet>

            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-[#1E6B4E] mb-6 font-[Comfortaa]">
                    Get in Touch
                </h1>

                <p className="text-lg text-[#5a6e5a] mb-10 leading-relaxed max-w-lg mx-auto">
                    Have a question, feedback, or need support? We're here to help. Reach out to us directly via email.
                </p>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#e8e4de] inline-block">
                    <p className="font-semibold text-[#1E6B4E] mb-4">Support Team</p>
                    <a
                        href="mailto:support@opeari.com"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[#1E6B4E] text-white font-bold rounded-xl hover:bg-[#165a40] transition-all hover:scale-105"
                    >
                        Email Support
                    </a>
                    <p className="text-sm text-[#8faaaa] mt-4">
                        We typically respond within 24 hours.
                    </p>
                </div>
            </div>
        </div>
    )
}
