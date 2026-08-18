import React from 'react';
import { FaArrowLeft, FaBriefcase, FaCheck, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import { Copy, KeyRound, UserPlus, Users } from 'lucide-react';
import CaseDetailsView from './CaseDetailsView';
import { EmptyBlock, ModalShell } from './LawyerSharedComponents';
import { formatDate, getEntityId, getTeamCaseStatusLabel } from '../../utils/lawyerUtils';

export default function LawyerTeamModal({
  show,
  onClose,
  hasTeam,
  displayIsTeamOwner,
  displayTeam,
  teamSize,
  handleCopyTeamCode,
  handleDeleteTeam,
  deletingTeam,
  teamWorkspaceLoading,
  teamWorkspaces,
  handleSelectTeam,
  teamMode,
  setTeamMode,
  setTeamError,
  setTeamMessage,
  createTeamForm,
  handleCreateTeamInput,
  handleCreateTeam,
  teamLoading,
  joinTeamForm,
  handleJoinTeamInput,
  handleJoinTeam,
  setActiveTeamTab,
  currentActiveTeamTab,
  ownTeamCases,
  visibleTeamDirectory,
  teamPendingRequests,
  showTeamCaseForm,
  setShowTeamCaseForm,
  teamCaseForm,
  handleTeamCaseInput,
  handleAddTeamCase,
  savingTeamCase,
  teamCaseStatuses,
  selectedCaseForDetailsId,
  setSelectedCaseForDetailsId,
  updatingTeamCaseId,
  handleUpdateTeamCaseStatus,
  handleDeleteTeamCase,
  loadTeamWorkspace,
  loadLawyerNextHearings,
  activeTeamMember,
  setSelectedTeamMemberId,
  onSelectTeamMember,
  teamCases,
  canRemoveActiveTeamMember,
  handleRemoveTeamMember,
  handleLeaveTeam,
  removingTeamMemberId,
  activeTeamMemberId,
  activeTeamMemberCases,
  memberOwnedTeam,
  memberOwnedTeamLoading,
  memberOwnedTeamError,
  loadSelectedMemberProfile,
  updatingTeamRequestId,
  handleTeamRequestDecision,
}) {
  const [memberDetailTab, setMemberDetailTab] = React.useState('cases');
  const [showTeamDetails, setShowTeamDetails] = React.useState(false);
  const [showTeamCode, setShowTeamCode] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    setMemberDetailTab('cases');
  }, [activeTeamMemberId]);

  React.useEffect(() => {
    if (activeTeamMember && !activeTeamMember.hasTeam) setMemberDetailTab('cases');
  }, [activeTeamMember]);

  React.useEffect(() => {
    setShowTeamDetails(false);
    setShowTeamCode(false);
    setConfirmDelete(false);
  }, [displayTeam?.id]);

  if (!show) return null;

  const ownedTeamMembers = Array.isArray(memberOwnedTeam?.members) ? memberOwnedTeam.members : [];
  const ownedTeamRegularMembers = ownedTeamMembers.filter((member) => member.role === 'member');

  return (
    <ModalShell
      title="My Team"
      icon={<Users className="h-6 w-6 text-[#15a276]" />}
      onClose={onClose}
    >
      <div className="lawyer-team-workspace text-[#062552]">
        {hasTeam ? (
          <div className="space-y-5">
            <div className="border-b border-[#d7e9ef] pb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
                    {displayIsTeamOwner ? 'Team you own' : 'Joined team'}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-[#062552]">{displayTeam.firmName || 'My Team'}</h3>
                  <p className="mt-2 text-sm text-[#5f7488]">
                    {displayIsTeamOwner ? 'Created by you' : `Team Owner: ${displayTeam.seniorLawyerName || 'Not added'}`}
                  </p>
                  {!displayIsTeamOwner ? <div className="mt-3 flex flex-wrap items-center gap-3"><p className="text-sm text-[#5f7488]">Your Role: Member</p><button type="button" onClick={handleLeaveTeam} disabled={Boolean(removingTeamMemberId)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60">{removingTeamMemberId ? 'Leaving...' : 'Leave Team'}</button></div> : null}
                </div>
                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => { setTeamMode('create'); setTeamError(''); setTeamMessage(''); }}
                      className="rounded-xl border border-[#d6b85b] bg-[#f1d15f] px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-sm transition hover:bg-[#d6a400]"
                    >
                      Create Team
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTeamMode('join'); setTeamError(''); setTeamMessage(''); }}
                      className="rounded-xl border border-[#d7e9ef] bg-white px-4 py-2.5 text-sm font-bold text-[#062552] transition hover:bg-[#f3f8fb]"
                    >
                      Join Team
                    </button>
                  {displayIsTeamOwner ? <div className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 text-sm">
                    <span className="text-[#5f7488]">Team size</span>
                    <span className="font-bold text-[#062552]">{teamSize}/{displayTeam.maxTeamSize || teamSize}</span>
                  </div> : null}
                </div>
              </div>
            </div>

            {confirmDelete ? <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Confirm team deletion">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-[#062552]">Delete {displayTeam.firmName || 'this team'}?</h3>
                <p className="mt-3 text-sm leading-6 text-[#5f7488]">This permanently deletes the team, its cases, documents, hearings, and memberships. This cannot be undone.</p>
                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setConfirmDelete(false)} disabled={deletingTeam} className="rounded-xl border border-[#d7e9ef] px-4 py-2.5 font-bold text-[#062552]">Cancel</button><button type="button" onClick={async () => { await handleDeleteTeam(); setConfirmDelete(false); }} disabled={deletingTeam} className="rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white transition hover:bg-red-700 disabled:opacity-60">{deletingTeam ? 'Deleting...' : 'Delete Team'}</button></div>
              </div>
            </div> : null}

            {teamWorkspaceLoading ? (
              <p className="rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-sm font-semibold text-[#5f7488]">
                Refreshing team workspace...
              </p>
            ) : null}

            {teamMode === 'create' ? (
              <form onSubmit={handleCreateTeam} className="relative space-y-4 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
                <button type="button" onClick={() => setTeamMode('overview')} className="absolute -right-4 -top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#e2c878] bg-[#fffdf0] text-zinc-950 shadow-sm transition hover:border-red-600 hover:bg-red-600 hover:text-white" aria-label="Close Create Team"><FaTimes size={17} /></button>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <input name="firmName" value={createTeamForm.firmName} onChange={handleCreateTeamInput} placeholder="Firm name" className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]" required />
                  <input name="seniorLawyerName" value={createTeamForm.seniorLawyerName} onChange={handleCreateTeamInput} placeholder="Team Owner name" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300" required />
                  <input type="number" min="2" name="maxTeamSize" value={createTeamForm.maxTeamSize} onChange={handleCreateTeamInput} className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]" required />
                </div>
                <button type="submit" disabled={teamLoading} className="verdits-primary-action inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition disabled:cursor-not-allowed"><Users size={18} />{teamLoading ? 'Creating...' : 'Create Team'}</button>
              </form>
            ) : null}

            {teamMode === 'join' ? (
              <form onSubmit={handleJoinTeam} className="relative space-y-4 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
                <button type="button" onClick={() => setTeamMode('overview')} className="absolute -right-4 -top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#e2c878] bg-[#fffdf0] text-zinc-950 shadow-sm transition hover:border-red-600 hover:bg-red-600 hover:text-white" aria-label="Close Join Team"><FaTimes size={17} /></button>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f7488]">Team code</label><input name="teamCode" value={joinTeamForm.teamCode} onChange={handleJoinTeamInput} placeholder="Enter team code" className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]" required /></div>
                <button type="submit" disabled={teamLoading} className="verdits-primary-action inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition disabled:cursor-not-allowed"><UserPlus size={18} />{teamLoading ? 'Sending...' : 'Request to Join'}</button>
              </form>
            ) : null}

            <div className="rounded-2xl border border-[#d7e9ef] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Current Team</p>
                  <h3 className="mt-1 text-base font-bold text-[#062552]">{displayTeam.firmName || 'My Team'}</h3>
                </div>
                <button type="button" onClick={() => setShowTeamDetails((current) => !current)} className="self-start rounded-xl border border-[#15a276] bg-[#e8f7f2] px-4 py-2.5 text-sm font-bold text-[#0c7556] transition hover:bg-[#d8f2e9] sm:self-auto">{showTeamDetails ? 'Hide Team Details' : 'Team Details'}</button>
              </div>

              {teamWorkspaces.length ? <select aria-label="Select team" value={displayTeam.id || ''} onChange={(event) => { handleSelectTeam(event.target.value); setTeamMode('overview'); }} className="mt-4 w-full rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-3 text-sm font-bold text-[#062552] outline-none focus:border-[#15a276]">
                {teamWorkspaces.map((team) => <option key={team.id || team.teamCode} value={team.id}>{team.firmName || 'Lawyer Team'} — {team.role === 'owner' ? 'Owner' : 'Member'}</option>)}
              </select> : null}
              {displayIsTeamOwner && showTeamDetails ? <div className="mt-4 border-t border-[#d7e9ef] pt-4">
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setShowTeamCode((current) => !current)} className="rounded-xl border border-[#d7e9ef] bg-white px-4 py-2.5 text-sm font-bold text-[#062552] transition hover:bg-[#f3f8fb]">{showTeamCode ? 'Hide Team Code' : 'Team Code'}</button>
                  <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100">Delete Team</button>
                </div>
                {showTeamCode ? <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-3"><KeyRound className="h-5 w-5 shrink-0 text-[#15a276]" /><span className="min-w-0 flex-1 font-mono text-lg font-bold tracking-wider text-[#062552]">{displayTeam.teamCode}</span></div>
                  <button type="button" onClick={handleCopyTeamCode} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6b85b] bg-[#f1d15f] px-5 py-3 font-bold text-zinc-950 shadow-sm transition hover:bg-[#d6a400]"><Copy size={18} />Copy Code</button>
                </div> : null}
              </div> : null}
            </div>

            {/* Sub-workspace Navigation Tabs */}
            {!activeTeamMember ? <div className="rounded-2xl border border-[#d7e9ef] bg-white p-2 shadow-sm flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTeamTab('my_cases')}
                className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                  currentActiveTeamTab === 'my_cases'
                    ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                    : 'bg-transparent text-[#5f7488] hover:bg-[#f8fbfc] hover:text-[#062552]'
                }`}
              >
                My Cases ({ownTeamCases.length})
              </button>

              {displayIsTeamOwner ? (
                <button
                  type="button"
                  onClick={() => setActiveTeamTab('my_team')}
                  className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                    currentActiveTeamTab === 'my_team'
                      ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                      : 'bg-transparent text-[#5f7488] hover:bg-[#f8fbfc] hover:text-[#062552]'
                  }`}
                >
                  Members ({visibleTeamDirectory.length})
                </button>
              ) : null}

              {displayIsTeamOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTeamTab('join_requests')}
                    className={`relative rounded-xl px-5 py-3 text-sm font-bold transition ${
                      currentActiveTeamTab === 'join_requests'
                        ? 'bg-[#f1d15f] text-zinc-950 shadow-sm border border-[#d6b85b]'
                        : 'bg-transparent text-[#5f7488] hover:bg-[#f8fbfc] hover:text-[#062552]'
                    }`}
                  >
                    Join Requests
                    {teamPendingRequests.length > 0 ? (
                      <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                        {teamPendingRequests.length}
                      </span>
                    ) : null}
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => setShowTeamCaseForm((current) => !current)}
                className={`ml-auto inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm transition ${
                  showTeamCaseForm
                    ? 'border-red-700 bg-red-600 text-white hover:bg-red-700'
                    : 'border-[#d6b85b] bg-[#f1d15f] text-zinc-950 hover:bg-[#d6a400]'
                }`}
              >
                {showTeamCaseForm ? <FaTimes /> : <FaPlus />}
                {showTeamCaseForm ? 'Close Form' : 'Add Case'}
              </button>

            </div> : null}

            {/* My Cases Tab View */}
            {currentActiveTeamTab === 'my_cases' ? (
              <div className="space-y-5">
                {showTeamCaseForm ? (
                  <form onSubmit={handleAddTeamCase} className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5 md:grid-cols-2">
                    <p className="text-sm font-semibold text-zinc-400 md:col-span-2">
                      This case will be saved under your lawyer profile in the team.
                    </p>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Name</label>
                      <input
                        name="clientName"
                        value={teamCaseForm.clientName}
                        onChange={handleTeamCaseInput}
                        placeholder="Client name"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Phone</label>
                      <input
                        name="clientPhone"
                        value={teamCaseForm.clientPhone}
                        onChange={handleTeamCaseInput}
                        placeholder="Client phone number"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Address</label>
                      <input
                        name="clientAddress"
                        value={teamCaseForm.clientAddress}
                        onChange={handleTeamCaseInput}
                        placeholder="Client address"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Case Name</label>
                      <input
                        name="caseName"
                        value={teamCaseForm.caseName}
                        onChange={handleTeamCaseInput}
                        placeholder="Case name"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Court Name</label>
                      <input
                        name="courtName"
                        value={teamCaseForm.courtName}
                        onChange={handleTeamCaseInput}
                        placeholder="Court name"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Starting Date</label>
                      <input
                        type="date"
                        name="startingDate"
                        value={teamCaseForm.startingDate}
                        onChange={handleTeamCaseInput}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Hearing Date</label>
                      <input
                        type="date"
                        name="hearingDate"
                        value={teamCaseForm.hearingDate}
                        onChange={handleTeamCaseInput}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Hearing Time</label>
                      <input
                        type="time"
                        name="hearingTime"
                        value={teamCaseForm.hearingTime}
                        onChange={handleTeamCaseInput}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Brief Info About the Case</label>
                      <textarea
                        name="briefInfo"
                        value={teamCaseForm.briefInfo}
                        onChange={handleTeamCaseInput}
                        placeholder="Brief info about the case"
                        rows="4"
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Status</label>
                      <select
                        name="status"
                        value={teamCaseForm.status}
                        onChange={handleTeamCaseInput}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      >
                        {teamCaseStatuses.map((status) => (
                          <option key={status.value} value={status.value} className="text-zinc-950">
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingTeamCase}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-5 py-3 font-bold transition border border-[#d6b85b] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FaCheck />
                        {savingTeamCase ? 'Saving...' : 'Save Case'}
                      </button>
                    </div>
                  </form>
                ) : null}

                {selectedCaseForDetailsId && ownTeamCases.some((item) => String(item.id) === String(selectedCaseForDetailsId)) ? (() => {
                  const selectedCase = ownTeamCases.find((item) => String(item.id) === String(selectedCaseForDetailsId));
                  return (
                    <CaseDetailsView
                      selectedCase={selectedCase}
                      displayTeam={displayTeam}
                      onBack={() => setSelectedCaseForDetailsId('')}
                      teamCaseStatuses={teamCaseStatuses}
                      updatingTeamCaseId={updatingTeamCaseId}
                      handleUpdateTeamCaseStatus={handleUpdateTeamCaseStatus}
                      handleDeleteTeamCase={handleDeleteTeamCase}
                      loadTeamWorkspace={loadTeamWorkspace}
                      loadLawyerNextHearings={loadLawyerNextHearings}
                      formatDate={formatDate}
                    />
                  );
                })() : ownTeamCases.length === 0 ? (
                  <EmptyBlock icon={<FaBriefcase size={24} />} message="No cases added by you yet." />
                ) : (
                  <div className="space-y-4">
                    {ownTeamCases.map((teamCase) => (
                      <div
                        key={teamCase.id}
                        onClick={() => setSelectedCaseForDetailsId(String(teamCase.id))}
                        className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-[#15a276]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-white group-hover:text-[#15a276] transition">
                              {teamCase.caseName || teamCase.caseTitle || teamCase.title || 'Untitled Case'}
                            </h4>
                            <p className="mt-1 text-sm text-zinc-400">
                              Client: <span className="font-semibold text-blue-300 underline">{teamCase.clientName || 'Not added'}</span>
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">Court: {teamCase.courtName || 'Not added'}</p>
                            <p className="mt-1 text-xs text-zinc-500">Added by: You</p>
                          </div>
                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={teamCase.status || 'new'}
                              onChange={(event) => handleUpdateTeamCaseStatus(teamCase, event.target.value)}
                              disabled={updatingTeamCaseId === teamCase.id}
                              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white outline-none focus:border-amber-300 disabled:opacity-60"
                            >
                              {teamCaseStatuses.map((status) => (
                                <option key={status.value} value={status.value} className="text-zinc-950">
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-zinc-300">{teamCase.briefInfo || teamCase.caseDetails || 'No brief info added.'}</p>

                        <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3 text-sm">
                          <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <span>Next hearing: <strong className="text-zinc-200">{formatDate(teamCase.nextHearingAt || teamCase.hearingDate) || 'Not scheduled'}</strong></span>
                          </div>
                          <span className="text-xs font-bold text-[#15a276] group-hover:underline flex items-center gap-1">
                            View Case Details &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Members are the gateway to each lawyer's cases for every team member. */}
            {currentActiveTeamTab === 'my_team' ? (
              !activeTeamMember ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#eef5f8] pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#062552]">Team Directory</h3>
                        <p className="mt-1 text-sm text-[#5f7488]">
                          Select a lawyer to view their cases and their own team.
                        </p>
                      </div>
                      <span className="shrink-0 self-start sm:self-auto rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-1.5 text-sm font-bold text-[#5f7488]">
                        {visibleTeamDirectory.length} {visibleTeamDirectory.length === 1 ? 'Lawyer' : 'Lawyers'}
                      </span>
                    </div>

                    {visibleTeamDirectory.length === 0 ? (
                      <EmptyBlock icon={<UserPlus size={24} />} message="No other team members yet." />
                    ) : (
                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {visibleTeamDirectory.map((member) => {
                          const memberId = getEntityId(member.lawyerId || member.id);
                          const canViewMemberDetails = true;
                          const memberCasesCount = teamCases.filter((teamCase) => {
                            const caseOwnerId = getEntityId(teamCase.addedBy || teamCase.ownerId);
                            return caseOwnerId && memberId && String(caseOwnerId) === String(memberId);
                          }).length;

                          return (
                            <div
                              key={member.id || member.phone || member.email}
                              onClick={canViewMemberDetails ? () => onSelectTeamMember(member) : undefined}
                              className={`rounded-2xl border p-5 shadow-sm transition ${
                                canViewMemberDetails
                                  ? 'group cursor-pointer border-[#d7e9ef] bg-white hover:border-[#15a276] hover:shadow-md'
                                  : 'cursor-default border-[#e2edf1] bg-[#f8fbfc] opacity-90'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className={`truncate text-base font-bold transition ${
                                    canViewMemberDetails ? 'text-[#062552] group-hover:text-[#15a276]' : 'text-[#5f7488]'
                                  }`}>
                                    {member.name || 'Lawyer'}
                                  </h4>
                                  <p className="mt-1 truncate text-xs text-[#5f7488]">
                                    {member.email || member.phone || 'Contact not shared'}
                                  </p>
                                </div>
                                {canViewMemberDetails ? (
                                  <span className="shrink-0 rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-2.5 py-1 text-xs font-bold text-[#5f7488]">
                                    {memberCasesCount} {memberCasesCount === 1 ? 'case' : 'cases'}
                                  </span>
                                ) : (
                                  <span className="shrink-0 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                    Private
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 flex items-center justify-between border-t border-[#f0f6f8] pt-3">
                                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                  {member.roleLabel}
                                </span>
                                <span className="text-xs font-bold text-[#5f7488]">
                                  Has Team: {member.hasTeam ? 'Yes' : 'No'}
                                </span>
                                {canViewMemberDetails ? (
                                  <span className="text-xs font-bold text-[#15a276] group-hover:underline flex items-center gap-1">
                                    View Details &rarr;
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamMemberId('')}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-2 text-xs font-bold text-[#062552] transition hover:bg-[#eef5f8] self-start sm:self-auto"
                    >
                      <FaArrowLeft />
                      Back to Team Directory
                    </button>

                    <div className="flex items-center gap-3">
                      {canRemoveActiveTeamMember ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(activeTeamMember)}
                          disabled={removingTeamMemberId === activeTeamMemberId}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingTeamMemberId === activeTeamMemberId ? 'Removing...' : 'Remove Member'}
                        </button>
                      ) : null}
                      <span className="rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-xs font-bold text-[#5f7488]">
                        {activeTeamMemberCases.length} {activeTeamMemberCases.length === 1 ? 'case' : 'cases'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-[#062552]">{activeTeamMember.name || 'Lawyer'}</h3>
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            {activeTeamMember.roleLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#5f7488]">
                          Email: {activeTeamMember.email || 'Not shared'} | Phone: {activeTeamMember.phone || 'Not shared'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 rounded-2xl border border-[#d7e9ef] bg-white p-2 shadow-sm">
                    <button type="button" onClick={() => setMemberDetailTab('cases')} className={`rounded-xl px-5 py-3 text-sm font-bold transition ${memberDetailTab === 'cases' ? 'border border-[#d6b85b] bg-[#f1d15f] text-zinc-950 shadow-sm' : 'text-[#5f7488] hover:bg-[#f8fbfc] hover:text-[#062552]'}`}>
                      {activeTeamMember.name || 'Lawyer'}'s Cases
                    </button>
                    {activeTeamMember.hasTeam ? (
                      <button type="button" onClick={() => { setMemberDetailTab('team'); loadSelectedMemberProfile(); }} className={`rounded-xl px-5 py-3 text-sm font-bold transition ${memberDetailTab === 'team' ? 'border border-[#d6b85b] bg-[#f1d15f] text-zinc-950 shadow-sm' : 'text-[#5f7488] hover:bg-[#f8fbfc] hover:text-[#062552]'}`}>
                        {activeTeamMember.name || 'Lawyer'}'s Team
                      </button>
                    ) : null}
                  </div>

                  {memberDetailTab === 'cases' ? <div className="space-y-4">
                    <h4 className="text-base font-bold text-[#062552]">{activeTeamMember.name || 'This lawyer'}'s Cases</h4>
                    {selectedCaseForDetailsId && activeTeamMemberCases.some((item) => String(item.id) === String(selectedCaseForDetailsId)) ? (() => {
                      const selectedCase = activeTeamMemberCases.find((item) => String(item.id) === String(selectedCaseForDetailsId));
                      return (
                        <CaseDetailsView
                          selectedCase={selectedCase}
                          displayTeam={displayTeam}
                          hearingLawyerId={activeTeamMember?.lawyerId}
                          onBack={() => setSelectedCaseForDetailsId('')}
                          teamCaseStatuses={teamCaseStatuses}
                          updatingTeamCaseId={updatingTeamCaseId}
                          handleUpdateTeamCaseStatus={handleUpdateTeamCaseStatus}
                          handleDeleteTeamCase={handleDeleteTeamCase}
                          loadTeamWorkspace={loadTeamWorkspace}
                          formatDate={formatDate}
                        />
                      );
                    })() : activeTeamMemberCases.length === 0 ? (
                      <EmptyBlock icon={<FaBriefcase size={24} />} message="No cases added by this lawyer yet." />
                    ) : (
                      <div className="space-y-4">
                        {activeTeamMemberCases.map((teamCase) => (
                          <div
                            key={teamCase.id}
                            onClick={() => setSelectedCaseForDetailsId(String(teamCase.id))}
                            className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-[#15a276]"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <h4 className="text-lg font-bold text-white group-hover:text-[#15a276] transition">
                                  {teamCase.caseName || teamCase.caseTitle || teamCase.title || 'Untitled Case'}
                                </h4>
                                <p className="mt-1 text-sm text-zinc-400">
                                  Client: <span className="font-semibold text-blue-300 underline">{teamCase.clientName || 'Not added'}</span>
                                </p>
                            <p className="mt-1 text-xs text-zinc-400">Court: {teamCase.courtName || 'Not added'}</p>
                            <p className="mt-1 text-xs text-zinc-500">Added by: {teamCase.addedByName || activeTeamMember.name || 'Team member'}</p>
                              </div>
                              <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-400">
                                {getTeamCaseStatusLabel(teamCase.status)}
                              </span>
                            </div>

                            <p className="mt-4 text-sm leading-7 text-zinc-300">{teamCase.briefInfo || teamCase.caseDetails || 'No brief info added.'}</p>

                            <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3 text-sm">
                              <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <span>Next hearing: <strong className="text-zinc-200">{formatDate(teamCase.nextHearingAt || teamCase.hearingDate) || 'Not scheduled'}</strong></span>
                              </div>
                              <span className="text-xs font-bold text-[#15a276] group-hover:underline flex items-center gap-1">
                                View Case Details &rarr;
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div> : null}

                  {memberDetailTab === 'team' && memberOwnedTeamLoading ? (
                    <p className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] px-4 py-3 text-sm font-semibold text-[#5f7488]">
                      Loading {activeTeamMember.name || 'lawyer'}'s team members...
                    </p>
                  ) : memberDetailTab === 'team' && memberOwnedTeamError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
                      {memberOwnedTeamError}
                      <button type="button" onClick={loadSelectedMemberProfile} className="ml-3 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-700">
                        Retry
                      </button>
                    </div>
                  ) : memberDetailTab === 'team' && memberOwnedTeam ? (
                    <div className="rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-[#eef5f8] pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-[#062552]">{activeTeamMember.name || 'This lawyer'}'s Team</h4>
                          <p className="mt-1 text-sm text-[#5f7488]">{memberOwnedTeam.firmName || 'Team'}{memberOwnedTeam.seniorLawyerName ? ` · Created by ${memberOwnedTeam.seniorLawyerName}` : ''}</p>
                        </div>
                        <span className="self-start rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-xs font-bold text-[#5f7488] sm:self-auto">
                          {ownedTeamRegularMembers.length} {ownedTeamRegularMembers.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      {ownedTeamRegularMembers.length === 0 ? (
                        <div className="mt-4">
                          <EmptyBlock icon={<UserPlus size={24} />} message="No team members" />
                        </div>
                      ) : (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {ownedTeamRegularMembers.length > 0 && ownedTeamMembers.filter((member) => member.role === 'member').map((member) => (
                            <button key={member.id || member.lawyerId} type="button" onClick={() => onSelectTeamMember(member)} className="rounded-xl border border-[#e2edf1] bg-[#f8fbfc] px-4 py-3 text-left transition hover:border-[#15a276] hover:bg-white">
                              <p className="font-bold text-[#062552]">{member.name || 'Lawyer'}</p>
                              <p className="mt-1 text-xs text-[#5f7488]">Has Team: {member.hasTeam ? 'Yes' : 'No'}</p>
                              <p className="mt-1 text-xs text-[#5f7488]">Team Member · View Cases</p>
                            </button>
                          ))}
                      </div>
                      )}
                    </div>
                  ) : memberDetailTab === 'team' ? (
                    <EmptyBlock icon={<Users size={24} />} message="No team created" />
                  ) : null}
                </div>
              )
            ) : null}

            {/* Tab 3: Join Requests */}
            {currentActiveTeamTab === 'join_requests' && displayIsTeamOwner ? (
              <div className="rounded-2xl border border-[#d7e9ef] bg-white p-6 shadow-sm max-w-3xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#062552]">Join Requests</h3>
                    <p className="mt-1 text-sm text-[#5f7488]">Review requests from lawyers wanting to join your team.</p>
                  </div>
                  <span className="rounded-full border border-[#d7e9ef] bg-[#f8fbfc] px-3 py-1 text-sm font-bold text-[#5f7488]">
                    {teamPendingRequests.length} pending
                  </span>
                </div>
                {teamPendingRequests.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-dashed border-[#d7e9ef] bg-[#f8fbfc] p-6 text-center text-sm font-semibold text-[#5f7488]">
                    No pending join requests.
                  </p>
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {teamPendingRequests.map((request) => (
                      <div key={request.id} className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-5">
                        <h4 className="font-bold text-[#062552] text-base">{request.name || 'Lawyer'}</h4>
                        <p className="mt-1 text-xs text-[#5f7488]">{request.email || request.phone || 'Contact not shared'}</p>
                        <p className="mt-2 text-xs text-[#5f7488]">Requested {formatDate(request.requestedAt) || 'recently'}</p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleTeamRequestDecision(request, 'accept')}
                            disabled={updatingTeamRequestId === request.id}
                            className="rounded-lg bg-[#15a276] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#118b66] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingTeamRequestId === request.id ? 'Saving...' : 'Accept'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTeamRequestDecision(request, 'reject')}
                            disabled={updatingTeamRequestId === request.id}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header bar for No-Team state */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#d7e9ef] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#062552]">My Cases</h3>
                <p className="text-xs text-[#5f7488]">Manage your personal legal cases independently.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTeamMode(teamMode === 'create' ? 'none' : 'create');
                    setTeamError('');
                    setTeamMessage('');
                  }}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    teamMode === 'create'
                      ? 'border-[#15a276] bg-[#e8f7f2] text-[#0c7556]'
                      : 'border-[#d6b85b] bg-[#f1d15f] text-zinc-950 hover:bg-[#d6a400]'
                  }`}
                >
                  Create Team
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeamMode(teamMode === 'join' ? 'none' : 'join');
                    setTeamError('');
                    setTeamMessage('');
                  }}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    teamMode === 'join'
                      ? 'border-[#15a276] bg-[#e8f7f2] text-[#0c7556]'
                      : 'border-[#d7e9ef] bg-white text-[#062552] hover:bg-[#f3f8fb]'
                  }`}
                >
                  Join Team
                </button>
                <button
                  type="button"
                  onClick={() => setShowTeamCaseForm((current) => !current)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-sm transition ${
                    showTeamCaseForm
                      ? 'border-red-700 bg-red-600 text-white hover:bg-red-700'
                      : 'border-[#15a276] bg-[#15a276] text-white hover:bg-[#0f805d]'
                  }`}
                >
                  {showTeamCaseForm ? <FaTimes /> : <FaPlus />}
                  {showTeamCaseForm ? 'Close Form' : 'Add Case'}
                </button>
              </div>
            </div>

            {/* Create Team Form (Collapsible/Optional) */}
            {teamMode === 'create' ? (
              <form onSubmit={handleCreateTeam} className="relative space-y-4 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
                <button type="button" onClick={() => setTeamMode('none')} className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e9ef] bg-white text-zinc-600 shadow-sm transition hover:bg-red-600 hover:text-white" aria-label="Close Create Team"><FaTimes size={14} /></button>
                <h4 className="text-sm font-bold text-[#062552]">Create New Team</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <input name="firmName" value={createTeamForm.firmName} onChange={handleCreateTeamInput} placeholder="Firm name" className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-2.5 text-sm text-[#062552] outline-none focus:border-[#15a276]" required />
                  <input name="seniorLawyerName" value={createTeamForm.seniorLawyerName} onChange={handleCreateTeamInput} placeholder="Team Owner name" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-300" required />
                  <input type="number" min="2" name="maxTeamSize" value={createTeamForm.maxTeamSize} onChange={handleCreateTeamInput} className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-2.5 text-sm text-[#062552] outline-none focus:border-[#15a276]" required />
                </div>
                <button type="submit" disabled={teamLoading} className="verdits-primary-action inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed"><Users size={16} />{teamLoading ? 'Creating...' : 'Create Team Workspace'}</button>
              </form>
            ) : null}

            {/* Join Team Form (Collapsible/Optional) */}
            {teamMode === 'join' ? (
              <form onSubmit={handleJoinTeam} className="relative space-y-4 rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
                <button type="button" onClick={() => setTeamMode('none')} className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e9ef] bg-white text-zinc-600 shadow-sm transition hover:bg-red-600 hover:text-white" aria-label="Close Join Team"><FaTimes size={14} /></button>
                <h4 className="text-sm font-bold text-[#062552]">Join Existing Team</h4>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5f7488]">Team code</label><input name="teamCode" value={joinTeamForm.teamCode} onChange={handleJoinTeamInput} placeholder="Enter team code" className="w-full rounded-xl border border-[#d7e9ef] bg-white px-4 py-3 text-[#062552] outline-none focus:border-[#15a276]" required /></div>
                <button type="submit" disabled={teamLoading} className="verdits-primary-action inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition disabled:cursor-not-allowed"><UserPlus size={18} />{teamLoading ? 'Sending...' : 'Request to Join'}</button>
              </form>
            ) : null}

            {/* My Cases Content (Add Form & Case List) */}
            <div className="space-y-5">
              {showTeamCaseForm ? (
                <form onSubmit={handleAddTeamCase} className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5 md:grid-cols-2">
                  <p className="text-sm font-semibold text-zinc-400 md:col-span-2">
                    This case will be saved under your lawyer profile.
                  </p>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Name</label>
                    <input
                      name="clientName"
                      value={teamCaseForm.clientName}
                      onChange={handleTeamCaseInput}
                      placeholder="Client name"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Phone</label>
                    <input
                      name="clientPhone"
                      value={teamCaseForm.clientPhone}
                      onChange={handleTeamCaseInput}
                      placeholder="Client phone number"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Client Address</label>
                    <input
                      name="clientAddress"
                      value={teamCaseForm.clientAddress}
                      onChange={handleTeamCaseInput}
                      placeholder="Client address"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Case Name</label>
                    <input
                      name="caseName"
                      value={teamCaseForm.caseName}
                      onChange={handleTeamCaseInput}
                      placeholder="Case name"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Court Name</label>
                    <input
                      name="courtName"
                      value={teamCaseForm.courtName}
                      onChange={handleTeamCaseInput}
                      placeholder="Court name"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Starting Date</label>
                    <input
                      type="date"
                      name="startingDate"
                      value={teamCaseForm.startingDate}
                      onChange={handleTeamCaseInput}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Hearing Date</label>
                    <input
                      type="date"
                      name="hearingDate"
                      value={teamCaseForm.hearingDate}
                      onChange={handleTeamCaseInput}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Hearing Time</label>
                    <input
                      type="time"
                      name="hearingTime"
                      value={teamCaseForm.hearingTime}
                      onChange={handleTeamCaseInput}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Brief Info About the Case</label>
                    <textarea
                      name="briefInfo"
                      value={teamCaseForm.briefInfo}
                      onChange={handleTeamCaseInput}
                      placeholder="Brief info about the case"
                      rows="4"
                      className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-amber-300"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-400">Status</label>
                    <select
                      name="status"
                      value={teamCaseForm.status}
                      onChange={handleTeamCaseInput}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300"
                    >
                      {teamCaseStatuses.map((status) => (
                        <option key={status.value} value={status.value} className="text-zinc-950">
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingTeamCase}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f1d15f] hover:bg-[#d6a400] text-zinc-950 px-5 py-3 font-bold transition border border-[#d6b85b] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaCheck />
                      {savingTeamCase ? 'Saving...' : 'Save Case'}
                    </button>
                  </div>
                </form>
              ) : null}

              {selectedCaseForDetailsId && ownTeamCases.some((item) => String(item.id) === String(selectedCaseForDetailsId)) ? (() => {
                const selectedCase = ownTeamCases.find((item) => String(item.id) === String(selectedCaseForDetailsId));
                return (
                  <CaseDetailsView
                    selectedCase={selectedCase}
                    displayTeam={displayTeam}
                    onBack={() => setSelectedCaseForDetailsId('')}
                    teamCaseStatuses={teamCaseStatuses}
                    updatingTeamCaseId={updatingTeamCaseId}
                    handleUpdateTeamCaseStatus={handleUpdateTeamCaseStatus}
                    handleDeleteTeamCase={handleDeleteTeamCase}
                    loadTeamWorkspace={loadTeamWorkspace}
                    formatDate={formatDate}
                  />
                );
              })() : ownTeamCases.length === 0 ? (
                <EmptyBlock icon={<FaBriefcase size={24} />} message="No cases added by you yet." />
              ) : (
                <div className="space-y-4">
                  {ownTeamCases.map((teamCase) => (
                    <div
                      key={teamCase.id}
                      onClick={() => setSelectedCaseForDetailsId(String(teamCase.id))}
                      className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-[#15a276]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-white group-hover:text-[#15a276] transition">
                            {teamCase.caseName || teamCase.caseTitle || teamCase.title || 'Untitled Case'}
                          </h4>
                          <p className="mt-1 text-sm text-zinc-400">
                            Client: <span className="font-semibold text-blue-300 underline">{teamCase.clientName || 'Not added'}</span>
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">Court: {teamCase.courtName || 'Not added'}</p>
                          <p className="mt-1 text-xs text-zinc-500">Added by: You</p>
                        </div>
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={teamCase.status || 'new'}
                            onChange={(event) => handleUpdateTeamCaseStatus(teamCase, event.target.value)}
                            disabled={updatingTeamCaseId === teamCase.id}
                            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white outline-none focus:border-amber-300 disabled:opacity-60"
                          >
                            {teamCaseStatuses.map((status) => (
                              <option key={status.value} value={status.value} className="text-zinc-950">
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-zinc-300">{teamCase.briefInfo || teamCase.caseDetails || 'No brief info added.'}</p>

                      <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3 text-sm">
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                          <span>Next hearing: <strong className="text-zinc-200">{formatDate(teamCase.nextHearingAt || teamCase.hearingDate) || 'Not scheduled'}</strong></span>
                        </div>
                        <span className="text-xs font-bold text-[#15a276] group-hover:underline flex items-center gap-1">
                          View Case Details &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
