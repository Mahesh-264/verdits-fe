import React from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Users,
} from 'lucide-react';
import api from '../../api/axios.jsx';
import ReactionBar from '../feed/ReactionBar.jsx';
import { formatDistanceLabel } from '../../utils/lawyerDiscovery.js';

const typeStyles = {
  internship: {
    badge: 'bg-[#e8f1ff] text-[#15a276]',
    button: 'bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold border border-[#d6b85b] shadow-sm',
    joined: 'bg-[#fffde6] text-[#755617] border border-[#ead79c]',
  },
  jam: {
    badge: 'bg-[#eafbf4] text-[#0e8f5b]',
    button: 'bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold border border-[#d6b85b] shadow-sm',
    joined: 'bg-[#fffde6] text-[#755617] border border-[#ead79c]',
  },
};

// Opportunity card shared by internships and jam sessions, now with host distance hints.
const getPrimaryActionLabel = (post) => {
  if (post.type === 'internship') {
    if (post.status === 'closed' && !post.applied) return 'Applications Closed';
    return post.applied ? 'Applied ✓' : 'Apply Now';
  }

  return post.joined ? 'Joined ✓' : 'Join Session';
};

export default function StudentOpportunityCard({
  post,
  mode = 'feed',
  onApply,
  onJoin,
}) {
  const styles = typeStyles[post.type] || typeStyles.internship;
  const isInternship = post.type === 'internship';
  const isCompleted = isInternship ? post.applied || post.status === 'closed' : post.joined;

  const handleInternshipLike = async () => {
    const { data } = await api.post(`/auth/lawyer/internships/${post.id}/like`);
    return data;
  };

  const handleInternshipComment = async (_post, text) => {
    const { data } = await api.post(`/auth/lawyer/internships/${post.id}/comments`, { text });
    return data;
  };

  const handleJamLike = async () => {
    const { data } = await api.post(`/auth/jam-sessions/${post.id}/like`);
    return data;
  };

  const handleJamComment = async (_post, text) => {
    const { data } = await api.post(`/auth/jam-sessions/${post.id}/comments`, { text });
    return data;
  };

  return (
    <article className="min-w-0 rounded-[28px] border border-[#dbe2ef] bg-white p-4 shadow-[0_8px_30px_rgba(11,31,68,0.06)] sm:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {post.profileImage ? (
              <img
                src={post.profileImage}
                alt={post.lawyerName}
                className="h-[68px] w-[68px] shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ffb76b] via-[#ff8b5f] to-[#ff6f61] text-2xl font-bold text-white">
                {post.avatar}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[19px] font-semibold text-[#0b1f44]">{post.lawyerName}</p>
                <span className={`rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] ${styles.badge}`}>
                  {isInternship ? 'Internship' : 'Jam Session'}
                </span>
              </div>
              <h2 className="mt-3 text-[24px] font-semibold tracking-tight text-[#102144]">{post.title}</h2>
              <p className="mt-2 text-[15px] text-[#62708a]">{post.postedAt || post.time}</p>
            </div>
          </div>

          {mode === 'explore' && (
            <div className="rounded-2xl bg-[#f5f7fb] px-4 py-3 text-right">
              <p className="text-[12px] uppercase tracking-[0.16em] text-[#7d8aa5]">Host</p>
              <p className="mt-1 text-[14px] font-semibold text-[#243b67]">{post.lawyerName}</p>
            </div>
          )}
        </div>

        <p className="text-[16px] leading-8 text-[#243b67]">
          {isInternship ? post.description : post.summary}
        </p>

        {isInternship ? (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 rounded-xl bg-[#f7f9fd] px-2.5 py-3 text-[#44516d] sm:rounded-2xl sm:px-4 sm:py-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#7d8aa5] sm:gap-2 sm:text-sm">
                  <MapPin size={16} />
                  Location
                </div>
                <p className="mt-1.5 break-words text-sm font-semibold text-[#0b1f44] sm:mt-2 sm:text-[15px]">{post.location}</p>
              </div>
              <div className="min-w-0 rounded-xl bg-[#f7f9fd] px-2.5 py-3 text-[#44516d] sm:rounded-2xl sm:px-4 sm:py-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#7d8aa5] sm:gap-2 sm:text-sm">
                  <CalendarDays size={16} />
                  Duration
                </div>
                <p className="mt-1.5 break-words text-sm font-semibold text-[#0b1f44] sm:mt-2 sm:text-[15px]">{post.duration}</p>
              </div>
              <div className="min-w-0 rounded-xl bg-[#f7f9fd] px-2.5 py-3 text-[#44516d] sm:rounded-2xl sm:px-4 sm:py-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#7d8aa5] sm:gap-2 sm:text-sm">
                  <IndianRupee size={16} />
                  Stipend
                </div>
                <p className="mt-1.5 break-words text-sm font-semibold text-[#0b1f44] sm:mt-2 sm:text-[15px]">{post.stipend}</p>
              </div>
              <div className="col-span-3 min-w-0 rounded-xl bg-[#f7f9fd] px-2.5 py-3 text-[#44516d] sm:col-auto sm:rounded-2xl sm:px-4 sm:py-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#7d8aa5] sm:gap-2 sm:text-sm">
                  <BriefcaseBusiness size={16} />
                  Specialization
                </div>
                <p className="mt-1.5 break-words text-sm font-semibold text-[#0b1f44] sm:mt-2 sm:text-[15px]">
                  {post.specialization?.length ? post.specialization.join(', ') : 'General'}
                </p>
              </div>
            </div>

            {post.skills?.length > 0 && (
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.18em] text-[#6d7a92]">
                  Skills
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#dbe2ef] bg-[#fbfcff] px-4 py-2 text-sm font-medium text-[#0b1f44]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-[#f7f9fd] px-4 py-4 text-[#44516d]">
              <div className="flex items-center gap-2 text-sm font-medium text-[#7d8aa5]">
                <Users size={16} />
                Host
              </div>
              <p className="mt-2 text-[15px] font-semibold text-[#0b1f44]">{post.lawyerName}</p>
            </div>
            <div className="rounded-2xl bg-[#f7f9fd] px-4 py-4 text-[#44516d]">
              <div className="flex items-center gap-2 text-sm font-medium text-[#7d8aa5]">
                <Clock3 size={16} />
                Date & Time
              </div>
              <p className="mt-2 text-[15px] font-semibold text-[#0b1f44]">{post.schedule || 'To be announced'}</p>
            </div>
            <div className="rounded-2xl bg-[#f7f9fd] px-4 py-4 text-[#44516d]">
              <div className="flex items-center gap-2 text-sm font-medium text-[#7d8aa5]">
                <MapPin size={16} />
                Format
              </div>
              <p className="mt-2 text-[15px] font-semibold text-[#0b1f44]">{post.location || 'Online / TBA'}</p>
            </div>
            <div className="rounded-2xl bg-[#f7f9fd] px-4 py-4 text-[#44516d]">
              <div className="flex items-center gap-2 text-sm font-medium text-[#7d8aa5]">
                <Users size={16} />
                Participation
              </div>
              <p className="mt-2 text-[15px] font-semibold text-[#0b1f44]">
                {post.participantCount || 0} joined
              </p>
            </div>
          </div>
        )}

        <ReactionBar
          item={post}
          itemLabel={isInternship ? 'internship' : 'jam session'}
          compact
          onLike={isInternship ? handleInternshipLike : handleJamLike}
          onComment={isInternship ? handleInternshipComment : handleJamComment}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-[#6d7a92]">
            <p>
              {isInternship
                ? `${post.applicationCount || 0} application${post.applicationCount === 1 ? '' : 's'} so far`
                : `${post.participantCount || 0} student${post.participantCount === 1 ? '' : 's'} joined`}
            </p>
            {Number.isFinite(Number(post.distanceKm)) ? (
              <p className="font-medium text-[#15a276]">{formatDistanceLabel(post.distanceKm)}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => (isInternship ? onApply?.(post) : onJoin?.(post))}
            disabled={isCompleted}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold transition-colors select-none touch-manipulation active:scale-[0.98] ${
              isCompleted
                ? `${styles.joined} cursor-not-allowed`
                : styles.button
            }`}
          >
            {isCompleted && <CheckCircle2 size={18} />}
            {getPrimaryActionLabel(post)}
          </button>
        </div>
      </div>
    </article>
  );
}
