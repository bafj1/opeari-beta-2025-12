/**
 * Normalizes location/area strings for display.
 * Prevents "000", "0", or empty values from leaking to the UI.
 * 
 * @param area - The raw area/zip string or number from the DB/RPC
 * @returns A clean string for display (e.g. "Nearby" or "Noe Valley")
 */
export function normalizeArea(area: string | number | null | undefined): string {
    if (!area) return 'Nearby';

    const str = String(area).trim();

    // Check for empty or whitespace
    if (str.length === 0) return 'Nearby';

    // Check for "0", "000", "00000" artifacts
    if (/^0+$/.test(str)) return 'Nearby';

    return str;
}

/**
 * Normalizes visibility labels for display.
 * Ensures consistent casing and mapping.
 * 
 * @param visibility - The raw visibility string (e.g. "village_only", "public")
 * @returns formatted string "Village only" or "Public"
 */
export function normalizeVisibility(visibility: string | null | undefined): string {
    const raw = (visibility ?? '').toString().trim();
    if (!raw) return 'Village only';

    const v = raw.toLowerCase().replace(/[-\s]/g, '_');

    if (v === 'village_only') return 'Village only';
    if (v === 'public') return 'Public';

    // Fail closed for any unknown values
    return 'Village only';
}
