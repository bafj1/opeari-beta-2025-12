import { Helmet } from 'react-helmet-async';

export default function HowItWorks() {
    return (
        <div className="container">
            <Helmet>
                <title>Opeari - How It Works</title>
                <meta name="description" content="Find, Match, Connect. Discover how easy it is to find compatible families and share trusted childcare in your neighborhood." />

                {/* Open Graph */}
                <meta property="og:title" content="Opeari - How It Works" />
                <meta property="og:description" content="Find, Match, Connect. Discover how easy it is to find compatible families and share trusted childcare in your neighborhood." />
                <meta property="og:image" content="https://opeari.com/opeari-village-hero.png" />
                <meta property="og:url" content="https://opeari.com/how-it-works" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Opeari - How It Works" />
                <meta name="twitter:description" content="Find, Match, Connect. Discover how easy it is to find compatible families and share trusted childcare in your neighborhood." />
                <meta name="twitter:image" content="https://opeari.com/opeari-village-hero.png" />
            </Helmet>
            <h1>How It Works</h1>
        </div>
    );
}
