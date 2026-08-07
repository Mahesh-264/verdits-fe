import React from 'react';
import { FaFileSignature, FaMagic, FaPlus, FaTimes } from 'react-icons/fa';
import { ModalShell } from './LawyerSharedComponents';
import { getNoticeFields, noticeDocumentTypes } from '../../utils/lawyerUtils';

export default function LawyerNoticeGeneratorModal({
  show,
  onClose,
  noticeForm,
  handleNoticeInput,
  handleNoticeNameInput,
  addNoticeName,
  removeNoticeName,
  noticeError,
  noticeLoading,
  handleGenerateNotice,
  noticeDraft,
  setNoticeDraft,
  handleCopyNotice,
  noticeEditPrompt,
  setNoticeEditPrompt,
  handleEditNotice,
  noticeEditing,
  noticeMessage,
}) {
  if (!show) return null;

  const selectedNoticeFields = getNoticeFields(noticeForm.documentType);

  return (
    <ModalShell
      title="AI Notice Generator"
      icon={<FaFileSignature className="text-[#15a276]" />}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={handleGenerateNotice} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#062552] mb-2">Document Type</label>
            <select
              name="documentType"
              value={noticeForm.documentType}
              onChange={handleNoticeInput}
              className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
            >
              {noticeDocumentTypes.map((type) => (
                <option key={type} value={type} className="text-[#062552]">{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#062552] mb-2">Basic Information</label>
            <div className="max-h-[48vh] space-y-4 overflow-y-auto pr-2">
              {selectedNoticeFields.map((field) => {
                if (field.dependsOn && !noticeForm[field.dependsOn]) return null;

                if (field.type === 'checkbox') {
                  return (
                    <label
                      key={field.id}
                      className="flex items-start gap-3 rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-semibold text-[#062552]"
                    >
                      <input
                        type="checkbox"
                        name={field.id}
                        checked={Boolean(noticeForm[field.id])}
                        onChange={handleNoticeInput}
                        className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#15a276]"
                      />
                      {field.label}
                    </label>
                  );
                }

                if (field.type === 'names') {
                  const names = noticeForm[field.id] || [''];

                  return (
                    <div key={field.id}>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f7488]">
                        {field.label}{field.required ? ' *' : ''}
                      </label>
                      <div className="space-y-2">
                        {names.map((name, index) => (
                          <div key={`${field.id}-${index}`} className="flex gap-2">
                            <input
                              value={name}
                              onChange={(event) => handleNoticeNameInput(field.id, index, event.target.value)}
                              placeholder={`${field.label} ${index + 1}`}
                              className="min-w-0 flex-1 rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                            />
                            {names.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeNoticeName(field.id, index)}
                                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d7e9ef] bg-white text-[#062552] transition hover:border-red-600 hover:bg-red-50 hover:text-red-700"
                                aria-label={`Remove ${field.label.toLowerCase()}`}
                              >
                                <FaTimes />
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addNoticeName(field.id)}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#d7e9ef] bg-white px-3 py-2 text-xs font-bold text-[#062552] transition hover:border-[#15a276] hover:bg-[#e8f7f2]"
                      >
                        <FaPlus />
                        {field.addLabel || 'Add another name'}
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={field.id}>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f7488]">
                      {field.label}{field.required ? ' *' : ''}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.id}
                        value={noticeForm[field.id] || ''}
                        onChange={handleNoticeInput}
                        rows={field.rows || 3}
                        placeholder={field.placeholder || field.label}
                        className="w-full resize-none rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.id}
                        value={noticeForm[field.id] || ''}
                        onChange={handleNoticeInput}
                        placeholder={field.placeholder || field.label}
                        className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {noticeError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{noticeError}</p>
          ) : null}

          <button
            type="submit"
            disabled={noticeLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#15a276] px-5 py-3 font-bold text-white transition hover:bg-[#118b66] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaMagic />
            {noticeLoading ? 'Generating...' : 'Generate Document'}
          </button>
        </form>

        <div className="min-w-0 space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-bold text-[#062552]">Generated Draft</label>
              <button
                type="button"
                onClick={handleCopyNotice}
                disabled={!noticeDraft.trim()}
                className="rounded-lg border border-[#d7e9ef] px-3 py-2 text-xs font-bold text-[#062552] transition hover:border-[#15a276] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy
              </button>
            </div>
            <textarea
              value={noticeDraft}
              onChange={(event) => setNoticeDraft(event.target.value)}
              rows="18"
              placeholder="Your generated notice will appear here."
              className="w-full resize-none rounded-xl border border-[#d7e9ef] bg-white px-4 py-4 font-mono text-sm leading-7 text-[#062552] outline-none focus:border-[#15a276]"
            />
          </div>

          <form onSubmit={handleEditNotice} className="space-y-3">
            <label className="block text-sm font-bold text-[#062552]">Edit With AI</label>
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={noticeEditPrompt}
                onChange={(event) => setNoticeEditPrompt(event.target.value)}
                placeholder="Example: make it stronger, add 15-day compliance deadline, simplify paragraph 3"
                className="min-w-0 flex-1 rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]"
              />
              <button
                type="submit"
                disabled={noticeEditing || !noticeDraft.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 border border-[#d6b85b] shadow-sm"
              >
                <FaMagic />
                {noticeEditing ? 'Editing...' : 'Apply Edit'}
              </button>
            </div>
          </form>

          {noticeMessage ? <p className="text-sm font-semibold text-[#15a276]">{noticeMessage}</p> : null}
        </div>
      </div>
    </ModalShell>
  );
}
