import React from 'react';
import { Link } from 'react-router-dom';

export const LoadingState = React.memo(() => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#15a276]"></div>
    </div>
));

LoadingState.displayName = 'LoadingState';

export const ErrorState = React.memo(() => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">Lawyer not found</h2>
        <Link
            to="/user-home"
            className="mt-4 text-[#15a276] font-semibold hover:text-[#118b66] transition"
        >
            Go to dashboard home
        </Link>
    </div>
));

ErrorState.displayName = 'ErrorState';
