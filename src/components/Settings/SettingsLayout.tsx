import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    icon: any;
}

interface SettingsLayoutProps {
    activeTab: string;
    onTabChange: (id: string) => void;
    tabs: Tab[];
    children: React.ReactNode;
}

export default function SettingsLayout({ activeTab, onTabChange, tabs, children }: SettingsLayoutProps) {
    const activeTabDetails = tabs.find(t => t.id === activeTab);

    return (
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 animate-fade-in">

            {/* SIDEBAR NAVIGATION (Desktop) */}
            <nav className="hidden md:block w-64 flex-shrink-0 space-y-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left
                ${isActive
                                    ? 'bg-white shadow-sm border border-gray-100 text-opeari-heading font-bold'
                                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-700 font-medium'
                                }`}
                        >
                            <span className={`${isActive ? 'text-opeari-green' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                <Icon size={20} />
                            </span>
                            <span>{tab.label}</span>
                            {isActive && (
                                <ChevronRight size={16} className="ml-auto text-opeari-green" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* MOBILE NAVIGATION (Mobile) */}
            <nav className="md:hidden">
                <div className="relative">
                    <select
                        value={activeTab}
                        onChange={(e) => onTabChange(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 text-opeari-heading font-bold py-3 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-opeari-green/20 focus:border-opeari-green"
                    >
                        {tabs.map((tab) => (
                            <option key={tab.id} value={tab.id}>
                                {tab.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <ChevronRight className="rotate-90" size={20} />
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 min-w-0">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                    <div className="mb-6 pb-6 border-b border-gray-50">
                        <h2 className="text-2xl font-bold text-opeari-heading flex items-center gap-2">
                            {activeTabDetails?.icon && <activeTabDetails.icon className="text-opeari-green" size={24} />}
                            {activeTabDetails?.label}
                        </h2>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
