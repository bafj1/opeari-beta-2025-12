import { Sprout } from 'lucide-react';

interface FeedHeaderProps {
    neighborhood: string;
    onCreateClick: () => void;
}

export default function FeedHeader({ neighborhood, onCreateClick }: FeedHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#d8f5e5] text-[#1e6b4e] p-1.5 rounded-full">
                        <Sprout size={16} />
                    </span>
                    <h2 className="font-bold text-[#1e6b4e] text-sm uppercase tracking-wider">Your Village Feed</h2>
                </div>
                <h1 className="text-2xl font-bold text-[#2d3748] font-comfortaa">
                    Happening in {neighborhood || 'your neighborhood'}
                </h1>
            </div>

            <button
                onClick={onCreateClick}
                className="bg-[#1e6b4e] text-white px-4 py-2 rounded-full font-bold shadow-sm hover:bg-[#155d42] transition-colors text-sm"
            >
                Post Update
            </button>
        </div>
    );
}
