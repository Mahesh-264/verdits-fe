import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaArrowLeft, FaCheck, FaPencilAlt, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import api from '../../api/axios';

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

  const currentStatusObject = teamCaseStatuses.find((item) => item.value === (caseRecord.status || 'new'));
  const statusLabel = currentStatusObject ? currentStatusObject.label : (caseRecord.status || 'New');

  const getInitialHearingHistory = useCallback(() => {
    if (Array.isArray(caseRecord.hearingHistory) && caseRecord.hearingHistory.length > 0) {
      return caseRecord.hearingHistory.map((item) => ({
        id: item.id,
        courtName: item.courtName || '',
        hearingDate: item.hearingDate ? new Date(item.hearingDate).toISOString().split('T')[0] : '',
        hearingDetails: item.hearingDetails || '',
        nextHearing: item.nextHearing ? new Date(item.nextHearing).toISOString().split('T')[0] : '',
      }));
    }
    return canEditCase ? [
      {
        courtName: caseRecord.courtName || '',
        hearingDate: '',
        hearingDetails: '',
        nextHearing: caseRecord.nextHearingDate ? new Date(caseRecord.nextHearingDate).toISOString().split('T')[0] : '',
      },
    ] : [];
  }, [caseRecord, canEditCase]);

  const [localHearingHistory, setLocalHearingHistory] = useState(getInitialHearingHistory);

  useEffect(() => {
    let active = true;
    api.get(`/teams/${displayTeam.id}/cases/${selectedCase.id}`)
      .then(({ data }) => {
        if (active && data?.case) {
          setCaseDetails((prev) => ({
            ...(prev || selectedCase),
            ...data.case,
          }));
        }
      })
      .catch((error) => console.error('Error loading case details:', error));
    return () => { active = false; };
  }, [displayTeam.id, selectedCase.id]);

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

  const handleAddHearingRow = () => {
    if (!canEditCase) return;
    let newCourtName = caseRecord?.courtName || '';
    let newHearingDate = '';

    if (localHearingHistory.length > 0) {
      const lastRow = localHearingHistory[localHearingHistory.length - 1];
      newCourtName = lastRow.courtName || newCourtName;
      newHearingDate = lastRow.nextHearing || '';
    }

    setLocalHearingHistory((prev) => [
      ...prev,
      {
        courtName: newCourtName,
        hearingDate: newHearingDate,
        hearingDetails: '',
        nextHearing: '',
      },
    ]);
  };

  const handleRemoveHearingRow = (index) => {
    if (!canEditCase) return;
    setLocalHearingHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveHearingHistory = async () => {
    if (!canEditCase) return;
    try {
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
            hearingDate: item.hearingDate ? new Date(item.hearingDate).toISOString().split('T')[0] : '',
            hearingDetails: item.hearingDetails || '',
            nextHearing: item.nextHearing ? new Date(item.nextHearing).toISOString().split('T')[0] : (item.nextHearingDate ? new Date(item.nextHearingDate).toISOString().split('T')[0] : ''),
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

      {/* Hearing History Table Section */}
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#15a276] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#118460]"
              >
                <FaPlus size={12} /> Add Hearing
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

        <div className="overflow-x-auto rounded-lg border border-[#d7e9ef] bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fbfc] border-b border-[#d7e9ef] text-[#5f7488] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 min-w-[160px]">Court Name</th>
                <th className="px-4 py-3 min-w-[140px]">Hearing Date</th>
                <th className="px-4 py-3 min-w-[200px]">Hearing Details</th>
                <th className="px-4 py-3 min-w-[140px]">Next Hearing</th>
                {canEditCase ? <th className="px-2 py-3 w-10"></th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef5f8] text-[#062552]">
              {localHearingHistory.length === 0 ? (
                <tr>
                  <td colSpan={canEditCase ? 5 : 4} className="px-4 py-4 text-center text-xs text-[#5f7488]">
                    No hearing history recorded yet.
                  </td>
                </tr>
              ) : (
                localHearingHistory.map((row, index) => (
                  <tr key={`hearing-row-${index}`} className="hover:bg-[#f8fbfc]">
                    <td className="px-4 py-2.5">
                      {canEditCase ? (
                        <input
                          type="text"
                          value={row.courtName}
                          onChange={(e) => handleHearingHistoryChange(index, 'courtName', e.target.value)}
                          placeholder="Court name"
                          className="w-full rounded-md border border-[#d7e9ef] bg-white px-2.5 py-1 text-xs font-semibold text-[#062552] outline-none focus:border-[#15a276]"
                        />
                      ) : (
                        <span className="font-semibold text-[#062552]">{row.courtName || 'Not provided'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {canEditCase ? (
                        <input
                          type="date"
                          value={row.hearingDate}
                          onChange={(e) => handleHearingHistoryChange(index, 'hearingDate', e.target.value)}
                          className="w-full rounded-md border border-[#d7e9ef] bg-white px-2 py-1 text-xs font-semibold text-[#062552] outline-none focus:border-[#15a276]"
                        />
                      ) : (
                        <span className="font-semibold text-[#062552]">{formatDate(row.hearingDate) || 'Not provided'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {canEditCase ? (
                        <input
                          type="text"
                          value={row.hearingDetails}
                          onChange={(e) => handleHearingHistoryChange(index, 'hearingDetails', e.target.value)}
                          placeholder="Hearing details"
                          className="w-full rounded-md border border-[#d7e9ef] bg-white px-2.5 py-1 text-xs font-semibold text-[#062552] outline-none focus:border-[#15a276]"
                        />
                      ) : (
                        <span className="font-semibold text-[#062552]">{row.hearingDetails || 'Not provided'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {canEditCase ? (
                        <input
                          type="date"
                          value={row.nextHearing}
                          onChange={(e) => handleHearingHistoryChange(index, 'nextHearing', e.target.value)}
                          className="w-full rounded-md border border-[#d7e9ef] bg-white px-2 py-1 text-xs font-semibold text-[#062552] outline-none focus:border-[#15a276]"
                        />
                      ) : (
                        <span className="font-semibold text-[#062552]">{formatDate(row.nextHearing) || 'Not provided'}</span>
                      )}
                    </td>
                    {canEditCase ? (
                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveHearingRow(index)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Remove row"
                        >
                          <FaTrash size={12} />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsView;
