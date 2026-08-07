import React, { useMemo, useState } from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';

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

  const previews = useMemo(
    () => images.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [images]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#081124]/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-6 shadow-[0_24px_60px_rgba(8,17,36,0.26)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#15a276]">Create Post</p>
            <h2 className="mt-2 text-[26px] font-semibold text-[#0b1f44]">{title}</h2>
            <p className="mt-2 text-sm text-[#5e6c87]">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[#dbe2ef] p-2 text-[#5e6c87] transition hover:bg-[#f7f9fd]">
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ content, visibility, tags, images });
          }}
          className="mt-6 space-y-5"
        >
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
              <label className="mb-2 block text-sm font-semibold text-[#243b67]">Images</label>
              <label className={`${baseInputClassName} flex cursor-pointer items-center justify-between`}>
                <span className="text-sm text-[#44516d]">Upload 1-3 images</span>
                <ImagePlus size={18} />
                <input
                  type="file"
                  accept="image/*"
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
                {previews.map((item) => (
                  <div key={`${item.file.name}-${item.file.size}`} className="overflow-hidden rounded-2xl border border-[#dbe2ef] bg-[#fbfcff]">
                    <img src={item.preview} alt={item.file.name} className="h-40 w-full object-cover" />
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

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-[#dbe2ef] px-5 py-3 font-semibold text-[#243b67]">
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
    </div>
  );
}
