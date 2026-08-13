import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaCircle, FaTimes } from 'react-icons/fa';
import { capitalize, formatDate, normalizeExternalUrl } from '../../utils/lawyerUtils';

export function FeaturePageShell({ title, icon, onClose, children }) {
  return (
    <div className="w-full animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#dbe2ef]">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-4 py-2.5 text-sm font-bold transition shadow-sm cursor-pointer border border-[#d6b85b]"
          >
            <FaArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-6 w-px bg-[#dbe2ef] hidden sm:block" />
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-[#062552]">
            {icon} {title}
          </h1>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="self-end sm:self-auto text-[#5f7488] hover:text-[#062552] bg-white border border-[#d7e9ef] hover:bg-gray-100 rounded-full transition p-2.5 shadow-sm cursor-pointer"
          aria-label="Close feature page"
        >
          <FaTimes size={18} />
        </button>
      </div>

      <div className="w-full">{children}</div>
    </div>
  );
}

export const ModalShell = FeaturePageShell;

export function EmptyBlock({ icon, message }) {
  return (
    <div className="text-center py-16 border border-dashed border-[#d7e9ef] rounded-2xl bg-white shadow-sm">
      <div className="w-16 h-16 bg-[#e8f7f2] text-[#15a276] rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="text-[#5f7488] font-medium">{message}</p>
    </div>
  );
}

export function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
        status === 'Pending'
          ? 'bg-[#15a276]/10 text-[#15a276] border-[#15a276]/20'
          : status === 'Accepted'
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            : 'bg-red-500/10 text-red-500 border-red-500/20'
      }`}
    >
      <FaCircle className="text-[8px]" /> {status}
    </span>
  );
}

export function ApplicantDetail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[190px] text-right font-semibold text-zinc-200">{value || 'Not shared'}</span>
    </div>
  );
}

export function ApplicantLink({ href, label }) {
  const safeHref = normalizeExternalUrl(href);

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-blue-300 transition hover:border-blue-500/50 hover:text-blue-200"
    >
      {label}
    </a>
  );
}

export function ResumePreviewModal({ resume, onClose }) {
  const resumeUrl = normalizeExternalUrl(resume.url);
  const fileName = resume.fileName || 'Uploaded resume';
  const filePath = `${fileName} ${resumeUrl.split('?')[0]}`.toLowerCase();
  const isImage = /\.(png|jpe?g|webp|gif)\b/.test(filePath);
  const isPdf = /\.pdf\b/.test(filePath);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(isPdf);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isPdf) return undefined;

    const controller = new AbortController();
    let objectUrl = '';

    const loadPdf = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError('');

        const response = await fetch(resumeUrl, { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load this PDF');

        const fileBlob = await response.blob();
        const pdfBlob = fileBlob.type === 'application/pdf'
          ? fileBlob
          : new Blob([fileBlob], { type: 'application/pdf' });

        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfPreviewUrl(objectUrl);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setPreviewError('The PDF could not be displayed. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    };

    loadPdf();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isPdf, resumeUrl]);

  const officePreviewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeUrl)}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${fileName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15a276]">Resume preview</p>
            <h3 className="mt-1 truncate font-semibold text-white">{fileName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-zinc-800 p-2 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
            aria-label="Close resume preview"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 bg-zinc-800">
          {previewLoading ? (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-zinc-300">
              Loading PDF preview...
            </div>
          ) : previewError ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm font-semibold text-red-300">
              {previewError}
            </div>
          ) : isImage ? (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              <img src={resumeUrl} alt={fileName} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <iframe
              src={isPdf ? pdfPreviewUrl : officePreviewUrl}
              title={fileName}
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ApplicantDrawer({
  drawer,
  drawerFilter,
  setDrawerFilter,
  activeDrawerFilters,
  filteredDrawerItems,
  onClose,
  setResumePreview,
  updatingApplicantId,
  handleApplicantDecision,
}) {
  if (!drawer.open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex justify-end bg-black/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-zinc-950 p-6 shadow-2xl overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15a276]">
              {drawer.type === 'participants' ? 'Jam Session Participants' : 'Internship Applicants'}
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">{drawer.title}</h3>
            {drawer.parentLabel ? (
              <p className="mt-1 text-xs text-zinc-400">For: {drawer.parentLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {activeDrawerFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setDrawerFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                drawerFilter === filter
                  ? 'bg-white text-zinc-950'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {filteredDrawerItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
              {drawer.type === 'participants'
                ? 'No students have joined this session yet.'
                : 'No records match this filter.'}
            </div>
          ) : (
            filteredDrawerItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">{item.email || 'No email shared'}</p>
                    <p className="text-xs text-zinc-500 mt-2">
                      {item.collegeName || 'College not shared'}
                      {item.yearOfStudy ? ` | ${item.yearOfStudy}` : ''}
                    </p>
                    {drawer.type === 'participants' && item.joinedAt ? (
                      <p className="text-xs text-zinc-500 mt-2">Joined: {formatDate(item.joinedAt)}</p>
                    ) : null}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${
                    drawer.type === 'participants'
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                      : item.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : item.status === 'rejected'
                          ? 'bg-red-500/10 text-red-300 border-red-500/20'
                          : 'bg-[#15a276]/10 text-[#8de2c6] border-[#15a276]/20'
                  }`}>
                    {drawer.type === 'participants' ? 'Joined' : capitalize(item.status || 'pending')}
                  </span>
                </div>

                {item.coverMessage ? (
                  <p className="mt-3 text-xs leading-6 text-zinc-300">{item.coverMessage}</p>
                ) : null}

                {drawer.type === 'applicants' ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-2 text-xs text-zinc-300">
                      <ApplicantDetail label="Phone" value={item.phone} />
                      <ApplicantDetail label="Degree" value={item.degree} />
                      <ApplicantDetail label="Year" value={item.yearOfStudy} />
                      <ApplicantDetail label="Applied" value={formatDate(item.submittedAt)} />
                    </div>

                    {item.skills?.length ? (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Skills</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.skills.map((skill) => (
                            <span key={skill} className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Resume and links</p>
                      <div className="mt-3 space-y-2">
                        {item.resumeLink ? <ApplicantLink href={item.resumeLink} label="Open resume link" /> : null}
                        {item.resumeUrl ? (
                          <button
                            type="button"
                            onClick={() => setResumePreview({
                              url: item.resumeUrl,
                              fileName: item.resumeFileName || `${item.name || 'Applicant'} resume`,
                            })}
                            className="block w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-xs font-bold text-blue-300 transition hover:border-blue-500/50 hover:text-blue-200"
                          >
                            View uploaded resume
                          </button>
                        ) : null}
                        {item.linkedIn ? <ApplicantLink href={item.linkedIn} label="Open LinkedIn" /> : null}
                        {item.portfolio ? <ApplicantLink href={item.portfolio} label="Open portfolio" /> : null}
                        {item.resumeFileName ? (
                          <p className="text-xs text-zinc-400">Attached file name: {item.resumeFileName}</p>
                        ) : null}
                        {!item.resumeLink && !item.resumeUrl && !item.linkedIn && !item.portfolio && !item.resumeFileName ? (
                          <p className="text-xs text-zinc-500">No resume or external links shared.</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplicantDecision(item.id, 'accepted')}
                        disabled={updatingApplicantId === item.id || item.status === 'accepted'}
                        className="verdits-primary-action flex-1 rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed"
                      >
                        {updatingApplicantId === item.id ? 'Saving...' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplicantDecision(item.id, 'rejected')}
                        disabled={updatingApplicantId === item.id || item.status === 'rejected'}
                        className="verdits-danger-action flex-1 rounded-lg border border-red-900/60 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingApplicantId === item.id ? 'Saving...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-zinc-500">
                    Joined on {new Date(item.joinedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
