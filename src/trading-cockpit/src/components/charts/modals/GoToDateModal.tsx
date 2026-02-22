import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useChartTheme } from '../../../context/ChartThemeContext';

interface GoToDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoTo: (timestamp: number) => void;
}

export const GoToDateModal: React.FC<GoToDateModalProps> = ({ isOpen, onClose, onGoTo }) => {
    const { theme } = useChartTheme();
    const [activeTab, setActiveTab] = useState<'date' | 'custom'>('date');

    // Date State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [inputDate, setInputDate] = useState<string>('');
    const [inputTime, setInputTime] = useState<string>('00:00');

    // Calendar View State
    const [viewDate, setViewDate] = useState<Date>(new Date()); // For navigating months without changing selection

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setSelectedDate(now);
            setViewDate(now);
            setInputDate(now.toISOString().split('T')[0]);
            setInputTime(now.toTimeString().slice(0, 5));
        }
    }, [isOpen]);

    // Update inputs when calendar selection changes
    useEffect(() => {
        setInputDate(selectedDate.toISOString().split('T')[0]);
    }, [selectedDate]);

    // Handle Input Changes
    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputDate(e.target.value);
        const d = new Date(e.target.value);
        if (!isNaN(d.getTime())) {
            setSelectedDate(d);
            setViewDate(d);
        }
    };

    const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputTime(e.target.value);
    };

    const handleGoTo = () => {
        const [hours, minutes] = inputTime.split(':').map(Number);
        const target = new Date(selectedDate);
        target.setHours(hours, minutes, 0, 0);
        onGoTo(Math.floor(target.getTime() / 1000));
        onClose();
    };

    // Calendar Helper Functions
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust for Monday start (0=Mon, 6=Sun)
    };

    const generateCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days: (number | null)[] = [];

        // Padding for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    if (!isOpen) return null;

    const days = generateCalendarDays();
    const weekDays = ['Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.', 'So.'];

    // Format Helper
    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1E222D] rounded-lg shadow-xl w-[340px] overflow-hidden border border-slate-200 dark:border-[#2A2E39]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 pb-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-[#D1D4DC]">Gehe zu</h2>
                    <button onClick={onClose} className="text-slate-500 dark:text-[#787B86] hover:text-slate-900 dark:hover:text-[#D1D4DC] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tags */}
                <div className="flex px-4 border-b border-slate-200 dark:border-[#2A2E39] mb-4">
                    <button
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors mr-4 ${activeTab === 'date'
                            ? 'text-blue-600 dark:text-[#2962FF] border-blue-600 dark:border-[#2962FF]'
                            : 'text-slate-500 dark:text-[#D1D4DC] border-transparent hover:text-blue-600 dark:hover:text-[#2962FF]'
                            }`}
                        onClick={() => setActiveTab('date')}
                    >
                        Datum
                    </button>
                    {/* Custom range removed per user request */}
                </div>

                <div className="px-4 pb-4">
                    {/* Inputs Row */}
                    <div className="flex gap-3 mb-6">
                        <div className="relative flex-1">
                            <input
                                type="date"
                                value={inputDate}
                                onChange={handleDateInputChange}
                                className="w-full bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-[#363A45] rounded px-3 py-1.5 text-sm text-slate-900 dark:text-[#D1D4DC] focus:border-blue-500 dark:focus:border-[#2962FF] focus:outline-none"
                            />
                            {/* Icon overlay logic excluded for standard date input appearance */}
                        </div>
                        <div className="relative w-24">
                            <input
                                type="time"
                                value={inputTime}
                                onChange={handleTimeInputChange}
                                className="w-full bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-[#363A45] rounded px-3 py-1.5 text-sm text-slate-900 dark:text-[#D1D4DC] focus:border-blue-500 dark:focus:border-[#2962FF] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Calendar Nav */}
                    <div className="flex justify-between items-center mb-4 text-slate-900 dark:text-[#D1D4DC]">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-[#2A2E39] rounded text-slate-500 dark:text-[#787B86] hover:text-slate-900 dark:hover:text-[#D1D4DC]">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-medium">
                            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-[#2A2E39] rounded text-slate-500 dark:text-[#787B86] hover:text-slate-900 dark:hover:text-[#D1D4DC]">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-xs text-slate-500 dark:text-[#787B86] py-1 bg-slate-100 dark:bg-[#2A2E39]/30 rounded-sm">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {days.map((day, idx) => {
                            if (day === null) return <div key={`empty-${idx}`} />;

                            const isSelected =
                                day === selectedDate.getDate() &&
                                viewDate.getMonth() === selectedDate.getMonth() &&
                                viewDate.getFullYear() === selectedDate.getFullYear();

                            const isToday =
                                day === new Date().getDate() &&
                                viewDate.getMonth() === new Date().getMonth() &&
                                viewDate.getFullYear() === new Date().getFullYear();

                            return (
                                <button
                                    key={day}
                                    onClick={() => {
                                        const newD = new Date(viewDate);
                                        newD.setDate(day);
                                        setSelectedDate(newD);
                                    }}
                                    className={`
                                        text-sm py-1.5 rounded transition-colors
                                        ${isSelected
                                            ? 'bg-blue-600 dark:bg-white text-white dark:text-black font-bold'
                                            : 'text-slate-700 dark:text-[#D1D4DC] hover:bg-slate-100 dark:hover:bg-[#2A2E39]'
                                        }
                                        ${isToday && !isSelected ? 'underline decoration-blue-500 dark:decoration-[#2962FF] underline-offset-4' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-[#2A2E39]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-[#D1D4DC] border border-slate-300 dark:border-[#363A45] rounded hover:bg-slate-100 dark:hover:bg-[#2A2E39] transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleGoTo}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-white hover:bg-blue-500 dark:hover:bg-slate-200 text-white dark:text-black rounded transition-colors font-bold"
                    >
                        Gehe zu
                    </button>
                </div>
            </div>
        </div>
    );
};
