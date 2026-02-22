(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/trades/TradesPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TradesPanel",
    ()=>TradesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTradeMonitor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useTradeMonitor.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const TradesPanel = ({ onClose })=>{
    _s();
    const { aggregatedTrades, modifyTrade } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTradeMonitor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTradeMonitor"])();
    const [expandedIds, setExpandedIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    // UI Local State for Action Feedback (Key: TradeID-Action)
    const [actionStatus, setActionStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const toggleExpand = (id)=>{
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };
    const handleAction = (trade, action, percent)=>{
        // Direct execution per user request (No Confirmation)
        modifyTrade({
            action,
            tradeId: trade.tradeId,
            percent
        });
    };
    // const displayTrades = showHistory ? historyTrades : aggregatedTrades;
    // const displayTrades = showHistory ? historyTrades : aggregatedTrades;
    // Sort Descending (Newest First) per User Request
    const displayTrades = [
        ...aggregatedTrades
    ].sort((a, b)=>b.openTime - a.openTime);
    // Group trades by Date
    const groupedTrades = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TradesPanel.useMemo[groupedTrades]": ()=>{
            const groups = [];
            const dateMap = new Map();
            displayTrades.forEach({
                "TradesPanel.useMemo[groupedTrades]": (t)=>{
                    const date = t.openTime ? new Date(t.openTime).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : 'Unknown Date';
                    if (!dateMap.has(date)) {
                        dateMap.set(date, []);
                        groups.push({
                            date,
                            trades: dateMap.get(date)
                        });
                    }
                    dateMap.get(date).push(t);
                }
            }["TradesPanel.useMemo[groupedTrades]"]);
            return groups;
        }
    }["TradesPanel.useMemo[groupedTrades]"], [
        displayTrades
    ]);
    const [panelHeight, setPanelHeight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(300);
    const startResizing = (e)=>{
        e.preventDefault(); // Prevent text selection
        const startY = e.clientY;
        const startHeight = panelHeight;
        const onMouseMove = (moveEvent)=>{
            const delta = startY - moveEvent.clientY; // Dragging up increases height
            setPanelHeight(Math.max(150, Math.min(window.innerHeight - 100, startHeight + delta)));
        };
        const onMouseUp = ()=>{
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    // Removed helper to use inline logic
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            height: panelHeight
        },
        className: "bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-bottom duration-200 shadow-2xl relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onMouseDown: startResizing,
                className: "absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/50 transition-colors z-50 group",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto w-12 h-1 bg-slate-600/50 group-hover:bg-blue-400 rounded-full mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                }, void 0, false, {
                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                    lineNumber: 84,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                lineNumber: 80,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-8 bg-slate-100 dark:bg-slate-800 flex items-center justify-between px-2 shrink-0 border-b border-slate-200 dark:border-slate-700/50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-bold text-slate-700 dark:text-slate-300",
                                children: "Active Trades"
                            }, void 0, false, {
                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                lineNumber: 90,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-slate-500",
                                children: [
                                    aggregatedTrades.length,
                                    " Active"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                lineNumber: 93,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                        lineNumber: 89,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            aggregatedTrades.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-slate-500 italic",
                                children: "No active trades"
                            }, void 0, false, {
                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                lineNumber: 98,
                                columnNumber: 55
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                className: "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                    lineNumber: 100,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                lineNumber: 99,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                        lineNumber: 97,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                lineNumber: 88,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full text-left border-collapse",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            className: "bg-white dark:bg-slate-900 text-[10px] text-slate-500 font-mono sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 w-6"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 110,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1",
                                        children: "Time"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 111,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1",
                                        children: "Trade"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 112,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Price"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 114,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "SL"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 115,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "TP"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 116,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Comm"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 117,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Realized"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 118,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Unrealized"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 119,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Plan R"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 120,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Run R"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 121,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-center",
                                        children: "Actions"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                        lineNumber: 122,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                lineNumber: 109,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                            lineNumber: 108,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            className: "text-[11px] text-slate-600 dark:text-slate-300 font-mono",
                            children: groupedTrades.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                colSpan: 12,
                                                className: "bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800",
                                                children: group.date
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                lineNumber: 130,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 129,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        group.trades.map((trade)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: `border-b ${trade.status === 'OFFLINE' ? 'border-slate-200 dark:border-slate-800/20 bg-slate-100/50 dark:bg-slate-900/50 opacity-60' : 'border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30'} transition-colors`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1 text-center cursor-pointer",
                                                                onClick: ()=>toggleExpand(trade.tradeId),
                                                                children: expandedIds.has(trade.tradeId) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                                    size: 12
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 140,
                                                                    columnNumber: 83
                                                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                                    size: 12
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 140,
                                                                    columnNumber: 111
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 139,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1 text-slate-500 dark:text-slate-400",
                                                                children: new Date(trade.openTime).toLocaleTimeString()
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 142,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-center gap-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "font-bold text-slate-900 dark:text-slate-200",
                                                                            children: trade.symbol
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                            lineNumber: 148,
                                                                            columnNumber: 53
                                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: `text-[9px] font-bold px-1 rounded ${trade.direction === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`,
                                                                            children: trade.direction
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                            lineNumber: 150,
                                                                            columnNumber: 53
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 147,
                                                                    columnNumber: 49
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 146,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1 text-right font-bold text-slate-900 dark:text-white",
                                                                children: trade.type || 'MARKET'
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 158,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1 text-right text-slate-900 dark:text-white",
                                                                children: trade.slLabel ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-purple-600 dark:text-purple-400 text-[10px]",
                                                                    children: trade.slLabel
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 163,
                                                                    columnNumber: 66
                                                                }, ("TURBOPACK compile-time value", void 0)) : trade.avgSl > 0 ? trade.avgSl.toFixed(5) : '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 162,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1 text-right text-slate-900 dark:text-white",
                                                                children: trade.tpLabel ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-blue-600 dark:text-blue-400 text-[10px]",
                                                                    children: trade.tpLabel
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 166,
                                                                    columnNumber: 66
                                                                }, ("TURBOPACK compile-time value", void 0)) : trade.avgTp > 0 ? trade.avgTp.toFixed(5) : '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 165,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `p-1 text-right font-bold ${Math.abs(trade.totalCommission || 0) < 0.005 ? 'text-slate-900 dark:text-white' : (trade.totalCommission || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                                                children: (trade.totalCommission || 0).toFixed(2)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 169,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `p-1 text-right font-bold ${Math.abs(trade.realizedPl || 0) < 0.005 ? 'text-slate-900 dark:text-white' : (trade.realizedPl || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                                                children: (trade.realizedPl || 0).toFixed(2)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 173,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: `p-1 text-right font-bold ${Math.abs(trade.unrealizedPl || 0) < 0.005 ? 'text-slate-900 dark:text-white' : (trade.unrealizedPl || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                                                children: (trade.unrealizedPl || 0).toFixed(2)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 176,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1 text-right text-slate-500",
                                                                children: trade.currentRr > 0 ? trade.currentRr.toFixed(2) : '-'
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 180,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1 text-right font-bold text-slate-700 dark:text-slate-300",
                                                                children: (trade.runningRr || 0).toFixed(2)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 181,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "p-1 flex items-center justify-center gap-1",
                                                                children: [
                                                                    {
                                                                        label: 'BE',
                                                                        action: 'SL_BE',
                                                                        title: 'Set SL to Break-Even'
                                                                    },
                                                                    {
                                                                        label: '25%',
                                                                        action: 'CLOSE_PARTIAL',
                                                                        percent: 0.25,
                                                                        title: 'Close 25%'
                                                                    },
                                                                    {
                                                                        label: '50%',
                                                                        action: 'CLOSE_PARTIAL',
                                                                        percent: 0.50,
                                                                        title: 'Close 50%'
                                                                    },
                                                                    {
                                                                        label: '75%',
                                                                        action: 'CLOSE_PARTIAL',
                                                                        percent: 0.75,
                                                                        title: 'Close 75%'
                                                                    },
                                                                    {
                                                                        label: '100%',
                                                                        action: 'CLOSE_PARTIAL',
                                                                        percent: 1.0,
                                                                        title: 'Close All'
                                                                    }
                                                                ].map((btn)=>{
                                                                    const key = `${trade.tradeId}-${btn.action}-${btn.percent || 'FULL'}`;
                                                                    const status = actionStatus[key];
                                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: async ()=>{
                                                                            if (status === 'PENDING') return;
                                                                            setActionStatus((prev)=>({
                                                                                    ...prev,
                                                                                    [key]: 'PENDING'
                                                                                }));
                                                                            const s = await modifyTrade({
                                                                                action: btn.action,
                                                                                tradeId: trade.tradeId,
                                                                                percent: btn.percent
                                                                            });
                                                                            if (s) {
                                                                                setActionStatus((prev)=>({
                                                                                        ...prev,
                                                                                        [key]: 'SUCCESS'
                                                                                    }));
                                                                                setTimeout(()=>setActionStatus((prev)=>{
                                                                                        const n = {
                                                                                            ...prev
                                                                                        };
                                                                                        delete n[key];
                                                                                        return n;
                                                                                    }), 1500);
                                                                            } else {
                                                                                setActionStatus((prev)=>({
                                                                                        ...prev,
                                                                                        [key]: 'ERROR'
                                                                                    }));
                                                                                setTimeout(()=>setActionStatus((prev)=>{
                                                                                        const n = {
                                                                                            ...prev
                                                                                        };
                                                                                        delete n[key];
                                                                                        return n;
                                                                                    }), 2000);
                                                                            }
                                                                        },
                                                                        className: `
                                                                min-w-[32px] h-[20px] text-[9px] font-bold uppercase transition-all flex items-center justify-center
                                                                border border-slate-400 dark:border-slate-600 hover:border-slate-600 dark:hover:border-slate-400
                                                                ${status === 'SUCCESS' ? 'bg-green-600 text-white border-green-500' : ''}
                                                                ${status === 'ERROR' ? 'bg-red-600 text-white border-red-500' : ''}
                                                                ${status === 'PENDING' ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-wait' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}
                                                                rounded-none shadow-sm active:translate-y-[1px]
                                                            `,
                                                                        title: btn.title,
                                                                        children: status === 'PENDING' ? '...' : status === 'SUCCESS' ? '✔' : status === 'ERROR' ? '✖' : btn.label
                                                                    }, key, false, {
                                                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                        lineNumber: 197,
                                                                        columnNumber: 57
                                                                    }, ("TURBOPACK compile-time value", void 0));
                                                                })
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                lineNumber: 185,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                        lineNumber: 138,
                                                        columnNumber: 41
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    expandedIds.has(trade.tradeId) && trade.positions.map((pos, index)=>{
                                                        // DYNAMIC OFFSET HEURISTIC
                                                        // 1. Master Trade Open Time (Local)
                                                        // 2. Position Time (Broker)
                                                        // 3. Diff (rounded to hours) = Broker Offset
                                                        // Warning: This only works if master trade and position are relatively close.
                                                        // If master is old and position is new, drift is small.
                                                        // BUT: We compare `trade.openTime` (db created_at) with `pos.time` (broker time).
                                                        // `pos.time` is usually a few seconds after `trade.openTime`.
                                                        // So `pos.time (seconds) * 1000 - trade.openTime` = Offset + Latency.
                                                        // Offset = Round((posMs - tradeMs) / 3600000) * 3600000.
                                                        let displayTime = "-";
                                                        if (pos.time) {
                                                            const posMs = pos.time * 1000;
                                                            const tradeMs = trade.openTime;
                                                            const diff = posMs - tradeMs;
                                                            // Round to nearest hour (3600000 ms)
                                                            // e.g. Broker UTC+2. Diff approx +7,200,000 ms.
                                                            // If diff is large (>30 mins), it's likely an offset.
                                                            const offsetHours = Math.round(diff / 3600000);
                                                            const offsetMs = offsetHours * 3600000;
                                                            // Corrected Time = BrokerTime - Offset
                                                            const corrected = posMs - offsetMs;
                                                            displayTime = new Date(corrected).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit'
                                                            });
                                                        }
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            className: `bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-500 ${pos.status === 'OFFLINE' ? 'opacity-40 grayscale pointer-events-none' : ''}`,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 261,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 pl-4 text-[10px] text-slate-500 font-mono font-bold",
                                                                    children: pos.status === 'OFFLINE' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-slate-600 font-bold border border-slate-300 dark:border-slate-700 px-1 rounded-[2px]",
                                                                        children: "OFFLINE"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                        lineNumber: 264,
                                                                        columnNumber: 61
                                                                    }, ("TURBOPACK compile-time value", void 0)) : pos.status === 'SENT' && !pos.time ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-amber-500 font-bold animate-pulse",
                                                                        children: "SENT"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                        lineNumber: 267,
                                                                        columnNumber: 65
                                                                    }, ("TURBOPACK compile-time value", void 0)) : displayTime
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 262,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 font-mono font-bold text-slate-900 dark:text-white",
                                                                    children: pos.brokerId
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 273,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-right text-slate-900 dark:text-white",
                                                                    children: (pos.open || 0).toFixed(5)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 275,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-right text-slate-900 dark:text-white",
                                                                    children: (pos.sl || 0).toFixed(5)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 278,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-right text-slate-900 dark:text-white",
                                                                    children: (pos.tp || 0).toFixed(5)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 279,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: `p-1 text-right ${Math.abs(pos.commission || 0) < 0.005 ? 'text-slate-900 dark:text-white' : (pos.commission || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                                                    children: (pos.commission || 0).toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 282,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: `p-1 text-right ${Math.abs(pos.realizedPl || 0) < 0.005 ? 'text-slate-900 dark:text-white' : (pos.realizedPl || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                                                    children: (pos.realizedPl || 0).toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 284,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: `p-1 text-right ${Math.abs(pos.profit || 0) < 0.005 ? 'text-slate-900 dark:text-white' : (pos.profit || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                                                    children: (pos.profit || 0).toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 285,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-right text-slate-900 dark:text-white",
                                                                    children: (()=>{
                                                                        const distSl = Math.abs((pos.open || 0) - (pos.sl || 0));
                                                                        const distTp = Math.abs((pos.tp || 0) - (pos.open || 0));
                                                                        if (distSl > 0 && pos.tp > 0) {
                                                                            return (distTp / distSl).toFixed(2);
                                                                        }
                                                                        return '-';
                                                                    })()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 290,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-right text-slate-900 dark:text-white",
                                                                    children: pos.runningRr !== undefined ? pos.runningRr.toFixed(2) : '-'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 302,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-center"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                                    lineNumber: 306,
                                                                    columnNumber: 53
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, `${pos.botId}-${pos.brokerId}-${index}`, true, {
                                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                            lineNumber: 260,
                                                            columnNumber: 49
                                                        }, ("TURBOPACK compile-time value", void 0));
                                                    })
                                                ]
                                            }, trade.tradeId, true, {
                                                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                                lineNumber: 136,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    ]
                                }, group.date, true, {
                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                    lineNumber: 127,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                            lineNumber: 125,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tfoot", {
                            className: "bg-slate-50 dark:bg-slate-900 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 sticky bottom-0 z-10 shadow-[0_-1px_0_theme(colors.slate.300)] dark:shadow-[0_-1px_0_theme(colors.slate.700)]",
                            children: (()=>{
                                const totals = displayTrades.reduce((acc, t)=>({
                                        comm: acc.comm + (t.totalCommission || 0),
                                        realized: acc.realized + (t.realizedPl || 0),
                                        unrealized: acc.unrealized + (t.unrealizedPl || 0)
                                    }), {
                                    comm: 0,
                                    realized: 0,
                                    unrealized: 0
                                });
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 325,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2 text-slate-500 uppercase tracking-wider text-[10px]",
                                            children: "Total"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 326,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 327,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 328,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 329,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 330,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: `p-2 text-right ${Math.abs(totals.comm) < 0.005 ? 'text-slate-500' : totals.comm > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                            children: totals.comm.toFixed(2)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 333,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: `p-2 text-right ${Math.abs(totals.realized) < 0.005 ? 'text-slate-500' : totals.realized > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                            children: totals.realized.toFixed(2)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 338,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: `p-2 text-right ${Math.abs(totals.unrealized) < 0.005 ? 'text-slate-500' : totals.unrealized > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                            children: totals.unrealized.toFixed(2)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 343,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 347,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 348,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                            lineNumber: 349,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                                    lineNumber: 324,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0));
                            })()
                        }, void 0, false, {
                            fileName: "[project]/src/components/trades/TradesPanel.tsx",
                            lineNumber: 315,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/trades/TradesPanel.tsx",
                    lineNumber: 107,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/trades/TradesPanel.tsx",
                lineNumber: 106,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/trades/TradesPanel.tsx",
        lineNumber: 75,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(TradesPanel, "ZRryMVqFgRvvda0E4Wm1vmv3B0c=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useTradeMonitor$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTradeMonitor"]
    ];
});
_c = TradesPanel;
var _c;
__turbopack_context__.k.register(_c, "TradesPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/trades/HistoryPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HistoryPanel",
    ()=>HistoryPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const HistoryPanel = ({ onClose })=>{
    _s();
    const isTestMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])({
        "HistoryPanel.useWorkspaceStore[isTestMode]": (state)=>state.isTestMode
    }["HistoryPanel.useWorkspaceStore[isTestMode]"]);
    const [trades, setTrades] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [expandedIds, setExpandedIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const toggleExpand = (id)=>{
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };
    const loadHistory = async ()=>{
        setIsLoading(true);
        try {
            const envParam = isTestMode ? 'test' : 'live';
            const res = await fetch(`http://localhost:3005/api/trade-history?limit=50&env=${envParam}`);
            const body = await res.json();
            if (body.success) {
                const mapped = body.history.map((h)=>({
                        tradeId: h.id,
                        symbol: h.symbol,
                        direction: h.direction === 1 ? 'BUY' : 'SELL',
                        active: false,
                        status: 'CLOSED',
                        openTime: h.open_time,
                        closeTime: h.close_time,
                        entryPrice: h.entry_price,
                        exitPrice: h.exit_price,
                        activePrice: h.exit_price,
                        volume: h.volume,
                        realizedPl: h.profit,
                        commission: h.commission,
                        swap: h.swap,
                        positions: (h.positions || []).map((p)=>({
                                id: p.id,
                                brokerId: p.broker_id,
                                botId: p.bot_id,
                                status: p.status,
                                realizedPl: p.realized_pl,
                                commission: p.commission,
                                swap: p.swap,
                                entryPrice: p.entry_price || h.entry_price,
                                currentPrice: p.exit_price || h.exit_price,
                                volume: p.volume
                            })),
                        botId: 'HISTORY',
                        brokerId: 'HISTORY',
                        unrealizedPl: 0,
                        runningRr: 0,
                        currentRr: 0,
                        sl: 0,
                        tp: 0,
                        avgPrice: h.exit_price || 0,
                        strategy: h.strategy,
                        entryLabel: 'Market'
                    }));
                setTrades(mapped);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        } finally{
            setIsLoading(false);
        }
    };
    // Reload when Environment Toggles or Mounts
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HistoryPanel.useEffect": ()=>{
            loadHistory();
        }
    }["HistoryPanel.useEffect"], [
        isTestMode
    ]);
    const [panelHeight, setPanelHeight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(300);
    const startResizing = (e)=>{
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = panelHeight;
        const onMouseMove = (moveEvent)=>{
            const delta = startY - moveEvent.clientY;
            setPanelHeight(Math.max(150, Math.min(window.innerHeight - 100, startHeight + delta)));
        };
        const onMouseUp = ()=>{
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    // Group trades by Date
    const groupedTrades = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HistoryPanel.useMemo[groupedTrades]": ()=>{
            const groups = [];
            const dateMap = new Map();
            trades.forEach({
                "HistoryPanel.useMemo[groupedTrades]": (t)=>{
                    const date = t.openTime ? new Date(t.openTime).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : 'Unknown Date';
                    if (!dateMap.has(date)) {
                        dateMap.set(date, []);
                        groups.push({
                            date,
                            trades: dateMap.get(date)
                        });
                    }
                    dateMap.get(date).push(t);
                }
            }["HistoryPanel.useMemo[groupedTrades]"]);
            return groups;
        }
    }["HistoryPanel.useMemo[groupedTrades]"], [
        trades
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            height: panelHeight
        },
        className: "bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-bottom duration-200 shadow-2xl relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onMouseDown: startResizing,
                className: "absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/50 transition-colors z-50 group",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-slate-600 group-hover:bg-blue-400 rounded-b opacity-0 group-hover:opacity-100 transition-opacity"
                }, void 0, false, {
                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                    lineNumber: 132,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                lineNumber: 128,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-8 bg-slate-100 dark:bg-slate-800 flex items-center justify-between px-2 shrink-0 border-b border-slate-200 dark:border-slate-700/50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-bold text-slate-700 dark:text-slate-300",
                                children: [
                                    "Trade History (",
                                    isTestMode ? 'TEST' : 'LIVE',
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                lineNumber: 138,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-slate-500",
                                children: [
                                    trades.length,
                                    " Closed"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                lineNumber: 141,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                        lineNumber: 137,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            trades.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-slate-500 italic",
                                children: "No closed trades"
                            }, void 0, false, {
                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                lineNumber: 146,
                                columnNumber: 45
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                className: "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                    lineNumber: 148,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                lineNumber: 147,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                        lineNumber: 145,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                lineNumber: 136,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-auto custom-scrollbar",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full border-collapse",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            className: "bg-white dark:bg-slate-900 sticky top-0 z-20 text-[10px] text-slate-500 font-mono uppercase tracking-wider shadow-sm",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 w-6"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 158,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-left",
                                        children: "Time"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 159,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-left",
                                        children: "Symbol"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 160,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Type"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 161,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Entry"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 162,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Exit"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 163,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Comm"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 164,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Swap"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 165,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 text-right",
                                        children: "Realized"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 166,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-1 w-8"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 167,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                lineNumber: 157,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                            lineNumber: 156,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            className: "text-[11px] text-slate-600 dark:text-slate-300 font-mono",
                            children: [
                                groupedTrades.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    colSpan: 10,
                                                    className: "bg-slate-100/80 dark:bg-slate-800/80 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800",
                                                    children: group.date
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                    lineNumber: 175,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                lineNumber: 174,
                                                columnNumber: 33
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            group.trades.map((trade)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            className: "border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-center cursor-pointer",
                                                                    onClick: ()=>toggleExpand(trade.tradeId),
                                                                    children: expandedIds.has(trade.tradeId) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                                        size: 12
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 184,
                                                                        columnNumber: 83
                                                                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                                        size: 12
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 184,
                                                                        columnNumber: 111
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 183,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-slate-500 dark:text-slate-400",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-slate-900 dark:text-white font-bold",
                                                                        children: trade.openTime ? new Date(trade.openTime).toLocaleTimeString() : '-'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 188,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 186,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex items-center gap-1",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "font-bold text-slate-900 dark:text-slate-200",
                                                                                children: trade.symbol
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                                lineNumber: 192,
                                                                                columnNumber: 53
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: `text-[9px] font-bold px-1 rounded ${trade.direction === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`,
                                                                                children: trade.direction
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                                lineNumber: 193,
                                                                                columnNumber: 53
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 191,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 190,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-right font-bold text-slate-900 dark:text-white",
                                                                    children: "Market"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 198,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-right text-slate-900 dark:text-white",
                                                                    children: trade.entryPrice || 0
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 199,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-right text-slate-900 dark:text-white",
                                                                    children: trade.exitPrice || 0
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 200,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: `p-1 text-right font-bold ${(trade.commission || 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`,
                                                                    children: (trade.commission || 0).toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 201,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: `p-1 text-right font-bold ${(trade.swap || 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`,
                                                                    children: (trade.swap || 0).toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 204,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: `p-1 text-right font-bold ${Math.abs(trade.realizedPl || 0) < 0.005 ? 'text-slate-900 dark:text-white' : (trade.realizedPl || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                                                    children: (trade.realizedPl || 0).toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 207,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "p-1 text-center",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-[10px] text-slate-600",
                                                                        children: "CLOSED"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 211,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                    lineNumber: 210,
                                                                    columnNumber: 45
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                            lineNumber: 182,
                                                            columnNumber: 41
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        expandedIds.has(trade.tradeId) && trade.positions.map((child)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                className: `bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/30 text-[10px] text-slate-500 ${child.status === 'OFFLINE' ? 'opacity-40 grayscale' : ''}`,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 217,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 pl-4 flex items-center gap-1",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "w-1.5 h-1.5 rounded-full bg-slate-600"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                                lineNumber: 219,
                                                                                columnNumber: 53
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            child.botId
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 218,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 text-left",
                                                                        children: child.brokerId
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 222,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 text-right",
                                                                        children: trade.direction
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 223,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 text-right",
                                                                        children: child.entryPrice?.toFixed(5)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 224,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 text-right",
                                                                        children: child.currentPrice?.toFixed(5)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 225,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 text-right",
                                                                        children: (child.commission || 0).toFixed(2)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 226,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 text-right",
                                                                        children: (child.swap || 0).toFixed(2)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 227,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 text-right font-mono text-slate-400",
                                                                        children: (child.realizedPl || 0).toFixed(2)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 228,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "p-1 text-center text-[9px]",
                                                                        children: child.status === 'OFFLINE' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-slate-500 border border-slate-300 dark:border-slate-700 px-1 rounded-[2px]",
                                                                            children: "OFFLINE"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                            lineNumber: 231,
                                                                            columnNumber: 57
                                                                        }, ("TURBOPACK compile-time value", void 0)) : child.status
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                        lineNumber: 229,
                                                                        columnNumber: 49
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, child.id, true, {
                                                                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                                lineNumber: 216,
                                                                columnNumber: 45
                                                            }, ("TURBOPACK compile-time value", void 0)))
                                                    ]
                                                }, trade.tradeId, true, {
                                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                                    lineNumber: 181,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0)))
                                        ]
                                    }, group.date, true, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 172,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))),
                                trades.length === 0 && !isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        colSpan: 10,
                                        className: "p-8 text-center text-slate-500 italic",
                                        children: [
                                            "No closed trades found for ",
                                            isTestMode ? 'TEST' : 'LIVE',
                                            " environment."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                        lineNumber: 244,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                    lineNumber: 243,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                            lineNumber: 170,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tfoot", {
                            className: "bg-slate-50 dark:bg-slate-900 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 sticky bottom-0 z-10 shadow-[0_-1px_0_theme(colors.slate.300)] dark:shadow-[0_-1px_0_theme(colors.slate.700)]",
                            children: (()=>{
                                const totals = trades.reduce((acc, t)=>({
                                        comm: acc.comm + (t.commission || 0),
                                        swap: acc.swap + (t.swap || 0),
                                        realized: acc.realized + (t.realizedPl || 0)
                                    }), {
                                    comm: 0,
                                    swap: 0,
                                    realized: 0
                                });
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 260,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2 text-slate-500 uppercase tracking-wider text-[10px]",
                                            children: "Total"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 261,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 262,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 263,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 264,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 265,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: `p-2 text-right ${Math.abs(totals.comm) < 0.005 ? 'text-slate-500' : totals.comm > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                            children: totals.comm.toFixed(2)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 268,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: `p-2 text-right ${Math.abs(totals.swap) < 0.005 ? 'text-slate-500' : totals.swap > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                            children: totals.swap.toFixed(2)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 273,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: `p-2 text-right ${Math.abs(totals.realized) < 0.005 ? 'text-slate-500' : totals.realized > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`,
                                            children: totals.realized.toFixed(2)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 278,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                            lineNumber: 282,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                                    lineNumber: 259,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0));
                            })()
                        }, void 0, false, {
                            fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                            lineNumber: 250,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                    lineNumber: 155,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/trades/HistoryPanel.tsx",
                lineNumber: 154,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/trades/HistoryPanel.tsx",
        lineNumber: 123,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(HistoryPanel, "AQ/2wZ4/rSKbtSio09KmGP2W6pY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"]
    ];
});
_c = HistoryPanel;
var _c;
__turbopack_context__.k.register(_c, "HistoryPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_trades_5d83643c._.js.map