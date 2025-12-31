import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const WhyOpeari = () => {
    return (
        <>
            <Helmet>
                <title>Why Opeari | Opeari</title>
                <meta
                    name="description"
                    content="Opeari helps you build a trusted care network with people you already know. Rebuild your village with friends, neighbors, and community-verified care."
                />
                <meta property="og:title" content="Why Opeari | Opeari" />
                <meta
                    property="og:description"
                    content="Opeari helps you build a trusted care network with people you already know. Rebuild your village with friends, neighbors, and community-verified care."
                />
                <meta name="twitter:title" content="Why Opeari | Opeari" />
                <meta
                    name="twitter:description"
                    content="Opeari helps you build a trusted care network with people you already know. Rebuild your village with friends, neighbors, and community-verified care."
                />
                <meta property="og:url" content="https://opeari.com/why-opeari" />
                <meta property="og:image" content="https://opeari.com/opeari-village-hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:image" content="https://opeari.com/opeari-village-hero.png" />
            </Helmet>

            {/* Hero */}
            <section className="bg-[#fffaf5] px-6 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-[#1e6b4e] mb-6 leading-tight">
                        It takes a village. <br className="hidden md:block" />
                        But ours have been dismantled.
                    </h1>
                    <p className="text-lg md:text-xl text-[#4A6163] max-w-2xl mx-auto leading-relaxed">
                        Opeari helps you build a care network you trust — with people you actually know.
                    </p>
                </div>
            </section>

            {/* The Problem */}
            <section className="px-6 py-16 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-8">The Reality</h2>
                    <div className="space-y-6 text-[#4A6163] text-lg leading-relaxed">
                        <p>
                            Childcare today feels heavier than it should.
                        </p>
                        <p>
                            Parents don’t start with a search engine — they start with a text. But those connections are fragile when life changes fast.
                        </p>
                        <p>
                            We’re raising children in isolation. We rely on strangers because our natural networks have frayed. The mental load of coordination is exhausting, and the "market" of available care rarely aligns with the reality of our lives.
                        </p>
                        <p className="font-medium text-[#1e6b4e]">
                            We believe there is a better way. One that doesn't just fill a slot, but actually rebuilds your support system.
                        </p>
                    </div>
                </div>
            </section>

            {/* What Opeari Is / Is Not */}
            <section className="px-6 py-16 bg-[#8bd7c7]/10">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">

                        {/* What It Is */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#1e6b4e]/10">
                            <h3 className="text-xl font-bold text-[#1e6b4e] mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-[#1e6b4e]/10 flex items-center justify-center text-[#1e6b4e] text-sm" aria-hidden="true"></span>
                                What Opeari Is
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { title: 'Private', desc: 'A closed network where you connect only with people you invite or are referred to.' },
                                    { title: 'Community-Built', desc: 'Powered by your existing circles—friends, neighbors, and local connections.' },
                                    { title: 'Reciprocal', desc: 'A space for families to trade care, share nannies, and support each other.' },
                                    { title: 'Transparent', desc: 'See exactly who knows whom, removing the guesswork from trust.' }
                                ].map((item) => (
                                    <li key={item.title} className="flex flex-col gap-1">
                                        <span className="font-bold text-[#1e6b4e]">{item.title}</span>
                                        <span className="text-[#4A6163] text-sm leading-relaxed">{item.desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* What It Is Not */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#1e6b4e]/10">
                            <h3 className="text-xl font-bold text-[#1e6b4e] mb-6 flex items-center gap-3 opacity-90">
                                <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-800 text-sm" aria-hidden="true"></span>
                                What Opeari Is Not
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { title: 'Not a Marketplace', desc: "We don't sell your data or treat care like a commodity." },
                                    { title: 'Not an Agency', desc: "We don't take a cut of your caregiver's pay or dictate terms." },
                                    { title: 'Not a Public Job Board', desc: 'No scrolling through hundreds of stranger profiles.' },
                                    { title: 'Not Another Social Feed', desc: 'No noise, no ads, just the tools to manage care.' }
                                ].map((item) => (
                                    <li key={item.title} className="flex flex-col gap-1">
                                        <span className="font-bold text-[#555]">{item.title}</span>
                                        <span className="text-[#666] text-sm leading-relaxed">{item.desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="px-6 py-16 bg-white">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-12 text-center">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { step: '1', title: 'Build Your Circle', desc: 'Invite friends, neighbors, and caregivers you already know.' },
                            { step: '2', title: 'Discover Connections', desc: 'See who your friends trust and find recommended caregivers.' },
                            { step: '3', title: 'Coordinate & Share', desc: 'Easily schedule care, share a nanny, or swap sitting duties.' },
                            { step: '4', title: 'Manage Details', desc: 'Handle logistics, schedules, and agreements in one place.' }
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-10 h-10 rounded-full bg-[#1e6b4e] text-white flex items-center justify-center mx-auto mb-4 font-bold">
                                    {item.step}
                                </div>
                                <h4 className="font-bold text-[#1e6b4e] mb-2">{item.title}</h4>
                                <p className="text-[#4A6163] text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust & Safety */}
            <section className="px-6 py-16 bg-[#1e6b4e] text-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">Trust & Safety</h2>
                    <p className="text-lg opacity-90 mb-8 leading-relaxed">
                        Trust isn't an algorithm; it's a relationship.
                    </p>
                    <div className="space-y-6 text-white/90 text-lg leading-relaxed mb-8">
                        <p>
                            We are actively building verification tools like background checks and certifications to give you confidence in your network. We are transparent about what is built today versus what is coming soon.
                        </p>
                        <p>
                            But our core safety feature remains <span className="font-bold text-white">context</span>: knowing that a caregiver is vouched for by a family you know. We provide the structure for you to make informed, confident decisions about who enters your home.
                        </p>
                    </div>
                    <p className="font-medium text-[#8bd7c7]">
                        We’ll always be clear about what Opeari can and cannot verify — so you’re never guessing.
                    </p>
                </div>
            </section>

            {/* Who Opeari Is For */}
            <section className="px-6 py-16 bg-[#fffaf5]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e6b4e] mb-12 text-center">Who Opeari Is For</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: 'Families', desc: 'Who need flexible, trusted support and want to break free from the isolation of modern parenting.' },
                            { title: 'Caregivers', desc: 'Who value dignity, fair relationships, and working with families that respect their profession.' },
                            { title: 'Communities', desc: 'Neighborhoods, schools, and friend groups that want to formalize their village and share the load.' }
                        ].map((group) => (
                            <div key={group.title} className="bg-white p-6 rounded-2xl shadow-sm border border-[#1e6b4e]/5 text-center">
                                <h4 className="font-bold text-[#1e6b4e] text-xl mb-3">{group.title}</h4>
                                <p className="text-[#4A6163] text-sm leading-relaxed">{group.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 py-20 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1e6b4e] mb-4">
                        Rebuild your village, one connection at a time.
                    </h2>
                    <p className="text-lg text-[#4A6163] mb-8">
                        We’re opening Opeari to a small group of families and caregivers.
                    </p>
                    <Link
                        to="/waitlist"
                        className="inline-block bg-[#1e6b4e] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#165a40] transition-colors shadow-lg shadow-[#1e6b4e]/20"
                    >
                        Request an Invite
                    </Link>
                </div>
            </section>
        </>
    );
};

export default WhyOpeari;
