import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

export const StepHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold text-opeari-heading mb-2">{title}</h2>
        <p className="text-gray-500">{subtitle}</p>
    </div>
);

export const Input = ({ label, value, onChange, type = 'text', required, placeholder, subtext, maxLength }: any) => (
    <div className="w-full">
        <label className="block text-xs font-bold text-opeari-heading uppercase tracking-wide mb-1.5">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-opeari-border/50 rounded-xl focus:ring-2 focus:ring-opeari-green focus:outline-none focus:border-transparent transition-all"
            placeholder={placeholder}
            maxLength={maxLength}
        />
        {subtext && <p className="text-[11px] text-gray-500 mt-1">{subtext}</p>}
    </div>
);

export const InfoBanner = ({ children }: { children: ReactNode }) => (
    <div className="bg-[#f0faf4] border-l-4 border-opeari-heading p-4 rounded-r-lg">
        <p className="text-opeari-heading text-sm leading-relaxed">{children}</p>
    </div>
);

export const SelectionCard = ({ icon: Icon, label, desc, selected, onClick, isCheckboxStyle }: any) => (
    <div onClick={onClick} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden h-full ${selected ? 'border-opeari-green bg-[#f0faf4] shadow-sm' : 'border-gray-200 bg-white hover:border-opeari-mint hover:shadow-sm'}`}>
        {isCheckboxStyle ? (
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-[#1e6b4e] border-[#1e6b4e]' : 'border-gray-300'}`}>
                <Check size={14} className={`text-white transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} />
            </div>
        ) : (
            <div className={`p-2.5 rounded-lg flex-shrink-0 transition-colors ${selected ? 'bg-opeari-green text-white' : 'bg-[#F5F1EB] text-opeari-heading'}`}>
                <Icon size={20} strokeWidth={2} />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="font-bold text-opeari-heading text-[14px] leading-tight break-words pr-2">{label}</p>
            {desc && <p className="text-xs text-gray-500 leading-tight mt-0.5 line-clamp-2">{desc}</p>}
        </div>
        {selected && !isCheckboxStyle && <div className="absolute top-2 right-2"><Check size={16} className="text-opeari-green" /></div>}
    </div>
);
