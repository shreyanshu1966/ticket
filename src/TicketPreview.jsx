import React from 'react';
import Ticket from './Ticket';

const TicketPreview = () => {
    // Sample dummy data for preview
    const sampleTicketData = {
        name: "Alex Johnson",
        email: "alex.j@university.edu",
        college: "Institute of Technology",
        year: "3rd Year",
        id: "ACD-2026-REG-8829",
        amount: "199",
        eventDate: "March 15, 2026",
        eventTime: "10:00 AM",
        qrCode: null, // Component will show placeholder
        ticketType: "Regular Access"
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-8">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">Ticket Preview</h2>
                <p className="text-gray-500">This is how the ticket will look when sent via email.</p>
            </div>

            <Ticket data={sampleTicketData} />

            <div className="mt-12 flex gap-4">
                <button className="px-6 py-2 rounded-full bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                    Download PDF
                </button>
                <button className="px-6 py-2 rounded-full bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-900/40">
                    Send Email
                </button>
            </div>
        </div>
    );
};

export default TicketPreview;
