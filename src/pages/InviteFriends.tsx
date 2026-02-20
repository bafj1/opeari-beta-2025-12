import { useState, useEffect } from 'react';
import { Copy, Check, Mail, MessageCircle, Share2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function InviteFriends() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    if (!user) return;
    async function loadReferral() {
      const { data } = await supabase
        .from('members')
        .select('first_name, referral_code')
        .eq('id', user!.id)
        .single();
      if (data) {
        setReferralCode(data.referral_code || user!.id.slice(0, 8));
        setFirstName(data.first_name || '');
      }
    }
    loadReferral();
  }, [user]);

  const inviteLink = `https://opeari.com/invite?code=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${firstName} invited you to join Opeari`);
    const body = encodeURIComponent(
      `Hi!\n\n${firstName} thinks you'd love Opeari — a trusted community for finding childcare and connecting with families in your neighborhood.\n\nJoin here: ${inviteLink}\n\nSee you in the village!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleText = () => {
    const body = encodeURIComponent(
      `Hey! I've been using Opeari to find trusted childcare in my neighborhood. You should check it out: ${inviteLink}`
    );
    window.location.href = `sms:?body=${body}`;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! I've been using Opeari to find trusted childcare in my neighborhood. You should check it out: ${inviteLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f0faf4]" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#d8f5e5] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#1e6b4e]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e6b4e] mb-2">Grow Your Village</h1>
          <p className="text-sm text-[#546E5C]">
            Families you invite skip the waitlist and join directly.
          </p>
        </div>

        {/* Invite Link Card */}
        <div className="bg-white rounded-[20px] p-6 border-2 border-[#8bd7c7]/20 shadow-sm mb-6">
          <h3 className="text-base font-bold text-[#1e6b4e] mb-4">Your Invite Link</h3>

          {/* Referral code */}
          <div className="flex items-center justify-between p-3 bg-[#f0faf4] rounded-xl border border-[#8bd7c7]/15 mb-4">
            <code className="text-sm font-semibold text-[#1e6b4e] tracking-wide">
              {referralCode || '...'}
            </code>
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-full bg-[#1e6b4e] text-white text-xs font-semibold hover:bg-[#174f3a] transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" /> Copied</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy Link</>
              )}
            </button>
          </div>

          {/* Full link display */}
          <p className="text-xs text-[#546E5C] bg-[#f0faf4] px-3 py-2 rounded-lg break-all mb-4 border border-[#8bd7c7]/10">
            {inviteLink}
          </p>

          {/* Share buttons */}
          <p className="text-xs font-semibold text-[#546E5C] uppercase tracking-wide mb-3">Share via</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleText}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-[#8bd7c7]/20 hover:border-[#8bd7c7]/50 hover:bg-[#f0faf4] transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-[#1e6b4e]" />
              <span className="text-xs font-medium text-[#546E5C]">Text</span>
            </button>
            <button
              onClick={handleEmail}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-[#8bd7c7]/20 hover:border-[#8bd7c7]/50 hover:bg-[#f0faf4] transition-colors"
            >
              <Mail className="w-5 h-5 text-[#1e6b4e]" />
              <span className="text-xs font-medium text-[#546E5C]">Email</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-[#8bd7c7]/20 hover:border-[#8bd7c7]/50 hover:bg-[#f0faf4] transition-colors"
            >
              <Share2 className="w-5 h-5 text-[#1e6b4e]" />
              <span className="text-xs font-medium text-[#546E5C]">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white rounded-[20px] p-6 border-2 border-[#8bd7c7]/20 shadow-sm">
          <h3 className="text-base font-bold text-[#1e6b4e] mb-3">Who to invite</h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2 text-sm text-[#546E5C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7c7] mt-1.5 flex-shrink-0" />
              Parents in your neighborhood
            </li>
            <li className="flex items-start gap-2 text-sm text-[#546E5C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7c7] mt-1.5 flex-shrink-0" />
              Families with kids similar ages to yours
            </li>
            <li className="flex items-start gap-2 text-sm text-[#546E5C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7c7] mt-1.5 flex-shrink-0" />
              Friends looking for nanny shares or backup care
            </li>
            <li className="flex items-start gap-2 text-sm text-[#546E5C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8bd7c7] mt-1.5 flex-shrink-0" />
              Trusted caregivers you'd recommend
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}