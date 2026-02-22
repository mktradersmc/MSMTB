"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../../services/socket';
import { HistoryTreeTable, HistoryNode } from './HistoryTreeTable';
import { SanityControls } from './SanityControls';

// Config
const API_URL = 'http://localhost:3005'; // Correct backend port

interface SanityUpdate {
    symbol: string;
    timeframe?: string;
    status?: string;
    message?: string;
}

export function DataHistoryView() {
    const [data, setData] = useState<HistoryNode[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeJob, setActiveJob] = useState<{ id: string; status: string; progress: number; total: number; completed: number; } | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // --- Initial Data Fetch ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/data-history/stats`, { cache: 'no-store' });
            if (!res.ok) throw new Error("Failed to fetch");
            const body = await res.json();
            if (body.success) {
                setData(body.stats);
            } else {
                console.error("Failed to load history stats: " + body.error);
            }

            // Sync Sanity Job Status (Sanity 2.0)
            const jobRes = await fetch(`${API_URL}/api/sanity/job/current`, { cache: 'no-store' });
            if (jobRes.ok) {
                const jobBody = await jobRes.json();
                if (jobBody.success && jobBody.job) {
                    setActiveJob({
                        id: jobBody.job.id,
                        status: jobBody.job.status,
                        progress: jobBody.job.completedTasks / jobBody.job.totalTasks,
                        total: jobBody.job.totalTasks,
                        completed: jobBody.job.completedTasks
                    });
                    setIsChecking(true);
                } else {
                    // Fallback to legacy check status if no job but flag active?
                    // Actually, if no job, we assume not checking.
                    setActiveJob(null);

                    // Legacy Check (for transitions)
                    const statusRes = await fetch(`${API_URL}/api/sanity-check/status`, { cache: 'no-store' });
                    if (statusRes.ok) {
                        const sBody = await statusRes.json();
                        setIsChecking(sBody.isChecking);
                    } else {
                        setIsChecking(false);
                    }
                }
            }

        } catch (e) {
            console.error("Failed to connect to backend", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- Handle Real-time Updates ---
    const handleSanityUpdate = (update: SanityUpdate) => {
        setData(currentData => {
            const newData = [...currentData];

            // Find Symbol Node
            const symbolNode = newData.find(n => n.key === update.symbol);
            if (symbolNode) {
                // If update is for specific timeframe
                if (update.timeframe) {
                    const tfKey = `${update.symbol}-${update.timeframe}`;
                    const tfNode = symbolNode.children?.find(c => c.key === tfKey);
                    if (tfNode) {
                        tfNode.data = {
                            ...tfNode.data,
                            status: update.status,
                            message: update.message
                        };
                    }
                }
                // Also update Symbol Status nicely (Aggregate?)
                // Or if update is generic for symbol
                if (!update.timeframe) { // Only symbol level update
                    symbolNode.data = {
                        ...symbolNode.data,
                        status: update.status,
                        message: update.message
                    };
                }
            }
            return newData;
        });
    };

    useEffect(() => {
        fetchData();

        // --- Socket Connection ---
        const socket = socketService.getSocket();

        // No explicit connect() or disconnect() needed for Shared Socket.
        // But we DO need to hook listeners.

        if (socket.connected) {
            console.log("Socket connected (Shared) for Data History");
        }

        const onConnect = () => console.log("Socket connected (Shared) for Data History");
        socket.on('connect', onConnect);

        // Events
        const onSanityUpdate = (update: any) => handleSanityUpdate(update);
        const onTaskUpdate = (update: any) => {
            console.log("Task Update:", update);
            handleSanityUpdate(update);
        };
        const onJobUpdate = (job: any) => {
            console.log("Job Update:", job);
            setActiveJob({
                id: job.id,
                status: job.status,
                progress: job.progress,
                total: job.total,
                completed: job.completed
            });

            if (job.status === 'COMPLETED' || job.status === 'FAILED') {
                setIsChecking(false);
                setTimeout(() => {
                    setActiveJob(null);
                    fetchData(); // Refresh Data Stats to show final OK/Counts
                }, 2000);
            } else {
                setIsChecking(true);
            }
        };

        socket.on('sanity_update', onSanityUpdate);
        socket.on('task_update', onTaskUpdate);
        socket.on('job_update', onJobUpdate);

        return () => {
            // CLEANUP: Remove listeners to prevent leaks or double-handling
            socket.off('connect', onConnect);
            socket.off('sanity_update', onSanityUpdate);
            socket.off('task_update', onTaskUpdate);
            socket.off('job_update', onJobUpdate);
            // DO NOT disconnect shared socket
        };
    }, [fetchData]);

    const runSanityCheck = async (startDate: string) => {
        setIsChecking(true);
        try {
            const res = await fetch(`${API_URL}/api/sanity-check/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startTime: startDate })
            });
            const body = await res.json();
            if (body.success) {
                console.log(body.message);
                // Maybe trigger a quick refresh of data too?
            } else {
                alert("Failed to start sanity check: " + body.error);
                setIsChecking(false);
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
            setIsChecking(false);
        }
    };

    return (
        <div className="container mx-auto py-8 text-foreground h-full flex flex-col overflow-hidden">
            <div className="flex flex-col gap-2 mb-8 shrink-0">
                <h1 className="text-3xl font-bold tracking-tight">Data History Management</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    View data availability ranges and running consistency checks.
                </p>
            </div>

            <SanityControls onRunCheck={runSanityCheck} isChecking={isChecking} />

            {activeJob && (
                <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            Job Running: {activeJob.status} ({activeJob.completed}/{activeJob.total} tasks)
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                            {Math.round(activeJob.progress * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, activeJob.progress * 100)}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <p className="text-muted-foreground text-sm">Loading Data History...</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden">
                    <HistoryTreeTable
                        data={data}
                        onCheck={async (symbol, timeframe) => {
                            if (isChecking) {
                                alert("Check already in progress.");
                                return;
                            }
                            setIsChecking(true);

                            // OPTIMISTIC UPDATE: Mark target as CHECKING immediately
                            setData(prev => {
                                const next = [...prev];
                                const symNode = next.find(n => n.key === symbol);
                                if (symNode) {
                                    if (timeframe) {
                                        // Update specific childcare
                                        const tfKey = `${symbol}-${timeframe}`;
                                        const child = symNode.children?.find(c => c.key === tfKey);
                                        if (child) {
                                            child.data = { ...child.data, status: 'CHECKING', message: 'Request sent...' };
                                        }
                                    } else {
                                        // Update Symbol Node checks ALL (Visual feedback on parent?)
                                        symNode.data = { ...symNode.data, status: 'CHECKING', message: 'Request sent...' };
                                    }
                                }
                                return next;
                            });

                            try {
                                const d = new Date();
                                d.setDate(d.getDate() - 7);
                                const startDate = d.toISOString().slice(0, 16);

                                const res = await fetch(`${API_URL}/api/sanity-check/run`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        startTime: startDate,
                                        symbol: symbol,
                                        timeframe: timeframe
                                    })
                                });
                                const body = await res.json();
                                if (!body.success) {
                                    alert("Failed: " + body.error);
                                    setIsChecking(false);
                                }
                            } catch (e) {
                                console.error(e);
                                setIsChecking(false);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
