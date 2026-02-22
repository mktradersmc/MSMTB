"use client";

import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SanityControlsProps {
    onRunCheck: (startDate: string) => void;
    isChecking: boolean;
}

export function SanityControls({ onRunCheck, isChecking }: SanityControlsProps) {
    // Default to 1 week ago
    const getDefaultDate = () => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    };

    const [startDate, setStartDate] = useState(getDefaultDate());

    const handleRun = () => {
        if (!startDate) {
            alert("Please select a start date");
            return;
        }
        onRunCheck(startDate);
    };

    return (
        <div className="w-full mb-6 rounded-xl border bg-card text-card-foreground shadow bg-white dark:bg-[#1E222D] border-gray-200 dark:border-gray-800">
            <div className="flex flex-col space-y-1.5 p-6 pb-3">
                <h3 className="font-semibold leading-none tracking-tight text-lg flex items-center gap-2">
                    Sanity Check Controls
                </h3>
            </div>
            <div className="p-6 pt-0">
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <label htmlFor="start-date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Check From Date</label>
                        <input
                            id="start-date"
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={cn(
                                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                                "border-gray-300 dark:border-gray-700 w-full sm:w-[250px]"
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-2 flex-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Last Reference Date (UTC): <span className="font-mono">{new Date().toISOString().split('T')[0]} (Yesterday)</span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            Checks data integrity from the selected date up to the end of yesterday (UTC).
                        </div>
                    </div>

                    <button
                        onClick={() => window.open((window as any).API_URL ? `${(window as any).API_URL}/api/sanity-check/report` : 'http://localhost:3005/api/sanity-check/report', '_blank')}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                            "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
                            "h-9 px-4 py-2 w-full sm:w-auto text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        Download Protocol
                    </button>

                    <button
                        onClick={handleRun}
                        disabled={isChecking}
                        className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                            "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
                            "h-9 px-4 py-2 w-full sm:w-auto min-w-[140px]"
                        )}
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" />
                                Run Sanity Check
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
