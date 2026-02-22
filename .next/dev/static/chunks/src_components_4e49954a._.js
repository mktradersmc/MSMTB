(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/MessageCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MessageCard",
    ()=>MessageCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$arrow$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-arrow-up.js [app-client] (ecmascript) <export default as ArrowUpCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$arrow$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-arrow-down.js [app-client] (ecmascript) <export default as ArrowDownCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/activity.js [app-client] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
;
;
// Fallback utility if @/lib/utils is missing (common in initialized projects)
function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}
const MessageCard = ({ message })=>{
    const { type, content, timestamp, symbol } = message;
    const isSetup = type === 'TradingSetup';
    // Extract details
    const strategy = content.strategy || 'Unknown Strategy';
    const status = content.status || ''; // Long / Short
    const isLong = status.toLowerCase() === 'long' || content.direction === 'BUY' || content.direction === 'Long';
    const isShort = status.toLowerCase() === 'short' || content.direction === 'SELL' || content.direction === 'Short';
    const description = content.description || JSON.stringify(content);
    // Format Time
    const timeString = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    // Status Badge Logic
    const getBadgeColor = ()=>{
        if (isLong) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (isShort) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };
    const StatusIcon = isLong ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$arrow$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpCircle$3e$__["ArrowUpCircle"] : isShort ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$arrow$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDownCircle$3e$__["ArrowDownCircle"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-4 shadow-lg transition-all hover:shadow-xl hover:border-slate-600 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            }, void 0, false, {
                fileName: "[project]/src/components/MessageCard.tsx",
                lineNumber: 42,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative flex justify-between items-start",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: classNames("p-2 rounded-lg border", getBadgeColor()),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusIcon, {
                                    size: 20
                                }, void 0, false, {
                                    fileName: "[project]/src/components/MessageCard.tsx",
                                    lineNumber: 49,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/MessageCard.tsx",
                                lineNumber: 48,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-slate-100 font-bold text-lg tracking-tight",
                                        children: symbol || 'Unknown'
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/MessageCard.tsx",
                                        lineNumber: 52,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 text-xs text-slate-400",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                                size: 12
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/MessageCard.tsx",
                                                lineNumber: 54,
                                                columnNumber: 29
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono",
                                                children: timeString
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/MessageCard.tsx",
                                                lineNumber: 55,
                                                columnNumber: 29
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-1 h-1 rounded-full bg-slate-600"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/MessageCard.tsx",
                                                lineNumber: 56,
                                                columnNumber: 29
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: message.botId
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/MessageCard.tsx",
                                                lineNumber: 57,
                                                columnNumber: 29
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/MessageCard.tsx",
                                        lineNumber: 53,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    (message.environment === 'BACKTEST' || message.environment === 'TEST') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20",
                                        children: "STRATEGY TESTER"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/MessageCard.tsx",
                                        lineNumber: 61,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/MessageCard.tsx",
                                lineNumber: 51,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/MessageCard.tsx",
                        lineNumber: 47,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: classNames("px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border backdrop-blur-md", getBadgeColor()),
                        children: status || type
                    }, void 0, false, {
                        fileName: "[project]/src/components/MessageCard.tsx",
                        lineNumber: 69,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/MessageCard.tsx",
                lineNumber: 44,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 pl-[3.25rem]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm font-medium text-slate-300 mb-1",
                        children: strategy
                    }, void 0, false, {
                        fileName: "[project]/src/components/MessageCard.tsx",
                        lineNumber: 76,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-slate-500 leading-relaxed font-mono line-clamp-3",
                        children: isSetup ? description.replace(/,/g, '\n') : JSON.stringify(content, null, 2)
                    }, void 0, false, {
                        fileName: "[project]/src/components/MessageCard.tsx",
                        lineNumber: 77,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/MessageCard.tsx",
                lineNumber: 75,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/MessageCard.tsx",
        lineNumber: 39,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_c = MessageCard;
var _c;
__turbopack_context__.k.register(_c, "MessageCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/ColorPalettePicker.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ColorPalettePicker",
    ()=>ColorPalettePicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
// --- CONSTANTS (Exact TradingView Palette) ---
// 1. Grayscale Row (10 Steps)
const TRADINGVIEW_GRAYSCALE = [
    '#FFFFFF',
    '#D9D9D9',
    '#B7B7B7',
    '#929292',
    '#737373',
    '#525252',
    '#3F3F3F',
    '#2B2B2B',
    '#0D0D0D',
    '#000000'
];
// 2. Base Hues Row (Vibrant)
const TRADINGVIEW_BASE_HUES = [
    '#D44E4D',
    '#EC9D3B',
    '#F1E452',
    '#6EB059',
    '#56967D',
    '#68C1D3',
    '#4E6CF3',
    '#6B40B7',
    '#9231AA',
    '#CD3F63'
];
// 3. Shade Matrix (6 Rows x 10 Cols)
const COLOR_GRID = [
    // Row 1
    [
        '#F1D4D3',
        '#F9E5C3',
        '#FBF8C9',
        '#D5E9CE',
        '#CFE5DD',
        '#D3EBF1',
        '#CFD9FB',
        '#D5CEE8',
        '#DEC7E6',
        '#ECC7D1'
    ],
    // Row 2
    [
        '#E4AAAB',
        '#F4D294',
        '#F8F19E',
        '#B3D8AA',
        '#A6D3C3',
        '#AEE0E9',
        '#A8BAF8',
        '#B3A8DA',
        '#C399D5',
        '#E099AB'
    ],
    // Row 3
    [
        '#D98586',
        '#EEBE6A',
        '#F4EB71',
        '#93C686',
        '#81C0AA',
        '#88D3E0',
        '#819BF4',
        '#9283CE',
        '#A86AC4',
        '#D36C89'
    ],
    // Row 4
    [
        '#C14243',
        '#E8A232',
        '#EFDF46',
        '#67AB54',
        '#529A82',
        '#60C3D4',
        '#4F6AF1',
        '#6E45B9',
        '#8E2FA6',
        '#C63A62'
    ],
    // Row 5
    [
        '#963131',
        '#B86F26',
        '#C2A52F',
        '#4F833F',
        '#3D7561',
        '#43909E',
        '#394EB1',
        '#513289',
        '#6B237C',
        '#972B49'
    ],
    // Row 6
    [
        '#682221',
        '#BF5A2A',
        '#D78B39',
        '#3B612C',
        '#1B3C2D',
        '#336169',
        '#2B3D8A',
        '#29247E',
        '#4F1F83',
        '#731F41'
    ]
];
const ColorPalettePicker = ({ color, onChange, label, opacity = 100, onOpacityChange })=>{
    _s();
    const [hex, setHex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(color);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ColorPalettePicker.useEffect": ()=>{
            setHex(color);
        }
    }["ColorPalettePicker.useEffect"], [
        color
    ]);
    const handleColorClick = (c)=>{
        setHex(c);
        onChange(c);
    };
    const handleOpacityChange = (e)=>{
        const val = parseInt(e.target.value);
        if (onOpacityChange) onOpacityChange(val);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-[340px] bg-white dark:bg-[#2A2E39] border border-slate-300 dark:border-[#363A45] rounded-xl shadow-2xl p-4 flex flex-col gap-4 select-none animate-in zoom-in-95 duration-100",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-10 gap-1.5 place-items-center",
                        children: TRADINGVIEW_GRAYSCALE.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Swatch, {
                                color: c,
                                active: hex.toLowerCase() === c.toLowerCase(),
                                onClick: handleColorClick
                            }, c, false, {
                                fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                                lineNumber: 75,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                        lineNumber: 73,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-10 gap-1.5 place-items-center",
                        children: TRADINGVIEW_BASE_HUES.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Swatch, {
                                color: c,
                                active: hex.toLowerCase() === c.toLowerCase(),
                                onClick: handleColorClick
                            }, c, false, {
                                fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                                lineNumber: 82,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                        lineNumber: 80,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                lineNumber: 71,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-10 gap-1.5 place-items-center",
                children: COLOR_GRID.map((row, rIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                        children: row.map((c, cIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Swatch, {
                                color: c,
                                active: hex.toLowerCase() === c.toLowerCase(),
                                onClick: handleColorClick
                            }, `${rIdx}-${cIdx}`, false, {
                                fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                                lineNumber: 100,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, rIdx, false, {
                        fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                        lineNumber: 98,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                lineNumber: 96,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-px bg-slate-200 dark:bg-[#363A45] w-full"
            }, void 0, false, {
                fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                lineNumber: 106,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E222D] border border-slate-300 dark:border-[#363A45] flex items-center justify-center text-slate-500 dark:text-[#B2B5BE] hover:text-black dark:hover:text-white hover:border-slate-400 dark:hover:border-[#5d606b] transition-colors",
                            title: "Add Custom Color",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                size: 16
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                                lineNumber: 115,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                            lineNumber: 111,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-af2f3c815320da97" + " " + "flex-1 flex flex-col justify-center gap-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-af2f3c815320da97" + " " + "flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 dark:text-[#787b86]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "jsx-af2f3c815320da97",
                                            children: "Opacity"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                                            lineNumber: 120,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "jsx-af2f3c815320da97",
                                            children: [
                                                opacity,
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                                            lineNumber: 121,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                                    lineNumber: 119,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "range",
                                    min: "0",
                                    max: "100",
                                    value: opacity,
                                    onChange: handleOpacityChange,
                                    style: {
                                        backgroundImage: `linear-gradient(to right, transparent, ${hex})`,
                                        backgroundColor: 'transparent',
                                        border: 'none'
                                    },
                                    className: "jsx-af2f3c815320da97" + " " + "w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                                    lineNumber: 123,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    id: "af2f3c815320da97",
                                    children: "input[type=range].jsx-af2f3c815320da97::-webkit-slider-thumb{-webkit-appearance:none;cursor:pointer;background:#fff;border:2px solid #cbd5e1;border-radius:50%;width:14px;height:14px;margin-top:-5px;box-shadow:0 1px 3px #00000080}input[type=range].jsx-af2f3c815320da97::-moz-range-thumb{cursor:pointer;background:#fff;border:2px solid #cbd5e1;border-radius:50%;width:14px;height:14px;box-shadow:0 1px 3px #00000080}input[type=range].jsx-af2f3c815320da97::-webkit-slider-runnable-track{cursor:pointer;border-radius:2px;width:100%;height:4px}"
                                }, void 0, false, void 0, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                            lineNumber: 118,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                    lineNumber: 110,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
                lineNumber: 109,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
        lineNumber: 68,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ColorPalettePicker, "Un/RqkSq6i876pZybB2ua9IRATc=");
_c = ColorPalettePicker;
const Swatch = ({ color, active, onClick })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: ()=>onClick(color),
        className: `w-6 h-6 rounded-[4px] cursor-pointer transition-transform hover:scale-110 relative
            ${active ? 'ring-2 ring-blue-500 dark:ring-white z-10' : 'hover:brightness-110'}
        `,
        style: {
            backgroundColor: color
        },
        title: color
    }, void 0, false, {
        fileName: "[project]/src/components/ui/ColorPalettePicker.tsx",
        lineNumber: 172,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c1 = Swatch;
var _c, _c1;
__turbopack_context__.k.register(_c, "ColorPalettePicker");
__turbopack_context__.k.register(_c1, "Swatch");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/SymbolAutocomplete.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SymbolAutocomplete",
    ()=>SymbolAutocomplete
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$up$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsUpDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevrons-up-down.js [app-client] (ecmascript) <export default as ChevronsUpDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/ui/usePopoverPosition.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
function SymbolAutocomplete({ brokerId, value, onChange, placeholder, disabled, items, className }) {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [symbols, setSymbols] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [errorMessage, setErrorMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Derived error state
    const error = !!errorMessage;
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const wrapperRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Portal Positioning
    const { top, left, contentRef } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePopoverPosition"])({
        triggerRef: wrapperRef,
        isOpen: open,
        gap: 4,
        contentHeight: 200 // Approx max height
    });
    // Fetch symbols when brokerId changes, or use provided items
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SymbolAutocomplete.useEffect": ()=>{
            if (items) {
                // Use provided items
                const normalized = items.map({
                    "SymbolAutocomplete.useEffect.normalized": (s)=>typeof s === 'string' ? {
                            name: s,
                            path: '',
                            description: ''
                        } : s
                }["SymbolAutocomplete.useEffect.normalized"]);
                setSymbols(normalized);
                setErrorMessage("");
                setLoading(false);
                return;
            }
            if (!brokerId) {
                setSymbols([]);
                return;
            }
            const fetchSymbols = {
                "SymbolAutocomplete.useEffect.fetchSymbols": async ()=>{
                    setLoading(true);
                    setErrorMessage("");
                    try {
                        const url = `/api/broker-symbols/${encodeURIComponent(brokerId)}`; // Fixed URL relative path
                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`Status ${res.status}`);
                        const data = await res.json();
                        // Data might be strings or objects
                        const normalized = Array.isArray(data) ? data.map({
                            "SymbolAutocomplete.useEffect.fetchSymbols": (s)=>typeof s === 'string' ? {
                                    name: s,
                                    path: '',
                                    description: ''
                                } : s
                        }["SymbolAutocomplete.useEffect.fetchSymbols"]) : [];
                        setSymbols(normalized);
                        if (normalized.length === 0) {
                        // Valid but empty
                        }
                    } catch (e) {
                        console.error("Symbol fetch failed", e);
                        setErrorMessage(e.message || "Fetch Error");
                    } finally{
                        setLoading(false);
                    }
                }
            }["SymbolAutocomplete.useEffect.fetchSymbols"];
            fetchSymbols();
        }
    }["SymbolAutocomplete.useEffect"], [
        brokerId,
        items
    ]);
    // Close on click outside (Portal friendly)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SymbolAutocomplete.useEffect": ()=>{
            function handleClickOutside(event) {
                // Check if click is inside input wrapper OR inside portal content
                const clickedWrapper = wrapperRef.current && wrapperRef.current.contains(event.target);
                // Note: usePopoverPosition usually doesn't expose the content node directly for this check easily unless we store ref
                // But we pass contentRef to the div, so we need to check if target is inside that div.
                // However, since the div is in portal, we can't easily check 'contentRef.current.contains' because contentRef is a callback.
                // Standard trick: use a separate ref sync or check if click is NOT in wrapper.
                // Ideally usePopoverPosition or a 'useOnClickOutside' handles this better. 
                // Simplified: If we click outside the wrapper, we close. BUT clicking the portal list item shouldn't close immediately (handled by onClick).
                // Clicking scrollbar of portal? 
                // Better approach: The portal has an overlay or we detect.
                // For now, let's rely on standard logic:
                if (!clickedWrapper && open) {
                    // If it's in the portal, don't close?
                    // The portal is attached to body. 
                    // We'll trust the portal to handle its own events (e.g. item click).
                    // But clicking *elsewhere* should close.
                    // Hack: Check if target closest '.symbol-autocomplete-dropdown' exists
                    if (event.target.closest('.symbol-autocomplete-dropdown')) return;
                    setOpen(false);
                }
            }
            document.addEventListener("mousedown", handleClickOutside);
            return ({
                "SymbolAutocomplete.useEffect": ()=>document.removeEventListener("mousedown", handleClickOutside)
            })["SymbolAutocomplete.useEffect"];
        }
    }["SymbolAutocomplete.useEffect"], [
        open
    ]);
    // Filter logic
    const filteredSymbols = query === "" ? symbols : symbols.filter((s)=>s.name.toLowerCase().includes(query.toLowerCase()));
    const isOffline = error || symbols.length === 0 && !loading && brokerId && !items;
    const inputWidth = wrapperRef.current?.offsetWidth || 200;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `relative w-full ${className || ''}`,
        ref: wrapperRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: inputRef,
                        disabled: disabled,
                        className: `w-full bg-white dark:bg-slate-950 border rounded px-3 py-2 text-sm outline-none transition-all font-mono
                        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-text"}
                        ${isOffline ? "border-amber-500/50 dark:border-amber-700/50 text-amber-600 dark:text-amber-200 placeholder:text-amber-400 dark:placeholder:text-amber-500/50 focus:border-amber-500" : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-emerald-300 placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:border-blue-500 dark:focus:border-emerald-500"}
                    `,
                        placeholder: isOffline ? "Manual Input (Broker Offline)" : placeholder || "Select Symbol...",
                        value: (open ? query : value) || "",
                        onChange: (e)=>{
                            setQuery(e.target.value);
                            if (isOffline) {
                                onChange(e.target.value);
                            } else {
                                setOpen(true);
                            }
                        },
                        onFocus: ()=>{
                            if (!disabled) {
                                setOpen(true);
                            }
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                        lineNumber: 134,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none",
                        children: [
                            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-3 h-3 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                                lineNumber: 163,
                                columnNumber: 33
                            }, this),
                            isOffline && !loading && !disabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                title: `Offline/Error: ${errorMessage || "No Symbols"}`,
                                className: "flex items-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                    size: 14,
                                    className: "text-amber-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                                    lineNumber: 166,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                                lineNumber: 165,
                                columnNumber: 25
                            }, this),
                            !loading && !isOffline && !disabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevrons$2d$up$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronsUpDown$3e$__["ChevronsUpDown"], {
                                size: 14,
                                className: "text-slate-600"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                                lineNumber: 169,
                                columnNumber: 61
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                        lineNumber: 162,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                lineNumber: 133,
                columnNumber: 13
            }, this),
            open && !isOffline && !disabled && typeof document !== 'undefined' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: contentRef,
                className: "fixed z-[100000] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100 symbol-autocomplete-dropdown custom-scrollbar",
                style: {
                    top,
                    left,
                    width: inputWidth // Match input width
                },
                children: filteredSymbols.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-2 text-xs text-slate-500 text-center",
                    children: "No symbols found."
                }, void 0, false, {
                    fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                    lineNumber: 185,
                    columnNumber: 25
                }, this) : filteredSymbols.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                    ${value === s.name ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}
                                `,
                        onClick: ()=>{
                            onChange(s.name);
                            setOpen(false);
                            setQuery("");
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-mono",
                                children: s.name
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                                lineNumber: 199,
                                columnNumber: 33
                            }, this),
                            value === s.name && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                size: 14,
                                className: "text-emerald-500"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                                lineNumber: 200,
                                columnNumber: 54
                            }, this)
                        ]
                    }, s.name, true, {
                        fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                        lineNumber: 188,
                        columnNumber: 29
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
                lineNumber: 175,
                columnNumber: 17
            }, this), document.body)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/SymbolAutocomplete.tsx",
        lineNumber: 132,
        columnNumber: 9
    }, this);
}
_s(SymbolAutocomplete, "FIf8QXUEv530WTPYh5TOeSO9Q2A=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePopoverPosition"]
    ];
});
_c = SymbolAutocomplete;
var _c;
__turbopack_context__.k.register(_c, "SymbolAutocomplete");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/data-history/HistoryTreeTable.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HistoryTreeTable",
    ()=>HistoryTreeTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-client] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function HistoryTreeTable({ data, onCheck }) {
    _s();
    const [expandedKeys, setExpandedKeys] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const toggleExpand = (key)=>{
        const newExpanded = new Set(expandedKeys);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedKeys(newExpanded);
    };
    const formatDate = (ts)=>{
        if (!ts || ts === 0) return "-";
        return new Date(ts).toLocaleString();
    };
    const renderStatus = (status)=>{
        if (!status) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground border-gray-200 dark:border-gray-700 text-gray-500",
            children: "Idle"
        }, void 0, false, {
            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
            lineNumber: 50,
            columnNumber: 29
        }, this);
        const badgeClass = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground ";
        switch(status){
            case 'CHECKING':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: cn(badgeClass, "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80 animate-pulse"),
                    children: "Checking..."
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                    lineNumber: 56,
                    columnNumber: 24
                }, this);
            case 'RESOLVING':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: cn(badgeClass, "border-transparent bg-red-100 text-red-900 hover:bg-red-100/80 animate-pulse"),
                    children: "Resolving..."
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                    lineNumber: 58,
                    columnNumber: 24
                }, this);
            case 'OK':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: cn(badgeClass, "border-transparent bg-green-500/10 text-green-600 border-green-500/20"),
                    children: "OK"
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                    lineNumber: 60,
                    columnNumber: 24
                }, this);
            case 'INCOMPLETE':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: cn(badgeClass, "border-transparent bg-red-500 text-white hover:bg-red-500/80"),
                    children: "Incomplete"
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                    lineNumber: 62,
                    columnNumber: 24
                }, this);
            case 'ERROR':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: cn(badgeClass, "border-transparent bg-red-900 text-white hover:bg-red-900/80"),
                    children: "Error"
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                    lineNumber: 64,
                    columnNumber: 24
                }, this);
            case 'OFFLINE':
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: cn(badgeClass, "border-transparent bg-gray-500 text-white hover:bg-gray-600"),
                    children: "Offline"
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                    lineNumber: 66,
                    columnNumber: 24
                }, this);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: cn(badgeClass, "text-foreground"),
                    children: status
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                    lineNumber: 68,
                    columnNumber: 24
                }, this);
        }
    };
    const renderRow = (node, level = 0)=>{
        const isExpanded = expandedKeys.has(node.key);
        const hasChildren = node.children && node.children.length > 0;
        const isSymbol = node.data.type === 'symbol';
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", isSymbol ? "bg-gray-50/20 dark:bg-gray-800/20 hover:bg-gray-100/30" : ""),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "p-2 align-middle [&:has([role=checkbox])]:pr-0 font-medium",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 cursor-pointer select-none",
                                style: {
                                    paddingLeft: `${level * 1.5}rem`
                                },
                                onClick: ()=>hasChildren && toggleExpand(node.key),
                                children: [
                                    hasChildren ? isExpanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                        className: "h-4 w-4 text-gray-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                        lineNumber: 87,
                                        columnNumber: 46
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                        className: "h-4 w-4 text-gray-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                        lineNumber: 87,
                                        columnNumber: 98
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                        lineNumber: 89,
                                        columnNumber: 33
                                    }, this),
                                    isSymbol ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"], {
                                        className: "h-4 w-4 text-primary"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                        lineNumber: 93,
                                        columnNumber: 33
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        className: "h-3 w-3 text-gray-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                        lineNumber: 95,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: cn(isSymbol ? "font-semibold" : "text-gray-500"),
                                        children: node.data.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                        lineNumber: 98,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                lineNumber: 81,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                            lineNumber: 80,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "p-2 align-middle [&:has([role=checkbox])]:pr-0",
                            children: formatDate(node.data.min)
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                            lineNumber: 103,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "p-2 align-middle [&:has([role=checkbox])]:pr-0",
                            children: formatDate(node.data.max)
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                            lineNumber: 104,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "p-2 align-middle [&:has([role=checkbox])]:pr-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    renderStatus(node.data.status),
                                    node.data.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-500 truncate max-w-[200px]",
                                        title: node.data.message,
                                        children: node.data.message
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                        lineNumber: 109,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                lineNumber: 106,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                            lineNumber: 105,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                            className: "p-2 align-middle [&:has([role=checkbox])]:pr-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: (e)=>{
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
                                },
                                className: "p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors",
                                title: isSymbol ? "Check All Timeframes" : "Check This Timeframe",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    xmlns: "http://www.w3.org/2000/svg",
                                    width: "16",
                                    height: "16",
                                    viewBox: "0 0 24 24",
                                    fill: "none",
                                    stroke: "currentColor",
                                    strokeWidth: "2",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    className: "lucide lucide-play w-4 h-4 text-primary",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                        points: "5 3 19 12 5 21 5 3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                        lineNumber: 132,
                                        columnNumber: 259
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                    lineNumber: 132,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                lineNumber: 116,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                            lineNumber: 115,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                    lineNumber: 79,
                    columnNumber: 17
                }, this),
                isExpanded && node.children?.map((child)=>renderRow(child, level + 1))
            ]
        }, node.key, true, {
            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
            lineNumber: 78,
            columnNumber: 13
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E222D] h-full flex flex-col",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full h-full overflow-auto",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                className: "w-full caption-bottom text-sm relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                        className: "[&_tr]:border-b sticky top-0 bg-white dark:bg-[#1E222D] z-10 shadow-sm",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: "border-b border-gray-200 dark:border-gray-800 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[300px]",
                                    children: "Symbol / Timeframe"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                    lineNumber: 148,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                                    children: "Date From"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                    lineNumber: 149,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                                    children: "Date To"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                    lineNumber: 150,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 w-[80px]",
                                    children: "Action"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                    lineNumber: 151,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                            lineNumber: 147,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                        lineNumber: 146,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                        className: "[&_tr:last-child]:border-0",
                        children: data.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                colSpan: 5,
                                className: "p-2 align-middle [&:has([role=checkbox])]:pr-0 h-24 text-center",
                                children: "No data available."
                            }, void 0, false, {
                                fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                                lineNumber: 157,
                                columnNumber: 33
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                            lineNumber: 156,
                            columnNumber: 29
                        }, this) : data.map((node)=>renderRow(node))
                    }, void 0, false, {
                        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                        lineNumber: 154,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
                lineNumber: 145,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
            lineNumber: 144,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/data-history/HistoryTreeTable.tsx",
        lineNumber: 143,
        columnNumber: 9
    }, this);
}
_s(HistoryTreeTable, "94YNR/hJyGJAfy334Cs68Z9esJI=");
_c = HistoryTreeTable;
var _c;
__turbopack_context__.k.register(_c, "HistoryTreeTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/data-history/SanityControls.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SanityControls",
    ()=>SanityControls
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.js [app-client] (ecmascript) <export default as Play>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function SanityControls({ onRunCheck, isChecking }) {
    _s();
    // Default to 1 week ago
    const getDefaultDate = ()=>{
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    };
    const [startDate, setStartDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(getDefaultDate());
    const handleRun = ()=>{
        if (!startDate) {
            alert("Please select a start date");
            return;
        }
        onRunCheck(startDate);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full mb-6 rounded-xl border bg-card text-card-foreground shadow bg-white dark:bg-[#1E222D] border-gray-200 dark:border-gray-800",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col space-y-1.5 p-6 pb-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    className: "font-semibold leading-none tracking-tight text-lg flex items-center gap-2",
                    children: "Sanity Check Controls"
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/SanityControls.tsx",
                    lineNumber: 38,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/data-history/SanityControls.tsx",
                lineNumber: 37,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6 pt-0",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col sm:flex-row items-end gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-2 w-full sm:w-auto",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    htmlFor: "start-date",
                                    className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                    children: "Check From Date"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/data-history/SanityControls.tsx",
                                    lineNumber: 45,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    id: "start-date",
                                    type: "datetime-local",
                                    value: startDate,
                                    onChange: (e)=>setStartDate(e.target.value),
                                    className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", "border-gray-300 dark:border-gray-700 w-full sm:w-[250px]")
                                }, void 0, false, {
                                    fileName: "[project]/src/components/data-history/SanityControls.tsx",
                                    lineNumber: 46,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/data-history/SanityControls.tsx",
                            lineNumber: 44,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-2 flex-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm text-gray-500 dark:text-gray-400 mb-1",
                                    children: [
                                        "Last Reference Date (UTC): ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-mono",
                                            children: [
                                                new Date().toISOString().split('T')[0],
                                                " (Yesterday)"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/data-history/SanityControls.tsx",
                                            lineNumber: 60,
                                            columnNumber: 56
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/data-history/SanityControls.tsx",
                                    lineNumber: 59,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-400 dark:text-gray-500",
                                    children: "Checks data integrity from the selected date up to the end of yesterday (UTC)."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/data-history/SanityControls.tsx",
                                    lineNumber: 62,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/data-history/SanityControls.tsx",
                            lineNumber: 58,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>window.open(window.API_URL ? `${window.API_URL}/api/sanity-check/report` : 'http://localhost:3005/api/sanity-check/report', '_blank'),
                            className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground", "h-9 px-4 py-2 w-full sm:w-auto text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"),
                            children: "Download Protocol"
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/SanityControls.tsx",
                            lineNumber: 67,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleRun,
                            disabled: isChecking,
                            className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90", "h-9 px-4 py-2 w-full sm:w-auto min-w-[140px]"),
                            children: isChecking ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        className: "mr-2 h-4 w-4 animate-spin"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/SanityControls.tsx",
                                        lineNumber: 89,
                                        columnNumber: 33
                                    }, this),
                                    "Checking..."
                                ]
                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                                        className: "mr-2 h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/data-history/SanityControls.tsx",
                                        lineNumber: 94,
                                        columnNumber: 33
                                    }, this),
                                    "Run Sanity Check"
                                ]
                            }, void 0, true)
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/SanityControls.tsx",
                            lineNumber: 78,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/data-history/SanityControls.tsx",
                    lineNumber: 43,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/data-history/SanityControls.tsx",
                lineNumber: 42,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/data-history/SanityControls.tsx",
        lineNumber: 36,
        columnNumber: 9
    }, this);
}
_s(SanityControls, "UgA9Dsi6PFHQZpXizYr1wt+IbUo=");
_c = SanityControls;
var _c;
__turbopack_context__.k.register(_c, "SanityControls");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/data-history/DataHistoryView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DataHistoryView",
    ()=>DataHistoryView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/socket.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$data$2d$history$2f$HistoryTreeTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/data-history/HistoryTreeTable.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$data$2d$history$2f$SanityControls$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/data-history/SanityControls.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
// Config
const API_URL = 'http://localhost:3005'; // Correct backend port
function DataHistoryView() {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isChecking, setIsChecking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [activeJob, setActiveJob] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const socketRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // --- Initial Data Fetch ---
    const fetchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DataHistoryView.useCallback[fetchData]": async ()=>{
            setIsLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/data-history/stats`, {
                    cache: 'no-store'
                });
                if (!res.ok) throw new Error("Failed to fetch");
                const body = await res.json();
                if (body.success) {
                    setData(body.stats);
                } else {
                    console.error("Failed to load history stats: " + body.error);
                }
                // Sync Sanity Job Status (Sanity 2.0)
                const jobRes = await fetch(`${API_URL}/api/sanity/job/current`, {
                    cache: 'no-store'
                });
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
                        const statusRes = await fetch(`${API_URL}/api/sanity-check/status`, {
                            cache: 'no-store'
                        });
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
            } finally{
                setIsLoading(false);
            }
        }
    }["DataHistoryView.useCallback[fetchData]"], []);
    // --- Handle Real-time Updates ---
    const handleSanityUpdate = (update)=>{
        setData((currentData)=>{
            const newData = [
                ...currentData
            ];
            // Find Symbol Node
            const symbolNode = newData.find((n)=>n.key === update.symbol);
            if (symbolNode) {
                // If update is for specific timeframe
                if (update.timeframe) {
                    const tfKey = `${update.symbol}-${update.timeframe}`;
                    const tfNode = symbolNode.children?.find((c)=>c.key === tfKey);
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
                if (!update.timeframe) {
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DataHistoryView.useEffect": ()=>{
            fetchData();
            // --- Socket Connection ---
            const socket = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["socketService"].getSocket();
            // No explicit connect() or disconnect() needed for Shared Socket.
            // But we DO need to hook listeners.
            if (socket.connected) {
                console.log("Socket connected (Shared) for Data History");
            }
            const onConnect = {
                "DataHistoryView.useEffect.onConnect": ()=>console.log("Socket connected (Shared) for Data History")
            }["DataHistoryView.useEffect.onConnect"];
            socket.on('connect', onConnect);
            // Events
            const onSanityUpdate = {
                "DataHistoryView.useEffect.onSanityUpdate": (update)=>handleSanityUpdate(update)
            }["DataHistoryView.useEffect.onSanityUpdate"];
            const onTaskUpdate = {
                "DataHistoryView.useEffect.onTaskUpdate": (update)=>{
                    console.log("Task Update:", update);
                    handleSanityUpdate(update);
                }
            }["DataHistoryView.useEffect.onTaskUpdate"];
            const onJobUpdate = {
                "DataHistoryView.useEffect.onJobUpdate": (job)=>{
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
                        setTimeout({
                            "DataHistoryView.useEffect.onJobUpdate": ()=>{
                                setActiveJob(null);
                                fetchData(); // Refresh Data Stats to show final OK/Counts
                            }
                        }["DataHistoryView.useEffect.onJobUpdate"], 2000);
                    } else {
                        setIsChecking(true);
                    }
                }
            }["DataHistoryView.useEffect.onJobUpdate"];
            socket.on('sanity_update', onSanityUpdate);
            socket.on('task_update', onTaskUpdate);
            socket.on('job_update', onJobUpdate);
            return ({
                "DataHistoryView.useEffect": ()=>{
                    // CLEANUP: Remove listeners to prevent leaks or double-handling
                    socket.off('connect', onConnect);
                    socket.off('sanity_update', onSanityUpdate);
                    socket.off('task_update', onTaskUpdate);
                    socket.off('job_update', onJobUpdate);
                // DO NOT disconnect shared socket
                }
            })["DataHistoryView.useEffect"];
        }
    }["DataHistoryView.useEffect"], [
        fetchData
    ]);
    const runSanityCheck = async (startDate)=>{
        setIsChecking(true);
        try {
            const res = await fetch(`${API_URL}/api/sanity-check/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startTime: startDate
                })
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "container mx-auto py-8 text-foreground h-full flex flex-col overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-2 mb-8 shrink-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold tracking-tight",
                        children: "Data History Management"
                    }, void 0, false, {
                        fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                        lineNumber: 192,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-500 dark:text-gray-400",
                        children: "View data availability ranges and running consistency checks."
                    }, void 0, false, {
                        fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                        lineNumber: 193,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                lineNumber: 191,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$data$2d$history$2f$SanityControls$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SanityControls"], {
                onRunCheck: runSanityCheck,
                isChecking: isChecking
            }, void 0, false, {
                fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                lineNumber: 198,
                columnNumber: 13
            }, this),
            activeJob && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-center mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-semibold text-blue-700 dark:text-blue-300",
                                children: [
                                    "Job Running: ",
                                    activeJob.status,
                                    " (",
                                    activeJob.completed,
                                    "/",
                                    activeJob.total,
                                    " tasks)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                                lineNumber: 203,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-blue-600 dark:text-blue-400",
                                children: [
                                    Math.round(activeJob.progress * 100),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                                lineNumber: 206,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                        lineNumber: 202,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-blue-600 h-2.5 rounded-full transition-all duration-500",
                            style: {
                                width: `${Math.max(5, activeJob.progress * 100)}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                            lineNumber: 211,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                        lineNumber: 210,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                lineNumber: 201,
                columnNumber: 17
            }, this),
            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col items-center gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                            lineNumber: 222,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-muted-foreground text-sm",
                            children: "Loading Data History..."
                        }, void 0, false, {
                            fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                            lineNumber: 223,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                    lineNumber: 221,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                lineNumber: 220,
                columnNumber: 17
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-h-0 overflow-hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$data$2d$history$2f$HistoryTreeTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HistoryTreeTable"], {
                    data: data,
                    onCheck: async (symbol, timeframe)=>{
                        if (isChecking) {
                            alert("Check already in progress.");
                            return;
                        }
                        setIsChecking(true);
                        // OPTIMISTIC UPDATE: Mark target as CHECKING immediately
                        setData((prev)=>{
                            const next = [
                                ...prev
                            ];
                            const symNode = next.find((n)=>n.key === symbol);
                            if (symNode) {
                                if (timeframe) {
                                    // Update specific childcare
                                    const tfKey = `${symbol}-${timeframe}`;
                                    const child = symNode.children?.find((c)=>c.key === tfKey);
                                    if (child) {
                                        child.data = {
                                            ...child.data,
                                            status: 'CHECKING',
                                            message: 'Request sent...'
                                        };
                                    }
                                } else {
                                    // Update Symbol Node checks ALL (Visual feedback on parent?)
                                    symNode.data = {
                                        ...symNode.data,
                                        status: 'CHECKING',
                                        message: 'Request sent...'
                                    };
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
                                headers: {
                                    'Content-Type': 'application/json'
                                },
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
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                    lineNumber: 228,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
                lineNumber: 227,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/data-history/DataHistoryView.tsx",
        lineNumber: 190,
        columnNumber: 9
    }, this);
}
_s(DataHistoryView, "sjn/9njRX+fOeigU8DPVstQzJiY=");
_c = DataHistoryView;
var _c;
__turbopack_context__.k.register(_c, "DataHistoryView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_4e49954a._.js.map