import React from 'react';
import { FaGavel } from 'react-icons/fa';
import { EmptyBlock, ModalShell } from './LawyerSharedComponents';
import { formatDate, formatTime, getTeamCaseStatusLabel } from '../../utils/lawyerUtils';

export default function LawyerNextHearingsModal({
  show,
  onClose,
  googleCalendarLoading,
  googleCalendarStatus,
  googleCalendarActionLoading,
  handleConnectGoogleCalendar,
  handleDisconnectGoogleCalendar,
  hearingsLoading,
  ownHearings,
  onRefresh,
}) {
  React.useEffect(() => {
    if (show && typeof onRefresh === 'function') {
      onRefresh();
    }
  }, [show, onRefresh]);

  if (!show) return null;

  return (
    <ModalShell title="Next Hearings" icon={<FaGavel className="text-[#062552]" />} onClose={onClose}>
      <div className="lawyer-team-workspace space-y-4">
        <div className="rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#062552]">Google Calendar</h3>
          {googleCalendarLoading ? (
            <p className="mt-2 text-sm text-[#5f7488]">Checking connection...</p>
          ) : googleCalendarStatus.connected ? (
            <div className="mt-2">
              <p className="text-sm font-semibold text-[#15a276]">✓ Google Calendar Connected</p>
              <p className="mt-1 text-sm text-[#5f7488]">Connected Email: {googleCalendarStatus.email}</p>
              <button
                type="button"
                onClick={handleDisconnectGoogleCalendar}
                disabled={googleCalendarActionLoading}
                className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleCalendarActionLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogleCalendar}
              disabled={googleCalendarActionLoading}
              className="mt-4 rounded-xl bg-[#15a276] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleCalendarActionLoading ? 'Connecting...' : '📅 Connect Google Calendar'}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-[#062552]">My Upcoming Hearings</h3>
          <p className="mt-1 text-sm text-[#5f7488]">
            Upcoming hearings from cases added by you across all your teams and firms.
          </p>
        </div>

        {hearingsLoading ? (
          <EmptyBlock icon={<FaGavel size={24} />} message="Loading hearings..." />
        ) : ownHearings.length === 0 ? (
          <EmptyBlock icon={<FaGavel size={24} />} message="No upcoming hearings from your cases yet." />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {ownHearings.map((hearing) => (
              <div key={`${hearing.id}-${hearing.teamCode || 'team'}`} className="rounded-2xl border border-[#d7e9ef] bg-white p-5 shadow-sm hover:border-[#15a276]/50 transition-all text-[#062552]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">{hearing.teamName || 'No team'}</p>
                    <h3 className="mt-2 text-xl font-bold text-[#062552]">{hearing.caseTitle || 'Untitled Case'}</h3>
                    <p className="mt-1 text-sm text-[#5f7488]">Client: {hearing.clientName || 'Not added'}</p>
                  </div>
                  <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                    {formatDate(hearing.hearingDate)}
                    <span className="block mt-1 text-xs">{hearing.hearingTime ? formatTime(`${hearing.hearingDate?.slice(0, 10)}T${hearing.hearingTime}`) : formatTime(hearing.hearingDate)}</span>
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                  <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Court</p>
                    <p className="mt-1 font-semibold text-[#062552]">{hearing.courtName || 'Not added'}</p>
                  </div>
                  <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Hearing Time</p>
                    <p className="mt-1 font-semibold text-[#062552]">{hearing.hearingTime ? formatTime(`${hearing.hearingDate?.slice(0, 10)}T${hearing.hearingTime}`) : formatTime(hearing.hearingDate)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Status</p>
                    <p className="mt-1 font-semibold text-[#062552]">{getTeamCaseStatusLabel(hearing.status)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d7e9ef] bg-[#f8fbfc] p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5f7488]">Team Code</p>
                    <p className="mt-1 font-mono font-semibold text-[#062552]">{hearing.teamCode || 'Not added'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
