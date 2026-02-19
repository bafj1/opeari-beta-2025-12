import type { CareNeed } from '../../types/careNeed';
import { MoreHorizontal, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CareNeedCardProps {
    careNeed: CareNeed;
    onEdit: (careNeed: CareNeed) => void;
    onDelete?: (id: string) => void;
}

const formatCareType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return `${hour}${minutes !== '00' ? `:${minutes}` : ''}${ampm}`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function CareNeedCard({ careNeed, onEdit, onDelete }: CareNeedCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'covered': return '#1E6B4E'; // Green
            case 'open': return '#F8C3B3'; // Light Coral/Pink
            case 'closed': return '#D1D5DB'; // Gray
            case 'active': return '#F8C3B3'; // Legacy -> Open
            case 'seeking': return '#F8C3B3'; // Legacy -> Open
            case 'matched': return '#1E6B4E'; // Legacy -> Covered
            case 'confirmed': return '#1E6B4E'; // Legacy -> Covered
            case 'past': return '#D1D5DB'; // Legacy -> Closed
            case 'completed': return '#D1D5DB'; // Legacy -> Closed
            default: return '#F8C3B3'; // Default to Open/Looking
        }
    };

    const statusBorderColor = getStatusColor(careNeed.status || 'open');

    return (
        <div
            className="bg-white rounded-xl border-l-[4px] border-y border-r border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow relative group"
            style={{ borderLeftColor: statusBorderColor }}
        >
            <div className="flex justify-between items-start">
                <div className="flex gap-3">
                    {/* Status Indicator removed (using border instead) */}

                    <div>
                        <h3 className="font-bold text-[#1e6b4e] text-base mb-1">
                            {formatCareType(careNeed.care_type)}
                        </h3>

                        <div className="flex flex-col gap-1 text-sm text-gray-600">
                            {/* Schedule */}
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>
                                    {careNeed.days_needed?.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ') || 'Flexible'}
                                    {careNeed.duration_type === 'ongoing' && ' • Ongoing'}
                                    {careNeed.duration_type === 'short-term' && careNeed.start_date && (
                                        ` • ${formatDate(careNeed.start_date)}${careNeed.end_date ? ` - ${formatDate(careNeed.end_date)}` : ''}`
                                    )}
                                </span>
                            </div>

                            {/* Time */}
                            <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>
                                    {(careNeed.start_time && careNeed.end_time)
                                        ? `${formatTime(careNeed.start_time)} - ${formatTime(careNeed.end_time)}`
                                        : 'Flexible'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(careNeed)}
                        className="p-1.5 text-gray-400 hover:text-[#1e6b4e] hover:bg-[#d8f5e5] rounded-lg transition-colors"
                        aria-label="Edit care need"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>

                    {onDelete && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {showMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
                                        <button
                                            onClick={() => {
                                                onDelete(careNeed.id);
                                                setShowMenu(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
