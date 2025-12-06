import React from 'react';
import ChatWindow from '../components/ChatWindow';

interface ChatPageProps {
    customerId: string;
    customerName: string;
    onLogout: () => void;
    onBackToDashboard: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ customerId, customerName, onLogout, onBackToDashboard }) => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-md">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBackToDashboard}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="font-semibold">Loan Application</h1>
                            <p className="text-xs text-blue-100">Chat with our AI assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm">Hi, {customerName}</span>
                        <button
                            onClick={onLogout}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <ChatWindow customerId={customerId} customerName={customerName} />
            </div>
        </div>
    );
};

export default ChatPage;
