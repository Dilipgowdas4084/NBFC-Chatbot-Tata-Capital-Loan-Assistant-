import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (customerId: string, customerName: string) => void;
}

// Demo customers for login
const demoCustomers = [
    { id: '101', name: 'Amit Verma', phone: '9876543210' },
    { id: '102', name: 'Priya Sharma', phone: '9123456789' },
    { id: '103', name: 'Rahul Singh', phone: '9988776655' },
    { id: '104', name: 'Sneha Gupta', phone: '9876500001' },
];

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [error, setError] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<typeof demoCustomers[0] | null>(null);

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Find customer by phone
        const customer = demoCustomers.find(c => c.phone === phone);
        if (customer) {
            setSelectedCustomer(customer);
            setStep('otp');
            // In real app, send OTP via SMS
        } else {
            setError('Phone number not registered. Try: 9876543210');
        }
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // For demo, accept any 4-digit OTP
        if (otp.length === 4 && selectedCustomer) {
            onLogin(selectedCustomer.id, selectedCustomer.name);
        } else {
            setError('Invalid OTP. Enter any 4 digits for demo.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tata Capital</h1>
                    <p className="text-blue-200">Personal Loan Assistant</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                        {step === 'phone' ? 'Welcome Back!' : 'Verify OTP'}
                    </h2>

                    {step === 'phone' ? (
                        <form onSubmit={handleSendOtp}>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">+91</span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="Enter 10-digit mobile"
                                        className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={phone.length !== 10}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                            >
                                Send OTP
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <div className="mb-4 text-center">
                                <p className="text-gray-600 text-sm">
                                    OTP sent to <span className="font-medium">+91 {phone}</span>
                                </p>
                                <p className="text-green-600 text-sm mt-1">
                                    Welcome, {selectedCustomer?.name}!
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="Enter 4-digit OTP"
                                    className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    maxLength={4}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Demo: Enter any 4 digits
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={otp.length !== 4}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                            >
                                Verify & Login
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                                className="w-full mt-3 text-blue-600 hover:text-blue-800 font-medium py-2 transition"
                            >
                                ← Change Number
                            </button>
                        </form>
                    )}
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4">
                    <p className="text-blue-200 text-sm font-medium mb-2 text-center">Demo Accounts:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {demoCustomers.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => { setPhone(c.phone); setStep('phone'); setError(''); }}
                                className="text-xs bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-2 transition"
                            >
                                {c.name}<br />
                                <span className="opacity-75">{c.phone}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-300 text-xs mt-6">
                    © 2025 Tata Capital. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
