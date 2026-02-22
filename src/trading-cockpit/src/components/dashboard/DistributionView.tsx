import React, { useState, useEffect, useMemo } from 'react';
import { Share2, Save, RefreshCw, Layers, Activity, CheckCircle2, ChevronDown, ChevronRight, X, Download } from 'lucide-react';
import { fetchDirect, fetchSystem } from '../../lib/client-api';

interface DistributionConfig {
    brokers: {
        [brokerId: string]: {
            loop_size: number;
            matrix: { [step: string]: string[]; }
        }
    };
    test_brokers?: {
        [brokerId: string]: {
            loop_size: number;
            matrix: { [step: string]: string[]; }
        }
    };
}

export function DistributionView() {
    const [config, setConfig] = useState<DistributionConfig>({ brokers: {} });
    const [accounts, setAccounts] = useState<any[]>([]);
    const [brokers, setBrokers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedBrokerId, setExpandedBrokerId] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isTestMode, setIsTestMode] = useState(false); // New Toggle
    const [updateAvailable, setUpdateAvailable] = useState<{ hasUpdate: boolean, lastDeployed: number, available: number, updatedFiles: string[] } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadData();
        checkUpdates();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [confRes, accRes, brokerRes] = await Promise.all([
                fetchDirect('/distribution/config'),
                fetchDirect('/accounts'),
                fetchDirect('/brokers')
            ]);

            if (confRes.ok) setConfig(await confRes.json());
            if (accRes.ok) {
                const accData = await accRes.json();
                setAccounts(Array.isArray(accData) ? accData : (accData?.accounts || []));
            }
            if (brokerRes.ok) setBrokers(await brokerRes.json());

        } catch (e) {
            console.error("Failed to load distribution data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const getGroupConfig = (cfg: DistributionConfig, test: boolean) => {
        return test ? (cfg.test_brokers || {}) : cfg.brokers;
    };

    const handleSave = async () => {
        // Clean up stale account IDs
        const validAccountIds = new Set(accounts.map(a => a.id));
        const cleanedConfig = { ...config };

        // Ensure roots exist
        if (!cleanedConfig.brokers) cleanedConfig.brokers = {};
        if (!cleanedConfig.test_brokers) cleanedConfig.test_brokers = {};

        // Determine target map based on current mode (we auto-generate for the CURRENT mode)
        const targetMap = isTestMode ? cleanedConfig.test_brokers : cleanedConfig.brokers;

        // 1. Auto-Generate Defaults if missing
        activeBrokers.forEach(broker => {
            if (!targetMap[broker.id]) {
                // Filter accounts for this broker AND mode
                const brokerAccounts = accounts.filter(a =>
                    a.brokerId === broker.id &&
                    (a.accountType === 'TRADING' || !a.isDatafeed) &&
                    (isTestMode ? a.isTest : !a.isTest)
                );

                const N = brokerAccounts.length;

                if (N > 0) {
                    const defaultMatrix: Record<string, string[]> = {};
                    brokerAccounts.forEach((acc, idx) => {
                        defaultMatrix[String(idx + 1)] = [acc.id];
                    });

                    targetMap[broker.id] = {
                        loop_size: N,
                        matrix: defaultMatrix
                    };
                    console.log(`[DistributionView] Auto-generated default matrix for ${broker.name} (${isTestMode ? 'TEST' : 'LIVE'})`);
                }
            }
        });

        // 2. Clean existing matrices (Both Live and Test)
        [cleanedConfig.brokers, cleanedConfig.test_brokers].forEach(map => {
            if (!map) return;
            Object.keys(map).forEach(brokerId => {
                const matrix = map[brokerId].matrix;
                Object.keys(matrix).forEach(step => {
                    matrix[step] = matrix[step].filter(id => validAccountIds.has(id));
                });
            });
        });

        try {
            const res = await fetchDirect('/distribution/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedConfig)
            });
            if (res.ok) {
                setConfig(cleanedConfig);
                setStatusMsg({ type: 'success', text: "Matrix saved and cleaned successfully!" });
                setTimeout(() => setStatusMsg(null), 3000);
            }
        } catch (e) {
            setStatusMsg({ type: 'error', text: "Failed to save matrix." });
        }
    };

    const checkUpdates = async () => {
        try {
            const res = await fetchSystem('/system/check-updates');
            const data = await res.json();
            setUpdateAvailable(data);
        } catch (e) { }
    };



    const toggleBroker = (brokerId: string) => {
        setExpandedBrokerId(expandedBrokerId === brokerId ? null : brokerId);
    };

    const updateMatrix = (brokerId: string, step: string, accountId: string) => {
        setConfig(prev => {
            const isTest = isTestMode;
            const targetRoot = isTest ? 'test_brokers' : 'brokers';

            // Get current section safely
            const currentMap = { ...(isTest ? (prev.test_brokers || {}) : prev.brokers) };
            const currentBroker = currentMap[brokerId] || { loop_size: 1, matrix: {} };
            const currentStepAccs = currentBroker.matrix[step] || [];

            const nextStepAccs = currentStepAccs.includes(accountId)
                ? currentStepAccs.filter(id => id !== accountId)
                : [...currentStepAccs, accountId];

            const updatedMap = {
                ...currentMap,
                [brokerId]: {
                    ...currentBroker,
                    matrix: {
                        ...currentBroker.matrix,
                        [step]: nextStepAccs
                    }
                }
            };

            return {
                ...prev,
                [targetRoot]: updatedMap
            };
        });
    };

    // Filter brokers that have at least one valid account for current mode
    const activeBrokers = useMemo(() => {
        if (!Array.isArray(accounts)) return [];
        return brokers.filter(broker =>
            accounts.some(acc =>
                acc.brokerId === broker.id &&
                (acc.accountType === 'TRADING' || !acc.isDatafeed) &&
                (isTestMode ? acc.isTest : !acc.isTest)
            )
        );
    }, [brokers, accounts, isTestMode]);

    const renderMatrix = (brokerId: string) => {
        // Filter Accounts for this Broker AND Mode
        const brokerAccounts = accounts.filter(a =>
            a.brokerId === brokerId &&
            (a.accountType === 'TRADING' || !a.isDatafeed) &&
            (isTestMode ? a.isTest : !a.isTest)
        );

        // Get Config Logic
        const brokerConfig = (isTestMode ? config.test_brokers : config.brokers)?.[brokerId];

        const N = brokerAccounts.length;
        const matrix = brokerConfig?.matrix || {};

        if (N === 0) {
            return <div className="p-4 text-slate-500 italic text-center">No {isTestMode ? 'Test' : 'Live'} Accounts for this broker.</div>
        }

        return (
            <div className="mt-4 border border-slate-300 dark:border-slate-700 rounded-sm overflow-hidden bg-slate-50 dark:bg-slate-950/40 animate-in slide-in-from-top-2 duration-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800/50">
                                <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-300 dark:border-slate-700 sticky left-0 z-10 bg-slate-100 dark:bg-slate-800/80 backdrop-blur-sm min-w-[200px]">Trading Account</th>
                                {Array.from({ length: N }).map((_, i) => (
                                    <th key={i} className="p-3 text-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider min-w-[80px] border-r border-slate-300 dark:border-slate-700">
                                        Trade {i + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {brokerAccounts.map((acc, rowIndex) => (
                                <tr key={acc.id} className="border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-3 border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate flex items-center gap-2">
                                                {acc.accountName || 'Login ' + acc.login}
                                                {acc.isTest && <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-500 px-1 rounded-sm">TEST</span>}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500">{acc.login}</span>
                                        </div>
                                    </td>
                                    {Array.from({ length: N }).map((_, colIndex) => {
                                        const step = String(colIndex + 1);
                                        const isChecked = brokerConfig
                                            ? (matrix[step]?.includes(acc.id) || false)
                                            : rowIndex === colIndex;

                                        return (
                                            <td key={colIndex} className="p-1 border-r border-slate-200 dark:border-slate-700 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (!brokerConfig) {
                                                            // Initialize Logic (unchanged concept, just updated path)
                                                            const initMatrix: any = {};
                                                            brokerAccounts.forEach((fa, idx) => {
                                                                initMatrix[String(idx + 1)] = [fa.id];
                                                            });

                                                            const currentAccsInStep = initMatrix[step] || [];
                                                            const nextStepAccs = currentAccsInStep.includes(acc.id)
                                                                ? currentAccsInStep.filter((id: string) => id !== acc.id)
                                                                : [...currentAccsInStep, acc.id];

                                                            // Create initial broker entry in correct map
                                                            setConfig(prev => {
                                                                const isTest = isTestMode;
                                                                const targetRoot = isTest ? 'test_brokers' : 'brokers';
                                                                const currentMap = isTest ? (prev.test_brokers || {}) : prev.brokers;

                                                                return {
                                                                    ...prev,
                                                                    [targetRoot]: {
                                                                        ...currentMap,
                                                                        [brokerId]: {
                                                                            loop_size: N,
                                                                            matrix: { ...initMatrix, [step]: nextStepAccs }
                                                                        }
                                                                    }
                                                                };
                                                            });
                                                        } else {
                                                            updateMatrix(brokerId, step, acc.id);
                                                            // Auto-grow loop size if needed
                                                            if (brokerConfig.loop_size < N) {
                                                                setConfig(prev => {
                                                                    const isTest = isTestMode;
                                                                    const targetRoot = isTest ? 'test_brokers' : 'brokers';
                                                                    const currentMap = isTest ? (prev.test_brokers || {}) : prev.brokers;

                                                                    return {
                                                                        ...prev,
                                                                        [targetRoot]: {
                                                                            ...currentMap,
                                                                            [brokerId]: { ...currentMap[brokerId], loop_size: N }
                                                                        }
                                                                    };
                                                                });
                                                            }
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-full h-8 rounded flex items-center justify-center transition-all font-bold text-sm",
                                                        isChecked
                                                            ? (isTestMode
                                                                ? "bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                                : "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                                            )
                                                            : "bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-transparent text-slate-400 dark:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-500"
                                                    )}
                                                >
                                                    {isChecked ? 'X' : ''}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-[10px] border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 italic">
                        <Activity size={12} className={isTestMode ? "text-amber-500" : "text-emerald-500"} />
                        Sequence through Trade 1 to {N}
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <RefreshCw className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="h-20 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Share2 size={20} className={isTestMode ? "text-amber-500" : "text-indigo-600 dark:text-indigo-400"} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            Trade Distribution
                            {isTestMode && <span className="text-[10px] ml-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Test Mode</span>}
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Configure {isTestMode ? 'TEST' : 'LIVE'} execution matrix</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">


                    {/* MODE TOGGLE */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setIsTestMode(false)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                !isTestMode ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            LIVE
                        </button>
                        <button
                            onClick={() => setIsTestMode(true)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                isTestMode ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            TEST
                        </button>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2"></div>

                    {statusMsg && (
                        <div className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-right-4",
                            statusMsg.type === 'success' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        )}>
                            {statusMsg.text}
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        className={cn(
                            "text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg active:scale-95 text-sm",
                            isTestMode
                                ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
                                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                        )}
                    >
                        <Save size={18} /> Save All
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {activeBrokers.length > 0 ? activeBrokers.map(broker => {
                    const isExpanded = expandedBrokerId === broker.id;
                    const brokerAccCount = accounts.filter(a =>
                        a.brokerId === broker.id &&
                        (a.accountType === 'TRADING' || !a.isDatafeed) &&
                        (isTestMode ? a.isTest : !a.isTest)
                    ).length;

                    // Stripe Color Logic
                    const borderColorClass = isTestMode
                        ? 'border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                        : 'border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10';

                    return (
                        <div key={broker.id} className={cn(
                            "border-l-4 rounded-r-lg transition-all duration-300 relative",
                            isExpanded
                                ? (isTestMode ? "bg-white dark:bg-slate-900 border-amber-500 shadow-xl my-4" : "bg-white dark:bg-slate-900 border-indigo-500 shadow-xl my-4")
                                : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 cursor-pointer shadow-sm hover:shadow-md ${borderColorClass}`
                        )} onClick={() => !isExpanded && toggleBroker(broker.id)}>

                            {/* Card Header (Collapsed or Expanded) */}
                            <div className={cn("flex items-center justify-between", isExpanded && "px-6 pt-6 mb-6")}>
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center font-bold text-base shadow-md transition-colors shrink-0",
                                        isTestMode ? "bg-amber-500 text-white shadow-amber-500/20" : "bg-indigo-500 text-white shadow-indigo-500/20"
                                    )}>
                                        {broker.shorthand.substring(0, 2)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{broker.name}</h3>
                                            {isExpanded && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold">Configuration</span>}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                                <Layers size={14} className={isTestMode ? "text-amber-500" : "text-indigo-500"} />
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{brokerAccCount}</span> Accounts
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isExpanded && (
                                        <button onClick={(e) => { e.stopPropagation(); toggleBroker(broker.id); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                                            <X size={20} />
                                        </button>
                                    )}
                                    {!isExpanded && <ChevronRight className="text-slate-400 dark:text-slate-700" />}
                                </div>
                            </div>

                            {/* Inner Content (Matrix) */}
                            {isExpanded && <div className="px-6 pb-6 animate-in fade-in zoom-in-95 duration-200">
                                {renderMatrix(broker.id)}
                            </div>}
                        </div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-600 bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                        <Layers size={48} className="opacity-20 mb-4" />
                        <p className="font-medium">No {isTestMode ? 'Test' : 'Live'} Brokers Configured</p>
                        <p className="text-xs mt-1 text-slate-400">Add accounts in the Accounts view to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}



function cn(...classes: (string | undefined | null | boolean)[]) {
    return classes.filter(Boolean).join(" ");
}
