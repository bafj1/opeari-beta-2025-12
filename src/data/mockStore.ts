import type { WaitlistEntry, ParentProfile, NannyShare } from './types';

// Simple generic mock store that persists to localStorage
class MockStore {
    private get<T>(key: string): T[] {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    private save<T>(key: string, data: T[]) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    private async simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, 600)); // 600ms latency
    }

    // --- Waitlist ---
    async addToWaitlist(entry: Omit<WaitlistEntry, 'id' | 'created_at'>): Promise<WaitlistEntry> {
        await this.simulateDelay();
        const current = this.get<WaitlistEntry>('opeari_waitlist');
        const newEntry: WaitlistEntry = {
            ...entry,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
        };
        this.save('opeari_waitlist', [...current, newEntry]);
        console.log('[MockDB] Waitlist Entry Added:', newEntry);
        return newEntry;
    }

    // --- Profiles ---
    async createParentProfile(profile: Omit<ParentProfile, 'id' | 'created_at'>): Promise<ParentProfile> {
        await this.simulateDelay();
        const current = this.get<ParentProfile>('opeari_parent_profiles');
        const newProfile: ParentProfile = {
            ...profile,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
        };
        this.save('opeari_parent_profiles', [...current, newProfile]);
        console.log('[MockDB] Parent Profile Created:', newProfile);
        return newProfile;
    }

    async getParentProfiles(): Promise<ParentProfile[]> {
        await this.simulateDelay();
        return this.get<ParentProfile>('opeari_parent_profiles');
    }

    // --- Nanny Shares ---
    async createNannyShare(share: Omit<NannyShare, 'id' | 'created_at'>): Promise<NannyShare> {
        await this.simulateDelay();
        const current = this.get<NannyShare>('opeari_shares');
        const newShare: NannyShare = {
            ...share,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
        };
        this.save('opeari_shares', [...current, newShare]);
        console.log('[MockDB] Share Created:', newShare);
        return newShare;
    }
}

export const db = new MockStore();
