import React, { useState } from 'react';
import { Heart, MessageSquare, Send, Share2 } from 'lucide-react';

export default function ReactionBar({
  item,
  itemLabel = 'post',
  compact = false,
  onLike,
  onComment,
}) {
  const [liked, setLiked] = useState(Boolean(item?.liked));
  const [likesCount, setLikesCount] = useState(Number(item?.likesCount) || 0);
  const [commentsCount, setCommentsCount] = useState(Number(item?.commentsCount) || 0);
  const [comments, setComments] = useState(Array.isArray(item?.comments) ? item.comments : []);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const handleLike = async () => {
    if (working) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));

    try {
      setWorking(true);
      const result = await onLike?.(item);
      if (result) {
        setLiked(Boolean(result.liked));
        setLikesCount(Number(result.likesCount) || 0);
      }
    } catch (error) {
      setLiked(!nextLiked);
      setLikesCount((count) => Math.max(0, count + (nextLiked ? -1 : 1)));
      setMessage(error.response?.data?.message || 'Could not update reaction.');
    } finally {
      setWorking(false);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text || working) return;

    try {
      setWorking(true);
      setMessage('');
      const result = await onComment?.(item, text);
      const nextComment = result?.comment || {
        id: `${Date.now()}`,
        name: 'You',
        role: 'member',
        text,
        postedAt: 'Just now',
      };
      setComments((current) => [nextComment, ...current]);
      setCommentsCount(Number(result?.commentsCount) || commentsCount + 1);
      setCommentText('');
      setShowComments(true);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add comment.');
    } finally {
      setWorking(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    const shareText = item?.title || item?.content || item?.summary || `VERDITS ${itemLabel}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: shareText, text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setMessage('Link copied.');
      }
    } catch {
      setMessage('Share was cancelled.');
    }
  };

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center gap-2 ${compact ? 'text-sm' : 'text-base'}`}>
        <ReactionButton active={liked} onClick={handleLike} icon={<Heart size={18} fill={liked ? 'currentColor' : 'none'} />}>
          {likesCount} Like{likesCount === 1 ? '' : 's'}
        </ReactionButton>
        <ReactionButton onClick={() => setShowComments((current) => !current)} icon={<MessageSquare size={18} />}>
          {commentsCount} Comment{commentsCount === 1 ? '' : 's'}
        </ReactionButton>
        <ReactionButton onClick={handleShare} icon={<Share2 size={18} />}>
          Share
        </ReactionButton>
      </div>

      {showComments ? (
        <div className="rounded-2xl border border-[#dbe2ef] bg-[#f8faff] p-4">
          <form onSubmit={handleComment} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={`Add a comment on this ${itemLabel}`}
              className="min-w-0 flex-1 rounded-xl border border-[#dbe2ef] bg-white px-4 py-3 text-sm outline-none focus:border-[#15a276]"
            />
            <button
              type="submit"
              disabled={working || !commentText.trim()}
              className="verdits-primary-action inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed"
            >
              <Send size={16} />
              Post
            </button>
          </form>

          {comments.length ? (
            <div className="mt-4 space-y-3">
              {comments.slice(0, 4).map((comment) => (
                <div key={comment.id || comment._id || `${comment.userId}-${comment.createdAt}`} className="rounded-xl bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6d7a92]">
                    <span className="font-semibold text-[#0b1f44]">{comment.name || 'User'}</span>
                    <span>{comment.role || 'member'}</span>
                    <span>{comment.postedAt || 'Just now'}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#243b67]">{comment.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="text-sm font-medium text-[#5e6c87]">{message}</p> : null}
    </div>
  );
}

function ReactionButton({ active = false, icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-semibold transition ${
        active
          ? 'border-[#f4a0b5] bg-[#fff0f4] text-[#c42c55]'
          : 'border-[#dbe2ef] bg-white text-[#243b67] hover:bg-[#f8faff]'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
