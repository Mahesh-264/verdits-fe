import React, { useEffect, useMemo, useState } from 'react';
import { FileText, ImagePlus, Plus, X } from 'lucide-react';

const baseInputClassName =
  'w-full rounded-2xl border border-[#dbe2ef] bg-[#fbfcff] px-4 py-3 text-[#0b1f44] outline-none transition focus:border-[#15a276]';

const TagInput = ({ value, onChange }) => {
  const [draft, setDraft] = useState('');

  const commitTag = () => {
    const nextTag = draft.trim();
    if (!nextTag || value.includes(nextTag)) {
      setDraft('');
      return;
    }

    onChange([...value, nextTag]);
    setDraft('');
  };

  return (
    <div className="rounded-3xl border border-[#dbe2ef] bg-[#fbfcff] px-4 py-4">
     <div className="flex flex-wrap gap-2">
  {value.map((item) => (
    <span key={item} className="inline-flex items-center gap-2 rounded-full bg-[#e8f7f2] px-3 py-2 text-sm font-medium text-[#15a276]">
      {item}
      <button type="button" onClick={() => onChange(value.filter((tag) => tag !== item))}>
        <X size={14} />
      </button>
    </span>
  ))}

  {/* 🔥 SHOW DRAFT LIVE */}
  {draft && (
    <span className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-3 py-2 text-sm text-gray-700 opacity-70">
      {draft}
    </span>
  )}
</div>

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commitTag();
            }
          }}
          placeholder="Add tags or specialization"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#8a95ab]"
        />
        <button
          type="button"
          onClick={commitTag}
          className="verdits-icon-action inline-flex h-9 w-9 items-center justify-center rounded-full transition"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default function PostComposerModal({
  open,
  title = 'Create Post',
  description = 'Share an update with your network.',
  submitting,
  error,
  onClose,
  onSubmit,
}) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedPreview, setSelectedPreview] = useState(null);

  const previews = useMemo(
    () => images.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [images]
  );

  useEffect(() => {
    if (!open) return undefined;

    const bodyStyle = document.body.style;
    const htmlStyle = document.documentElement.style;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyPaddingRight = bodyStyle.paddingRight;
    const previousHtmlOverflow = htmlStyle.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // The dialog owns scrolling while it is open, so the dashboard behind it cannot move.
    bodyStyle.overflow = 'hidden';
    htmlStyle.overflow = 'hidden';
    if (scrollbarWidth > 0) bodyStyle.paddingRight = `${scrollbarWidth}px`;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.paddingRight = previousBodyPaddingRight;
      htmlStyle.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose, submitting]);

  useEffect(() => () => {
    previews.forEach(({ preview }) => URL.revokeObjectURL(preview));
  }, [previews]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden bg-[#081124]/60 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-composer-title"
    >
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_24px_60px_rgba(8,17,36,0.26)] sm:max-h-[calc(100dvh-3rem)]">
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#15a276]">Create Post</p>
            <h2 id="post-composer-title" className="mt-2 text-[26px] font-semibold text-[#0b1f44]">{title}</h2>
            <p className="mt-2 text-sm text-[#5e6c87]">{description}</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="shrink-0 rounded-full border border-[#dbe2ef] p-2 text-[#5e6c87] transition hover:bg-[#f7f9fd] disabled:cursor-not-allowed disabled:opacity-60" aria-label="Close create post dialog">
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ content, visibility, tags, images });
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#243b67]">Text Content</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              placeholder="Share an update, opportunity, or insight..."
              className={baseInputClassName}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#243b67]">Visibility</label>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
                className={baseInputClassName}
              >
                <option value="public">Public</option>
                <option value="connections">Connections</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#243b67]">Attachments</label>
              <label className={`${baseInputClassName} flex cursor-pointer items-center justify-between`}>
                <span className="text-sm text-[#44516d]">Upload 1-3 files</span>
                <ImagePlus size={18} />
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const nextFiles = Array.from(event.target.files || []).slice(0, 3);
                    setImages(nextFiles);
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#243b67]">Tags / Specialization</label>
            <TagInput value={tags} onChange={setTags} />
          </div>

          {previews.length > 0 ? (
            <div>
              <p className="mb-3 text-sm font-semibold text-[#243b67]">Preview</p>
              <div className={`grid gap-3 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                {previews.map((item, index) => item.file.type.startsWith('image/') ? (
                  <div key={`${item.file.name}-${item.file.size}`} className="overflow-hidden rounded-2xl border border-[#dbe2ef] bg-[#fbfcff]">
                    <img src={item.preview} alt={item.file.name} className="h-40 w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 border-t border-[#dbe2ef] px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPreview(item)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#15a276] transition hover:bg-[#e8f7f2]"
                      >
                        View image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPreview(null);
                          setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={`${item.file.name}-${item.file.size}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#dbe2ef] bg-[#fbfcff] p-4">
                    <FileText className="shrink-0 text-[#15a276]" size={22} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#243b67]" title={item.file.name}>{item.file.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-[#6d7a92]">{item.file.type || 'File'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-[#ffd9d9] bg-[#fff4f4] px-4 py-3 text-sm text-[#b13e3e]">
              {error}
            </div>
          ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#edf1f7] bg-white px-5 py-4 sm:px-6">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-2xl border border-[#dbe2ef] px-5 py-3 font-semibold text-[#243b67] disabled:cursor-not-allowed disabled:opacity-60">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="verdits-primary-action rounded-2xl px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Posting...' : 'Post Now'}
            </button>
          </div>
        </form>
      </div>

      {selectedPreview ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSelectedPreview(null)}
            className="absolute right-4 top-4 rounded-full bg-white/95 p-2 text-[#0b1f44] shadow-lg transition hover:bg-[#fff2bf]"
            aria-label="Close image preview"
          >
            <X size={20} />
          </button>
          <img
            src={selectedPreview.preview}
            alt={selectedPreview.file.name}
            className="max-h-[92vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      ) : null}
    </div>
  );
}
