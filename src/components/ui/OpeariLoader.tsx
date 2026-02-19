interface OpeariLoaderProps {
    message?: string;
}

export default function OpeariLoader({ message = 'Loading...' }: OpeariLoaderProps) {
    return (
        <div
            className="flex flex-col items-center justify-center gap-4"
            role="status"
            aria-live="polite"
        >
            <div className="animate-pulse">
                <img src="/logo.svg" alt="Opeari" className="w-16 h-16 sm:w-20 sm:h-20 opacity-90" />
            </div>
            <p className="text-[#1e6b4e] font-medium text-sm animate-pulse font-serif">{message}</p>
        </div>
    );
}
