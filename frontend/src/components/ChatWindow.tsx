import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import FileUpload from './FileUpload';
import { sendMessage, getSanctionLetterUrl } from '../services/api';

interface ChatWindowProps {
    customerId: string;
    customerName: string;
}

interface Message {
    role: 'user' | 'bot';
    content: string;
}

interface LoanApprovalDetails {
    applicationId: string;
    loanAmount: number;
    tenure: number;
    emi: number;
    interestRate: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ customerId, customerName }) => {
    const sessionId = useRef(`sess_${Date.now()}`);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [currentState, setCurrentState] = useState('START');
    const [loading, setLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [loanApproval, setLoanApproval] = useState<LoanApprovalDetails | null>(null);
    const [showTenureSelector, setShowTenureSelector] = useState(false);
    const [selectedTenure, setSelectedTenure] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const tenureOptions = [
        { months: 12, label: '12 Months', description: 'Higher EMI, Less Interest' },
        { months: 24, label: '24 Months', description: 'Balanced Option' },
        { months: 36, label: '36 Months', description: 'Lower EMI, More Interest' },
        { months: 48, label: '48 Months', description: 'Extended Tenure' },
        { months: 60, label: '60 Months', description: 'Maximum Tenure' },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, showUpload, loanApproval, showTenureSelector]);

    // Initial greeting
    useEffect(() => {
        const initChat = async () => {
            setLoading(true);
            try {
                // Send empty message to trigger start
                const response = await sendMessage(sessionId.current, customerId, '', 'START');
                // Prepend customer name to the welcome message
                const greeting = customerName 
                    ? response.botMessage.replace(/^(Hello|Hi|Welcome)/, `$1 ${customerName},`)
                    : response.botMessage;
                setMessages([{ role: 'bot', content: greeting }]);
                setCurrentState(response.nextState);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        initChat();
    }, [customerId, customerName]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const response = await sendMessage(sessionId.current, customerId, userMsg, currentState);

            setMessages(prev => [...prev, { role: 'bot', content: response.botMessage }]);
            setCurrentState(response.nextState);

            // Handle Actions
            if (response.actions?.includes('REQUEST_SALARY_SLIP_UPLOAD')) {
                setShowUpload(true);
            } else {
                setShowUpload(false);
            }

            // Show tenure selector when bot asks for tenure
            const tenureKeywords = ['tenure', 'months', 'how many months', 'repayment', 'duration'];
            const askingForTenure = tenureKeywords.some(keyword => 
                response.botMessage.toLowerCase().includes(keyword)
            ) && currentState === 'COLLECTING_LOAN_DETAILS';
            
            if (askingForTenure && !response.meta?.applicationId) {
                setShowTenureSelector(true);
            } else {
                setShowTenureSelector(false);
            }

            // Handle loan approval with full details
            if (response.meta?.applicationId) {
                setShowTenureSelector(false);
                setLoanApproval({
                    applicationId: response.meta.applicationId,
                    loanAmount: response.meta.loanAmount || 0,
                    tenure: response.meta.tenure || 12,
                    emi: response.meta.emi || 0,
                    interestRate: response.meta.interestRate || 0.15
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'bot', content: "Sorry, something went wrong." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadComplete = async () => {
        setShowUpload(false);
        // Inform backend about upload
        setLoading(true);
        try {
            // We tell master agent we uploaded
            const response = await sendMessage(sessionId.current, customerId, "Uploaded salary slip", 'SALARY_SLIP_UPLOAD');
            setMessages(prev => [...prev,
            { role: 'user', content: '[System]: Salary Slip Uploaded' },
            { role: 'bot', content: response.botMessage }
            ]);
            setCurrentState(response.nextState);
            if (response.meta?.applicationId) {
                setLoanApproval({
                    applicationId: response.meta.applicationId,
                    loanAmount: response.meta.loanAmount || 0,
                    tenure: response.meta.tenure || 12,
                    emi: response.meta.emi || 0,
                    interestRate: response.meta.interestRate || 0.15
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTenureSelect = async (months: number) => {
        setSelectedTenure(months);
        setShowTenureSelector(false);
        
        // Send tenure selection as message
        const userMsg = `${months} months`;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await sendMessage(sessionId.current, customerId, userMsg, currentState);
            setMessages(prev => [...prev, { role: 'bot', content: response.botMessage }]);
            setCurrentState(response.nextState);

            if (response.meta?.applicationId) {
                setLoanApproval({
                    applicationId: response.meta.applicationId,
                    loanAmount: response.meta.loanAmount || 0,
                    tenure: response.meta.tenure || months,
                    emi: response.meta.emi || 0,
                    interestRate: response.meta.interestRate || 0.15
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'bot', content: "Sorry, something went wrong." }]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-md mx-auto border rounded-xl shadow-xl bg-white overflow-hidden">
            <div className="p-4 bg-blue-600 text-white font-bold text-center">
                Personal Loan Assistant
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.map((msg, idx) => (
                    <MessageBubble key={idx} role={msg.role} content={msg.content} />
                ))}

                {loading && (
                    <div className="text-xs text-gray-500 italic ml-2 mb-2">Bot is typing...</div>
                )}

                {showUpload && (
                    <FileUpload onUploadComplete={handleUploadComplete} />
                )}

                {/* Tenure Selector Dropdown */}
                {showTenureSelector && !loading && (
                    <div className="my-4 bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
                        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
                            <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Select Loan Tenure
                            </h3>
                            <p className="text-xs text-blue-600 mt-1">Choose your preferred repayment duration</p>
                        </div>
                        <div className="p-2">
                            {tenureOptions.map((option) => (
                                <button
                                    key={option.months}
                                    onClick={() => handleTenureSelect(option.months)}
                                    className={`w-full text-left p-3 rounded-lg mb-1 transition-all hover:bg-blue-50 border-2 ${
                                        selectedTenure === option.months 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-transparent hover:border-blue-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-gray-800">{option.label}</span>
                                            <p className="text-xs text-gray-500">{option.description}</p>
                                        </div>
                                        <div className="w-6 h-6 rounded-full border-2 border-blue-400 flex items-center justify-center">
                                            {selectedTenure === option.months && (
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loan Approval Card */}
                {loanApproval && (
                    <div className="my-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                        {/* Success Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-lg">Loan Approved! 🎉</p>
                                <p className="text-green-100 text-xs">Ref: {loanApproval.applicationId}</p>
                            </div>
                        </div>

                        {/* Loan Details */}
                        <div className="bg-white/20 backdrop-blur rounded-lg p-3 mb-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-green-100 text-xs">Loan Amount</p>
                                    <p className="font-bold">{formatCurrency(loanApproval.loanAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-green-100 text-xs">Tenure</p>
                                    <p className="font-bold">{loanApproval.tenure} Months</p>
                                </div>
                                <div>
                                    <p className="text-green-100 text-xs">Interest Rate</p>
                                    <p className="font-bold">{(loanApproval.interestRate * 100).toFixed(1)}% p.a.</p>
                                </div>
                                <div>
                                    <p className="text-green-100 text-xs">Monthly EMI</p>
                                    <p className="font-bold text-yellow-300">{formatCurrency(loanApproval.emi)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Disbursement Notice */}
                        <div className="flex items-center gap-2 text-xs text-green-100 mb-4">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Amount will be disbursed within 24-48 hours</span>
                        </div>

                        {/* Download Button */}
                        <a
                            href={getSanctionLetterUrl(loanApproval.applicationId)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-white text-green-600 font-semibold py-3 rounded-lg hover:bg-green-50 transition shadow"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Sanction Letter (PDF)
                        </a>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || showUpload || !!loanApproval}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || showUpload || !!loanApproval}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
