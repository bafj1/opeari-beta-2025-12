import type { CareNeed } from '../../types/careNeed';
import { MoreHorizontal, Calendar, Clock, Edit2, Trash2, CalendarDays } from 'lucide-react';
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
    return `${hour}:${minutes !== '00' ? minutes : '00'}${ampm}`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Use UTC to prevent day shifting
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const formatDays = (days: string[] | undefined) => {
    if (!days || days.length === 0) return 'Flexible days';
    if (days.length === 7) return 'Every Day';
    if (days.length === 5 && ['mon', 'tue', 'wed', 'thu', 'fri'].every(d => days.includes(d))) return 'Weekdays';
    if (days.length === 2 && ['sat', 'sun'].every(d => days.includes(d))) return 'Weekends';
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
};

export function CareNeedCard({ careNeed, onEdit, onDelete }: CareNeedCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'covered': return '#1E6B4E'; // Green
            case 'open': return '#F8C3B3'; // Light Coral/Pink
            case 'closed': return '#D1D5DB'; // Gray
            case 'active': return '#F8C3B3';
            case 'seeking': return '#F8C3B3';
            case 'matched': return '#1E6B4E';
            case 'confirmed': return '#1E6B4E';
            case 'past': return '#D1D5DB';
            case 'completed': return '#D1D5DB';
            default: return '#F8C3B3';
        }
    };

    const statusBorderColor = getStatusColor(careNeed.status || 'open');

    const getDurationBadgeColor = (type: string) => {
        switch (type) {
            case 'one-time': return 'bg-amber-100 text-amber-700';
            case 'temporary': return 'bg-blue-100 text-blue-700';
            case 'backup': return 'bg-purple-100 text-purple-700';
            default: return 'bg-[#d8f5e5] text-[#1e6b4e]'; // Regular/Ongoing
        }
    };

    const getDurationLabel = (type: string) => {
        switch (type) {
            case 'one-time': return 'One-Time';
            case 'temporary': return 'Temporary';
            case 'backup': return 'Backup';
            case 'short-term': return 'Temporary';
            case 'ongoing': return 'Regular';
            case 'regular': return 'Regular';
            default: return 'Regular';
        }
    };

    const durationType = careNeed.duration_type || 'regular';

    return (
        <div
            className="bg-white rounded-xl border-l-[4px] border-y border-r border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow relative group"
            style={{ borderLeftColor: statusBorderColor }}
        >
            <div className="flex justify-between items-start">
                <div className="flex gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#1e6b4e] text-base">
                                {formatCareType(careNeed.care_type)}
                            </h3>
                            {/* Need Type Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDurationBadgeColor(durationType)}`}>
                                {getDurationLabel(durationType)}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 text-sm text-gray-600">
                            {/* Schedule Display */}
                            {(durationType !== 'one-time') && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>
                                        {formatDays(careNeed.days_needed)}
                                        {careNeed.start_time && careNeed.end_time && (
                                            <span className="text-gray-500"> • {formatTime(careNeed.start_time)} – {formatTime(careNeed.end_time)}</span>
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* Date Range or Single Date */}
                            {(durationType === 'temporary' || durationType === 'one-time' || durationType === 'short-term') && careNeed.start_date && (
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                    <span>
                                        {durationType === 'one-time'
                                            ? formatDate(careNeed.start_date)
                                            : `${formatDate(careNeed.start_date)}${careNeed.end_date ? ` – ${formatDate(careNeed.end_date)}` : ' onwards'}`
                                        }
                                        {/* Show time for one-time events here if specific */}
                                        {durationType === 'one-time' && careNeed.start_time && (
                                            <span className="text-gray-500"> • {formatTime(careNeed.start_time)} – {formatTime(careNeed.end_time || '')}</span>
                                        )}
                                    </span>
                                </div>
                            )}

                            {/* Regular/Ongoing just shows "Ongoing" if no dates */}
                            {(durationType === 'regular' || durationType === 'ongoing') && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Ongoing schedule</span>
                                </div>
                            )}
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

