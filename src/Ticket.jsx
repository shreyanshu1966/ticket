import React from 'react';

const Ticket = ({ data }) => {
    const { name, email, college, year, id, qrCode, amount, eventDate = "March 15, 2026", eventTime = "10:00 AM", ticketType = "General Entry" } = data || {};

    return (
        <div className="relative w-full max-w-4xl mx-auto perspective-1000">
            {/* Background Glow Effects */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>

            <div className="relative flex flex-col md:flex-row bg-[#1a1a1a] border border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl">

                {/* Left Section - Main Ticket Info */}
                <div className="flex-1 p-8 relative overflow-hidden group">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-900/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

                    {/* Header */}
                    <div className="relative z-10 flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center p-0.5 shadow-lg shadow-purple-900/20">
                                <div className="w-full h-full bg-[#1a1a1a] rounded-xl flex items-center justify-center overflow-hidden">
                                    <img src="/ACES_LOGO-.png" alt="Logo" className="w-12 h-12 object-contain" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">ACD 2026</h1>
                                <p className="text-purple-400 font-medium tracking-wide text-sm uppercase">Annual Cultural Day</p>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full backdrop-blur-sm">
                                <span className="text-purple-300 font-semibold text-xs tracking-wider uppercase">Official Ticket</span>
                            </div>
                        </div>
                    </div>

                    {/* Attendee Details Grid */}
                    <div className="relative z-10 grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                        <div className="col-span-2 sm:col-span-1">
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Attendee</p>
                            <h3 className="text-xl font-bold text-white truncate">{name || 'Guest User'}</h3>
                            <p className="text-gray-400 text-sm truncate">{email || 'guest@example.com'}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Ticket Type</p>
                            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                                {ticketType}
                            </h3>
                            <p className="text-gray-400 text-sm">₹{(amount / 100) || 199} Paid</p>
                        </div>

                        <div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">College</p>
                            <p className="text-white font-medium">{college || 'University Name'}</p>
                        </div>

                        <div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Year</p>
                            <p className="text-white font-medium">{year || 'Year'}</p>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="relative z-10 flex flex-wrap gap-6 pt-6 border-t border-gray-800">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Date</p>
                                <p className="text-gray-300 text-sm font-medium">{eventDate}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Time</p>
                                <p className="text-gray-300 text-sm font-medium">{eventTime}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Location</p>
                                <p className="text-gray-300 text-sm font-medium">Main Auditorium</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Perforation / Divider */}
                <div className="relative hidden md:flex flex-col items-center justify-center w-8 bg-[#151515]">
                    <div className="absolute top-0 w-6 h-6 bg-black rounded-full -translate-y-1/2"></div>
                    <div className="h-full border-l-2 border-dashed border-gray-700/50"></div>
                    <div className="absolute bottom-0 w-6 h-6 bg-black rounded-full translate-y-1/2"></div>
                </div>

                {/* Horizontal Divider for Mobile */}
                <div className="md:hidden relative w-full h-8 bg-[#151515] flex items-center justify-center">
                    <div className="absolute left-0 w-6 h-6 bg-black rounded-full -translate-x-1/2"></div>
                    <div className="w-full border-t-2 border-dashed border-gray-700/50"></div>
                    <div className="absolute right-0 w-6 h-6 bg-black rounded-full translate-x-1/2"></div>
                </div>

                {/* Right Section - Stub / QA */}
                <div className="w-full md:w-80 bg-[#151515] p-8 flex flex-col items-center justify-between relative">

                    <div className="text-center w-full">
                        <p className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase mb-4">Scan Entry</p>
                        <div className="bg-white p-3 rounded-xl mx-auto w-48 h-48 flex items-center justify-center shadow-lg shadow-black/50">
                            {/* QR Code Placeholder - In production use a real QR library */}
                            {qrCode ? (
                                <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-center text-gray-400 break-all p-2">
                                    QR CODE
                                    <br />
                                    {id || 'PREVIEW'}
                                </div>
                            )}
                        </div>
                        <p className="mt-4 font-mono text-purple-400 text-sm tracking-widest">{id || 'TICKET-ID-123'}</p>
                    </div>

                    <div className="w-full mt-6 space-y-3">
                        <div className="flex justify-between text-xs text-gray-500 border-b border-gray-800 pb-2">
                            <span>Order ID</span>
                            <span className="text-gray-300 font-mono">#ORD-{id?.slice(0, 6) || '000'}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Allowed</span>
                            <span className="text-green-400 font-bold">1 Person</span>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-600"></div>
                </div>
            </div>
        </div>
    );
};

export default Ticket;
