import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useViewer } from '../hooks/useViewer';
import { supabase } from '../lib/supabase';

import SettingsLayout from '../components/Settings/SettingsLayout';
import ProfilePanel from '../components/Settings/ProfilePanel';

import AccountPanel from '../components/Settings/AccountPanel';
import SafetyVerificationPanel from '../components/Settings/SafetyVerificationPanel';
import KidsPanel from '../components/Settings/KidsPanel';
import NotificationsPanel from '../components/Settings/NotificationsPanel';
import MatchingPreferencesPanel from '../components/Settings/MatchingPreferencesPanel';
import SchedulePanel from '../components/Settings/SchedulePanel';
import VillageNetworkPanel from '../components/Settings/VillageNetworkPanel';
import PrivacyPanel from '../components/Settings/PrivacyPanel';
import FeedbackPanel from '../components/Settings/FeedbackPanel';

export default function Settings() {
  const { viewer, refresh } = useViewer();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const activeTab = searchParams.get('tab') || 'profile';

  // Handle hash-based navigation (Deep Links)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const panelMap: Record<string, string> = {
        'profile': 'profile',
        'schedule': 'schedule',
        'notifications': 'notifications',
        'account': 'account',
        'matching': 'preferences', // Map #matching to preferences tab
        'village': 'village',
        'reviews': 'reviews',
        'safety': 'safety',
        'privacy': 'privacy',
        'feedback': 'feedback',
      };
      const tab = panelMap[hash];
      if (tab) {
        setSearchParams({ tab });
      }
    }
  }, [location.hash, setSearchParams]);

  // Form State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Initialize form data when viewer loads or refreshes
  useEffect(() => {
    if (viewer?.member) {
      setFormData({
        // Profile (Members)
        first_name: viewer.member.first_name || '',
        last_name: viewer.member.last_name || '',
        avatar_url: viewer.member.avatar_url || '',
        phone: viewer.member.phone || '',
        zip_code: viewer.member.zip_code || '',
        bio: viewer.member.bio || '',
        neighborhood: viewer.member.neighborhood || '',
        languages: viewer.member.languages || [], // Array
        instagram_handle: viewer.member.instagram_handle || '',
        linkedin_handle: viewer.member.linkedin_url
          ? viewer.member.linkedin_url.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '')
          : '',
        facebook_handle: viewer.member.facebook_url
          ? viewer.member.facebook_url.replace(/https?:\/\/(www\.)?facebook\.com\//, '')
          : '',
        // NEW fields (Phase 9A)
        role: viewer.member.role || 'parent',
        comfortable_with_pets: viewer.member.comfortable_with_pets || false,
        smoke_free_required: viewer.member.smoke_free_required || false,
        willing_to_travel: viewer.member.willing_to_travel || false,
        available_overnight: viewer.member.available_overnight || false,
        emergency_contact_name: viewer.member.emergency_contact_name || '',
        emergency_contact_phone: viewer.member.emergency_contact_phone || '',
        emergency_contact_relationship: viewer.member.emergency_contact_relationship || '',
        privacy_show_full_name: viewer.member.privacy_show_full_name ?? true,
        privacy_show_location: viewer.member.privacy_show_location ?? true,
        privacy_show_phone: viewer.member.privacy_show_phone ?? false,
        privacy_appear_in_search: viewer.member.privacy_appear_in_search ?? true,

        // Village Intent (Members - Shared)
        support_needed: viewer.member.support_needed || [],
        support_offered: viewer.member.support_offered || [],
        support_notes: viewer.member.support_notes || '',
        schedule_notes: viewer.member.schedule_notes || '',
        village_prefs: viewer.member.village_prefs || {},

        // Schedules
        weekly_schedule: viewer.member.weekly_schedule || {},
        available_to_help_schedule: viewer.member.available_to_help_schedule || {},

        // Family Needs (Members)
        availability_days: viewer.member.availability_days || [],
        availability_blocks: viewer.member.availability_blocks || [],
        schedule_flexible: viewer.member.schedule_flexible || false,
        special_availability: viewer.member.special_availability || [],
        children_age_groups: viewer.member.children_age_groups || [],
        care_types: viewer.member.care_types || [],
        budget_tier: viewer.member.budget_tier || (viewer.member.budget_tiers?.[0] || ''),
        transportation_required: viewer.member.transportation_required || false,
        require_identity_verified: viewer.member.require_identity_verified || false,
        require_background_verified: viewer.member.require_background_verified || false,
        language_requirement: viewer.member.language_requirement || 'nice_to_have',

        // New Fields for Matching/Notifications
        notification_prefs: viewer.member.notification_prefs || {},
        timezone: viewer.member.timezone || 'PT',
        // Matching Prefs (Single JSONB column)
        matching_prefs: viewer.member.matching_prefs || {},

        max_distance: viewer.member.max_distance || 10,
        min_schedule_overlap: viewer.member.min_schedule_overlap || 50,
        dealbreakers: viewer.member.dealbreakers || {},
        discovery_settings: viewer.member.discovery_settings || {},
        vetting_status: viewer.member.vetting_status || 'none',


        // Caregiver Specific (Caregiver Profiles)
        ...(viewer.caregiverProfile ? {
          cg_role_type: viewer.caregiverProfile.role_type || '',
          cg_secondary_roles: viewer.caregiverProfile.secondary_roles || [],
          cg_years_experience: viewer.caregiverProfile.years_experience || '',
          cg_hourly_rate: viewer.caregiverProfile.hourly_rate || '',
          cg_logistics: viewer.caregiverProfile.logistics || [],
          // Certs handled as array
          cg_certifications: viewer.caregiverProfile.certifications ? viewer.caregiverProfile.certifications.map((c: any) => c.name) : [],

          cg_availability_days: viewer.caregiverProfile.availability_days || [],
          cg_availability_blocks: viewer.caregiverProfile.availability_blocks || [],
          cg_transportation: viewer.caregiverProfile.transportation || 'none',
          // Languages handled as string for input, array for DB
          cg_languages: (viewer.caregiverProfile.languages || []).join(', '),
          cg_age_groups: viewer.caregiverProfile.age_groups || []
        } : {})
      });
      setLoading(false);
    }
  }, [viewer]);

  const handleSave = async (override?: any) => {
    // Prevent accidental overwrites by scoping updates to the section being viewed.
    if (!viewer) return;
    setSaving(true);
    setMessage(null);

    try {
      // Helper to clean languages string to array
      const parseLanguages = (str: string) =>
        str ? str.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

      const memberId = viewer.member.id;

      // Use override payload if provided, otherwise fall back to state
      const payload = { ...(override ?? formData) };

      // construct full URLs for social handles before saving
      payload.linkedin_url = payload.linkedin_handle
        ? `https://linkedin.com/in/${payload.linkedin_handle}`
        : null;

      payload.facebook_url = payload.facebook_handle
        ? `https://facebook.com/${payload.facebook_handle}`
        : null;

      const dbSafeFields = [
        'first_name',
        'last_name',
        'phone',
        'zip_code',
        'neighborhood',
        'languages', // CHANGED from languages_spoken to matches DB column
        'bio',
        'avatar_url',
        'role',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'weekly_schedule',
        'available_to_help_schedule',
        'notification_prefs',
        'timezone',
        'matching_prefs',
        'village_prefs',
        'support_offered',
        'support_needed',
        'support_notes',
        // Preference Fields (Added to dbSafeFields to ensure persistence)
        'comfortable_with_pets',
        'smoke_free_required',
        'willing_to_travel',
        'available_overnight',
        'transportation_required',
        'children_age_groups', // Added Phase 9
        'care_types', // Added for persistence
        'children_count',
        'privacy_show_full_name',
        'privacy_show_location',
        'privacy_show_phone',
        'privacy_appear_in_search',
        // Social Fields
        'instagram_handle',
        'linkedin_url',
        'facebook_url',
      ];

      // Filter payload to only include fields that exist in DB
      const dataToSave: Record<string, any> = {};
      for (const field of dbSafeFields) {
        if (payload[field] !== undefined) {
          dataToSave[field] = payload[field];
        }
      }

      // 1. Update Member Profile
      const { error } = await supabase
        .from('members')
        .update(dataToSave)
        .eq('id', memberId);

      if (error) throw error;

      // 2. Update Caregiver Profile if applicable
      if (viewer.caregiverProfile) {
        const cgUpdates = {
          role_type: formData.cg_role_type,
          secondary_roles: formData.cg_secondary_roles,
          years_experience: formData.cg_years_experience,
          hourly_rate: formData.cg_hourly_rate ? parseInt(String(formData.cg_hourly_rate).replace(/[^0-9]/g, '')) : null,
          logistics: formData.cg_logistics,
          // Certifications: Preserve existing 'verified' status
          certifications: formData.cg_certifications.map((name: string) => {
            const existing = viewer.caregiverProfile?.certifications?.find((c: any) => c.name === name);
            return existing ? existing : { name, verified: false };
          }),
          availability_days: formData.cg_availability_days,
          availability_blocks: formData.cg_availability_blocks,
          transportation: formData.cg_transportation,
          languages: parseLanguages(formData.cg_languages),
          age_groups: formData.cg_age_groups
        };

        // Filter out undefined
        const cleanCgUpdates = Object.fromEntries(
          Object.entries(cgUpdates).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(cleanCgUpdates).length > 0) {
          const { error: cgError } = await supabase
            .from('caregiver_profiles')
            .update(cleanCgUpdates)
            .eq('user_id', viewer.user?.id);

          if (cgError) throw cgError;
        }
      }

      await refresh(); // Reload canonical data
      setMessage({ type: 'success', text: 'Settings saved successfully.' });

    } catch (err: any) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: 'Error saving settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
    setMessage(null);
  };

  const renderPanel = () => {
    if (loading) return null; // Or a spinner

    switch (activeTab) {
      case 'profile':
        return <ProfilePanel formData={formData} setFormData={setFormData} saving={saving} onSave={handleSave} />;
      case 'children':
        return <KidsPanel />;
      case 'schedule':
        return <SchedulePanel formData={formData} setFormData={setFormData} saving={saving} onSave={handleSave} />;

      case 'notifications':
        return <NotificationsPanel formData={formData} setFormData={setFormData} saving={saving} onSave={handleSave} />;

      case 'account':
        return (
          <div className="space-y-6">
            <AccountPanel
              displayEmail={viewer?.user?.email || ''}
              displayPhone={formData.phone}
              onPhoneChange={(val) => setFormData({ ...formData, phone: val })}
              onSave={handleSave}
              saving={saving}
            />
            {/* Placeholder for future Security components */}
          </div>
        );

      case 'preferences':
        return <MatchingPreferencesPanel formData={formData} setFormData={setFormData} saving={saving} onSave={handleSave} />;

      case 'village':
        return <VillageNetworkPanel formData={formData} setFormData={setFormData} saving={saving} onSave={handleSave} />;

      case 'reviews':
        return <div className="p-6 bg-white rounded-[20px] border-2 border-[#8bd7c7]/30"><p className="text-[#546E5C] text-center">Reviews & Reputation coming soon...</p></div>;

      case 'safety':
        return <SafetyVerificationPanel />;

      case 'privacy':
        return <PrivacyPanel formData={formData} setFormData={setFormData} saving={saving} onSave={handleSave} />;

      case 'feedback':
        return <FeedbackPanel />;

      default:
        return <ProfilePanel formData={formData} setFormData={setFormData} saving={saving} onSave={handleSave} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-4 border-[#8bd7c7] border-t-[#1e6b4e] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!viewer) return null;

  return (
    <SettingsLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {message && (
        <div className={`mb-6 p-4 rounded-[20px] flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}
      {renderPanel()}
    </SettingsLayout>
  );
}