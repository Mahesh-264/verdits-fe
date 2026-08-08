import React, { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, Paperclip, Plus, X } from 'lucide-react';

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
          <span
            key={item}
            className="inline-flex items-center gap-2 rounded-full bg-[#e8f7f2] px-3 py-2 text-sm font-medium text-[#15a276]"
          >
            {item}
            <button type="button" onClick={() => onChange(value.filter((tag) => tag !== item))}>
              <X size={14} />
            </button>
          </span>
        ))}
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
          placeholder="Add skills and press Enter"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#8a95ab]"
        />
        <button
          type="button"
          onClick={commitTag}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d6b85b] bg-[#f1d15f] text-[#062552] transition hover:bg-[#e5bd3c]"
          aria-label="Add skill"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

const Field = ({ label, required = false, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-[#243b67]">
      {label} {required ? <span className="text-[#d65f5f]">*</span> : null}
    </span>
    {children}
  </label>
);

const baseInputClassName = 'w-full rounded-2xl border border-[#dbe2ef] bg-[#fbfcff] px-4 py-3 text-[#0b1f44] outline-none transition focus:border-[#15a276]';

export function InternshipApplicationModal({
  open,
  internship,
  initialValues,
  submitting,
  error,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialValues);
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);
  const resumePreviewUrl = useMemo(
    () => (form.resumeFile ? URL.createObjectURL(form.resumeFile) : ''),
    [form.resumeFile]
  );

  useEffect(() => () => {
    if (resumePreviewUrl) {
      URL.revokeObjectURL(resumePreviewUrl);
    }
  }, [resumePreviewUrl]);

  if (!open || !internship) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[#081124]/55 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-[0_24px_60px_rgba(8,17,36,0.26)]">
        <div className="sticky top-0 z-10 border-b border-[#e3e8f3] bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#15a276]">Internship Application</p>
              <h2 className="mt-2 text-[26px] font-semibold text-[#0b1f44]">{internship.title}</h2>
              <p className="mt-2 text-sm text-[#5e6c87]">{internship.lawyerName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#dbe2ef] p-2 text-[#5e6c87] transition hover:bg-[#f7f9fd]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
          className="space-y-7 px-6 py-6"
        >
          <section className="rounded-[28px] border border-[#e3e8f3] bg-[#fcfdff] p-5">
            <h3 className="text-lg font-semibold text-[#102144]">Basic Details</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="First Name" required>
                <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} className={baseInputClassName} />
              </Field>
              <Field label="Last Name" required>
                <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} className={baseInputClassName} />
              </Field>
              <Field label="Email" required>
                <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={baseInputClassName} />
              </Field>
              <Field label="Phone Number" required>
                <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className={baseInputClassName} />
              </Field>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e3e8f3] bg-[#fcfdff] p-5">
            <h3 className="text-lg font-semibold text-[#102144]">Academic Details</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="College / University Name" required>
                <input value={form.collegeName} onChange={(event) => setForm((current) => ({ ...current, collegeName: event.target.value }))} className={baseInputClassName} />
              </Field>
              <Field label="Degree" required>
                <input value={form.degree} onChange={(event) => setForm((current) => ({ ...current, degree: event.target.value }))} placeholder="LLB, BA LLB" className={baseInputClassName} />
              </Field>
              <Field label="Year of Study" required>
                <input value={form.yearOfStudy} onChange={(event) => setForm((current) => ({ ...current, yearOfStudy: event.target.value }))} className={baseInputClassName} />
              </Field>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e3e8f3] bg-[#fcfdff] p-5">
            <h3 className="text-lg font-semibold text-[#102144]">Professional Info</h3>
            <div className="mt-5 space-y-4">
              <Field label="Skills" required>
                <TagInput value={form.skills} onChange={(skills) => setForm((current) => ({ ...current, skills }))} />
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Resume Link">
                  <input value={form.resumeLink} onChange={(event) => setForm((current) => ({ ...current, resumeLink: event.target.value }))} placeholder="https://..." className={baseInputClassName} />
                </Field>
                <Field label="Resume File Upload">
                  <label className={`${baseInputClassName} flex cursor-pointer items-center justify-between`}>
                    <span className={form.resumeFileName ? 'text-[#0b1f44]' : 'text-[#8a95ab]'}>
                      {form.resumeFileName || 'Attach resume file'}
                    </span>
                    <Paperclip size={16} />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        setForm((current) => ({
                          ...current,
                          resumeFile: file || null,
                          resumeFileName: file?.name || '',
                        }));
                        setResumePreviewOpen(false);
                      }}
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    />
                  </label>
                  {form.resumeFile ? (
                    <button
                      type="button"
                      onClick={() => setResumePreviewOpen(true)}
                      className="mt-2 inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-[#dbe2ef] bg-white px-4 py-3 text-left text-sm font-semibold text-[#0b1f44] transition hover:bg-[#f8faff]"
                    >
                      <span className="min-w-0 truncate">{form.resumeFileName}</span>
                      <ExternalLink size={16} className="shrink-0 text-[#15a276]" />
                    </button>
                  ) : null}
                </Field>
              </div>
              <Field label="Short Bio / Cover Message">
                <textarea value={form.coverMessage} onChange={(event) => setForm((current) => ({ ...current, coverMessage: event.target.value }))} rows={5} className={baseInputClassName} />
              </Field>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e3e8f3] bg-[#fcfdff] p-5">
            <h3 className="text-lg font-semibold text-[#102144]">Optional Links</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="LinkedIn Profile">
                <input value={form.linkedIn} onChange={(event) => setForm((current) => ({ ...current, linkedIn: event.target.value }))} placeholder="https://linkedin.com/in/..." className={baseInputClassName} />
              </Field>
              <Field label="Portfolio Link">
                <input value={form.portfolio} onChange={(event) => setForm((current) => ({ ...current, portfolio: event.target.value }))} placeholder="https://..." className={baseInputClassName} />
              </Field>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-[#ffd9d9] bg-[#fff4f4] px-4 py-3 text-sm text-[#b13e3e]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pb-4">
            <button type="button" onClick={onClose} className="rounded-2xl border border-[#dbe2ef] px-5 py-3 font-semibold text-[#243b67]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] px-6 py-3 font-bold text-zinc-950 transition-colors border border-[#d6b85b] shadow-sm select-none touch-manipulation active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>

      {resumePreviewOpen && form.resumeFile ? (
        <LocalResumePreviewModal
          file={form.resumeFile}
          fileName={form.resumeFileName}
          url={resumePreviewUrl}
          onClose={() => setResumePreviewOpen(false)}
        />
      ) : null}
    </div>
  );
}

function LocalResumePreviewModal({ file, fileName, url, onClose }) {
  const fileType = file?.type || '';
  const lowerName = String(fileName || '').toLowerCase();
  const isPdf = fileType === 'application/pdf' || lowerName.endsWith('.pdf');
  const isImage = fileType.startsWith('image/');
  const canEmbed = isPdf || isImage;

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#e3e8f3] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#15a276]">Resume Preview</p>
            <h3 className="mt-1 truncate text-lg font-semibold text-[#0b1f44]">{fileName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#dbe2ef] px-4 py-2 text-sm font-semibold text-[#243b67] transition hover:bg-[#f8faff]"
            >
              <ExternalLink size={16} />
              Open
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#dbe2ef] p-2 text-[#5e6c87] transition hover:bg-[#f7f9fd]"
              aria-label="Close resume preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-[60vh] flex-1 bg-[#f8faff] p-4">
          {isImage ? (
            <div className="flex h-full min-h-[60vh] items-center justify-center">
              <img src={url} alt={fileName} className="max-h-[76vh] max-w-full object-contain" />
            </div>
          ) : canEmbed ? (
            <iframe title={fileName} src={url} className="h-[76vh] w-full rounded-2xl border border-[#dbe2ef] bg-white" />
          ) : (
            <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#dbe2ef] bg-white p-6 text-center">
              <p className="text-lg font-semibold text-[#0b1f44]">Preview may not be available for this file type.</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#5e6c87]">
                Use Open to view the selected resume in a browser tab or your system document viewer before applying.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function JamJoinModal({
  open,
  session,
  defaultName,
  defaultEmail,
  submitting,
  error,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(defaultName || '');
  const [email, setEmail] = useState(defaultEmail || '');

  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#081124]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-[0_24px_60px_rgba(8,17,36,0.26)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#15a276]">Join Jam Session</p>
            <h2 className="mt-2 text-[24px] font-semibold text-[#0b1f44]">{session.title}</h2>
            <p className="mt-2 text-sm text-[#5e6c87]">{session.lawyerName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#dbe2ef] p-2 text-[#5e6c87] transition hover:bg-[#f7f9fd]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 rounded-[28px] bg-[#f8faff] p-5">
          <p className="text-sm leading-7 text-[#35506a]">
            Confirm your participation and we’ll mark you as joined right away. No long form needed.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Your Name">
              <input value={name} onChange={(event) => setName(event.target.value)} className={baseInputClassName} />
            </Field>
            <Field label="Email">
              <input value={email} onChange={(event) => setEmail(event.target.value)} className={baseInputClassName} />
            </Field>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#ffd9d9] bg-[#fff4f4] px-4 py-3 text-sm text-[#b13e3e]">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-[#dbe2ef] px-5 py-3 font-semibold text-[#243b67]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ name, email })}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 font-bold border border-[#d6b85b] px-6 py-3 transition-colors shadow-sm select-none touch-manipulation active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={16} />
            {submitting ? 'Joining...' : 'Confirm Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
