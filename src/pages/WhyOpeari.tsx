import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Users, Shield, Heart, Zap, Smile } from 'lucide-react';

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
                            src="/opeari-village-hero.png"
                            alt="A friendly village scene with Opeari characters"
                            className="w-full max-w-lg rounded-3xl"
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
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-2">Why Opeari</h2>
                    <p className="text-xl text-[#1e6b4e]/80 font-medium mb-10 max-w-2xl mx-auto">
                        Flexible, shared childcare — built locally, with people you trust.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6 text-left">
                        {[
                            { title: 'Flexible care', desc: 'Schedules change. Creates setups that adapt without starting over.', icon: <Zap className="w-6 h-6 text-[#1e6b4e]" /> },
                            { title: 'Easier connections', desc: 'Organize local connections in one place with context and clarity.', icon: <Users className="w-6 h-6 text-[#1e6b4e]" /> },
                            { title: 'Shared childcare', desc: 'Coordinate nannies, schedules, and care across families.', icon: <Heart className="w-6 h-6 text-[#1e6b4e]" /> },
                            { title: 'Parent-led', desc: 'Simple tools to coordinate care with people you already trust.', icon: <Smile className="w-6 h-6 text-[#1e6b4e]" /> },
                            { title: 'By parents, for parents', desc: 'Supporting how families help each other, making it easier to do well.', icon: <Shield className="w-6 h-6 text-[#1e6b4e]" /> }
                        ].map((item, i) => (
                            <div key={i} className="w-full md:w-[calc(33.33%-1.5rem)] min-w-[300px] bg-white p-6 rounded-2xl border border-transparent hover:-translate-y-0.5 hover:shadow-lg hover:border-[#8bd7c7] transition-all duration-300 group">
                                <div className="mb-4 bg-[#fffaf5] w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="font-bold text-[#1e6b4e] mb-2 text-xl">{item.title}</h3>
                                <p className="text-[#4A6163] leading-relaxed text-sm md:text-base">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-16 flex flex-col items-center justify-center">
                        <img
                            src="/opeari-why.png"
                            alt="From juggling responsibilities to relaxing with support"
                            className="w-full max-w-4xl h-auto object-contain mb-6"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <p className="text-lg md:text-xl text-[#4A6163] italic opacity-80">
                            From juggling everything → to a calmer care setup.
                        </p>
                    </div>
                </div>
            </section>

            {/* H2 — What We Believe */}
            <section className="px-6 py-16 bg-[#fffaf5]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-12 text-center">What We Believe</h2>
                    <div className="flex justify-center mb-10">
                        <img
                            src="/opeari-waving.png"
                            alt="Welcoming new friends to the village"
                            className="w-full max-w-sm rounded-2xl opacity-90"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { title: 'Flexibility is Freedom', desc: 'Life shifts. Care should too. We help families co-create care that adapts—not the other way around.' },
                            { title: 'Trust is Everything', desc: 'Care works best when it starts with people you know, or people your people know.' },
                            { title: 'Shared Care, Made Simple', desc: 'Nanny shares, backup swaps, carpools. Lower cost, higher connection, more support.' },
                            { title: 'Parents Know Best', desc: "We're not here to tell you how to parent—just to help you find the people who make parenting easier." }
                        ].map((item) => (
                            <div key={item.title} className="bg-white p-6 rounded-2xl shadow-sm border border-[#1e6b4e]/5 hover:-translate-y-0.5 hover:shadow-lg hover:border-[#8bd7c7] transition-all duration-300">
                                <h3 className="font-bold text-[#1e6b4e] text-xl mb-2">{item.title}</h3>
                                <p className="text-[#4A6163]">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* H2 — What Opeari Actually Does */}
            <section className="px-6 py-16 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-8">What Opeari Actually Does</h2>
                    <div className="text-left md:text-center space-y-4 text-[#4A6163] text-lg max-w-2xl mx-auto mb-10">
                        <ul className="space-y-4 md:space-y-0 md:flex md:flex-wrap md:justify-center md:gap-8">
                            <li className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-[#1e6b4e]" />
                                <span>Less time coordinating.</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-[#1e6b4e]" />
                                <span>Easier local connections.</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-[#1e6b4e]" />
                                <span>Shared care made sustainable.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="flex justify-center">
                        <img
                            src="/modern-village-text.jpg"
                            alt="The Modern Village concept"
                            className="w-full max-w-sm rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
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
                    <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-stretch">

                        {/* Is */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#1e6b4e]/10 h-full">
                            <h3 className="text-xl font-bold text-[#1e6b4e] mb-6 flex items-center gap-2 border-b border-[#1e6b4e]/10 pb-4">
                                <span className="bg-[#1e6b4e]/10 p-2 rounded-lg"><img src="/opeari-idea.png" className="w-6 h-6" alt="" /></span>
                                Opeari Is
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { title: 'Private', desc: 'Your network, your rules.' },
                                    { title: 'Community-Built', desc: 'Powered by real local circles.' },
                                    { title: 'Reciprocal', desc: 'Give help, get help.' },
                                    { title: 'Transparent', desc: 'Know who knows whom.' }
                                ].map(item => (
                                    <li key={item.title} className="flex flex-col p-3 -mx-3 rounded-lg hover:bg-[#8bd7c7]/10 transition-colors duration-200">
                                        <span className="font-bold text-[#1e6b4e]">{item.title}</span>
                                        <span className="text-sm text-[#4A6163]">{item.desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Is Not */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 opacity-90 h-full">
                            <h3 className="text-xl font-bold text-[#a64d4d] mb-6 flex items-center gap-2 border-b border-red-50 pb-4">
                                <span className="bg-red-50 p-2 rounded-lg text-red-400">✕</span>
                                Opeari Is Not
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { title: 'Marketplace', desc: "We don't sell access to people." },
                                    { title: 'Agency', desc: 'No middleman fees or rigid contracts.' },
                                    { title: 'Job Board', desc: 'No endless scrolling of strangers.' },
                                    { title: 'No noisy social feed', desc: 'No ads, no algorithms.' }
                                ].map(item => (
                                    <li key={item.title} className="flex flex-col p-3 -mx-3 rounded-lg hover:bg-red-50 transition-colors duration-200">
                                        <span className="font-bold text-[#555]">{item.title}</span>
                                        <span className="text-sm text-[#666]">{item.desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
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
                            src="/opeari-connect-new.png"
                            alt="Generations connecting"
                            className="w-64 h-auto object-contain opacity-90"
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
                            src="/opeari-family.png"
                            alt="The Opeari Family"
                            className="w-48 h-auto object-contain"
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
                </div>
            </section>
        </>
    );
};

export default WhyOpeari;
