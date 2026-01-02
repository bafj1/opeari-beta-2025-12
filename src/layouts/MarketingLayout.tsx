import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function MarketingLayout() {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash === '#main-content') {
            document.getElementById('main-content')?.focus();
        }
    }, [hash]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header forceGuest={true} />
            <main id="main-content" className="flex-grow focus:outline-none" tabIndex={-1}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
