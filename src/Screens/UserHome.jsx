import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, Lightbulb, MoreHorizontal, User } from 'lucide-react';

const UserHome = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Header */}
            <div className="w-full bg-black text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-8" /> {/* Add your logo */}
                    <span className="text-xl font-bold tracking-wide">Nyaya Setu</span>
                </div>
                <User className="h-6 w-6" onClick={() => navigate('/profile')} />
            </div>

            {/* Grid Menu */}
            <div className="w-full max-w-md p-6 grid grid-cols-2 gap-6 mt-10">

                {/* Book a Lawyer */}
                <div
                    onClick={() => navigate('/book-lawyer')}
                    className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition"
                >
                    <div className="h-14 w-14 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <BookOpen size={28} />
                    </div>
                    <span className="font-medium text-gray-800">Book a Lawyer</span>
                </div>

                {/* Consult a Lawyer */}
                <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition">
                    <div className="h-14 w-14 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <MessageSquare size={28} />
                    </div>
                    <span className="font-medium text-gray-800">Consult a Lawyer</span>
                </div>

                {/* Know Your Document */}
                <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition">
                    <div className="h-14 w-14 bg-yellow-500 rounded-full flex items-center justify-center text-white">
                        <Lightbulb size={28} />
                    </div>
                    <span className="font-medium text-gray-800 text-center">Know Your Document</span>
                </div>

                {/* Other */}
                <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition">
                    <div className="h-14 w-14 bg-purple-500 rounded-full flex items-center justify-center text-white">
                        <MoreHorizontal size={28} />
                    </div>
                    <span className="font-medium text-gray-800">Other</span>
                </div>

            </div>

            {/* Chat Bot Input Area (Visual Only as per image) */}
            <div className="w-full max-w-md fixed bottom-0 bg-black p-4 rounded-t-3xl">
                <h3 className="text-white text-sm mb-2 font-semibold">AI Legal Chat Bot</h3>
                <input
                    type="text"
                    placeholder="Ask a legal question"
                    className="w-full p-3 rounded-xl bg-white text-gray-800 outline-none"
                />
            </div>
        </div>
    );
};

export default UserHome;