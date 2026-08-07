import React from 'react';
import { FaCalendarPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { EmptyBlock, ModalShell, StatusPill } from './LawyerSharedComponents';

export default function LawyerAppointmentsModal({
  show,
  onClose,
  loadingAppointments,
  pendingAppointments,
  updateStatus,
}) {
  if (!show) return null;

  return (
    <ModalShell
      title="Incoming Appointments"
      icon={<FaCalendarPlus className="text-[#15a276]" />}
      onClose={onClose}
    >
      {loadingAppointments ? (
        <EmptyBlock icon={<FaCalendarPlus size={24} />} message="Loading appointment requests..." />
      ) : pendingAppointments.length === 0 ? (
        <EmptyBlock icon={<FaCalendarPlus size={24} />} message="No pending or rejected appointment requests right now." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingAppointments.slice().reverse().map((appt) => (
            <div key={appt.id} className="bg-white border border-[#d7e9ef] hover:border-[#15a276]/50 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-all text-[#062552]">
              <div>
                <h3 className="font-bold text-lg text-[#062552]">{appt.userName}</h3>
                <p className="text-xs text-[#5f7488] mb-2">Requested on: {new Date(appt.timestamp).toLocaleString()}</p>
                <StatusPill status={appt.status} />
              </div>
              {appt.status === 'Pending' ? (
                <div className="flex gap-3 w-full sm:w-auto mt-3 sm:mt-0 shadow-sm">
                  <button onClick={() => updateStatus(appt.id, 'Accepted')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#15a276] hover:bg-[#118b66] text-white rounded-xl font-bold transition-transform active:scale-95">
                    <FaCheck /> Accept
                  </button>
                  <button onClick={() => updateStatus(appt.id, 'Rejected')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold transition-transform active:scale-95 border border-red-200">
                    <FaTimes /> Reject
                  </button>
                </div>
              ) : appt.status === 'Rejected' ? (
                <p className="text-xs text-red-600 font-medium">Request rejected</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
