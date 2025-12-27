export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-opeari-bg">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-opeari-mint rounded-full opacity-25"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-t-opeari-green rounded-full animate-spin"></div>
            </div>
        </div>
    );
}
