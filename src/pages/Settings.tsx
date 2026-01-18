import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useViewer } from '../hooks/useViewer';
import { supabase } from '../lib/supabase';

import ChipMultiSelect from '../components/common/ChipMultiSelect';
import {
  DAYS_OPTIONS,
  BLOCKS_OPTIONS,
  SPECIAL_OPTIONS,
  BUDGET_TIERS,
  AGE_GROUPS,
  CARE_TYPES,
  VILLAGE_SUPPORT_OPTIONS
} from '../lib/constants/careConstants';

// --- NEW CONSTANTS FOR CAREGIVER SETTINGS ---
const YEARS_OPTIONS = [
  { value: '0-1', label: '< 1 Year' },
  { value: '1-3', label: '1-3 Years' },
  { value: '3-5', label: '3-5 Years' },
  { value: '5-10', label: '5-10 Years' },
  { value: '10+', label: '10+ Years' }
];

const ROLE_OPTIONS = [
  { value: 'nanny', label: 'Nanny' },
  { value: 'babysitter', label: 'Babysitter' },
  { value: 'parents_helper', label: "Parent's Helper" },
  { value: 'household_manager', label: 'Household Manager' },
  { value: 'ncs', label: 'Newborn Care Specialist' },
  { value: 'tutor', label: 'Tutor / Educator' },
  { value: 'au_pair_live_in', label: 'Live-in Au Pair' },
  { value: 'travel_nanny', label: 'Travel Nanny' }
];

const LOGISTICS_OPTIONS = [
  { value: 'driver_license', label: 'Clean Driving Record' },
  { value: 'car_seats', label: 'Comfortable with Car Seats' },
  { value: 'own_car', label: 'Own Car' },
  { value: 'errands', label: 'Errands & Pickups' },
  { value: 'cooking', label: 'Can Cook Basic Meals' },
  { value: 'lifting', label: 'Lift 25–30 lbs' },
  { value: 'multi_kid', label: 'Multi-kid Care' },
  { value: 'pets', label: 'Comfortable with Pets' },
  { value: 'swimming', label: 'Comfortable Swimming' },
  { value: 'stroller_walks', label: 'Stroller Walks' },
  { value: 'stairs', label: 'Stairs (carrying ok)' },
  { value: 'non_smoker', label: 'Non-Smoker' },
  { value: 'homework', label: 'Homework Help' },
  { value: 'housekeeping', label: 'Light Housekeeping' },
  { value: 'nanny_share', label: 'Nanny Share' }
];

const CERT_OPTIONS = [
  { value: 'cpr', label: 'CPR Certified' },
  { value: 'first_aid', label: 'First Aid' },
  { value: 'ece', label: 'Early Childhood Ed' },
  { value: 'driver', label: 'Safe Driver' }
];


export default function Settings() {
  const { viewer, loading, error, refresh } = useViewer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<'account' | 'profile' | 'care' | 'village'>('profile');
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

  const handleTabChange = (tab: 'profile' | 'care' | 'village' | 'account') => {
    setActiveSection(tab);
    setSearchParams({ tab });
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

  // Common UI classes
  const inputClass = "w-full p-3.5 rounded-xl border border-opeari-border/50 bg-white text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all duration-200 placeholder:text-gray-400";
  const labelClass = "block text-xs font-bold text-opeari-text-secondary uppercase tracking-wide mb-2";
  const sectionCardClass = "bg-white rounded-2xl border border-opeari-border shadow-card hover:shadow-card-hover transition-all duration-300 p-6 sm:p-10";

  return (
    <div className="min-h-screen bg-opeari-bg pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

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

        {/* Tabs */}
        <div className="flex gap-1 border-b border-opeari-border/30 mb-8 overflow-x-auto no-scrollbar pb-1">
          {['profile', 'care', 'village', 'account'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as any)}
              className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${activeSection === tab
                ? 'text-opeari-heading border-opeari-heading bg-white/50'
                : 'text-opeari-text-secondary border-transparent hover:text-opeari-heading hover:bg-white/30'
                }`}
            >
              {tab === 'care' ? (isCaregiver ? 'Experience' : 'Family Needs') : (tab === 'village' ? 'Village Intent' : tab.charAt(0).toUpperCase() + tab.slice(1))}
            </button>
          ))}
        </div>

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

        {/* Content Card */}
        <div className={sectionCardClass}>

          {/* ACCOUNT SECTION */}
          {activeSection === 'account' && (
            <div className="space-y-10 animate-fade-in">
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-lg text-opeari-heading font-medium">{displayEmail}</div>
                  <span className="text-xs font-bold px-3 py-1 bg-gray-200 text-gray-500 rounded-full uppercase tracking-wider">Verified</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 px-1">Contact support to change your email address.</p>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-opeari-heading mb-4">Security</h3>
                <button
                  onClick={() => window.location.href = '/forgot-password'}
                  className="px-6 py-3 bg-white border border-opeari-border text-opeari-heading font-bold rounded-full hover:bg-opeari-mint/10 hover:border-opeari-green/30 transition-all"
                >
                  Reset Password
                </button>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
                <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button
                  onClick={() => alert('Please contact support to verify identity and delete account.')}
                  className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-full hover:bg-red-50 hover:border-red-300 transition-all"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}


          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <form onSubmit={(e) => { e.preventDefault(); handleSave('profile'); }} className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Zip Code</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Neighborhood</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Noe Valley"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Languages Spoken</label>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  placeholder="English, Spanish, French..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Bio / Introduction</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={5}
                  className={inputClass}
                  placeholder="Tell your neighbors a bit about yourself..."
                />
              </div>

              <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-3.5 bg-opeari-heading text-white font-bold rounded-full hover:bg-opeari-green shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}


          {/* CARE DETAILS SECTION */}
          {activeSection === 'care' && (
            <form onSubmit={(e) => { e.preventDefault(); handleSave('care'); }} className="space-y-10 animate-fade-in">
              {isCaregiver ? (
                // CAREGIVER FORM
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Primary Role</label>
                      <select
                        value={formData.cg_role_type}
                        onChange={(e) => setFormData({ ...formData, cg_role_type: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Select Role</option>
                        {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Years Experience</label>
                      <select
                        value={formData.cg_years_experience}
                        onChange={(e) => setFormData({ ...formData, cg_years_experience: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Select Experience</option>
                        {YEARS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <ChipMultiSelect
                    label="Secondary Roles"
                    options={ROLE_OPTIONS}
                    selected={formData.cg_secondary_roles}
                    onChange={(vals) => setFormData({ ...formData, cg_secondary_roles: vals })}
                  />

                  {/* HOURLY RATE */}
                  <div>
                    <label className={labelClass}>Hourly Rate ($/hr)</label>
                    <div className="flex items-center">
                      <span className="p-3.5 bg-gray-50 border border-r-0 border-opeari-border/50 rounded-l-xl text-gray-500 font-bold">$</span>
                      <input
                        type="text"
                        value={formData.cg_hourly_rate}
                        onChange={(e) => setFormData({ ...formData, cg_hourly_rate: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder="25"
                        className="w-full p-3.5 rounded-r-xl border border-opeari-border/50 text-opeari-text focus:outline-none focus:border-opeari-green focus:ring-4 focus:ring-opeari-green/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 my-8"></div>

                  <div className="space-y-6">
                    <ChipMultiSelect
                      label="Availability Days"
                      options={DAYS_OPTIONS}
                      selected={formData.cg_availability_days}
                      onChange={(vals) => setFormData({ ...formData, cg_availability_days: vals })}
                    />
                    <ChipMultiSelect
                      label="Time Blocks"
                      options={BLOCKS_OPTIONS}
                      selected={formData.cg_availability_blocks}
                      onChange={(vals) => setFormData({ ...formData, cg_availability_blocks: vals })}
                    />
                  </div>

                  <div className="border-t border-gray-100 my-8"></div>

                  <div className="space-y-6">
                    <ChipMultiSelect
                      label="Age Groups Experience"
                      options={AGE_GROUPS}
                      selected={formData.cg_age_groups}
                      onChange={(vals) => setFormData({ ...formData, cg_age_groups: vals })}
                    />

                    <ChipMultiSelect
                      label="Logistics & Skills"
                      options={LOGISTICS_OPTIONS}
                      selected={formData.cg_logistics}
                      onChange={(vals) => setFormData({ ...formData, cg_logistics: vals })}
                    />

                    <ChipMultiSelect
                      label="Certifications"
                      options={CERT_OPTIONS}
                      selected={formData.cg_certifications}
                      onChange={(vals) => setFormData({ ...formData, cg_certifications: vals })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Transportation</label>
                      <select
                        value={formData.cg_transportation}
                        onChange={(e) => setFormData({ ...formData, cg_transportation: e.target.value })}
                        className={inputClass}
                      >
                        <option value="none">None</option>
                        <option value="own_car">Own Car</option>
                        <option value="public_transit">Public Transit</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Languages</label>
                      <input
                        type="text"
                        value={formData.cg_languages}
                        onChange={(e) => setFormData({ ...formData, cg_languages: e.target.value })}
                        placeholder="English, Spanish..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // FAMILY FORM
                <div className="space-y-6">
                  <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 space-y-6 hover:border-opeari-green/20 transition-colors">
                    <ChipMultiSelect
                      label="Care Type Needed"
                      options={CARE_TYPES}
                      selected={formData.care_types}
                      onChange={(vals) => setFormData({ ...formData, care_types: vals })}
                    />
                    <div className="space-y-1">
                      <ChipMultiSelect
                        label="Age groups only (for now)"
                        options={AGE_GROUPS}
                        selected={formData.children_age_groups}
                        onChange={(vals) => setFormData({ ...formData, children_age_groups: vals })}
                      />
                      <p className="text-xs text-gray-400 font-medium px-1">
                        These tags help us match your care needs. You’ll be able to add kid details later.
                      </p>
                    </div>
                    <ChipMultiSelect
                      label="Budget per Hour"
                      options={BUDGET_TIERS}
                      selected={formData.budget_tiers}
                      onChange={(vals) => setFormData({ ...formData, budget_tiers: vals })}
                    />
                  </div>

                  <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 space-y-6 hover:border-opeari-green/20 transition-colors">
                    <ChipMultiSelect
                      label="Days Needed"
                      options={DAYS_OPTIONS}
                      selected={formData.availability_days}
                      onChange={(vals) => setFormData({ ...formData, availability_days: vals })}
                    />
                    <ChipMultiSelect
                      label="Time Blocks"
                      options={BLOCKS_OPTIONS}
                      selected={formData.availability_blocks}
                      onChange={(vals) => setFormData({ ...formData, availability_blocks: vals })}
                    />

                    <div className="pt-2">
                      <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                        <input
                          type="checkbox"
                          checked={formData.schedule_flexible || false}
                          onChange={(e) => setFormData({ ...formData, schedule_flexible: e.target.checked })}
                          className="w-5 h-5 mt-0.5 text-opeari-green rounded focus:ring-opeari-green border-gray-300"
                        />
                        <div>
                          <span className="text-opeari-text font-bold text-sm block">My schedule is flexible</span>
                          <span className="text-xs text-gray-500 block mt-0.5">If your availability changes week to week, we’ll treat your schedule as flexible.</span>
                        </div>
                      </label>
                    </div>

                    <ChipMultiSelect
                      label="Special Requirements"
                      options={SPECIAL_OPTIONS}
                      selected={formData.special_availability}
                      onChange={(vals) => setFormData({ ...formData, special_availability: vals })}
                    />
                  </div>

                  <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 space-y-4 hover:border-opeari-green/20 transition-colors">
                    <label className={labelClass}>Additional Requirements</label>

                    <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Language Preference</label>
                      <select
                        value={formData.language_requirement}
                        onChange={(e) => setFormData({ ...formData, language_requirement: e.target.value })}
                        className={inputClass}
                      >
                        <option value="nice_to_have">Nice to have</option>
                        <option value="must_have">Must have</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.transportation_required || false}
                          onChange={(e) => setFormData({ ...formData, transportation_required: e.target.checked })}
                          className="w-5 h-5 text-opeari-green rounded focus:ring-opeari-green border-gray-300"
                        />
                        <span className="text-opeari-text font-medium">Transportation Required</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.require_identity_verified || false}
                          onChange={(e) => setFormData({ ...formData, require_identity_verified: e.target.checked })}
                          className="w-5 h-5 text-opeari-green rounded focus:ring-opeari-green border-gray-300"
                        />
                        <span className="text-opeari-text font-medium">Require Identity Verified</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.require_background_verified || false}
                          onChange={(e) => setFormData({ ...formData, require_background_verified: e.target.checked })}
                          className="w-5 h-5 text-opeari-green rounded focus:ring-opeari-green border-gray-300"
                        />
                        <span className="text-opeari-text font-medium">Require Background Check</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-3.5 bg-opeari-heading text-white font-bold rounded-full hover:bg-opeari-green shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          )}

          {/* VILLAGE INTENT SECTION */}
          {activeSection === 'village' && (
            <form onSubmit={(e) => { e.preventDefault(); handleSave('village'); }} className="space-y-10 animate-fade-in">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-blue-900 text-sm font-medium flex gap-3">
                <span className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <p className="mt-0.5">Opeari is about give and take. Use this section for neighborly help (meal trains, carpools) rather than professional care.</p>
              </div>

              <div className="space-y-8">
                <ChipMultiSelect
                  label="Support I can OFFER"
                  options={VILLAGE_SUPPORT_OPTIONS}
                  selected={formData.support_offered}
                  onChange={(vals) => setFormData({ ...formData, support_offered: vals })}
                />

                <ChipMultiSelect
                  label="Support I NEED"
                  options={VILLAGE_SUPPORT_OPTIONS}
                  selected={formData.support_needed}
                  onChange={(vals) => setFormData({ ...formData, support_needed: vals })}
                />
              </div>

              <div>
                <label className={labelClass}>Additional Notes / Other Ideas</label>
                <textarea
                  value={formData.support_notes}
                  onChange={(e) => setFormData({ ...formData, support_notes: e.target.value })}
                  rows={4}
                  className={inputClass}
                  placeholder="I can also bake bread on weekends..."
                />
              </div>

              <div className="pt-6 flex justify-end border-t border-gray-50">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-3.5 bg-opeari-heading text-white font-bold rounded-full hover:bg-opeari-green shadow-button hover:shadow-button-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Intent'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}