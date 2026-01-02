import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { viewer, loading, error, refresh } = useViewer(); // Added error here
  const navigate = useNavigate();
  // const { signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<'account' | 'profile' | 'care' | 'village'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State - Initialize from viewer when loaded
  const [formData, setFormData] = useState<any>({});

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
        // Family: Update Member fields
        if (viewer.member.role !== 'caregiver') {
          memberUpdates = {
            children_age_groups: formData.children_age_groups,
            care_types: formData.care_types,
            availability_days: formData.availability_days,
            availability_blocks: formData.availability_blocks,
            special_availability: formData.special_availability,
            budget_tiers: formData.budget_tiers,
            transportation_required: formData.transportation_required,
            require_identity_verified: formData.require_identity_verified,
            require_background_verified: formData.require_background_verified,
            language_requirement: formData.language_requirement
          };
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
        // ... (rest of logic same) ...
        const { error: cgError } = await supabase
          .from('caregiver_profiles')
          .update(cgUpdates)
          .eq('user_id', memberId);

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

  // REMOVED duplicate useViewer hook call here

  // ... (rest of constants/hooks same)

  // ... (rest of constants/hooks same)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="p-8 text-center text-[#1E6B4E] animate-pulse">Loading settings...</div>
      </div>
    );
  }

  if (error || !viewer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-red-600 font-bold mb-4">Unable to load settings.</div>
        <button
          onClick={refresh}
          className="px-6 py-2 bg-[#1E6B4E] text-white rounded-lg hover:bg-[#16503a]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { member, user } = viewer; // Destructure user for auth email
  const isCaregiver = member.role === 'caregiver';

  // Robust Email
  const displayEmail = user?.email || member.email || "No email found";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 bg-[#FAF8F5] min-h-screen">

      {/* ONBOARDING REMINDER BANNER */}
      {!member.onboarding_complete && (
        <div className="mb-8 p-6 bg-[#1E6B4E]/5 border-l-4 border-[#1E6B4E] rounded-r-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-[#1E6B4E] shrink-0" />
            <div>
              <h3 className="font-bold text-[#1E6B4E] text-lg">Complete your profile</h3>
              <p className="text-sm text-[#1E6B4E]/80">Finish onboarding to fully unlock your village.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/onboarding?step=0')}
            className="px-5 py-2.5 bg-[#1E6B4E] text-white font-bold rounded-lg hover:bg-[#16523d] text-sm transition-all"
          >
            Continue Onboarding
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold text-[#1E6B4E] mb-8 font-comfortaa">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#1E6B4E]/20 mb-8 overflow-x-auto">
        {['profile', 'care', 'village', 'account'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab as any)}
            className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeSection === tab
              ? 'text-[#1E6B4E] border-b-2 border-[#1E6B4E]'
              : 'text-[#1E6B4E]/60 hover:text-[#1E6B4E]'
              }`}
          >
            {tab === 'care' ? (isCaregiver ? 'Experience & Logistics' : 'Family Needs') : (tab === 'village' ? 'Village Intent' : tab)}
          </button>
        ))}
      </div>

      {/* Notification */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}>
          {message.text}
        </div>
      )}

      {/* Sections */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-[#1E6B4E]/10">

        {/* ACCOUNT SECTION */}
        {activeSection === 'account' && (
          <div className="space-y-8">
            <div>
              <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Email Address</label>
              <div className="text-lg text-[#1E6B4E] font-medium">{displayEmail}</div>
              <p className="text-xs text-[#1E6B4E]/50 mt-1">Contact support to change email.</p>
            </div>

            <div className="pt-6 border-t border-[#1E6B4E]/10">
              <h3 className="text-lg font-bold text-[#1E6B4E] mb-4">Password</h3>
              <button
                onClick={() => window.location.href = '/forgot-password'}
                className="px-5 py-2.5 border border-[#1E6B4E]/30 text-[#1E6B4E] font-bold rounded-full hover:bg-[#F5F1EB] transition-colors"
              >
                Reset Password
              </button>
            </div>

            <div className="pt-6 border-t border-[#1E6B4E]/10">
              <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
              <button
                onClick={() => alert('Please contact support to verify identity and delete account.')}
                className="px-5 py-2.5 border border-red-200 text-red-600 font-bold rounded-full hover:bg-red-50 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}


        {/* PROFILE SECTION */}
        {activeSection === 'profile' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSave('profile'); }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Zip Code</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Neighborhood (Optional)</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Languages Spoken</label>
              <input
                type="text"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                placeholder="English, Spanish, French..."
                className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
              />
              <p className="text-xs text-[#1E6B4E]/50 mt-1">Separate multiple languages with commas.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Bio / Introduction</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-[#1E6B4E] text-white font-bold rounded-full hover:bg-[#16523d] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}


        {/* CARE DETAILS SECTION */}
        {activeSection === 'care' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSave('care'); }} className="space-y-8">
            {isCaregiver ? (
              // CAREGIVER FORM
              <div className="space-y-6">

                {/* ROLE & EXPERIENCE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Primary Role</label>
                    <select
                      value={formData.cg_role_type}
                      onChange={(e) => setFormData({ ...formData, cg_role_type: e.target.value })}
                      className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                    >
                      <option value="">Select Role</option>
                      {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Years Experience</label>
                    <select
                      value={formData.cg_years_experience}
                      onChange={(e) => setFormData({ ...formData, cg_years_experience: e.target.value })}
                      className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
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

                {/* HOURLY RATE - Replaced Tiers with Input */}
                <div>
                  <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Hourly Rate ($/hr)</label>
                  <div className="flex items-center">
                    <span className="p-3 bg-gray-50 border border-r-0 border-[#1E6B4E]/20 rounded-l-lg text-[#1E6B4E]/70 font-bold">$</span>
                    <input
                      type="text"
                      value={formData.cg_hourly_rate}
                      onChange={(e) => setFormData({ ...formData, cg_hourly_rate: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="25"
                      className="w-full p-3 rounded-r-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                    />
                  </div>
                </div>

                <hr className="border-[#1E6B4E]/10" />

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

                <hr className="border-[#1E6B4E]/10" />

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

                <div>
                  <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Transportation</label>
                  <select
                    value={formData.cg_transportation}
                    onChange={(e) => setFormData({ ...formData, cg_transportation: e.target.value })}
                    className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                  >
                    <option value="none">None</option>
                    <option value="own_car">Own Car</option>
                    <option value="public_transit">Public Transit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Languages (Caregiver Specific)</label>
                  <input
                    type="text"
                    value={formData.cg_languages}
                    onChange={(e) => setFormData({ ...formData, cg_languages: e.target.value })}
                    placeholder="English, Spanish..."
                    className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                  />
                  <p className="text-xs text-[#1E6B4E]/50 mt-1">If different from profile, list here.</p>
                </div>
              </div>
            ) : (
              // FAMILY FORM
              <div className="space-y-6">
                <ChipMultiSelect
                  label="Care Type Needed"
                  options={CARE_TYPES}
                  selected={formData.care_types}
                  onChange={(vals) => setFormData({ ...formData, care_types: vals })}
                />
                <ChipMultiSelect
                  label="Children Age Groups"
                  options={AGE_GROUPS}
                  selected={formData.children_age_groups}
                  onChange={(vals) => setFormData({ ...formData, children_age_groups: vals })}
                />
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
                <ChipMultiSelect
                  label="Budget per Hour"
                  options={BUDGET_TIERS}
                  selected={formData.budget_tiers}
                  onChange={(vals) => setFormData({ ...formData, budget_tiers: vals })}
                />
                <ChipMultiSelect
                  label="Special Requirements"
                  options={SPECIAL_OPTIONS}
                  selected={formData.special_availability}
                  onChange={(vals) => setFormData({ ...formData, special_availability: vals })}
                />

                <div className="p-4 bg-white border border-[#1E6B4E]/10 rounded-xl space-y-4">
                  <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase">Additional Requirements</label>

                  <div>
                    <label className="block text-xs font-medium text-[#1E6B4E] mb-2">Language Preference</label>
                    <select
                      value={formData.language_requirement}
                      onChange={(e) => setFormData({ ...formData, language_requirement: e.target.value })}
                      className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                    >
                      <option value="nice_to_have">Nice to have</option>
                      <option value="must_have">Must have</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.transportation_required || false}
                      onChange={(e) => setFormData({ ...formData, transportation_required: e.target.checked })}
                      className="w-5 h-5 text-[#1E6B4E] rounded focus:ring-[#1E6B4E]"
                    />
                    <span className="text-[#1E6B4E] font-medium">Transportation Required</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.require_identity_verified || false}
                      onChange={(e) => setFormData({ ...formData, require_identity_verified: e.target.checked })}
                      className="w-5 h-5 text-[#1E6B4E] rounded focus:ring-[#1E6B4E]"
                    />
                    <span className="text-[#1E6B4E] font-medium">Require Identity Verified</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.require_background_verified || false}
                      onChange={(e) => setFormData({ ...formData, require_background_verified: e.target.checked })}
                      className="w-5 h-5 text-[#1E6B4E] rounded focus:ring-[#1E6B4E]"
                    />
                    <span className="text-[#1E6B4E] font-medium">Require Background Check</span>
                  </label>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-[#1E6B4E] text-white font-bold rounded-full hover:bg-[#16523d] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </form>
        )}

        {/* VILLAGE INTENT SECTION */}
        {activeSection === 'village' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSave('village'); }} className="space-y-8">
            <div className="text-sm text-[#1E6B4E]/70 mb-4 italic">
              Opeari is about give and take. Use this section for neighborly help (meal trains, carpools) rather than professional care.
            </div>

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

            <div>
              <label className="block text-xs font-bold text-[#1E6B4E]/70 uppercase mb-2">Additional Notes / Other Ideas</label>
              <textarea
                value={formData.support_notes}
                onChange={(e) => setFormData({ ...formData, support_notes: e.target.value })}
                rows={4}
                className="w-full p-3 rounded-lg border border-[#1E6B4E]/20 text-[#1E6B4E] focus:outline-none focus:ring-2 focus:ring-[#1E6B4E]/20"
                placeholder="I can also bake bread on weekends..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-[#1E6B4E] text-white font-bold rounded-full hover:bg-[#16523d] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Intent'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}