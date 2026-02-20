import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useViewer } from '../hooks/useViewer';
import { Users, MessageCircle, Loader2, UserPlus } from 'lucide-react';

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
        <div className="min-h-screen bg-[#f0faf4] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#f0faf4]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8" style={{ fontFamily: 'Comfortaa, sans-serif' }}>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#1e6b4e] mb-1">Connections</h1>
              <p className="text-sm text-[#546E5C]">
                {connections.length} trusted {connections.length === 1 ? 'connection' : 'connections'} in your care circle
              </p>
            </div>
            <Link
              to="/invite-friends"
              className="px-5 py-2.5 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#155a3e] transition-colors flex items-center gap-2 shadow-sm self-start"
            >
              <UserPlus className="w-4 h-4" />
              Invite Friends
            </Link>
          </div>

          {/* Connections Grid */}
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {connections.map((member) => {
                const displayName = `${member.first_name || ''} ${(member.last_name || '').charAt(0)}.`.trim();
                const roleLabel = member.role === 'caregiver' ? 'Caregiver' : member.role === 'both' ? 'Parent & Caregiver' : 'Parent';

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-[20px] border border-[#8bd7c7]/20 shadow-sm hover:shadow-md hover:border-[#8bd7c7]/40 transition-all overflow-hidden"
                  >
                    {/* Top gradient banner */}
                    <div className={`h-16 ${member.role === 'caregiver'
                        ? 'bg-gradient-to-r from-[#F8C3B3]/20 via-[#F8C3B3]/10 to-[#d8f5e5]/20'
                        : member.role === 'both'
                          ? 'bg-gradient-to-r from-[#8bd7c7]/20 via-[#d8f5e5]/20 to-[#F8C3B3]/10'
                          : 'bg-gradient-to-r from-[#d8f5e5] via-[#8bd7c7]/20 to-[#F8C3B3]/10'
                      }`} />

                    {/* Avatar + Info */}
                    <div className="px-5 pb-5 -mt-8">
                      {/* Large Avatar */}
                      <div className="w-16 h-16 rounded-full bg-white border-[3px] border-white shadow-md flex items-center justify-center overflow-hidden mb-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={displayName}
                            className="w-full h-full object-cover rounded-full hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#d8f5e5] flex items-center justify-center">
                            <span className="text-xl font-bold text-[#1e6b4e]">
                              {(member.first_name || '?').charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Name + Role */}
                      <h3 className="text-base font-bold text-[#1e6b4e] mb-0.5">{displayName}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${member.role === 'caregiver'
                            ? 'bg-[#F8C3B3]/30 text-[#c4785e]'
                            : member.role === 'both'
                              ? 'bg-[#8bd7c7]/20 text-[#1e6b4e]'
                              : 'bg-[#d8f5e5] text-[#1e6b4e]'
                          }`}>
                          {roleLabel}
                        </span>
                        {member.neighborhood && (
                          <span className="text-xs text-[#546E5C]">{member.neighborhood}</span>
                        )}
                      </div>

                      {/* Brief bio preview */}
                      {member.bio && (
                        <p className="text-xs text-[#546E5C] line-clamp-2 mb-3">{member.bio}</p>
                      )}

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/messages?to=${member.id}`}
                          className="py-2 rounded-full bg-[#1e6b4e] text-white text-xs font-semibold text-center hover:bg-[#174f3a] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Message
                        </Link>
                        <Link
                          to={`/member/${member.id}`}
                          className="py-2 rounded-full border border-[#8bd7c7]/30 text-xs font-semibold text-[#1e6b4e] text-center hover:bg-[#d8f5e5]/50 transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-[20px] p-12 text-center border border-[#8bd7c7]/20 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#d8f5e5] flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#1e6b4e]" />
              </div>
              <h3 className="font-semibold text-[#1e6b4e] mb-2 text-lg">No connections yet</h3>
              <p className="text-sm text-[#546E5C] mb-6 max-w-md mx-auto">
                Start building your village by discovering families and caregivers nearby.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/matches"
                  className="px-6 py-2.5 rounded-full bg-[#1e6b4e] text-white text-sm font-semibold hover:bg-[#155a3e] transition-colors"
                >
                  Discover People
                </Link>
                <Link
                  to="/invite-friends"
                  className="px-6 py-2.5 rounded-full border border-[#8bd7c7]/30 text-sm font-semibold text-[#1e6b4e] hover:bg-[#d8f5e5]/50 transition-colors"
                >
                  Invite Friends
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}