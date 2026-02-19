
export interface MemberData {
    looking_for?: string[];
    nanny_situation?: string;
    open_to?: string[];
    [key: string]: any;
}

export function getSharedCareTags(match: MemberData): string[] {
    const tags: string[] = [];

    // Check looking_for array
    if (match.looking_for?.includes('nanny-share')) {
        tags.push('Open to nanny share');
    }
    if (match.looking_for?.includes('co-share')) {
        tags.push('Open to co-share');
    }
    if (match.looking_for?.includes('backup-care')) {
        tags.push('Wants backup care');
    }

    // Check nanny_situation
    if (match.nanny_situation === 'have_nanny') {
        tags.push('Has a nanny');
    }
    if (match.nanny_situation === 'seeking_share') {
        tags.push('Seeking nanny share');
    }

    // Check open_to array
    if (match.open_to?.includes('weekend_swaps')) {
        tags.push('Open to weekend swaps');
    }

    // Limit to 2 tags max to avoid visual clutter
    return tags.slice(0, 2);
}

export function SharedCareTag({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8bd7c7]/20 text-[#1e6b4e] border border-[#8bd7c7]/30 mr-1.5 mb-1">
            {label}
        </span>
    );
}

export default SharedCareTag;
