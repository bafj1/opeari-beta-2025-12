import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { FamilyMatch } from '../../lib/matching';

interface SmartStackProps {
    title: string;
    subtitle?: string;
    matches: FamilyMatch[];
    emptyMessage?: string;
    viewAllLink?: string;
}

export default function SmartStack({ title, subtitle, matches, viewAllLink }: SmartStackProps) {
    if (matches.length === 0) return null; // Don't show empty stacks for clean look, or use placeholder if critical

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="font-bold text-xl text-opeari-heading">{title}</h3>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                {viewAllLink && (
                    <Link to={viewAllLink} className="text-opeari-green font-bold text-sm bg-[#e8f5f0] px-3 py-1 rounded-full hover:bg-[#d1eadd] transition-colors">
                        View All
                    </Link>
                )}
            </div>

            <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {matches.map(match => (
                    <Link
                        key={match.id}
                        to={`/member/${match.id}`}
                        className="snap-center shrink-0 w-72 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover border border-gray-100 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-opeari-mint flex items-center justify-center text-lg border-2 border-white shadow-sm overflow-hidden">
                                    {match.photo_url ? (
                                        <img src={match.photo_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{match.first_name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-opeari-heading group-hover:text-opeari-green transition-colors">{match.first_name}</h4>
                                    <p className="text-xs text-gray-400">{match.neighborhood}</p>
                                </div>
                            </div>
                            <span className="bg-opeari-green text-white text-xs font-bold px-2 py-1 rounded-full">
                                {match.compatibility}%
                            </span>
                        </div>

                        {/* Reasons Pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3 h-12 overflow-hidden content-start">
                            {match.matchReasons.slice(0, 3).map((r, i) => (
                                <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-md border ${r.highlight ? 'bg-[#f0faf4] text-opeari-green border-[#1e6b4e]/20' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    {r.text}
                                </span>
                            ))}
                            {match.matchReasons.length > 3 && (
                                <span className="text-[10px] text-gray-400 px-1 py-1">+ {match.matchReasons.length - 3}</span>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                            <span className="text-xs text-gray-400">
                                {match.kids.length} kids • {match.overlapDays.length} days overlap
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#F8C3B3] text-[#1e6b4e] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={16} strokeWidth={3} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
