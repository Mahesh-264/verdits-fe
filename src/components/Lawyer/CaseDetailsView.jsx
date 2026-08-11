import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaCheck, FaPencilAlt, FaTimes, FaTrash } from 'react-icons/fa';
import api from '../../api/axios';
import { formatTime, toDateInput, toTimeInput } from '../../utils/lawyerUtils';

const CaseDetailsView = ({
  selectedCase,
  displayTeam,
  onBack,
  teamCaseStatuses,
  updatingTeamCaseId,
  handleUpdateTeamCaseStatus,
  handleDeleteTeamCase,
  loadTeamWorkspace,
  formatDate,
}) => {
  const { user } = useSelector((state) => state.auth);
  const [caseDetails, setCaseDetails] = useState(null);
  const caseRecord = caseDetails || selectedCase;

  const currentUserId = user?._id || user?.id;
  const canEditCase = caseRecord?.canEdit !== undefined
    ? Boolean(caseRecord.canEdit)
    : String(caseRecord?.addedBy?._id || caseRecord?.addedBy || caseRecord?.ownerId?._id || caseRecord?.ownerId || '') === String(currentUserId || '');

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editingPhone, setEditingPhone] = useState(caseRecord.clientPhone || '');
  const [editingAddress, setEditingAddress] = useState(caseRecord.clientAddress || '');
  const [savingCaseDetails, setSavingCaseDetails] = useState(false);
  const [savingHearingHistory, setSavingHearingHistory] = useState(false);
  const [caseDetailsMessage, setCaseDetailsMessage] = useState('');
  const [caseDetailsError, setCaseDetailsError] = useState('');
  const nextTemporaryHearingKey = useRef(0);
  const hearingHistoryVersion = useRef(0);
  const createManualHistoryRow = () => ({
    tempKey: `new-hearing-${++nextTemporaryHearingKey.current}`,
    isManualHistory: true,
    courtName: caseRecord?.courtName || '',
    hearingDate: '',
    hearingTime: '',
    hearingDetails: '',
    nextHearingDate: '',
    nextHearingTime: '',
  });

  const currentStatusObject = teamCaseStatuses.find((item) => item.value === (caseRecord.status || 'new'));
  const statusLabel = currentStatusObject ? currentStatusObject.label : (caseRecord.status || 'New');

  const getInitialHearingHistory = useCallback(() => {
    if (Array.isArray(caseRecord.hearingHistory) && caseRecord.hearingHistory.length > 0) {
      return caseRecord.hearingHistory.map((item) => ({
        id: item.id,
        courtName: item.courtName || '',
        hearingDate: toDateInput(item.hearingDate),
        hearingTime: item.hearingTime || toTimeInput(item.hearingDate),
        hearingDetails: item.hearingDetails || '',
        nextHearingDate: toDateInput(item.nextHearingDate || item.nextHearing),
        nextHearingTime: item.nextHearingTime || toTimeInput(item.nextHearingDate || item.nextHearing),
        isManualHistory: Boolean(item.isHistorical),
      }));
    }
    return [];
  }, [caseRecord]);

  const [localHearingHistory, setLocalHearingHistory] = useState(getInitialHearingHistory);

  useEffect(() => {
    let active = true;
    const requestVersion = hearingHistoryVersion.current;
    api.get(`/teams/${displayTeam.id}/cases/${selectedCase.id}`)
      .then(({ data }) => {
        if (active && requestVersion === hearingHistoryVersion.current && data?.case) {
          setCaseDetails((prev) => ({
            ...(prev || selectedCase),
            ...data.case,
          }));
        }
      })
      .catch((error) => console.error('Error loading case details:', error));
    return () => { active = false; };
  }, [displayTeam.id, selectedCase, selectedCase.id]);

  useEffect(() => {
    setEditingPhone(caseRecord.clientPhone || '');
    setEditingAddress(caseRecord.clientAddress || '');
    setLocalHearingHistory(getInitialHearingHistory());
  }, [caseRecord, getInitialHearingHistory]);

  const handleSaveCaseDetails = async () => {
    if (!canEditCase) return;
    if (!editingPhone.trim()) { setCaseDetailsError('Phone number is required.'); return; }
    try {
      setSavingCaseDetails(true);
      setCaseDetailsError('');
      setCaseDetailsMessage('');
      await api.patch(`/teams/${displayTeam.id}/cases/${caseRecord.id}`, {
        clientPhone: editingPhone.trim(),
        clientAddress: editingAddress.trim(),
      });
      const { data } = await api.get(`/teams/${displayTeam.id}/cases/${caseRecord.id}`);
      if (data?.case) {
        setCaseDetails((prev) => ({
          ...(prev || caseRecord),
          ...data.case,
          clientPhone: editingPhone.trim(),
          clientAddress: editingAddress.trim(),
        }));
      }
      await loadTeamWorkspace();
      setCaseDetailsMessage('Case details saved.');
      setIsEditingDetails(false);
    } catch (error) {
      setCaseDetailsError(error.response?.data?.message || 'Unable to save case details.');
    } finally {
      setSavingCaseDetails(false);
    }
  };

  const handleHearingHistoryChange = (index, field, value) => {
    if (!canEditCase) return;
    setLocalHearingHistory((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveHearingRow = (index) => {
    if (!canEditCase) return;
    setLocalHearingHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddHearingRow = () => {
    if (!canEditCase) return;
    setLocalHearingHistory((rows) => [...rows, createManualHistoryRow()]);
  };

  const handleSaveHearingHistory = async () => {
    if (!canEditCase) return;
    try {
      // Ignore an older details request while this save makes the backend's
      // returned hearing IDs the single source of truth.
      hearingHistoryVersion.current += 1;
      setSavingHearingHistory(true);
      setCaseDetailsError('');
      setCaseDetailsMessage('');
      const { data } = await api.put(`/teams/${displayTeam.id}/cases/${caseRecord.id}/hearings`, { hearings: localHearingHistory });
      if (data?.case) {
        setCaseDetails((prev) => ({
          ...(prev || caseRecord),
          ...data.case,
          clientName: data.case.clientName || prev?.clientName || caseRecord.clientName,
          clientPhone: data.case.clientPhone || prev?.clientPhone || caseRecord.clientPhone,
          clientAddress: data.case.clientAddress || prev?.clientAddress || caseRecord.clientAddress,
        }));

        if (Array.isArray(data.case.hearingHistory)) {
          setLocalHearingHistory(data.case.hearingHistory.map((item) => ({
            id: item.id || item._id,
            courtName: item.courtName || '',
            hearingDate: toDateInput(item.hearingDate),
            hearingTime: item.hearingTime || toTimeInput(item.hearingDate),
            hearingDetails: item.hearingDetails || '',
            nextHearingDate: toDateInput(item.nextHearingDate || item.nextHearing),
            nextHearingTime: item.nextHearingTime || toTimeInput(item.nextHearingDate || item.nextHearing),
            isManualHistory: Boolean(item.isHistorical),
          })));
        }
      }
      await loadTeamWorkspace();
      setCaseDetailsMessage('Hearing history saved.');
    } catch (error) {
      console.error('Error saving hearing history:', error);
      setCaseDetailsError(error.response?.data?.message || 'Failed to save hearing history');
    } finally {
      setSavingHearingHistory(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#eef5f8] pb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-2 text-sm font-bold text-[#062552] transition hover:border-[#15a276] hover:text-[#15a276]"
        >
          <FaArrowLeft /> Back to Cases
        </button>
        <div className="flex items-center gap-3">
          {canEditCase ? (
            <>
              <button
                type="button"
                onClick={() => handleDeleteTeamCase(selectedCase)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
              >
                <FaTrash size={12} /> Delete Case
              </button>
              <span className="text-xs font-bold text-[#5f7488]">Status:</span>
              <select
                value={caseRecord.status || 'new'}
                onChange={(event) => handleUpdateTeamCaseStatus(caseRecord, event.target.value)}
                disabled={updatingTeamCaseId === caseRecord.id}
                className="rounded-xl border border-[#d7e9ef] bg-white px-3 py-1.5 text-xs font-bold text-[#062552] outline-none focus:border-[#15a276]"
              >
                {teamCaseStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5f7488]">Status:</span>
              <span className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-3.5 py-1.5 text-xs font-bold text-[#062552]">
                {statusLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Case Details Section */}
      <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#eef5f8] pb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#15a276]">Case Details</h4>
            <h3 className="mt-1 text-2xl font-bold text-[#062552]">
              {caseRecord.caseName || caseRecord.caseTitle || caseRecord.title || 'Untitled Case'}
            </h3>
          </div>
          {canEditCase ? (
            !isEditingDetails ? (
              <button
                type="button"
                onClick={() => setIsEditingDetails(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7e9ef] bg-white px-3.5 py-1.5 text-xs font-bold text-[#062552] shadow-sm transition hover:border-[#15a276] hover:text-[#15a276]"
              >
                <FaPencilAlt size={12} /> Edit Details
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCaseDetails}
                  disabled={savingCaseDetails}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#15a276] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#118460] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaCheck size={12} /> {savingCaseDetails ? 'Saving...' : 'Save Details'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingDetails(false);
                    setEditingPhone(caseRecord.clientPhone || '');
                    setEditingAddress(caseRecord.clientAddress || '');
                    setCaseDetailsError('');
                  }}
                  disabled={savingCaseDetails}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7e9ef] bg-white px-3.5 py-1.5 text-xs font-bold text-[#5f7488] transition hover:bg-[#f0f6f8] hover:text-[#062552]"
                >
                  <FaTimes size={12} /> Cancel
                </button>
              </div>
            )
          ) : null}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Brief Description</p>
          <p className="mt-1 text-sm leading-relaxed text-[#2c3e50]">
            {caseRecord.briefInfo || caseRecord.caseDetails || 'No brief description added.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <div className="rounded-lg border border-[#d7e9ef] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Client Name</p>
            <p className="mt-1 text-sm font-bold text-[#062552]">{caseRecord.clientName || 'Not provided'}</p>
          </div>

          <div className="rounded-lg border border-[#d7e9ef] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Phone Number</p>
            {canEditCase && isEditingDetails ? (
              <input
                type="tel"
                value={editingPhone}
                onChange={(e) => setEditingPhone(e.target.value)}
                disabled={savingCaseDetails}
                placeholder="Enter phone number"
                className="mt-1 w-full rounded-md border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-xs font-bold text-[#062552] outline-none focus:border-[#15a276]"
              />
            ) : (
              <p className="mt-1 text-sm font-bold text-[#062552]">{caseRecord.clientPhone || 'Not provided'}</p>
            )}
          </div>

          <div className="rounded-lg border border-[#d7e9ef] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Address</p>
            {canEditCase && isEditingDetails ? (
              <input
                type="text"
                value={editingAddress}
                onChange={(e) => setEditingAddress(e.target.value)}
                disabled={savingCaseDetails}
                placeholder="Enter address"
                className="mt-1 w-full rounded-md border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-xs font-bold text-[#062552] outline-none focus:border-[#15a276]"
              />
            ) : (
              <p className="mt-1 text-sm font-bold text-[#062552]">{caseRecord.clientAddress || 'Not provided'}</p>
            )}
          </div>

          <div className="rounded-lg border border-[#d7e9ef] bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Starting Date</p>
            <p className="mt-1 text-sm font-bold text-[#062552]">
              {formatDate(caseRecord.startingDate || caseRecord.hearingDate) || 'Not provided'}
            </p>
          </div>
        </div>
        {caseDetailsMessage || caseDetailsError ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {caseDetailsMessage ? <p className="text-xs font-semibold text-[#118460]">{caseDetailsMessage}</p> : null}
            {caseDetailsError ? <p className="text-xs font-semibold text-red-600">{caseDetailsError}</p> : null}
          </div>
        ) : null}
      </div>

      {/* Vertical history keeps all fields usable on narrow screens. The state
          and save payload deliberately remain unchanged, including empty times. */}
      <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#eef5f8] pb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#15a276]">Hearing History</h4>
            <p className="text-xs text-[#5f7488] mt-0.5">Track all court hearing schedules and details.</p>
          </div>
          {canEditCase ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddHearingRow}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#15a276] bg-white px-3 py-1.5 text-xs font-bold text-[#15a276] transition hover:bg-[#e8f7f2]"
              >
                + Add Hearing
              </button>
              <button
                type="button"
                onClick={handleSaveHearingHistory}
                disabled={savingHearingHistory}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#15a276] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#118460] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaCheck size={12} /> {savingHearingHistory ? 'Saving...' : 'Save Hearing'}
              </button>
            </div>
          ) : null}
        </div>

        {localHearingHistory.length === 0 ? <p className="rounded-lg border border-dashed border-[#d7e9ef] bg-white px-4 py-6 text-center text-sm text-[#5f7488]">No hearing history recorded yet.</p> : (
          <div className="space-y-4 border-l-2 border-[#d7e9ef] pl-5">
            {localHearingHistory.map((row, index) => (
              <div key={row.id || row.tempKey} className="relative rounded-xl border border-[#d7e9ef] bg-white p-4 shadow-sm">
                <span className="absolute -left-[1.82rem] top-5 h-3 w-3 rounded-full border-2 border-white bg-[#15a276]" />
                <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-[#15a276]">{index === 0 ? 'Next Hearing' : 'Previous Hearing'}</p>{canEditCase ? <button type="button" onClick={() => handleRemoveHearingRow(index)} className="text-red-500 hover:text-red-700" title="Remove hearing"><FaTrash size={14} /></button> : null}</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-[#5f7488]">Court{canEditCase ? <input type="text" value={row.courtName} onChange={(e) => handleHearingHistoryChange(index, 'courtName', e.target.value)} placeholder="Court name" className="mt-1 block w-full rounded-md border border-[#d7e9ef] px-3 py-2 text-sm text-[#062552] outline-none focus:border-[#15a276]" /> : <span className="mt-1 block text-sm text-[#062552]">{row.courtName || 'Not provided'}</span>}</label>
                  <label className="text-xs font-bold text-[#5f7488]">Hearing date{canEditCase ? <input type="date" value={row.hearingDate} onChange={(e) => handleHearingHistoryChange(index, 'hearingDate', e.target.value)} className="mt-1 block w-full rounded-md border border-[#d7e9ef] px-3 py-2 text-sm text-[#062552] outline-none focus:border-[#15a276]" /> : <span className="mt-1 block text-sm text-[#062552]">{formatDate(row.hearingDate) || 'Not provided'}</span>}</label>
                  <label className="text-xs font-bold text-[#5f7488]">Hearing time{canEditCase ? <span className="mt-1 flex gap-2"><input type="time" value={row.hearingTime} onChange={(e) => handleHearingHistoryChange(index, 'hearingTime', e.target.value)} className="min-w-0 flex-1 rounded-md border border-[#d7e9ef] px-3 py-2 text-sm text-[#062552] outline-none focus:border-[#15a276]" /><button type="button" onClick={() => handleHearingHistoryChange(index, 'hearingTime', '')} className="rounded border border-[#d7e9ef] px-2 text-xs text-[#5f7488]">Clear</button></span> : <span className="mt-1 block text-sm text-[#062552]">{formatTime(`${row.hearingDate}T${row.hearingTime}`) || 'Not provided'}</span>}</label>
                  <label className="text-xs font-bold text-[#5f7488]">Next hearing date{canEditCase ? <input type="date" value={row.nextHearingDate} onChange={(e) => handleHearingHistoryChange(index, 'nextHearingDate', e.target.value)} className="mt-1 block w-full rounded-md border border-[#d7e9ef] px-3 py-2 text-sm text-[#062552] outline-none focus:border-[#15a276]" /> : <span className="mt-1 block text-sm text-[#062552]">{formatDate(row.nextHearingDate) || 'Not scheduled'}</span>}</label>
                  <label className="text-xs font-bold text-[#5f7488]">Next hearing time{canEditCase ? <span className="mt-1 flex gap-2"><input type="time" value={row.nextHearingTime} onChange={(e) => handleHearingHistoryChange(index, 'nextHearingTime', e.target.value)} className="min-w-0 flex-1 rounded-md border border-[#d7e9ef] px-3 py-2 text-sm text-[#062552] outline-none focus:border-[#15a276]" /><button type="button" onClick={() => handleHearingHistoryChange(index, 'nextHearingTime', '')} className="rounded border border-[#d7e9ef] px-2 text-xs text-[#5f7488]">Clear</button></span> : <span className="mt-1 block text-sm text-[#062552]">{formatTime(`${row.nextHearingDate}T${row.nextHearingTime}`) || 'Not provided'}</span>}</label>
                  <label className="text-xs font-bold text-[#5f7488] sm:col-span-2">Hearing details{canEditCase ? <input type="text" value={row.hearingDetails} onChange={(e) => handleHearingHistoryChange(index, 'hearingDetails', e.target.value)} placeholder="Hearing details" className="mt-1 block w-full rounded-md border border-[#d7e9ef] px-3 py-2 text-sm text-[#062552] outline-none focus:border-[#15a276]" /> : <span className="mt-1 block text-sm text-[#062552]">{row.hearingDetails || 'No details added.'}</span>}</label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDetailsView;
