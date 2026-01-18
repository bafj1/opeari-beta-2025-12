import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useViewer } from '../hooks/useViewer';
import { supabase } from '../lib/supabase';
import { User, Heart, Users, Settings as SettingsIcon } from 'lucide-react';

import SettingsLayout from '../components/Settings/SettingsLayout';
import ProfilePanel from '../components/Settings/ProfilePanel';
import FamilyNeedsPanel from '../components/Settings/FamilyNeedsPanel';
import CaregiverExperiencePanel from '../components/Settings/CaregiverExperiencePanel';
import VillageIntentPanel from '../components/Settings/VillageIntentPanel';
import AccountPanel from '../components/Settings/AccountPanel';

export default function Settings() {
  const { viewer, loading, error, refresh } = useViewer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<'profile' | 'care' | 'village' | 'account'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State - Initialize from viewer when loaded
  const [formData, setFormData] = useState<any>({});
  const [showScheduleWarning, setShowScheduleWarning] = useState(false);

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'care', 'village', 'account'].includes(tab)) {
      setActiveSection(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveSection(tab as any);
    setSearchParams({ tab });
    setMessage(null); // Clear messages on tab change
  };

  // Initialize form data when viewer loads or refreshes
  useEffect(() => {
    if (viewer?.member) {
      setFormData({
        // Profile (Members)
        first_name: viewer.member.first_name || '',
        last_name: viewer.member.last_name || '',
        phone: viewer.member.phone || '',
        zip_code: viewer.member.zip_code || '',
        bio: viewer.member.bio || '',
        neighborhood: viewer.member.neighborhood || '',
        languages: (viewer.member.languages || []).join(', '), // Display as string

        // Village Intent (Members - Shared)
        support_needed: viewer.member.support_needed || [],
        support_offered: viewer.member.support_offered || [],
        support_notes: viewer.member.support_notes || '',

        // Family Needs (Members)
        availability_days: viewer.member.availability_days || [],
        availability_blocks: viewer.member.availability_blocks || [],
        schedule_flexible: viewer.member.schedule_flexible || false,
        special_availability: viewer.member.special_availability || [],
        children_age_groups: viewer.member.children_age_groups || [],
        care_types: viewer.member.care_types || [],
        budget_tiers: viewer.member.budget_tiers || [],
        transportation_required: viewer.member.transportation_required || false,
        require_identity_verified: viewer.member.require_identity_verified || false,
        require_background_verified: viewer.member.require_background_verified || false,
        language_requirement: viewer.member.language_requirement || 'nice_to_have',

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
    }
  }, [viewer]);

  const handleSave = async (section: 'profile' | 'care' | 'village' | 'account') => {
    // Prevent accidental overwrites by scoping updates to the section being viewed.
    if (!viewer) return;
    setSaving(true);
    setMessage(null);

    try {
      // Helper to clean languages string to array
      const parseLanguages = (str: string) =>
        str ? str.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

      const memberId = viewer.member.id;
      let memberUpdates: any = {};
      let cgUpdates: any = {};

      // === PROFILE SECTION ===
      if (section === 'profile') {
        memberUpdates = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          zip_code: formData.zip_code,
          bio: formData.bio,
          neighborhood: formData.neighborhood,
          languages: parseLanguages(formData.languages),
        };
      }

      // === VILLAGE INTENT SECTION ===
      if (section === 'village') {
        memberUpdates = {
          support_needed: formData.support_needed,
          support_offered: formData.support_offered,
          support_notes: formData.support_notes,
        }
      }

      // === CARE SECTION ===
      if (section === 'care') {
        const role = (viewer.member.role || '').toLowerCase().trim();
        const isCaregiver = role === 'caregiver' || role === 'provider';

        // Family: Update Member fields
        if (!isCaregiver) {
          memberUpdates = {
            children_age_groups: formData.children_age_groups,
            care_types: formData.care_types,
            availability_days: formData.availability_days,
            availability_blocks: formData.availability_blocks,
            schedule_flexible: formData.schedule_flexible,
            special_availability: formData.special_availability,
            budget_tiers: formData.budget_tiers,
            transportation_required: formData.transportation_required,
            require_identity_verified: formData.require_identity_verified,
            require_background_verified: formData.require_background_verified,
            language_requirement: formData.language_requirement
          };

          // SCHEDULE CONTRACT: If days/blocks change, reset the detailed grid
          const daysChanged = JSON.stringify(formData.availability_days) !== JSON.stringify(viewer.member.availability_days || []);
          const blocksChanged = JSON.stringify(formData.availability_blocks) !== JSON.stringify(viewer.member.availability_blocks || []);

          if (daysChanged || blocksChanged) {
            memberUpdates.schedule = {};
            setShowScheduleWarning(true); // Show warning if schedule is reset
          }
        }
        // Caregiver: Update Caregiver Profile fields
        else {
          cgUpdates = {
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

          const cgDaysChanged = JSON.stringify(formData.cg_availability_days) !== JSON.stringify(viewer.caregiverProfile?.availability_days || []);
          const cgBlocksChanged = JSON.stringify(formData.cg_availability_blocks) !== JSON.stringify(viewer.caregiverProfile?.availability_blocks || []);

          if (cgDaysChanged || cgBlocksChanged) {
            setShowScheduleWarning(true);
          }

          // ALWAYS enforce null for caregivers to prevent any split-brain data.
          memberUpdates.schedule = null;
        }
      }

      // EXECUTE UPDATES
      // 1. Update Members Table (if memberUpdates has keys)
      if (Object.keys(memberUpdates).length > 0) {
        // Use UPDATE for safety to avoid wiping unspecified fields
        const { error: updateError } = await supabase
          .from('members')
          .update(memberUpdates)
          .eq('id', memberId);

        if (updateError) throw updateError;
      }

      // 2. Update Caregiver Profile (if cgUpdates has keys)
      if (Object.keys(cgUpdates).length > 0) {
        const userId = viewer.user?.id;
        if (!userId) {
          throw new Error("User ID missing. Please reload.");
        }

        const { error: cgError } = await supabase
          .from('caregiver_profiles')
          .update(cgUpdates)
          .eq('user_id', userId);

        if (cgError) throw cgError;
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-opeari-bg">
        <div className="w-10 h-10 border-4 border-opeari-peach border-t-opeari-green rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !viewer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-opeari-bg">
        <div className="text-red-600 font-bold mb-6 text-lg">Unable to load settings.</div>
        <button
          onClick={refresh}
          className="px-8 py-3 bg-opeari-heading text-white font-bold rounded-full hover:bg-opeari-green transition-all shadow-button hover:shadow-button-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  const { member, user } = viewer;
  // Normalize role for robust checking (Village logic alignment)
  const role = (member.role || '').toLowerCase().trim();
  const isCaregiver = role === 'caregiver' || role === 'provider';

  const displayEmail = user?.email || member.email || "No email found";

  // Define Tabs configuration
  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'care', label: isCaregiver ? 'Experience' : 'Family Needs', icon: Heart },
    { id: 'village', label: 'Village Intent', icon: Users },
    { id: 'account', label: 'Account', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-opeari-bg pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ONBOARDING REMINDER */}
        {!member.onboarding_complete && (
          <div className="mb-8 p-6 bg-white border border-opeari-green/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-opeari-green/10 flex items-center justify-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-opeari-green animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-opeari-heading text-lg">Complete your profile</h3>
                <p className="text-sm text-opeari-text-secondary">Finish onboarding to fully unlock your village.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/onboarding?step=0')}
              className="px-6 py-2.5 bg-opeari-heading text-white font-bold rounded-full hover:bg-opeari-green shadow-button hover:shadow-button-hover transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue Onboarding
            </button>
          </div>
        )}

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-opeari-heading tracking-tight mb-2">Settings</h1>
          <p className="text-opeari-text-secondary">Manage your profile, preferences, and account details.</p>
        </header>

        {/* Notification */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
            <span className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </span>
            <div className="font-medium text-sm sm:text-base">{message.text}</div>
          </div>
        )}

        {showScheduleWarning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-100 flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div>
              <p className="font-bold text-sm">Schedule Updated</p>
              <p className="text-xs sm:text-sm opacity-90 mt-0.5">Your detailed schedule grid has been reset due to changes in availability days or time blocks. Please review it.</p>
            </div>
          </div>
        )}

        <SettingsLayout
          activeTab={activeSection}
          onTabChange={handleTabChange}
          tabs={settingsTabs}
        >
          {activeSection === 'profile' && (
            <ProfilePanel
              formData={formData}
              setFormData={setFormData}
              saving={saving}
              onSave={() => handleSave('profile')}
            />
          )}

          {activeSection === 'care' && (
            isCaregiver ? (
              <CaregiverExperiencePanel
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onSave={() => handleSave('care')}
              />
            ) : (
              <FamilyNeedsPanel
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onSave={() => handleSave('care')}
              />
            )
          )}

          {activeSection === 'village' && (
            <VillageIntentPanel
              formData={formData}
              setFormData={setFormData}
              saving={saving}
              onSave={() => handleSave('village')}
            />
          )}

          {activeSection === 'account' && (
            <AccountPanel displayEmail={displayEmail} />
          )}
        </SettingsLayout>

      </div>
    </div>
  );
}