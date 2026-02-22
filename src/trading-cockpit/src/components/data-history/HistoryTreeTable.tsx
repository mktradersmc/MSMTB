"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Database, Clock } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface HistoryNode {
    key: string;
    data: {
        name: string;
        type: 'symbol' | 'timeframe';
        min?: number; // timestamp
        max?: number; // timestamp
        count?: number;
        status?: string; // 'CHECKING' | 'RESOLVING' | 'OK' | 'ERROR' | 'INCOMPLETE'
        message?: string;
    };
    children?: HistoryNode[];
}

interface HistoryTreeTableProps {
    data: HistoryNode[];
    onCheck?: (symbol: string, timeframe?: string) => void;
}

export function HistoryTreeTable({ data, onCheck }: HistoryTreeTableProps) {
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    const toggleExpand = (key: string) => {
        const newExpanded = new Set(expandedKeys);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedKeys(newExpanded);
    };

    const formatDate = (ts?: number) => {
        if (!ts || ts === 0) return "-";
        return new Date(ts).toLocaleString();
    };

    const renderStatus = (status?: string) => {
        if (!status) return <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground border-gray-200 dark:border-gray-700 text-gray-500">Idle</span>;

        const badgeClass = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground ";

        switch (status) {
            case 'CHECKING':
                return <span className={cn(badgeClass, "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 animate-pulse")}>Checking...</span>;
            case 'RESOLVING':
                return <span className={cn(badgeClass, "border-transparent bg-red-100 text-red-900 hover:bg-red-100/80 animate-pulse")}>Resolving...</span>;
            case 'OK':
                return <span className={cn(badgeClass, "border-transparent bg-green-500/10 text-green-600 border-green-500/20")}>OK</span>;
            case 'INCOMPLETE':
                return <span className={cn(badgeClass, "border-transparent bg-red-500 text-white hover:bg-red-500/80")}>Incomplete</span>;
            case 'ERROR':
                return <span className={cn(badgeClass, "border-transparent bg-red-900 text-white hover:bg-red-900/80")}>Error</span>;
            case 'OFFLINE':
                return <span className={cn(badgeClass, "border-transparent bg-gray-500 text-white hover:bg-gray-600")}>Offline</span>;
            default:
                return <span className={cn(badgeClass, "text-foreground")}>{status}</span>;
        }
    };

    const renderRow = (node: HistoryNode, level: number = 0) => {
        const isExpanded = expandedKeys.has(node.key);
        const hasChildren = node.children && node.children.length > 0;
        const isSymbol = node.data.type === 'symbol';

        return (
            <React.Fragment key={node.key}>
                <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", isSymbol ? "bg-gray-50/20 dark:bg-gray-800/20 hover:bg-gray-100/30" : "")}>
                    <td className="p-2 align-middle [&:has([role=checkbox])]:pr-0 font-medium">
                        <div
                            className="flex items-center gap-2 cursor-pointer select-none"
                            style={{ paddingLeft: `${level * 1.5}rem` }}
                            onClick={() => hasChildren && toggleExpand(node.key)}
                        >
                            {hasChildren ? (
                                isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />
                            ) : (
                                <span className="w-4" /> // spacer
                            )}

                            {isSymbol ? (
                                <Database className="h-4 w-4 text-primary" />
                            ) : (
                                <Clock className="h-3 w-3 text-gray-500" />
                            )}

                            <span className={cn(isSymbol ? "font-semibold" : "text-gray-500")}>
                                {node.data.name}
                            </span>
                        </div>
                    </td>
                    <td className="p-2 align-middle [&:has([role=checkbox])]:pr-0">{formatDate(node.data.min)}</td>
                    <td className="p-2 align-middle [&:has([role=checkbox])]:pr-0">{formatDate(node.data.max)}</td>
                    <td className="p-2 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="flex items-center gap-2">
                            {renderStatus(node.data.status)}
                            {node.data.message && (
                                <span className="text-xs text-gray-500 truncate max-w-[200px]" title={node.data.message}>
                                    {node.data.message}
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="p-2 align-middle [&:has([role=checkbox])]:pr-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onCheck) {
                                    if (isSymbol) onCheck(node.key);
                                    else {
                                        const parts = node.key.split('-');
                                        const tf = parts.pop();
                                        const sym = parts.join('-');
                                        onCheck(sym, tf);
                                    }
                                }
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            title={isSymbol ? "Check All Timeframes" : "Check This Timeframe"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-4 h-4 text-primary"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </button>
                    </td>
                </tr>

                {isExpanded && node.children?.map(child => renderRow(child, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E222D] h-full flex flex-col">
            <div className="w-full h-full overflow-auto">
                <table className="w-full caption-bottom text-sm relative">
                    <thead className="[&_tr]:border-b sticky top-0 bg-white dark:bg-[#1E222D] z-10 shadow-sm">
                        <tr className="border-b border-gray-200 dark:border-gray-800 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[300px]">Symbol / Timeframe</th>
                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Date From</th>
                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Date To</th>
                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[80px]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-2 align-middle [&:has([role=checkbox])]:pr-0 h-24 text-center">
                                    No data available.
                                </td>
                            </tr>
                        ) : (
                            data.map(node => renderRow(node))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
