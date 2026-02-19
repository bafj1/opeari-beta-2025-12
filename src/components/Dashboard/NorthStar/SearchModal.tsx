import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X } from 'lucide-react';

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setSearching(true);
        try {
            // Search members by name
            const { data } = await supabase
                .from('members')
                .select('id, first_name, last_name, avatar_url, role, neighborhood')
                .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                .eq('onboarding_complete', true)
                .eq('privacy_appear_in_search', true)
                .limit(10);

            setResults(data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
        }
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-[20px] max-w-lg w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search members..."
                            className="w-full px-4 py-3 rounded-[15px] border border-gray-200 focus:border-[#1e6b4e] focus:outline-none text-sm"
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#546E5C] hover:text-[#1e6b4e]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                    {searching ? (
                        <div className="text-center py-8 text-[#546E5C]">Searching...</div>
                    ) : results.length > 0 ? (
                        <div className="space-y-2">
                            {results.map(member => (
                                <button
                                    key={member.id}
                                    className="w-full flex items-center gap-3 p-3 rounded-[12px] hover:bg-[#d8f5e5]/50 transition-all text-left"
                                    onClick={() => {
                                        // Could trigger profile view here
                                        console.log('View profile:', member.id);
                                        onClose();
                                    }}
                                >
                                    <img
                                        src={member.avatar_url || `https://via.placeholder.com/40?text=${member.first_name?.[0]}`}
                                        alt={member.first_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold text-[#1e6b4e]">
                                            {member.first_name} {member.last_name?.[0]}.
                                        </p>
                                        <p className="text-xs text-[#546E5C]">
                                            {member.role} • {member.neighborhood || 'Nearby'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query && !searching ? (
                        <div className="text-center py-8 text-[#546E5C]">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Search for families, caregivers, or neighbors
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
