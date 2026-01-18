import { Car, Home, Heart, Calendar, Users, Briefcase } from 'lucide-react';

interface VillageTileProps {
    icon: React.ReactNode;
    label: string;
    subtext?: string;
    color: string; // Tailwind color class for icon bg or text
    onClick: () => void;
    selected: boolean;
}

function VillageTile({ icon, label, subtext, color, onClick, selected }: VillageTileProps) {
    // Extract base color name (e.g. 'bg-amber-400' -> 'amber') to apply soft tints
    // This is a quick heuristic since we are passing full Tailwind classes
    // We'll trust the passed color for the icon, but use standard Opeari surfaces for the tile

    return (
        <button
            onClick={onClick}
            className={`
                relative flex items-center gap-3 p-4 rounded-[24px] transition-all duration-300 text-left w-full group overflow-hidden
                ${selected
                    ? 'bg-stone-50 ring-1 ring-opeari-green shadow-md'
                    : 'bg-white shadow-card hover:shadow-lg hover:-translate-y-[1px] hover:scale-[1.01]'
                }
            `}
        >
            {/* Glossy Icon Chip - Softer opacity (now using direct bg/text classes) */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} shadow-sm transition-transform shrink-0 ${selected ? 'scale-105' : 'group-hover:scale-105'}`}>
                <div className="opacity-90">
                    {icon}
                </div>
            </div>

            <div className="flex flex-col relative z-10">
                <span className={`font-bold text-[15px] leading-tight ${selected ? 'text-opeari-heading' : 'text-stone-600 group-hover:text-opeari-heading'} transition-colors`}>
                    {label}
                </span>
                {subtext && (
                    <span className="text-xs text-stone-400 font-medium mt-1 leading-relaxed">{subtext}</span>
                )}
            </div>

            {/* Selected Indicator - Subtle Background Glow instead of explicit dot if preferred, or keep dot */}
            {selected && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-opeari-green rounded-full shadow-sm"></div>
            )}
        </button>
    )
}

interface VillageHomeProps {
    userName?: string;
    selectedNeeds: string[];
    onToggleNeed: (id: string) => void;
}

export default function VillageHome({ userName = "Breada", selectedNeeds, onToggleNeed }: VillageHomeProps) {

    const needs = [
        { id: 'part-time', label: 'Part-time help', icon: <Heart size={22} />, color: 'bg-amber-100 text-amber-700' },
        { id: 'backup', label: 'Backup care', icon: <Calendar size={22} />, color: 'bg-rose-100 text-rose-700' },
        { id: 'nanny-share', label: 'Nanny share', icon: <Users size={22} />, color: 'bg-emerald-100 text-emerald-700' },
        { id: 'school-runs', label: 'School runs', icon: <Car size={22} />, color: 'bg-blue-100 text-blue-700' },
        { id: 'helper', label: 'Helper at home', subtext: 'Light chores, laundry, tidying', icon: <Home size={22} />, color: 'bg-indigo-100 text-indigo-700' },
        { id: 'short-term', label: 'Travel / Short-term', icon: <Briefcase size={22} />, color: 'bg-lime-100 text-lime-700' },
    ];

    return (
        <div className="relative w-full bg-[#fffaf5] rounded-[32px] p-8 md:p-12 overflow-hidden shadow-card border border-stone-100/50">

            {/* Background Decor - Keeping subtle but updating colors */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-opeari-peach/5 to-transparent rounded-bl-full pointer-events-none blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-opeari-mint/10 to-transparent rounded-tr-full pointer-events-none blur-3xl"></div>

            <div className="relative z-10 max-w-2xl mx-auto text-center mb-12">
                <h1 className="text-3xl md:text-5xl font-bold text-opeari-heading mb-4 tracking-tight">
                    Welcome back, {userName}.
                </h1>
                <p className="text-opeari-text-secondary font-medium text-lg md:text-xl">
                    What does your village need right now?
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {needs.map(need => (
                    <VillageTile
                        key={need.id}
                        label={need.label}
                        icon={need.icon}
                        color={need.color}
                        selected={selectedNeeds.includes(need.id)}
                        onClick={() => onToggleNeed(need.id)}
                    />
                ))}
            </div>

        </div>
    );
}
