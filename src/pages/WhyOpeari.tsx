import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const WhyOpeari = () => {
    return (
        <>
            <Helmet>
                <title>Why Opeari | Build Your Childcare Village Locally</title>
                <meta
                    name="description"
                    content="Opeari helps parents build trusted, local childcare networks — from nanny shares to backup care — without agencies or strangers."
                />

                {/* Open Graph / Social */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://opeari.com/why-opeari" />
                <meta property="og:title" content="Why Opeari | Build Your Childcare Village Locally" />
                <meta property="og:description" content="Opeari helps parents build trusted, local childcare networks — from nanny shares to backup care — without agencies or strangers." />
                <meta property="og:image" content="https://opeari.com/opeari-parents-happy.png" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://opeari.com/why-opeari" />
                <meta name="twitter:title" content="Why Opeari | Build Your Childcare Village Locally" />
                <meta name="twitter:description" content="Opeari helps parents build trusted, local childcare networks — from nanny shares to backup care — without agencies or strangers." />
                <meta name="twitter:image" content="https://opeari.com/opeari-parents-happy.png" />
            </Helmet>

            {/* H1 — HERO */}
            <section className="bg-[#fffaf5] px-6 py-16 md:py-24 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold text-[#1e6b4e] mb-6 leading-tight">
                        It takes a village. <br className="hidden md:block" />
                        Let’s help you build yours.
                    </h1>
                    <p className="text-xl md:text-2xl text-[#4A6163] max-w-2xl mx-auto leading-relaxed mb-10">
                        Childcare, reimagined for modern parents — flexible, shared, and built with people you trust.
                    </p>

                    {/* Illustration: Hero */}
                    <div className="flex justify-center mb-8">
                        <img
                            src="/opeari-parents-happy.png"
                            alt="Happy parents finding balance"
                            className="w-full max-w-lg rounded-3xl shadow-sm"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* H2 — Why We’re Here */}
            <section className="px-6 py-16 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-6">Why We’re Here</h2>
                    <div className="space-y-6 text-[#4A6163] text-lg leading-relaxed">
                        <p>
                            Parenting wasn't meant to be done alone. Yet somewhere along the way, we traded our villages for isolation.
                        </p>
                        <p>
                            Opeari exists to bring the village back. We connect families who live near each other to share care, cover gaps, and build the kind of trust that makes raising kids a little lighter.
                        </p>
                        <p>
                            No agencies. No algorithms. Just neighbors helping neighbors.
                        </p>
                    </div>
                    <div className="flex justify-center mt-10">
                        <img
                            src="/opeari-work-juggle.png"
                            alt="Balancing work and care"
                            className="w-full max-w-md rounded-2xl"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* H2 — What We Believe */}
            <section className="px-6 py-16 bg-[#fffaf5]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-12 text-center">What We Believe</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { title: 'Flexibility is Freedom', desc: 'Life shifts. Care should too. We help families co-create care that adapts—not the other way around.' },
                            { title: 'Trust is Everything', desc: 'Care works best when it starts with people you know, or people your people know.' },
                            { title: 'Sharing Makes Sense', desc: 'Nanny shares, backup swaps, carpools. Lower cost, higher connection, more support.' },
                            { title: 'Parents Know Best', desc: "We're not here to tell you how to parent—just to help you find the people who make parenting easier." }
                        ].map((item) => (
                            <div key={item.title} className="bg-white p-6 rounded-2xl shadow-sm border border-[#1e6b4e]/5">
                                <h3 className="font-bold text-[#1e6b4e] text-xl mb-2">{item.title}</h3>
                                <p className="text-[#4A6163]">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-12">
                        <img
                            src="/opearis-happy.png"
                            alt="Happy community"
                            className="w-full max-w-sm rounded-2xl opacity-90"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* H2 — What Opeari Actually Does */}
            <section className="px-6 py-16 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-8">What Opeari Actually Does</h2>
                    <div className="text-left md:text-center space-y-4 text-[#4A6163] text-lg max-w-2xl mx-auto">
                        <ul className="space-y-4 list-disc list-inside md:list-none">
                            <li>Less time coordinating and searching.</li>
                            <li>Easier local connections.</li>
                            <li>Shared care made sustainable.</li>
                        </ul>
                    </div>
                    <div className="flex justify-center mt-10">
                        <img
                            src="/opeari-working.png"
                            alt="Opeari in action"
                            className="w-full max-w-md rounded-2xl shadow-sm"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* H2 — What Opeari Is / Is Not */}
            <section className="px-6 py-16 bg-[#8bd7c7]/10">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-10 text-center">What We Are</h2>
                    <div className="grid md:grid-cols-2 gap-12">

                        {/* Is */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#1e6b4e]/10">
                            <h3 className="text-xl font-bold text-[#1e6b4e] mb-6 flex items-center gap-2">
                                Opeari Is
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex flex-col"><span className="font-bold text-[#1e6b4e]">Private</span><span className="text-sm text-[#4A6163]">Your network, your rules.</span></li>
                                <li className="flex flex-col"><span className="font-bold text-[#1e6b4e]">Community-Built</span><span className="text-sm text-[#4A6163]">Powered by real local circles.</span></li>
                                <li className="flex flex-col"><span className="font-bold text-[#1e6b4e]">Reciprocal</span><span className="text-sm text-[#4A6163]">Give help, get help.</span></li>
                                <li className="flex flex-col"><span className="font-bold text-[#1e6b4e]">Transparent</span><span className="text-sm text-[#4A6163]">Know who knows whom.</span></li>
                            </ul>
                        </div>

                        {/* Is Not */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#1e6b4e]/10 opacity-90">
                            <h3 className="text-xl font-bold text-[#555] mb-6 flex items-center gap-2">
                                Opeari Is Not
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex flex-col"><span className="font-bold text-[#555]">Marketplace</span><span className="text-sm text-[#666]">We don't sell access to people.</span></li>
                                <li className="flex flex-col"><span className="font-bold text-[#555]">Agency</span><span className="text-sm text-[#666]">No middleman fees or rigid contracts.</span></li>
                                <li className="flex flex-col"><span className="font-bold text-[#555]">Job Board</span><span className="text-sm text-[#666]">No endless scrolling of strangers.</span></li>
                                <li className="flex flex-col"><span className="font-bold text-[#555]">Social Feed</span><span className="text-sm text-[#666]">No ads, no noise, just tools.</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex justify-center mt-12">
                        <img
                            src="/opeari-work.png"
                            alt="Focused work"
                            className="w-full max-w-sm rounded-2xl"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* H2 — Trust & Safety */}
            <section className="px-6 py-16 bg-[#1e6b4e] text-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">Trust & Safety</h2>
                    <p className="text-lg opacity-90 mb-6 leading-relaxed">
                        Trust starts with context — not just profiles.
                    </p>
                    <p className="text-lg opacity-90 mb-6 leading-relaxed">
                        We begin with family-led connections and referrals, and we’re building toward expanded verification tools as Opeari grows.
                    </p>
                    <p className="text-lg opacity-90 mb-8 leading-relaxed">
                        We’re always clear about what’s available today and what’s coming next — so families are never guessing.
                    </p>
                    <div className="flex justify-center mt-8">
                        <img
                            src="/opeari-yellow.png"
                            alt="Trust signal"
                            className="w-24 h-24 object-contain opacity-90"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* H2 — Why “Opeari” */}
            <section className="px-6 py-16 bg-[#fffaf5]">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-6">Why “Opeari”?</h2>
                    <p className="text-[#4A6163] text-lg leading-relaxed">
                        A nod to au pair. A wink at pairing families. And a pear designed to flex — just like modern family life.
                    </p>
                    <div className="flex justify-center mt-10">
                        <img
                            src="/opeari-pink.png"
                            alt="Opeari Brand"
                            className="w-32 object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="px-6 py-20 bg-white border-t border-gray-100">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1e6b4e] mb-4">
                        Ready to build your village?
                    </h2>
                    <p className="text-lg text-[#4A6163] mb-10">
                        We’re opening intentionally, one community at a time.
                    </p>
                    <Link
                        to="/waitlist"
                        className="inline-block bg-[#1e6b4e] text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#165a40] transition-transform hover:-translate-y-1 shadow-lg shadow-[#1e6b4e]/20"
                    >
                        Join the Waitlist
                    </Link>
                    <div className="flex justify-center mt-12">
                        <img
                            src="/opeari-contact.png"
                            alt="Contact us"
                            className="w-full max-w-xs opacity-80"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            </section>
        </>
    );
};

export default WhyOpeari;
