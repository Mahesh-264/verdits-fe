import React from 'react';
import { FaBriefcase, FaCircle } from 'react-icons/fa';
import { EmptyBlock, ModalShell } from './LawyerSharedComponents';

export default function LawyerClientsModal({
  show,
  onClose,
  loadingAppointments,
  acceptedClients,
  handleOpenChat,
}) {
  if (!show) return null;

  return (
    <ModalShell title="My Clients" icon={<FaBriefcase className="text-[#062552]" />} onClose={onClose}>
      {loadingAppointments ? (
        <EmptyBlock icon={<FaBriefcase size={24} />} message="Loading accepted clients..." />
      ) : acceptedClients.length === 0 ? (
        <EmptyBlock icon={<FaBriefcase size={24} />} message="No accepted clients yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {acceptedClients.slice().reverse().map((client) => (
            <div key={client.id} className="bg-white border border-[#d7e9ef] hover:border-[#15a276]/50 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-all text-[#062552]">
              <div>
                <h3 className="font-bold text-lg text-[#062552]">{client.userName}</h3>
                <p className="text-xs text-[#5f7488] mb-2">Accepted on: {new Date(client.timestamp).toLocaleString()}</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <FaCircle className="text-[8px]" /> Accepted Client
                </span>
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                <p className="text-xs text-[#5f7488] font-medium">Client communication unlocked</p>
                <button
                  onClick={() => handleOpenChat(client)}
                  className="verdits-primary-action px-5 py-2 rounded-xl font-bold shadow transition-transform active:scale-95"
                >
                  Go to Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
