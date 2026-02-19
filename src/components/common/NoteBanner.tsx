import { Info } from 'lucide-react';

interface NoteBannerProps {
    title?: string;
    children: React.ReactNode;
}

export default function NoteBanner({ title, children }: NoteBannerProps) {
    return (
        <div className="bg-opeari-mint/10 border border-opeari-mint/20 rounded-xl p-5 flex gap-4">
            <div className="shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-opeari-green" />
            </div>
            <div className="text-sm text-opeari-heading">
                {title && <h4 className="font-bold mb-1">{title}</h4>}
                <div className="leading-relaxed opacity-90">
                    {children}
                </div>
            </div>
        </div>
    );
}
