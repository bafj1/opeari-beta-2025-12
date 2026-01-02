import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function AppLayout() {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash === '#main-content') {
            document.getElementById('main-content')?.focus();
        }
    }, [hash]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main id="main-content" className="flex-grow pt-24 focus:outline-none" tabIndex={-1}>
                {/* pt-24 to account for fixed header in app mode generally, check global styles if necessary */}
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
