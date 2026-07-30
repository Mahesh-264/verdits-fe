import React, { useCallback, useMemo } from 'react';
import { Phone, MessageSquare } from 'lucide-react';

const ConsultationButton = React.memo(({ icon: Icon, label, price, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition border ${
            label === 'Chat'
                ? 'consultation-chat-button bg-[#062552] hover:bg-[#0b3b70] text-white shadow-lg shadow-[#062552]/20'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100'
        }`}
    >
        <Icon size={24} className="mb-1" />
        <span className="text-xs font-bold">{label}</span>
        <span className="text-[10px] opacity-70">{price}</span>
    </button>
));

ConsultationButton.displayName = 'ConsultationButton';

const PendingStatus = React.memo(({ status, isSending }) => {
    const isPending = status === 'Pending' || isSending;
    const isRejected = status === 'Rejected';

    return (
        <div className="flex flex-col items-center">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Consultation Access
            </h4>
            {isPending ? (
                <button disabled className="w-full bg-[#15a276] text-white font-bold py-3 rounded-xl opacity-70 cursor-not-allowed">
                    {isSending ? 'Sending Request...' : 'Request Pending Approval...'}
                </button>
            ) : isRejected ? (
                <>
                    <button disabled className="w-full bg-red-500 text-white font-bold py-3 rounded-xl opacity-70 cursor-not-allowed">
                        Appointment Rejected
                    </button>
                    <p className="text-[11px] text-red-500 mt-2 text-center">
                        This appointment request was rejected by the lawyer.
                    </p>
                </>
            ) : null}
            {!isRejected && (
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                    Communication features will unlock once the lawyer accepts your request.
                </p>
            )}
        </div>
    );
});

PendingStatus.displayName = 'PendingStatus';

const AcceptedStatus = React.memo(({ onConnect }) => {
    const handleCall = useCallback(() => onConnect('call'), [onConnect]);
    const handleChat = useCallback(() => onConnect('chat'), [onConnect]);

    return (
        <>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Request Accepted - Connect Now
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <ConsultationButton
                    icon={MessageSquare}
                    label="Chat"
                    price="Free"
                    onClick={handleChat}
                />
                <ConsultationButton
                    icon={Phone}
                    label="Call"
                    price="₹15/min"
                    onClick={handleCall}
                />
            </div>
        </>
    );
});

AcceptedStatus.displayName = 'AcceptedStatus';

const AppointmentActions = React.memo(({
    requestStatus,
    isSendingRequest,
    onSendRequest,
    onConnect
}) => {
    const isAccepted = useMemo(() => requestStatus === 'Accepted', [requestStatus]);

    return (
        <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
            {!isAccepted ? (
                <>
                    <PendingStatus status={requestStatus} isSending={isSendingRequest} />
                    {requestStatus !== 'Rejected' && requestStatus !== 'Pending' && !isSendingRequest && (
                        <button
                            onClick={onSendRequest}
                            className="w-full bg-[#15a276] hover:bg-[#fff2bf] text-white font-bold py-3 rounded-xl shadow-lg transition mt-4"
                        >
                            Send Appointment Request
                        </button>
                    )}
                </>
            ) : (
                <AcceptedStatus onConnect={onConnect} />
            )}
        </div>
    );
});

AppointmentActions.displayName = 'AppointmentActions';

export default AppointmentActions;
