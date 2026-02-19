import { ArrowRight, Check } from 'lucide-react';

export function EmptyStateBanner() {
    return (

        <div className="relative overflow-hidden bg-gradient-to-r from-[#fffaf5] via-white to-green-50 rounded-card p-8 shadow-card">
            <div className="relative z-10 max-w-lg">
                <h2 className="text-2xl font-bold text-opeari-heading mb-2">Your village is just getting started.</h2>
                <p className="text-opeari-text mb-6 font-medium">You're early—and that's a good thing.</p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-button font-bold text-opeari-heading shadow-button border border-stone-200/50 hover:bg-stone-50 hover:border-stone-300 transition-all hover:-translate-y-0.5">
                        Complete Your Village Setup
                        <ArrowRight size={16} className="text-opeari-text-secondary group-hover:text-opeari-heading" />
                    </button>
                </div>
                <p className="mt-4 text-xs font-medium text-opeari-text-secondary">
                    or <span className="underline cursor-pointer hover:text-opeari-heading">invite someone you trust</span> to join.
                </p>
            </div>

            {/* Abstract Illustration Decor */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 pointer-events-none opacity-50">
                <div className="absolute bottom-[-20px] right-[20%] w-32 h-40 bg-opeari-green/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-[20px] right-[10%] w-24 h-24 bg-opeari-peach/30 rounded-full blur-xl"></div>
            </div>
        </div>
    );
}

export function SuccessStateBanner() {
    return (
        <div className="relative overflow-hidden bg-white rounded-card p-8 shadow-card flex items-center justify-between">
            <div className="relative z-10 flex items-center gap-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <div className="w-16 h-16 bg-opeari-green rounded-2xl rotate-12 flex items-center justify-center shadow-lg">
                        <Check size={32} className="text-white -rotate-12" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-opeari-heading mb-1">You've started your village.</h2>
                    <p className="text-opeari-text font-medium mb-4">This is how it begins.</p>
                    <button className="px-8 py-2.5 bg-opeari-peach hover:bg-opeari-peach/90 text-opeari-heading font-bold rounded-button shadow-button transition-all transform active:scale-95">
                        Great!
                    </button>
                </div>
            </div>

            {/* Decor */}
            <div className="absolute left-0 top-0 bottom-0 w-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-opeari-peach/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-blue-100/30 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
}
