import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function MarketingLayout() {
    const location = useLocation();

    useEffect(() => {
        if (location.hash === '#main-content') {
            requestAnimationFrame(() => {
                document.getElementById('main-content')?.focus();
            });
        }
    }, [location.key]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header forceGuest={true} />
            <main id="main-content" className="flex-grow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e6b4e]" tabIndex={-1}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
