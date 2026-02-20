import React from 'react';
import { Link } from 'react-router-dom';
import {
    ChevronLeft,
    User,
    Calendar,
    Bell,
    Target,
    Shield,
    Star,
    Lock,
    Baby,
    Eye,
    MessageSquare,
    Home
} from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

interface SettingsLayoutProps {
    activeTab: string;
    onTabChange: (id: string) => void;
    children: React.ReactNode;
}

import { useViewer } from '../../hooks/useViewer';

const navSections: NavSection[] = [
    {
        title: 'SETTINGS',
        items: [
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'children', label: 'Children', icon: Baby },
            { id: 'home', label: 'Home Details', icon: Home },
            { id: 'schedule', label: 'Schedule & Availability', icon: Calendar },
        ],
    },
    {
        title: 'MY ACCOUNT',
        items: [
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'account', label: 'Account & Security', icon: Lock },
            { id: 'privacy', label: 'Privacy', icon: Eye },
        ],
    },
    {
        title: 'MATCHING',
        items: [
            { id: 'preferences', label: 'Matching Preferences', icon: Target },
            { id: 'reviews', label: 'Reviews & Reputation', icon: Star },
        ],
    },
    {
        title: 'TRUST & SAFETY',
        items: [
            { id: 'safety', label: 'Safety & Verification', icon: Shield },
        ],
    },
    {
        title: 'SUPPORT',
        items: [
            { id: 'feedback', label: 'Share Feedback', icon: MessageSquare },
        ],
    },
];

export default function SettingsLayout({ activeTab, onTabChange, children }: SettingsLayoutProps) {
    const { viewer } = useViewer();
    const isCaregiver = viewer?.member?.role === 'caregiver';

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#e8f5f1] to-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <Link
                        to="/village"
                        className="inline-flex items-center gap-2 text-[#1e6b4e] hover:text-[#155a3e] transition-colors mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Village</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1e6b4e] mb-2">Settings</h1>
                    <p className="text-sm sm:text-base text-[#546E5C]">Manage your account and preferences</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Navigation - Desktop */}
                    <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                        <div className="bg-white border-2 border-[#8bd7c7]/30 rounded-[20px] p-4 shadow-sm sticky top-6">
                            <nav className="space-y-6">
                                {navSections.map((section) => (
                                    <div key={section.title}>
                                        <h3 className="text-xs font-bold text-[#546E5C] mb-2 px-3 uppercase tracking-wide">
                                            {section.title}
                                        </h3>
                                        <ul className="space-y-1">
                                            {section.items.map((item) => {
                                                if ((item.id === 'children' || item.id === 'home') && isCaregiver) return null;
                                                const Icon = item.icon;
                                                const isActive = activeTab === item.id;
                                                return (
                                                    <li key={item.id}>
                                                        <button
                                                            onClick={() => onTabChange(item.id)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[15px] transition-all text-left ${isActive
                                                                ? 'bg-[#8bd7c7]/20 text-[#1e6b4e] font-semibold'
                                                                : 'text-[#546E5C] hover:bg-[#8bd7c7]/10 hover:text-[#1e6b4e]'
                                                                }`}
                                                        >
                                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                                            <span className="text-sm">{item.label}</span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Mobile Navigation */}
                    <nav className="lg:hidden">
                        <select
                            value={activeTab}
                            onChange={(e) => onTabChange(e.target.value)}
                            className="w-full bg-white border-2 border-[#8bd7c7]/30 text-[#1e6b4e] font-semibold py-3 px-4 rounded-[15px] shadow-sm focus:outline-none focus:border-[#1e6b4e]"
                        >
                            {navSections.map((section) => (
                                <optgroup key={section.title} label={section.title}>
                                    {section.items.map((item) => {
                                        if ((item.id === 'children' || item.id === 'home') && isCaregiver) return null;
                                        return (
                                            <option key={item.id} value={item.id}>
                                                {item.label}
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            ))}
                        </select>
                    </nav>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0 max-w-3xl">
                        {children}
                    </main>
                </div>
            </div>
        </div >
    );
}
