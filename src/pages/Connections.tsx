import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useViewer } from '../hooks/useViewer';
import Header from '../components/common/Header';
import { Users, MessageCircle, User, MapPin, Calendar, Loader2 } from 'lucide-react';

export default function Connections() {
  const { viewer, loading: viewerLoading } = useViewer();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConnections() {
      if (!viewer?.member?.id) return;
      setLoading(true);
      try {
        const myId = viewer.member.id;

        const { data: conns, error: connErr } = await supabase
          .from('connections')
          .select('requester_id, recipient_id, created_at')
          .or(`requester_id.eq.${myId},recipient_id.eq.${myId}`)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (connErr) throw connErr;

        const connectedIds = (conns || []).map(c =>
          c.requester_id === myId ? c.recipient_id : c.requester_id
        );

        if (connectedIds.length === 0) {
          setConnections([]);
          setLoading(false);
          return;
        }

        const { data: members, error: memErr } = await supabase
          .from('members')
          .select('id, first_name, last_name, role, zip_code, neighborhood, care_types, availability_days, avatar_url, bio')
          .in('id', connectedIds);

        if (memErr) throw memErr;
        setConnections(members || []);
      } catch (err) {
        console.error('Error fetching connections:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchConnections();
  }, [viewer?.member?.id]);

  if (viewerLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#f0faf4] flex items-center justify-center" style={{ paddingTop: '72px' }}>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#1e6b4e] animate-spin" />
            <p className="text-sm text-[#1e6b4e] font-medium">Loading your village...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#f0faf4]" style={{ paddingTop: '72px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1e6b4e] mb-1">My Village</h1>
            <p className="text-sm text-[#546E5C]">
              {connections.length} trusted connection{connections.length !== 1 ? 's' : ''} in your care circle
            </p>
          </div>

          {/* Connections List */}
          {connections.length > 0 ? (
            <div className="space-y-3">
              {connections.map((member) => {
                const displayName = `${member.first_name || ''} ${(member.last_name || '').charAt(0)}.`.trim();
                const roleLabel = member.role === 'caregiver' ? 'Caregiver' : member.role === 'both' ? 'Parent & Caregiver' : 'Parent';
                const locationText = member.neighborhood || member.zip_code || '';
                const availability = (member.availability_days || []);
                const availText = availability.length > 0
                  ? availability.length === 7 ? 'All week'
                    : availability.length === 5 && ['mon', 'tue', 'wed', 'thu', 'fri'].every((d: string) => availability.includes(d)) ? 'Mon-Fri'
                      : availability.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')
                  : '';

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl p-5 border border-[#8bd7c7]/20 shadow-sm hover:border-[#8bd7c7]/40 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-[#d8f5e5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-xl font-bold text-[#1e6b4e]">
                            {(member.first_name || '?').charAt(0)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-[#1e6b4e]">{displayName}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#d8f5e5] text-[#1e6b4e] font-medium">
                            {roleLabel}
                          </span>
                        </div>

                        {/* Location + Availability */}
                        <div className="flex items-center gap-3 text-xs text-[#546E5C] mb-2">
                          {locationText && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {locationText}
                            </span>
                          )}
                          {availText && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {availText}
                            </span>
                          )}
                        </div>

                        {/* Bio snippet */}
                        {member.bio && (
                          <p className="text-xs text-[#546E5C] line-clamp-2 mb-3">{member.bio}</p>
                        )}

                        {/* Care type pills */}
                        {member.care_types && member.care_types.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {member.care_types.slice(0, 3).map((ct: string) => (
                              <span
                                key={ct}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#8bd7c7]/15 text-[#1e6b4e] font-medium"
                              >
                                {ct.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/messages?to=${member.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1e6b4e] rounded-full hover:bg-[#174f3a] transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Message
                          </Link>
                          <Link
                            to={`/member/${member.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1e6b4e] border border-[#8bd7c7]/30 rounded-full hover:bg-[#d8f5e5]/50 transition-colors"
                          >
                            <User className="w-3.5 h-3.5" />
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl p-8 border border-[#8bd7c7]/20 shadow-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#d8f5e5] rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-[#1e6b4e]" />
              </div>
              <h3 className="text-lg font-bold text-[#1e6b4e] mb-2">Your village is empty</h3>
              <p className="text-sm text-[#546E5C] mb-5 max-w-sm mx-auto">
                Invite families and caregivers you trust to start building your care circle.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Link
                  to="/invite"
                  className="inline-block px-6 py-2.5 bg-[#1e6b4e] text-white text-sm font-semibold rounded-full hover:bg-[#174f3a] transition-colors"
                >
                  Invite a Family
                </Link>
                <Link
                  to="/matches"
                  className="text-sm text-[#1e6b4e] font-semibold hover:underline"
                >
                  Discover Neighbors →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}