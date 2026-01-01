import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useState } from 'react';

// FAQ Data
const faqCategories = [
    {
        title: "What Opeari Is / Isn't",
        questions: [
            {
                q: "What is Opeari?",
                a: "Opeari is a private network that helps you build a support system with people you already know. Instead of searching strangers’ profiles, you use Opeari to organize care with friends, neighbors, and trusted connections. It’s a tool for formalizing your village, not a job board."
            },
            {
                q: "Is Opeari a marketplace or an agency?",
                a: "Neither. A marketplace sells access to strangers, and an agency manages caregivers for you. Opeari gives you the tools to manage your own network directly, without middleman fees or restrictive contracts. You stay in control of who you work with and how you arrange care."
            },
            {
                q: "How is this different from Facebook groups or texting friends?",
                a: "Facebook groups are chaotic and public, often filled with noise and unverified strangers. Text threads are great for quick chats but terrible for managing schedules and recurring needs. Opeari creates a calm, organized space specifically designed for the logistics of care, ensuring nothing slips through the cracks."
            }
        ]
    },
    {
        title: "Trust & Safety",
        questions: [
            {
                q: "How does trust work on Opeari?",
                a: "Trust on Opeari is built on context, not just ratings. You see exactly how you are connected to a caregiver—whether they are a friend’s nanny, a neighbor, or someone vouched for by your community. This transparency lets you make decisions based on real-world relationships, which is the strongest signal of safety."
            },
            {
                q: "Are background checks required?",
                a: "Background checks are optional but encouraged. During beta, we're prioritizing families and caregivers referred by existing members. We're building tools to let you request and view verified background checks directly in the platform."
            },
            {
                q: "What safety tools exist today vs what’s coming later?",
                a: "Today, safety relies on the transparency of your network—seeing who vouched for whom. We are actively building formal verification features, including identity checks and certification badges. We will always clearly label which profiles have completed these additional verification steps so you never have to guess."
            }
        ]
    },
    {
        title: "How It Works",
        questions: [
            {
                q: "Do I need a nanny share to use Opeari?",
                a: "No. While Opeari simplifies nanny shares, many families use it for solo care, occasional babysitting, or simply swapping help with neighbors. You can use the platform to manage whatever shape your support system takes."
            },
            {
                q: "What if I don't know anyone yet?",
                a: "Opeari is designed to help you discover the hidden connections around you. By inviting even one or two friends, you unlock their networks and see who they trust. We are also rolling out community features to help you meet local, likeminded families in your neighborhood or school."
            },
            {
                q: "How do care swaps or shared care work?",
                a: "Our platform handles the awkward logistics so you don't have to. You can set up care swaps (trading hours with a friend) or shared care arrangements (splitting a nanny’s time) with clear schedules and agreements. We provide the structure to keep these arrangements fair and sustainable for everyone."
            },
            {
                q: "Can caregivers join Opeari?",
                a: "Yes. Caregivers can create profiles, connect with families in their network, and manage their own schedules. Opeari treats caregivers as professionals, not commodities — you set your own terms and work directly with families."
            }
        ]
    },
    {
        title: "Beta & Access",
        questions: [
            {
                q: "Who can join Opeari right now?",
                a: "We are currently in a private beta, opening access to select communities and neighborhoods on a rolling basis. This allows us to ensure a high density of connections and a quality experience for early members. You can request an invite to be notified when your area opens up."
            },
            {
                q: "What does “beta” mean for features and access?",
                a: "Beta means the core features are working, but we are still polishing and adding new tools every week. You might encounter small bugs or changing layouts as we improve. Your feedback is critical during this time—you are helping shape the future of the platform."
            }
        ]
    },
    {
        title: "Cost",
        questions: [
            {
                q: "Is Opeari free? What does it cost?",
                a: "Opeari is currently free for early access members during our beta period. As we add premium features like automated payroll and advanced verifications, we will introduce membership tiers. We are committed to keeping the core networking tools accessible to families and caregivers."
            }
        ]
    }
];

const FAQItem = ({ question, answer, id }: { question: string; answer: string; id: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-[#1e6b4e]/10 rounded-2xl bg-white overflow-hidden transition-all duration-200">
            <button
                className="w-full relative flex items-center justify-between p-6 text-left focus:outline-none focus:bg-[#f8fcfb]"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${id}`}
                id={`faq-btn-${id}`}
            >
                <span className="text-lg font-bold text-[#1e6b4e] pr-8">{question}</span>
                <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-[#8bd7c7]/20 flex items-center justify-center text-[#1e6b4e] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            <div
                id={`faq-answer-${id}`}
                role="region"
                aria-labelledby={`faq-btn-${id}`}
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 pt-0 text-[#4A6163] leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const FAQ = () => {
    return (
        <>
            <Helmet>
                <title>FAQ | Opeari</title>
                <meta
                    name="description"
                    content="Common questions about Opeari. Learn about our private community model, trust & safety features, and how to build your village."
                />
                <meta property="og:title" content="FAQ | Opeari" />
                <meta
                    property="og:description"
                    content="Common questions about Opeari. Learn about our private community model, trust & safety features, and how to build your village."
                />
                <meta property="og:url" content="https://opeari.com/faq" />
                <meta property="og:image" content="https://opeari.com/opeari-village-hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="FAQ | Opeari" />
                <meta
                    name="twitter:description"
                    content="Common questions about Opeari. Learn about our private community model, trust & safety features, and how to build your village."
                />
                <meta name="twitter:image" content="https://opeari.com/opeari-village-hero.png" />
            </Helmet>

            {/* Hero */}
            <section className="bg-[#fffaf5] px-6 py-16 md:py-20 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold text-[#1e6b4e] mb-6">Frequently Asked Questions</h1>
                    <p className="text-lg text-[#4A6163] max-w-2xl mx-auto">
                        Everything you need to know about building your village with Opeari.
                    </p>
                </div>
            </section>

            {/* Questions Grid */}
            <section className="px-6 py-16 bg-white min-h-screen">
                <div className="max-w-3xl mx-auto space-y-12">
                    {/* Beta Note */}
                    <div className="bg-[#fffaf5] border border-[#1e6b4e]/10 rounded-2xl p-8">
                        <h2 className="text-xl font-bold text-[#1e6b4e] mb-4">A quick note about beta</h2>
                        <div className="text-[#4A6163] leading-relaxed space-y-4">
                            <p>
                                Opeari is launching intentionally, one community at a time.
                            </p>
                            <p>
                                During beta, we’re prioritizing family-to-family matching — helping parents align schedules and coordinate shared care like nanny shares, backup swaps, and ongoing support.
                            </p>
                            <p>
                                Caregiver tools and expanded verification (including background checks) are coming next. We’ll always be clear about what’s live and what’s on the roadmap.
                            </p>
                        </div>
                    </div>
                    {faqCategories.map((category, catIdx) => (
                        <div key={catIdx}>
                            <h2 className="text-xl font-bold text-[#1e6b4e]/80 mb-6 uppercase tracking-wide text-sm pl-2 border-l-4 border-[#8bd7c7]">
                                {category.title}
                            </h2>
                            <div className="space-y-4">
                                {category.questions.map((item, qIdx) => (
                                    <FAQItem
                                        key={qIdx}
                                        id={`cat-${catIdx}-q-${qIdx}`}
                                        question={item.q}
                                        answer={item.a}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact / CTA */}
            <section className="px-6 py-20 bg-[#f8fcfb] text-center border-t border-[#1e6b4e]/5">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-4">Still have questions?</h2>
                    <p className="text-[#4A6163] mb-8">
                        We’re here to help. Reach out to our team or request an invite to see exactly how it works.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/waitlist"
                            className="bg-[#1e6b4e] text-white px-8 py-3 rounded-full font-bold hover:bg-[#165a40] transition-colors shadow-lg shadow-[#1e6b4e]/20"
                        >
                            Request Invite
                        </Link>
                        <a
                            href="mailto:breada@opeari.com"
                            className="bg-white text-[#1e6b4e] border border-[#1e6b4e]/20 px-8 py-3 rounded-full font-bold hover:bg-[#f0f9f6] transition-colors"
                        >
                            Email Us
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
};

export default FAQ;
