export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-opeari-bg">
            <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Opeari Pear Icon */}
                <img src="/icon.svg" alt="Opeari" className="w-12 h-12 animate-pulse" />
            </div>
        </div>
    );
}
