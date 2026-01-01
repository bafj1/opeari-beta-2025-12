import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function AppLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow pt-24">
                {/* pt-24 to account for fixed header in app mode generally, check global styles if necessary */}
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
