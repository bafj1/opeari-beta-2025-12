import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Camera, Heart } from 'lucide-react';

interface ProfileStrengthProps {
    strength: number;
}

export default function ProfileStrength({ strength = 65 }: ProfileStrengthProps) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
            <div className="flex justify-between items-end mb-2">
                <h3 className="font-bold text-gray-800">Profile Strength</h3>
                <span className="font-bold text-[#1e6b4e]">{strength}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6 overflow-hidden">
                <div
                    className="bg-[#1e6b4e] h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${strength}%` }}
                />
            </div>

            <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Wins to Boost Matches</h4>

                {/* Quick Win Items */}
                <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group border border-transparent hover:border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400 group-hover:text-[#1e6b4e] group-hover:border-[#1e6b4e] transition-colors">
                        <Camera size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700 group-hover:text-[#1e6b4e] transition-colors">Add Profile Photo</p>
                        <p className="text-xs text-gray-500">Families respond <span className="text-green-600 font-bold">40% faster</span></p>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+15%</div>
                </Link>

                <Link to="/settings?tab=verification" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group border border-transparent hover:border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400 group-hover:text-[#1e6b4e] group-hover:border-[#1e6b4e] transition-colors">
                        <ShieldCheck size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700 group-hover:text-[#1e6b4e] transition-colors">Complete Background Check</p>
                        <p className="text-xs text-green-600 font-bold">Unlock matched families</p>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+25%</div>
                </Link>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 group border border-transparent opacity-60 cursor-not-allowed" title="Coming Soon">
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400">
                        <Heart size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700">Upload CPR / First Aid</p>
                        <p className="text-xs text-gray-500">Badge of safety</p>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+10%</div>
                </div>

                <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group border border-transparent hover:border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400 group-hover:text-[#1e6b4e] group-hover:border-[#1e6b4e] transition-colors">
                        <Users size={16} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700 group-hover:text-[#1e6b4e] transition-colors">Add a Reference</p>
                        <p className="text-xs text-gray-500">Boost trust score</p>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+20%</div>
                </Link>
            </div>
        </div>
    );
}
// Helper component

