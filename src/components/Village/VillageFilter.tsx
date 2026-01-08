import type { PostType } from '../../types/FeedTypes';

interface VillageFilterProps {
    currentFilter: PostType | 'all';
    onFilterChange: (filter: PostType | 'all') => void;
}

export default function VillageFilter({ currentFilter, onFilterChange }: VillageFilterProps) {
    const filters: { id: PostType | 'all'; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'question', label: 'Questions' },
        { id: 'availability', label: 'Availability' },
        { id: 'share', label: 'Shared Care' },
        { id: 'win', label: 'Wins' },
    ];

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {filters.map(f => (
                <button
                    key={f.id}
                    onClick={() => onFilterChange(f.id)}
                    className={`
                        px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                        ${currentFilter === f.id
                            ? 'bg-opeari-heading text-white shadow-md'
                            : 'bg-white text-opeari-text border border-opeari-border hover:bg-opeari-mint/30'
                        }
                    `}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}
