import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { BriefcaseBusiness, CalendarDays, Clock3, ExternalLink, FileText, IndianRupee, MapPin, Trash2, Users, X } from 'lucide-react';
import api from '../../api/axios.jsx';
import ReactionBar from './ReactionBar.jsx';

const badgeStyles = {
  general: 'bg-[#eef2ff] text-[#4a54e1]',
  internship: 'bg-[#fff3df] text-[#ad5d12]',
  jam: 'bg-[#eafbf4] text-[#0e8f5b]',
};

const typeLabels = {
  general: 'General',
  internship: 'Internship',
  jam: 'Jam Session',
};

const getAttachmentName = (url, fallback) => {
  try {
    const name = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
    return name || fallback;
  } catch {
    return fallback;
  }
};

const normalizeAttachment = (item, index) => {
  if (typeof item === 'string') {
    return { url: item, name: getAttachmentName(item, `Image ${index + 1}`), type: 'image/*' };
  }

  const url = item?.url || item?.secure_url || item?.path || '';
  return {
    url,
    name: item?.name || item?.fileName || getAttachmentName(url, `Attachment ${index + 1}`),
    type: item?.type || item?.mimeType || item?.contentType || '',
  };
};

const isImageAttachment = (attachment) => (
  attachment.type.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)(?:\?|$)/i.test(attachment.url)
);

const formatAttachmentType = (type) => {
  if (!type || type === 'image/*') return 'Image';
  return type.split('/').pop().replace(/[-_]/g, ' ').toUpperCase();
};

export default function FeedPostCard({ post, onApply, onJoin, onDelete, deleting }) {
  const { user } = useSelector((state) => state.auth);
  const [selectedImage, setSelectedImage] = useState(null);
  const creatorName = post.creatorName || post.lawyerName || 'User';
  const creatorRole = post.creatorRole || 'user';
  const avatar = post.creatorAvatar || creatorName.charAt(0).toUpperCase();
  const profileImage = post.creatorProfileImage || post.profileImage || '';
  const isInternship = post.type === 'internship';
  const isJam = post.type === 'jam';
  const hasPrimaryAction = isInternship || isJam;
  const isDisabled = isInternship ? post.applied || post.status === 'closed' : post.joined;
  const attachments = (Array.isArray(post.media) ? post.media : [])
    .map(normalizeAttachment)
    .filter((attachment) => attachment.url);

  const actionLabel = isInternship
    ? post.applied
      ? 'Applied'
      : post.status === 'closed'
        ? 'Applications Closed'
        : 'Apply Now'
    : post.joined
      ? 'Joined'
      : 'Join';

  const handleLike = async () => {
    const endpoint = post.sourceModel === 'LegacyInternship'
      ? `/auth/lawyer/internships/${post.id}/like`
      : post.sourceModel === 'LegacyJamSession'
        ? `/auth/jam-sessions/${post.id}/like`
        : `/posts/${post.id}/like`;
    const { data } = await api.post(endpoint);
    return data;
  };

  const handleComment = async (_post, text) => {
    const endpoint = post.sourceModel === 'LegacyInternship'
      ? `/auth/lawyer/internships/${post.id}/comments`
      : post.sourceModel === 'LegacyJamSession'
        ? `/auth/jam-sessions/${post.id}/comments`
        : `/posts/${post.id}/comments`;
    const { data } = await api.post(endpoint, { text });
    return data;
  };

  return (
    <article className="rounded-[28px] border border-[#dbe2ef] bg-white p-6 shadow-[0_8px_30px_rgba(11,31,68,0.06)]">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {profileImage ? (
              <img src={profileImage} alt={creatorName} className="h-[64px] w-[64px] rounded-full object-cover" />
            ) : (
              <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-gradient-to-br from-[#244ed8] to-[#6ca6ff] text-xl font-bold text-white">
                {avatar}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[18px] font-semibold text-[#0b1f44]">{creatorName}</p>
                <span className="rounded-full bg-[#f3f6fc] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#5e6c87]">
                  {creatorRole}
                </span>
                <span className={`rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] ${badgeStyles[post.type] || badgeStyles.general}`}>
                  {typeLabels[post.type] || 'Post'}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#6d7a92]">{post.postedAt || post.time}</p>
            </div>
          </div>

          {Boolean(onDelete && user && (
            String(post.createdBy || post.lawyerId || post.createdBy?._id) === String(user._id || user.id)
          )) ? (
            <button
              type="button"
              onClick={() => onDelete(post)}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200/80 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-all hover:bg-red-600 hover:text-white hover:border-red-600 select-none touch-manipulation active:scale-[0.98] disabled:opacity-50"
              aria-label="Delete post"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          ) : null}
        </div>

        {post.title ? <h2 className="text-[24px] font-semibold tracking-tight text-[#102144]">{post.title}</h2> : null}

        <p className="text-[16px] leading-8 text-[#243b67]">{post.content || post.summary || post.description}</p>

        {attachments.length ? (
          <div className={`grid gap-3 ${attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
            {attachments.map((attachment) => isImageAttachment(attachment) ? (
              <div key={attachment.url} className="overflow-hidden rounded-[24px] border border-[#dbe2ef] bg-[#f7f9fd]">
                <button
                  type="button"
                  onClick={() => setSelectedImage(attachment.url)}
                  className="block w-full text-left transition hover:opacity-90"
                  aria-label={`Preview ${attachment.name}`}
                >
                  <img src={attachment.url} alt={attachment.name || post.title || creatorName} className="max-h-[520px] w-full object-contain" />
                </button>
                <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 border-t border-[#dbe2ef] px-4 py-3 text-sm font-semibold text-[#243b67] transition hover:bg-[#e8f7f2]">
                  <span className="min-w-0 truncate">{attachment.name}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[#15a276]">View <ExternalLink size={14} /></span>
                </a>
              </div>
            ) : (
              <div key={attachment.url} className="flex min-w-0 flex-col justify-between gap-4 rounded-[24px] border border-[#dbe2ef] bg-[#f7f9fd] p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#15a276]"><FileText size={20} /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0b1f44]" title={attachment.name}>{attachment.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-[#6d7a92]">{formatAttachmentType(attachment.type)}</p>
                  </div>
                </div>
                <a href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#dbe2ef] bg-white px-3 py-2 text-sm font-semibold text-[#243b67] transition hover:border-[#15a276] hover:bg-[#e8f7f2]">
                  View / Open <ExternalLink size={15} />
                </a>
              </div>
            ))}
          </div>
        ) : null}

        {post.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#eef3fb] px-3 py-2 text-sm font-medium text-[#35506a]">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {isInternship ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <MetaCard icon={<MapPin size={16} />} label="Location" value={post.location || 'Not specified'} />
            <MetaCard icon={<CalendarDays size={16} />} label="Duration" value={post.duration || 'Not specified'} />
            <MetaCard icon={<IndianRupee size={16} />} label="Stipend" value={post.stipend || 'Not specified'} />
          </div>
        ) : null}

        {isJam ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MetaCard icon={<Clock3 size={16} />} label="Schedule" value={post.schedule || 'To be announced'} />
            <MetaCard icon={<MapPin size={16} />} label="Location" value={post.location || 'Online / TBA'} />
          </div>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-[#e9eef7] pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <ReactionBar
              item={post}
              itemLabel={isJam ? 'jam session' : isInternship ? 'internship' : 'post'}
              compact
              onLike={handleLike}
              onComment={handleComment}
            />

            <div className="flex flex-wrap items-center gap-5 text-sm text-[#6d7a92]">
              {isInternship ? (
                <span className="inline-flex items-center gap-2">
                  <BriefcaseBusiness size={16} />
                  {post.applicationCount || 0} applied
                </span>
              ) : null}
              {isJam ? (
                <span className="inline-flex items-center gap-2">
                  <Users size={16} />
                  {post.participantCount || 0} joined
                </span>
              ) : null}
            </div>
          </div>

          {hasPrimaryAction ? (
            <button
              type="button"
              onClick={() => (isInternship ? onApply?.(post) : onJoin?.(post))}
              disabled={isDisabled}
              className={`self-start rounded-2xl px-5 py-3 text-sm font-semibold transition-colors select-none touch-manipulation active:scale-[0.98] ${
                isDisabled
                  ? 'cursor-not-allowed bg-[#fffde6] text-[#755617] border border-[#ead79c]'
                  : 'bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold border border-[#d6b85b] shadow-sm'
              }`}
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>

      {selectedImage ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/95 p-2 text-[#0b1f44] shadow-lg transition hover:bg-[#fff2bf]"
            aria-label="Close image preview"
          >
            <X size={20} />
          </button>
          <img
            src={selectedImage}
            alt={post.title || creatorName}
            className="max-h-[92vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      ) : null}
    </article>
  );
}

function MetaCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7f9fd] px-4 py-4 text-[#44516d]">
      <div className="flex items-center gap-2 text-sm font-medium text-[#7d8aa5]">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-[15px] font-semibold text-[#0b1f44]">{value}</p>
    </div>
  );
}
