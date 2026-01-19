import React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';

interface AddToCalendarButtonProps {
    title: string;
    description?: string;
    location?: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
    durationMinutes?: number;
    className?: string;
}

const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
    title,
    description = '',
    location = '',
    date,
    time = '09:00', // Default if missing
    durationMinutes = 60,
    className = ''
}) => {

    // Check if the event is in the past
    // But we might want to add past events too? Usually not.

    const createGoogleCalendarUrl = () => {
        try {
            // Construct Start Date
            const startDateTime = new Date(`${date}T${time}:00`);
            const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

            // Format dates as YYYYMMDDTHHMMSS
            const formatDate = (date: Date) => {
                return date.toISOString().replace(/-|:|\.\d+/g, '');
            };

            const startStr = formatDate(startDateTime);
            const endStr = formatDate(endDateTime);

            const params = new URLSearchParams({
                action: 'TEMPLATE',
                text: title,
                dates: `${startStr}/${endStr}`,
                details: description,
                location: location,
            });

            return `https://calendar.google.com/calendar/render?${params.toString()}`;
        } catch (e) {
            console.error("Date parsing error", e);
            return '#';
        }
    };

    return (
        <a
            href={createGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors shadow-sm ${className}`}
            title="Google Takvime Ekle"
        >
            <Calendar className="w-3.5 h-3.5 text-[#4285F4]" />
            <span>Takvime Ekle</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
        </a>
    );
};

export default AddToCalendarButton;
