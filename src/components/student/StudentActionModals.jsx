import React, { useState } from 'react';
import { Check, Paperclip, Plus, X } from 'lucide-react';

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
            className="inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-3 py-2 text-sm font-medium text-[#2456f5]"
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0d1024] text-white"
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

const baseInputClassName = 'w-full rounded-2xl border border-[#dbe2ef] bg-[#fbfcff] px-4 py-3 text-[#0b1f44] outline-none transition focus:border-[#2456f5]';

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

  if (!open || !internship) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[#081124]/55 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-[0_24px_60px_rgba(8,17,36,0.26)]">
        <div className="sticky top-0 z-10 border-b border-[#e3e8f3] bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2456f5]">Internship Application</p>
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
                        setForm((current) => ({ ...current, resumeFileName: file?.name || '' }));
                      }}
                    />
                  </label>
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
              className="rounded-2xl bg-[#0d1024] px-6 py-3 font-semibold text-white transition hover:bg-[#171b34] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0e8f5b]">Join Jam Session</p>
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

        <div className="mt-6 rounded-[28px] bg-[#f6fbf8] p-5">
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
            className="inline-flex items-center gap-2 rounded-2xl bg-[#114a38] px-6 py-3 font-semibold text-white transition hover:bg-[#176049] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check size={16} />
            {submitting ? 'Joining...' : 'Confirm Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
