(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/workspaces/WorkspaceTabs.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WorkspaceTabs",
    ()=>WorkspaceTabs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const WorkspaceTabs = ()=>{
    _s();
    const { workspaces, activeWorkspaceId, setActiveWorkspace, addWorkspace, removeWorkspace } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])();
    const [isEditing, setIsEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleAdd = ()=>{
        addWorkspace(`Workspace ${workspaces.length + 1}`);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-1 overflow-x-auto no-scrollbar",
        children: [
            workspaces.map((w)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    onClick: ()=>setActiveWorkspace(w.id),
                    className: `
                        group flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-l border-r border-transparent cursor-pointer select-none text-xs font-medium transition-all
                        ${w.id === activeWorkspaceId ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50'}
                    `,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "flex items-center gap-1.5",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-bold",
                                children: w.panes?.[0]?.symbol || w.name
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceTabs.tsx",
                                lineNumber: 27,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/WorkspaceTabs.tsx",
                            lineNumber: 26,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: (e)=>{
                                e.stopPropagation();
                                removeWorkspace(w.id);
                            },
                            className: "relative z-20 p-0.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors ml-2 flex-shrink-0",
                            title: "Close Workspace",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceTabs.tsx",
                                lineNumber: 36,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/WorkspaceTabs.tsx",
                            lineNumber: 31,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, w.id, true, {
                    fileName: "[project]/src/components/workspaces/WorkspaceTabs.tsx",
                    lineNumber: 16,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleAdd,
                className: "ml-1 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors",
                title: "New Workspace",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                    size: 14
                }, void 0, false, {
                    fileName: "[project]/src/components/workspaces/WorkspaceTabs.tsx",
                    lineNumber: 46,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/WorkspaceTabs.tsx",
                lineNumber: 41,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/WorkspaceTabs.tsx",
        lineNumber: 14,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(WorkspaceTabs, "JoKSfiG3+58hKIe/4n0sSHqBZBE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"]
    ];
});
_c = WorkspaceTabs;
var _c;
__turbopack_context__.k.register(_c, "WorkspaceTabs");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/workspaces/ChartOverlay.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartOverlay",
    ()=>ChartOverlay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layers.js [app-client] (ecmascript) <export default as Layers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$live$2f$SymbolBrowser$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/live/SymbolBrowser.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/indicators/IndicatorRegistry.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$ChartStatusIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/ChartStatusIndicator.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ChartThemeContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
const ChartOverlay = /*#__PURE__*/ _s(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].forwardRef(_c = _s(({ symbol, timeframe, timezone, onSymbolChange, onTimeframeChange, onTimezoneChange, onAddIndicator, botId, ohlc, precision = 5, status = 'OFFLINE' }, ref)=>{
    _s();
    const { mode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"])();
    const isDark = mode === 'dark';
    const symbolBrowserRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const toolbarRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const triggerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isHovered, setIsHovered] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Indicator Menu State
    const [showIndMenu, setShowIndMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useImperativeHandle(ref, {
        "ChartOverlay.useImperativeHandle": ()=>({
                closePopups: ({
                    "ChartOverlay.useImperativeHandle": ()=>{
                        setIsHovered(false);
                        setShowIndMenu(false);
                        if (symbolBrowserRef.current) {
                            symbolBrowserRef.current.close();
                        }
                    }
                })["ChartOverlay.useImperativeHandle"]
            })
    }["ChartOverlay.useImperativeHandle"]);
    // Timeframe Scroll Logic
    const tfScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [canScrollLeft, setCanScrollLeft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [canScrollRight, setCanScrollRight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const checkTfScroll = ()=>{
        if (tfScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tfScrollRef.current;
            setCanScrollLeft(scrollLeft > 4);
            setCanScrollRight(Math.ceil(scrollWidth) > Math.ceil(clientWidth + scrollLeft) + 4);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartOverlay.useEffect": ()=>{
            if (isHovered && tfScrollRef.current) {
                setTimeout(checkTfScroll, 50);
                const el = tfScrollRef.current;
                el.addEventListener('scroll', checkTfScroll);
                const observer = new ResizeObserver({
                    "ChartOverlay.useEffect": ()=>checkTfScroll()
                }["ChartOverlay.useEffect"]);
                observer.observe(el);
                return ({
                    "ChartOverlay.useEffect": ()=>{
                        el.removeEventListener('scroll', checkTfScroll);
                        observer.disconnect();
                    }
                })["ChartOverlay.useEffect"];
            }
        }
    }["ChartOverlay.useEffect"], [
        isHovered
    ]);
    // Global Mouse Tracking to fix sticky hover
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartOverlay.useEffect": ()=>{
            if (!isHovered) return;
            const handleGlobalMove = {
                "ChartOverlay.useEffect.handleGlobalMove": (e)=>{
                    const target = e.target;
                    // Check if mouse is inside toolbar OR inside a symbol browser dropdown (portal)
                    if (toolbarRef.current && !toolbarRef.current.contains(target) && triggerRef.current && !triggerRef.current.contains(target) && !target.closest('.symbol-browser-dropdown')) {
                        setIsHovered(false);
                    }
                }
            }["ChartOverlay.useEffect.handleGlobalMove"];
            const handleWindowLeave = {
                "ChartOverlay.useEffect.handleWindowLeave": ()=>setIsHovered(false)
            }["ChartOverlay.useEffect.handleWindowLeave"];
            window.addEventListener('mousemove', handleGlobalMove);
            document.addEventListener('mouseleave', handleWindowLeave);
            return ({
                "ChartOverlay.useEffect": ()=>{
                    window.removeEventListener('mousemove', handleGlobalMove);
                    document.removeEventListener('mouseleave', handleWindowLeave);
                }
            })["ChartOverlay.useEffect"];
        }
    }["ChartOverlay.useEffect"], [
        isHovered
    ]);
    // Explicit Theme Colors based on Chart Mode (for Overlay Text ONLY)
    // User: "schriftfarben und status styling AUF dem chart ist allerdings weiterhin NUR abhängig vom tradingview style"
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const scrollTf = (direction)=>{
        if (tfScrollRef.current) {
            const amount = direction === 'left' ? -150 : 150;
            tfScrollRef.current.scrollBy({
                left: amount,
                behavior: 'smooth'
            });
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: triggerRef,
                className: "absolute top-0 left-0 right-0 h-[14px] z-[60] cursor-pointer transition-colors duration-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40",
                onMouseEnter: ()=>setIsHovered(true)
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                lineNumber: 130,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            !isHovered && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 left-2 z-[40] pointer-events-none select-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 text-sm",
                    children: (()=>{
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `flex items-center gap-2 ${textColor} tracking-tight`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: symbol
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 147,
                                            columnNumber: 41
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[4px] align-middle opacity-60",
                                            children: "●"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 148,
                                            columnNumber: 41
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: timeframe
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 149,
                                            columnNumber: 41
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                    lineNumber: 144,
                                    columnNumber: 37
                                }, ("TURBOPACK compile-time value", void 0)),
                                ohlc && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `flex items-center gap-2 text-xs font-mono ${textColor} ml-1`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[4px] align-middle opacity-60",
                                            children: "●"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 155,
                                            columnNumber: 45
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "flex gap-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "opacity-70",
                                                    children: "O"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                    lineNumber: 156,
                                                    columnNumber: 74
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                ohlc.open.toFixed(precision)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 156,
                                            columnNumber: 45
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "flex gap-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "opacity-70",
                                                    children: "H"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                    lineNumber: 157,
                                                    columnNumber: 74
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                ohlc.high.toFixed(precision)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 157,
                                            columnNumber: 45
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "flex gap-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "opacity-70",
                                                    children: "L"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                    lineNumber: 158,
                                                    columnNumber: 74
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                ohlc.low.toFixed(precision)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 158,
                                            columnNumber: 45
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "flex gap-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "opacity-70",
                                                    children: "C"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                    lineNumber: 159,
                                                    columnNumber: 74
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                ohlc.close.toFixed(precision)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 159,
                                            columnNumber: 45
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                    lineNumber: 154,
                                    columnNumber: 41
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true);
                    })()
                }, void 0, false, {
                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                    lineNumber: 139,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                lineNumber: 138,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: toolbarRef,
                className: `
                    absolute inset-x-0 top-0 h-[40px] z-[70]
                    flex items-center justify-between px-2 gap-2
                    bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl 
                    transition-all duration-200 ease-out
                    ${isHovered ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
                `,
                onMouseLeave: ()=>setIsHovered(false),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$live$2f$SymbolBrowser$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SymbolBrowser"], {
                                ref: symbolBrowserRef,
                                variant: "button",
                                currentSymbol: symbol,
                                onSelectSymbol: (s)=>{
                                    onSymbolChange(s);
                                    setIsHovered(false);
                                },
                                botId: botId,
                                className: "text-xs"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                lineNumber: 186,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                lineNumber: 197,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                        lineNumber: 183,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative flex-1 min-w-0 flex items-center group/tf overflow-hidden h-full",
                        children: [
                            canScrollLeft && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute left-0 top-0 bottom-0 z-10 flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute inset-0 bg-gradient-to-r from-white dark:from-slate-900 to-transparent w-6"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 204,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: (e)=>{
                                            e.stopPropagation();
                                            scrollTf('left');
                                        },
                                        className: "relative z-20 p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                            size: 14
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 205,
                                            columnNumber: 205
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 205,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                lineNumber: 203,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: tfScrollRef,
                                className: "flex items-center gap-0.5 overflow-x-auto no-scrollbar scroll-smooth px-1 w-full h-full",
                                style: {
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                                        children: `
                            .no-scrollbar::-webkit-scrollbar { display: none; }
                         `
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 214,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    [
                                        'M1',
                                        'M2',
                                        'M3',
                                        'M5',
                                        'M10',
                                        'M15',
                                        'M30',
                                        'H1',
                                        'H2',
                                        'H3',
                                        'H4',
                                        'H6',
                                        'H8',
                                        'H12',
                                        'D1',
                                        'W1',
                                        'MN1'
                                    ].map((tf)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: (e)=>{
                                                e.stopPropagation();
                                                onTimeframeChange(tf);
                                            },
                                            className: `px-2 py-0.5 text-[10px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${timeframe === tf ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`,
                                            children: tf
                                        }, tf, false, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 218,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                lineNumber: 209,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            canScrollRight && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute inset-0 bg-gradient-to-l from-white dark:from-slate-900 to-transparent w-6"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 231,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: (e)=>{
                                            e.stopPropagation();
                                            scrollTf('right');
                                        },
                                        className: "relative z-20 p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                            size: 14
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 232,
                                            columnNumber: 206
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 232,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                lineNumber: 230,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                        lineNumber: 201,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: (e)=>{
                                            e.stopPropagation();
                                            setShowIndMenu(!showIndMenu);
                                        },
                                        className: `p-1 transition-colors rounded ${showIndMenu ? 'bg-slate-200 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`,
                                        title: "Indicators",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__["Layers"], {
                                            size: 14
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                            lineNumber: 246,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 241,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    showIndMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-50 flex flex-col py-1 overflow-hidden",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 mb-1",
                                                children: "Add Indicator"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                lineNumber: 251,
                                                columnNumber: 33
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].getAll().map((def)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: (e)=>{
                                                        e.stopPropagation();
                                                        onAddIndicator?.(def.id);
                                                        setShowIndMenu(false);
                                                    },
                                                    className: "text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: def.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                        lineNumber: 264,
                                                        columnNumber: 41
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, def.id, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                    lineNumber: 255,
                                                    columnNumber: 37
                                                }, ("TURBOPACK compile-time value", void 0))),
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].getAll().length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "px-3 py-2 text-xs text-slate-500 italic",
                                                children: "No indicators found"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                lineNumber: 268,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 250,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                lineNumber: 240,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 group/tz relative hover:border-slate-300 dark:hover:border-slate-600 transition-colors h-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                        size: 10,
                                        className: "text-slate-400 dark:text-slate-500 group-hover/tz:text-indigo-500 dark:group-hover/tz:text-indigo-400 transition-colors"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 275,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: timezone,
                                        onChange: (e)=>onTimezoneChange(e.target.value),
                                        className: "bg-transparent text-slate-600 dark:text-slate-300 font-mono outline-none appearance-none cursor-pointer pr-3 hover:text-slate-900 dark:hover:text-white transition-colors pt-0.5 min-w-[40px]",
                                        children: [
                                            {
                                                id: 'UTC',
                                                label: 'UTC',
                                                short: 'UTC'
                                            },
                                            {
                                                id: 'America/New_York',
                                                label: 'New York',
                                                short: 'NYC'
                                            },
                                            {
                                                id: 'Europe/London',
                                                label: 'London',
                                                short: 'LON'
                                            },
                                            {
                                                id: 'Europe/Berlin',
                                                label: 'Berlin',
                                                short: 'BER'
                                            },
                                            {
                                                id: 'Europe/Athens',
                                                label: 'Athen',
                                                short: 'ATH'
                                            },
                                            {
                                                id: 'Asia/Tokyo',
                                                label: 'Tokyo',
                                                short: 'TOK'
                                            },
                                            {
                                                id: 'Asia/Singapore',
                                                label: 'Singapore',
                                                short: 'SIN'
                                            },
                                            {
                                                id: 'Australia/Sydney',
                                                label: 'Sydney',
                                                short: 'SYD'
                                            }
                                        ].map((tz)=>{
                                            // Dynamic Offset Calculation
                                            let offset = '';
                                            try {
                                                const now = new Date();
                                                const tf = new Intl.DateTimeFormat('en-US', {
                                                    timeZone: tz.id,
                                                    timeZoneName: 'shortOffset'
                                                });
                                                const parts = tf.formatToParts(now);
                                                const offsetPart = parts.find((p)=>p.type === 'timeZoneName');
                                                offset = offsetPart ? offsetPart.value : '';
                                                offset = offset.replace('GMT', 'UTC');
                                            } catch (e) {}
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: tz.id,
                                                className: "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-300 px-2 py-1",
                                                children: [
                                                    " ",
                                                    tz.label,
                                                    " (",
                                                    offset,
                                                    ") "
                                                ]
                                            }, tz.id, true, {
                                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                                lineNumber: 304,
                                                columnNumber: 41
                                            }, ("TURBOPACK compile-time value", void 0));
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                        lineNumber: 276,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                                lineNumber: 274,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                        lineNumber: 238,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                lineNumber: 171,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-20 z-[30] pointer-events-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$ChartStatusIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartStatusIndicator"], {
                    status: status,
                    className: "shadow-sm backdrop-blur-sm shadow-slate-900/10"
                }, void 0, false, {
                    fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                    lineNumber: 316,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/ChartOverlay.tsx",
                lineNumber: 315,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
}, "g5q6UWyKpRSVA5qRimv5oiHfLUU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"]
    ];
})), "g5q6UWyKpRSVA5qRimv5oiHfLUU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"]
    ];
});
_c1 = ChartOverlay;
ChartOverlay.displayName = 'ChartOverlay';
var _c, _c1;
__turbopack_context__.k.register(_c, "ChartOverlay$React.forwardRef");
__turbopack_context__.k.register(_c1, "ChartOverlay");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/workspaces/ChartPane.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartPane",
    ()=>ChartPane
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye.js [app-client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/eye-off.js [app-client] (ecmascript) <export default as EyeOff>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$ChartContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/ChartContainer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useChartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useChartData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useChartRegistryStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useChartRegistryStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$ChartOverlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/ChartOverlay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useSymbolStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useSymbolStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/indicators/IndicatorRegistry.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/indicators/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$settings$2f$IndicatorSettingsDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/settings/IndicatorSettingsDialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ChartThemeContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
const ChartPane = ({ workspaceId, pane, botId = 'MT5_Bot', accounts })=>{
    _s();
    const { setActivePane, updatePane, toggleMaximizePane, workspaces } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])();
    const activeWorkspace = workspaces.find((w)=>w.id === workspaceId);
    const isMaximized = activeWorkspace?.maximizedPaneId === pane.id;
    const maximizeId = activeWorkspace?.maximizedPaneId;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartPane.useEffect": ()=>{
            // If the maximization state changes (any pane maximized or restored), close local popups
            if (chartRef.current) {
                chartRef.current.closePopups();
            }
            if (overlayRef.current) {
                overlayRef.current.closePopups();
            }
        }
    }["ChartPane.useEffect"], [
        maximizeId
    ]);
    // Cleanup Selection on Deactivation
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartPane.useEffect": ()=>{
            if (!pane.isActive && chartRef.current) {
                chartRef.current.deselectAll();
            }
        }
    }["ChartPane.useEffect"], [
        pane.isActive,
        pane.id
    ]);
    // --- STATE PERSISTENCE ---
    const lastLogicalRangeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // --- INDICATOR STATE ---
    const [activeIndicators, setActiveIndicators] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(pane.indicators || []);
    const [editingIndicatorId, setEditingIndicatorId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Init Registry (Once)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartPane.useEffect": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["registerIndicators"])();
        }
    }["ChartPane.useEffect"], []);
    const { registerChart, unregisterChart } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useChartRegistryStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartRegistryStore"])();
    const chartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const overlayRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { getSymbolInfo } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useSymbolStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSymbolStore"])();
    const [layoutManager] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ChartPane.useState": ()=>__turbopack_context__.A("[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript, async loader)").then({
                "ChartPane.useState": (m)=>m.LayoutStateManager.getInstance()
            }["ChartPane.useState"])
    }["ChartPane.useState"]);
    // Keep track of latest timeframe to avoid stale closures in sync callbacks
    const timeframeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(pane.timeframe);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartPane.useEffect": ()=>{
            timeframeRef.current = pane.timeframe;
        }
    }["ChartPane.useEffect"], [
        pane.timeframe
    ]);
    // --- INTEGRATION: LayoutStateManager ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartPane.useEffect": ()=>{
            let manager = null;
            const initManager = {
                "ChartPane.useEffect.initManager": async ()=>{
                    const { LayoutStateManager } = await __turbopack_context__.A("[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript, async loader)");
                    manager = LayoutStateManager.getInstance();
                    manager.register({
                        id: pane.id,
                        setTimeframe: {
                            "ChartPane.useEffect.initManager": (tf)=>{
                                updatePane(workspaceId, pane.id, {
                                    timeframe: tf
                                });
                            }
                        }["ChartPane.useEffect.initManager"],
                        getTimeframe: {
                            "ChartPane.useEffect.initManager": ()=>{
                                return timeframeRef.current;
                            }
                        }["ChartPane.useEffect.initManager"],
                        setVisibleRange: {
                            "ChartPane.useEffect.initManager": (range)=>{
                                if (chartRef.current) {
                                    chartRef.current.setVisibleRange(range);
                                }
                            }
                        }["ChartPane.useEffect.initManager"],
                        setLogicalRange: {
                            "ChartPane.useEffect.initManager": (range)=>{
                                if (chartRef.current) {
                                    chartRef.current.setLogicalRange(range);
                                }
                            }
                        }["ChartPane.useEffect.initManager"],
                        setCrosshair: {
                            "ChartPane.useEffect.initManager": (time, price)=>{
                                if (chartRef.current) {
                                    chartRef.current.setCrosshair(time, price);
                                }
                            }
                        }["ChartPane.useEffect.initManager"]
                    });
                }
            }["ChartPane.useEffect.initManager"];
            initManager();
            return ({
                "ChartPane.useEffect": ()=>{
                    if (manager) {
                        manager.unregister(pane.id);
                    }
                }
            })["ChartPane.useEffect"];
        }
    }["ChartPane.useEffect"], [
        pane.id,
        workspaceId,
        updatePane
    ]);
    // Register Chart to Registry & Manage Persistence
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartPane.useEffect": ()=>{
            // console.log(`[ChartPane:${pane.id}] Mount/Register Effect`);
            if (chartRef.current) {
                registerChart(pane.id, chartRef.current);
                // --- DRAWING PERSISTENCE ---
                const widget = chartRef.current.getWidget();
                if (widget) {
                    // 1. Hydrate
                    if (pane.drawings) {
                        try {
                            console.log(`[ChartPane:${pane.id}] Hydrating drawings...`);
                            widget.hydrateDrawings(pane.drawings);
                        } catch (e) {
                            console.warn(`[ChartPane:${pane.id}] Failed to hydrate drawings:`, e);
                        }
                    }
                    // 2. Setup Persistence
                    const saveDrawings = {
                        "ChartPane.useEffect.saveDrawings": ()=>{
                            if (!widget) return;
                            try {
                                const serialized = widget.serializeDrawings();
                                // Only save if meaningful content or actual changes
                                // We always save on unmount to capture final state
                                updatePane(workspaceId, pane.id, {
                                    drawings: serialized
                                });
                            } catch (e) {
                                console.warn(`[ChartPane:${pane.id}] Failed to save drawings:`, e);
                            }
                        }
                    }["ChartPane.useEffect.saveDrawings"];
                    // Save on structure changes (add/remove)
                    widget.subscribe('drawing', saveDrawings);
                    // Save on execution (trade) just to be safe? 
                    // widget.subscribe('execute', saveDrawings);
                    return ({
                        "ChartPane.useEffect": ()=>{
                            console.log(`[ChartPane:${pane.id}] Unmounting/Unregistering. Saving drawings...`);
                            saveDrawings();
                            widget.unsubscribe('drawing', saveDrawings);
                            unregisterChart(pane.id);
                        }
                    })["ChartPane.useEffect"];
                }
            }
            return ({
                "ChartPane.useEffect": ()=>{
                    console.log(`[ChartPane:${pane.id}] Cleanup/Unregister (No Widget Path)`);
                    unregisterChart(pane.id);
                }
            })["ChartPane.useEffect"];
        }
    }["ChartPane.useEffect"], [
        pane.id,
        registerChart,
        unregisterChart,
        workspaceId,
        updatePane
    ]); // Important: Exclude pane.drawings to prevent re-hydration loops
    // Optimized Tick Handler
    const handleTick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ChartPane.useCallback[handleTick]": (candle)=>{
            if (chartRef.current) {
                chartRef.current.updateCandle(candle);
            }
        }
    }["ChartPane.useCallback[handleTick]"], []);
    // Data Hook
    const { data, horizonData, isLoading, isChartReady, syncError, syncStatus } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useChartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartData"])({
        symbol: pane.symbol,
        timeframe: pane.timeframe,
        botId: botId,
        isActivePane: pane.isActive,
        onTick: handleTick
    });
    const handleFocus = ()=>{
        setActivePane(workspaceId, pane.id);
        __turbopack_context__.A("[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript, async loader)").then(({ LayoutStateManager })=>{
            LayoutStateManager.getInstance().setLastActive(pane.id);
        });
    };
    // --- INTERACTION: Keyboard Shortcut (Alt + Enter) ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartPane.useEffect": ()=>{
            const handleKeyDown = {
                "ChartPane.useEffect.handleKeyDown": (e)=>{
                    if (pane.isActive && e.altKey && e.key === 'Enter') {
                        e.preventDefault();
                        toggleMaximizePane(workspaceId, pane.id);
                    }
                }
            }["ChartPane.useEffect.handleKeyDown"];
            window.addEventListener('keydown', handleKeyDown);
            return ({
                "ChartPane.useEffect": ()=>window.removeEventListener('keydown', handleKeyDown)
            })["ChartPane.useEffect"];
        }
    }["ChartPane.useEffect"], [
        pane.isActive,
        toggleMaximizePane,
        workspaceId,
        pane.id
    ]);
    const symbolInfo = getSymbolInfo(pane.symbol);
    const precision = symbolInfo?.digits || 5;
    // --- TIMEFRAME SCROLL LOGIC (Local) ---
    const tfScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [canScrollLeft, setCanScrollLeft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [canScrollRight, setCanScrollRight] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const checkTfScroll = ()=>{
        if (tfScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tfScrollRef.current;
            setCanScrollLeft(scrollLeft > 4);
            setCanScrollRight(Math.ceil(scrollWidth) > Math.ceil(clientWidth + scrollLeft) + 4);
        }
    };
    // Timezone State (Local for now, could be in PaneConfig)
    const [timezone, setTimezone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ChartPane.useState": ()=>{
            try {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch (e) {
                return 'UTC';
            }
        }
    }["ChartPane.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChartPane.useEffect": ()=>{
            const el = tfScrollRef.current;
            if (el) {
                checkTfScroll();
                el.addEventListener('scroll', checkTfScroll);
                const observer = new ResizeObserver({
                    "ChartPane.useEffect": ()=>checkTfScroll()
                }["ChartPane.useEffect"]);
                observer.observe(el);
                return ({
                    "ChartPane.useEffect": ()=>{
                        el.removeEventListener('scroll', checkTfScroll);
                        observer.disconnect();
                    }
                })["ChartPane.useEffect"];
            }
        }
    }["ChartPane.useEffect"], []);
    const [ohlc, setOhlc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // --- MANAGE OUTGOING EVENTS (Source) ---
    const handleCallbackTimeframeChange = (tf)=>{
        updatePane(workspaceId, pane.id, {
            timeframe: tf
        });
        // Broadcast sync
        __turbopack_context__.A("[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript, async loader)").then(({ LayoutStateManager })=>{
            LayoutStateManager.getInstance().syncTimeframe(pane.id, tf);
        });
    };
    const handleCallbackCrosshairMove = (time, priceA, priceB)=>{
        if (time) {
            __turbopack_context__.A("[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript, async loader)").then(({ LayoutStateManager })=>{
                LayoutStateManager.getInstance().syncCrosshair(pane.id, time, priceA || 0);
            });
        }
    };
    const handleCallbackVisibleRangeChange = (range)=>{
        __turbopack_context__.A("[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript, async loader)").then(({ LayoutStateManager })=>{
            LayoutStateManager.getInstance().syncScroll(pane.id, range);
        });
    };
    const handleCallbackLogicalRangeChange = (logicalRange)=>{
        const currentRange = {
            from: 0,
            to: 0
        }; // We only need logical range for primary sync
        if (logicalRange) {
            lastLogicalRangeRef.current = logicalRange;
        }
        __turbopack_context__.A("[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript, async loader)").then(({ LayoutStateManager })=>{
            LayoutStateManager.getInstance().syncScroll(pane.id, currentRange, {
                from: logicalRange.from,
                to: logicalRange.to,
                anchorTime: logicalRange.anchorTime,
                whitespaceOffset: logicalRange.whitespaceOffset
            });
        });
    };
    // --- INDICATOR HANDLERS ---
    const handleAddIndicator = (defId)=>{
        const def = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].get(defId);
        if (!def) return;
        // Create new instance (generic add, unique instance IDs)
        const newItem = {
            instanceId: `${defId}_${Date.now()}`,
            defId: defId,
            settings: {
                ...def.defaultSettings
            },
            visible: true
        };
        const newIndicators = [
            ...activeIndicators,
            newItem
        ];
        setActiveIndicators(newIndicators);
        // Save to Persistent Store
        updatePane(workspaceId, pane.id, {
            indicators: newIndicators
        });
        // Open Settings
        setEditingIndicatorId(newItem.instanceId);
    };
    const handleSaveSettings = (newSettings)=>{
        if (!editingIndicatorId) return;
        const newIndicators = activeIndicators.map((ind)=>{
            if (ind.instanceId === editingIndicatorId) {
                return {
                    ...ind,
                    settings: newSettings
                };
            }
            return ind;
        });
        setActiveIndicators(newIndicators);
        setEditingIndicatorId(null);
        // Save to Persistent Store
        updatePane(workspaceId, pane.id, {
            indicators: newIndicators
        });
    };
    const handleRemoveIndicator = (id)=>{
        const newIndicators = activeIndicators.filter((i)=>i.instanceId !== id);
        setActiveIndicators(newIndicators);
        if (editingIndicatorId === id) setEditingIndicatorId(null);
        // Save to Persistent Store
        updatePane(workspaceId, pane.id, {
            indicators: newIndicators
        });
    };
    // Get Definition for editing
    const handleToggleVisibility = (id)=>{
        const newIndicators = activeIndicators.map((ind)=>{
            if (ind.instanceId === id) {
                return {
                    ...ind,
                    visible: ind.visible === undefined ? false : !ind.visible
                };
            }
            return ind;
        });
        setActiveIndicators(newIndicators);
        // Save to Persistent Store
        updatePane(workspaceId, pane.id, {
            indicators: newIndicators
        });
    };
    const editingInd = activeIndicators.find((i)=>i.instanceId === editingIndicatorId);
    const editingDef = editingInd ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].get(editingInd.defId) : null;
    // --- THEME CONTEXT ---
    const { mode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"])();
    const isDark = mode === 'dark';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const mutedColor = isDark ? 'text-slate-500' : 'text-slate-400';
    const iconColor = isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900';
    const borderColor = isDark ? 'hover:border-slate-700' : 'hover:border-slate-300';
    // RESTORE RANGE ON MAXIMIZE/MINIMIZE
    // When isMaximized changes, the component effectively moves in the DOM.
    // LWC might reset. We force re-apply the last known logical range after a brief delay to allow resize to settle.
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useLayoutEffect({
        "ChartPane.useLayoutEffect": ()=>{
            if (lastLogicalRangeRef.current && chartRef.current) {
                const saved = lastLogicalRangeRef.current;
                // Small timeout to allow the resize observer in ChartContainer to fire first
                const t = setTimeout({
                    "ChartPane.useLayoutEffect.t": ()=>{
                        if (chartRef.current) {
                            chartRef.current.setLogicalRange({
                                from: saved.from,
                                to: saved.to
                            });
                        }
                    }
                }["ChartPane.useLayoutEffect.t"], 50);
                return ({
                    "ChartPane.useLayoutEffect": ()=>clearTimeout(t)
                })["ChartPane.useLayoutEffect"];
            }
        }
    }["ChartPane.useLayoutEffect"], [
        isMaximized
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `
                flex flex-col w-full h-full overflow-hidden bg-white dark:bg-slate-950 transition-all duration-200 group
                ${isMaximized ? 'fixed inset-0 z-[9999] border-0' : `relative ${pane.isActive ? 'border-2 border-blue-500 z-10' : 'border border-slate-200 dark:border-slate-800'}`}
            `,
        // Remove 100vw/100vh inline styles as fixed inset-0 handles it better without causing scrollbars
        onClick: (e)=>{
            // Alt + Click to Toggle Maximize
            if (e.altKey && !e.shiftKey && !e.ctrlKey) {
                e.stopPropagation();
                toggleMaximizePane(workspaceId, pane.id);
                return;
            }
            handleFocus();
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$ChartOverlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartOverlay"], {
                ref: overlayRef,
                symbol: pane.symbol,
                timeframe: pane.timeframe,
                timezone: timezone,
                onSymbolChange: (s)=>updatePane(workspaceId, pane.id, {
                        symbol: s
                    }),
                onTimeframeChange: handleCallbackTimeframeChange,
                onTimezoneChange: (tz)=>setTimezone(tz),
                onAddIndicator: handleAddIndicator,
                botId: botId,
                ohlc: ohlc,
                precision: precision,
                status: syncStatus
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                lineNumber: 387,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-h-0 relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$ChartContainer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartContainer"], {
                        ref: chartRef,
                        symbol: pane.symbol,
                        symbolB: "",
                        dataA: data,
                        dataB: [],
                        timeframe: pane.timeframe,
                        height: "100%",
                        isLoading: isLoading && data.length === 0,
                        precision: precision,
                        horizonData: horizonData,
                        accounts: accounts,
                        botId: botId,
                        isActive: pane.isActive,
                        timezone: timezone,
                        onOHLCChange: setOhlc,
                        onCrosshairMove: handleCallbackCrosshairMove,
                        // onVisibleRangeChange={handleCallbackVisibleRangeChange} // Disabled to prevent Time-Sync Jitter. We rely on LogicalRange.
                        onVisibleLogicalRangeChange: handleCallbackLogicalRangeChange,
                        activeIndicators: activeIndicators,
                        paneId: pane.id,
                        onChartClick: handleFocus,
                        scrollToTimeRequest: pane.scrollToTimeRequest,
                        isChartReady: isChartReady && data.length > 0,
                        syncError: syncError
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                        lineNumber: 404,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-[50px] left-1 flex flex-col items-start gap-0.5 z-20 pointer-events-auto select-none",
                        children: activeIndicators.map((ind)=>{
                            const def = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$indicators$2f$IndicatorRegistry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["indicatorRegistry"].get(ind.defId);
                            // Adapted Text Colors based on Chart Theme
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex items-center gap-1 group/legend px-1 py-0.5 border border-transparent rounded ${borderColor} transition-all`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-sm cursor-default ${ind.visible === false ? `${mutedColor} line-through decoration-slate-500` : textColor}`,
                                        children: def?.name || ind.defId
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                        lineNumber: 440,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-0 opacity-0 group-hover/legend:opacity-100 transition-opacity duration-200 ml-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: (e)=>{
                                                    e.stopPropagation();
                                                    handleToggleVisibility(ind.instanceId);
                                                },
                                                className: `${iconColor} p-0.5 transition-colors`,
                                                title: ind.visible === false ? "Show" : "Hide",
                                                children: ind.visible === false ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2d$off$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__EyeOff$3e$__["EyeOff"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                                    lineNumber: 449,
                                                    columnNumber: 66
                                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                                    lineNumber: 449,
                                                    columnNumber: 89
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                                lineNumber: 444,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: (e)=>{
                                                    e.stopPropagation();
                                                    setEditingIndicatorId(ind.instanceId);
                                                },
                                                className: `${iconColor} p-0.5 transition-colors`,
                                                title: "Settings",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                                    size: 14
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                                    lineNumber: 456,
                                                    columnNumber: 41
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                                lineNumber: 451,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: (e)=>{
                                                    e.stopPropagation();
                                                    handleRemoveIndicator(ind.instanceId);
                                                },
                                                className: `${iconColor} p-0.5 transition-colors`,
                                                title: "Close",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                    size: 12,
                                                    strokeWidth: 3
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                                    lineNumber: 464,
                                                    columnNumber: 41
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                                lineNumber: 458,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                        lineNumber: 443,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, ind.instanceId, true, {
                                fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                                lineNumber: 437,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0));
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                        lineNumber: 432,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    editingInd && editingDef && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$settings$2f$IndicatorSettingsDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IndicatorSettingsDialog"], {
                        isOpen: true,
                        onClose: ()=>setEditingIndicatorId(null),
                        onSave: handleSaveSettings,
                        definition: {
                            name: editingDef.name,
                            settingsSchema: editingDef.settingsSchema
                        },
                        currentSettings: editingInd.settings
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                        lineNumber: 474,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/ChartPane.tsx",
                lineNumber: 403,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/ChartPane.tsx",
        lineNumber: 367,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ChartPane, "6gfEsviCdbIc2xCxwRVJbrNVnYc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useChartRegistryStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartRegistryStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useSymbolStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSymbolStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useChartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartData"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"]
    ];
});
_c = ChartPane;
var _c;
__turbopack_context__.k.register(_c, "ChartPane");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/workspaces/LayoutGrid.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LayoutGrid",
    ()=>LayoutGrid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$ChartPane$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/ChartPane.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-resizable-panels/dist/react-resizable-panels.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const DraggableGutter = ({ direction = "horizontal", onDoubleClick })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Separator"], {
        className: `
        relative flex items-center justify-center
        ${direction === 'horizontal' ? 'w-1 cursor-col-resize hover:bg-blue-500/20' : 'h-1 cursor-row-resize hover:bg-blue-500/20'}
        group outline-none transition-colors duration-200
    `,
        onDoubleClick: onDoubleClick,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `
            absolute bg-slate-200 dark:bg-slate-800 transition-colors duration-200
            group-hover:bg-blue-500 group-active:bg-blue-600
            ${direction === 'horizontal' ? 'w-1 h-full' : 'h-1 w-full'}
            z-10
        `
        }, void 0, false, {
            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
            lineNumber: 23,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c = DraggableGutter;
const LayoutGrid = ({ botId, accounts })=>{
    _s();
    const { workspaces, activeWorkspaceId, updateLayoutSizes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])();
    // State to force remount of PanelGroups by changing their key
    const [groupVersions, setGroupVersions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const activeWorkspace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "LayoutGrid.useMemo[activeWorkspace]": ()=>workspaces.find({
                "LayoutGrid.useMemo[activeWorkspace]": (w)=>w.id === activeWorkspaceId
            }["LayoutGrid.useMemo[activeWorkspace]"])
    }["LayoutGrid.useMemo[activeWorkspace]"], [
        workspaces,
        activeWorkspaceId
    ]);
    const { layoutType, panes, layoutSizes = [] } = activeWorkspace || {};
    const getPaneId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LayoutGrid.useCallback[getPaneId]": (index)=>{
            if (!panes) return `pane-fallback-${index}`;
            return panes[index]?.id || `pane-fallback-${index}`;
        }
    }["LayoutGrid.useCallback[getPaneId]"], [
        panes
    ]);
    // Helper to merge new sizes into the flat layoutSizes array
    const handleLayoutChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LayoutGrid.useCallback[handleLayoutChange]": (indices, ids, layoutMap)=>{
            if (!activeWorkspace) return;
            const currentSizes = [
                ...activeWorkspace.layoutSizes || []
            ];
            // Ensure array is large enough
            while(currentSizes.length < 6)currentSizes.push(50);
            // Map the IDs back to the indices provided
            indices.forEach({
                "LayoutGrid.useCallback[handleLayoutChange]": (globalIndex, i)=>{
                    const id = ids[i];
                    if (layoutMap[id] !== undefined) {
                        currentSizes[globalIndex] = layoutMap[id];
                    }
                }
            }["LayoutGrid.useCallback[handleLayoutChange]"]);
            updateLayoutSizes(activeWorkspace.id, currentSizes);
        }
    }["LayoutGrid.useCallback[handleLayoutChange]"], [
        activeWorkspace,
        updateLayoutSizes
    ]);
    const handleResetLayout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LayoutGrid.useCallback[handleResetLayout]": (groupId, indices, targetValue = 50)=>{
            if (!activeWorkspace) return;
            const currentSizes = [
                ...activeWorkspace.layoutSizes || []
            ];
            // Ensure array is large enough
            while(currentSizes.length < 6)currentSizes.push(50);
            indices.forEach({
                "LayoutGrid.useCallback[handleResetLayout]": (index)=>{
                    currentSizes[index] = targetValue;
                }
            }["LayoutGrid.useCallback[handleResetLayout]"]);
            // 1. Update persisted store
            updateLayoutSizes(activeWorkspace.id, currentSizes);
            // 2. Force remount of the specific group
            setGroupVersions({
                "LayoutGrid.useCallback[handleResetLayout]": (prev)=>({
                        ...prev,
                        [groupId]: (prev[groupId] || 0) + 1
                    })
            }["LayoutGrid.useCallback[handleResetLayout]"]);
        }
    }["LayoutGrid.useCallback[handleResetLayout]"], [
        activeWorkspace,
        updateLayoutSizes
    ]);
    const getSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LayoutGrid.useCallback[getSize]": (index, defaultVal = 50)=>{
            return (layoutSizes && layoutSizes[index]) ?? defaultVal;
        }
    }["LayoutGrid.useCallback[getSize]"], [
        layoutSizes
    ]);
    const renderPane = (index)=>{
        if (!panes || !activeWorkspace) return null;
        const pane = panes[index];
        if (!pane) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-slate-50 dark:bg-slate-900 w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600",
            children: "Empty Pane"
        }, void 0, false, {
            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
            lineNumber: 96,
            columnNumber: 27
        }, ("TURBOPACK compile-time value", void 0));
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full h-full bg-white dark:bg-slate-900 overflow-hidden",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$ChartPane$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartPane"], {
                workspaceId: activeWorkspace.id,
                pane: pane,
                botId: botId,
                accounts: accounts
            }, pane.id, false, {
                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                lineNumber: 99,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
            lineNumber: 98,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0));
    };
    if (!activeWorkspace) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-10 text-center text-slate-500",
            children: "No active workspace"
        }, void 0, false, {
            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
            lineNumber: 111,
            columnNumber: 16
        }, ("TURBOPACK compile-time value", void 0));
    }
    // --- RENDERERS ---
    const layoutContent = ()=>{
        if (layoutType === 'single') {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-full bg-white dark:bg-slate-950",
                children: renderPane(0)
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                lineNumber: 119,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0));
        }
        if (layoutType === 'split-vertical') {
            const ids = [
                getPaneId(0),
                getPaneId(1)
            ];
            const groupId = 'main-group';
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-full bg-slate-950",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                    orientation: "horizontal",
                    onLayoutChanged: (l)=>handleLayoutChange([
                            0,
                            1
                        ], ids, l),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                            id: ids[0],
                            defaultSize: getSize(0),
                            minSize: 10,
                            className: "",
                            children: renderPane(0)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 135,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggableGutter, {
                            direction: "horizontal",
                            onDoubleClick: ()=>handleResetLayout(groupId, [
                                    0,
                                    1
                                ], 50)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 138,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                            id: ids[1],
                            defaultSize: getSize(1),
                            minSize: 10,
                            className: "",
                            children: renderPane(1)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 142,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, `${groupId}-${groupVersions[groupId] || 0}`, true, {
                    fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                    lineNumber: 130,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                lineNumber: 129,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0));
        }
        if (layoutType === 'split-horizontal') {
            const ids = [
                getPaneId(0),
                getPaneId(1)
            ];
            const groupId = 'main-group';
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-full bg-slate-950",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                    orientation: "vertical",
                    onLayoutChanged: (l)=>handleLayoutChange([
                            0,
                            1
                        ], ids, l),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                            id: ids[0],
                            defaultSize: getSize(0),
                            minSize: 10,
                            className: "",
                            children: renderPane(0)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 160,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggableGutter, {
                            direction: "vertical",
                            onDoubleClick: ()=>handleResetLayout(groupId, [
                                    0,
                                    1
                                ], 50)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 163,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                            id: ids[1],
                            defaultSize: getSize(1),
                            minSize: 10,
                            className: "",
                            children: renderPane(1)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 167,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, `${groupId}-${groupVersions[groupId] || 0}`, true, {
                    fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                    lineNumber: 155,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                lineNumber: 154,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0));
        }
        if (layoutType === 'grid-2x2') {
            // IDs for columns and cells
            const colIds = [
                'col-0',
                'col-1'
            ];
            const leftIds = [
                getPaneId(0),
                getPaneId(2)
            ];
            const rightIds = [
                getPaneId(1),
                getPaneId(3)
            ];
            const mainGroupId = 'main-group';
            const leftGroupId = 'left-col-group';
            const rightGroupId = 'right-col-group';
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-full bg-white dark:bg-slate-950",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                    orientation: "horizontal",
                    onLayoutChanged: (l)=>handleLayoutChange([
                            0,
                            1
                        ], colIds, l),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                            id: colIds[0],
                            defaultSize: getSize(0),
                            minSize: 10,
                            className: "flex flex-col",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                                orientation: "vertical",
                                onLayoutChanged: (l)=>handleLayoutChange([
                                        2,
                                        3
                                    ], leftIds, l),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                                        id: leftIds[0],
                                        defaultSize: getSize(2),
                                        minSize: 10,
                                        className: "",
                                        children: renderPane(0)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 199,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggableGutter, {
                                        direction: "vertical",
                                        onDoubleClick: ()=>handleResetLayout(leftGroupId, [
                                                2,
                                                3
                                            ], 50)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 202,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                                        id: leftIds[1],
                                        defaultSize: getSize(3),
                                        minSize: 10,
                                        className: "",
                                        children: renderPane(2)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 206,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, `${leftGroupId}-${groupVersions[leftGroupId] || 0}`, true, {
                                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                lineNumber: 194,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 193,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggableGutter, {
                            direction: "horizontal",
                            onDoubleClick: ()=>handleResetLayout(mainGroupId, [
                                    0,
                                    1
                                ], 50)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 212,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                            id: colIds[1],
                            defaultSize: getSize(1),
                            minSize: 10,
                            className: "flex flex-col",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                                orientation: "vertical",
                                onLayoutChanged: (l)=>handleLayoutChange([
                                        4,
                                        5
                                    ], rightIds, l),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                                        id: rightIds[0],
                                        defaultSize: getSize(4),
                                        minSize: 10,
                                        className: "",
                                        children: renderPane(1)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 224,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggableGutter, {
                                        direction: "vertical",
                                        onDoubleClick: ()=>handleResetLayout(rightGroupId, [
                                                4,
                                                5
                                            ], 50)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 227,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                                        id: rightIds[1],
                                        defaultSize: getSize(5),
                                        minSize: 10,
                                        className: "",
                                        children: renderPane(3)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 231,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, `${rightGroupId}-${groupVersions[rightGroupId] || 0}`, true, {
                                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                lineNumber: 219,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 218,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, `${mainGroupId}-${groupVersions[mainGroupId] || 0}`, true, {
                    fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                    lineNumber: 187,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                lineNumber: 186,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0));
        }
        if (layoutType === 'grid-1-2') {
            const colIds = [
                'col-main',
                'col-split'
            ];
            const subIds = [
                getPaneId(1),
                getPaneId(2)
            ];
            const mainGroupId = 'main-group';
            const subGroupId = 'sub-split-group';
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-full bg-white dark:bg-slate-950",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                    orientation: "horizontal",
                    onLayoutChanged: (l)=>handleLayoutChange([
                            0,
                            1
                        ], colIds, l),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                            id: colIds[0],
                            defaultSize: getSize(0, 66),
                            minSize: 20,
                            className: "",
                            children: renderPane(0)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 256,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggableGutter, {
                            direction: "horizontal",
                            onDoubleClick: ()=>handleResetLayout(mainGroupId, [
                                    0,
                                    1
                                ], 50)
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 260,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                            id: colIds[1],
                            defaultSize: getSize(1, 34),
                            minSize: 20,
                            className: "flex flex-col",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                                orientation: "vertical",
                                onLayoutChanged: (l)=>handleLayoutChange([
                                        2,
                                        3
                                    ], subIds, l),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                                        id: subIds[0],
                                        defaultSize: getSize(2),
                                        minSize: 10,
                                        className: "",
                                        children: renderPane(1)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 272,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggableGutter, {
                                        direction: "vertical",
                                        onDoubleClick: ()=>handleResetLayout(subGroupId, [
                                                2,
                                                3
                                            ], 50)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 275,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$resizable$2d$panels$2f$dist$2f$react$2d$resizable$2d$panels$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
                                        id: subIds[1],
                                        defaultSize: getSize(3),
                                        minSize: 10,
                                        className: "",
                                        children: renderPane(2)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                        lineNumber: 279,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, `${subGroupId}-${groupVersions[subGroupId] || 0}`, true, {
                                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                                lineNumber: 267,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                            lineNumber: 266,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, `${mainGroupId}-${groupVersions[mainGroupId] || 0}`, true, {
                    fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                    lineNumber: 250,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
                lineNumber: 249,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0));
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: "Unknown Layout"
        }, void 0, false, {
            fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
            lineNumber: 289,
            columnNumber: 16
        }, ("TURBOPACK compile-time value", void 0));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        id: "workspace-grid-root",
        className: "relative w-full h-full",
        children: layoutContent()
    }, void 0, false, {
        fileName: "[project]/src/components/workspaces/LayoutGrid.tsx",
        lineNumber: 293,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(LayoutGrid, "1mK+XDbpm8YBk+12gaxsZ9ovTtM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"]
    ];
});
_c1 = LayoutGrid;
var _c, _c1;
__turbopack_context__.k.register(_c, "DraggableGutter");
__turbopack_context__.k.register(_c1, "LayoutGrid");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/workspaces/DrawingSidebar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DrawingSidebar",
    ()=>DrawingSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useChartRegistryStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useChartRegistryStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$MagnetControl$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/MagnetControl.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mouse-pointer-2.js [app-client] (ecmascript) <export default as MousePointer2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Minus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/minus.js [app-client] (ecmascript) <export default as Minus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-client] (ecmascript) <export default as ArrowRight>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
/**
 * TV Style Icons (Projection Style)
 */ const LongPosIcon = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        className: "pointer-events-none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 5h13",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 16,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 12h13",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 17,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 19h13",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 18,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "4",
                cy: "5",
                r: "2"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 19,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "4",
                cy: "12",
                r: "2"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 20,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "4",
                cy: "19",
                r: "2"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 21,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 19L20 5",
                strokeDasharray: "3 3"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 22,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c = LongPosIcon;
const ShortPosIcon = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        className: "pointer-events-none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 5h13",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 28,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 12h13",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 29,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 19h13",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 30,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "4",
                cy: "5",
                r: "2"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 31,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "4",
                cy: "12",
                r: "2"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 32,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "4",
                cy: "19",
                r: "2"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 33,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 5L20 19",
                strokeDasharray: "3 3"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 34,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c1 = ShortPosIcon;
const DrawingSidebar = ()=>{
    _s();
    const { activeWorkspaceId, workspaces } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])();
    const { getChart } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useChartRegistryStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartRegistryStore"])();
    // Helper to execute command on active pane
    const executeOnActiveChart = (callback)=>{
        const workspace = workspaces.find((w)=>w.id === activeWorkspaceId);
        if (!workspace) return;
        // Diagnostic: Check for multiple active panes
        const activePanes = workspace.panes.filter((p)=>p.isActive);
        if (activePanes.length > 1) {
            console.warn(`[DrawingSidebar] CRITICAL: Multiple panes are active! IDs: ${activePanes.map((p)=>p.id).join(', ')}`);
        }
        const activePane = activePanes[0];
        if (!activePane) {
            alert("No active chart selected.");
            return;
        }
        console.log(`[DrawingSidebar] Targeting Active Pane: ${activePane.id}`);
        const chartHandle = getChart(activePane.id);
        if (!chartHandle) {
            console.error(`[DrawingSidebar] No handle found for pane ${activePane.id}`);
            return;
        }
        const widget = chartHandle.getWidget();
        if (widget) {
            // Optional: Check if widget ID matches pane ID (requires updating ChartWidget)
            if (widget.id && widget.id !== activePane.id) {
                console.error(`[DrawingSidebar] ID MISMATCH! Pane: ${activePane.id}, Widget: ${widget.id}`);
            }
            callback(widget, activePane);
        } else {
            console.error(`[DrawingSidebar] Handle found but getWidget() returned null for pane ${activePane.id}`);
        }
    };
    const handleToolClick = (toolName)=>{
        executeOnActiveChart((widget, pane)=>{
            const data = widget._data;
            if (!data || data.length === 0) {
                alert("No data available to place object.");
                return;
            }
            const latest = data[data.length - 1];
            if (!latest) return;
            const time = latest.time;
            const price = latest.close;
            // Mapping
            let shapeType = '';
            let overrides = {};
            if (toolName === 'HorizontalLine') shapeType = 'HorizontalLine';
            if (toolName === 'HorizontalRay') shapeType = 'HorizontalRay';
            if (toolName === 'VerticalLine') shapeType = 'VerticalLine';
            if (toolName === 'Long') shapeType = 'Riskrewardlong';
            if (toolName === 'Short') shapeType = 'Riskrewardshort';
            if (shapeType) {
                widget.createShape({
                    time,
                    price
                }, {
                    shape: shapeType,
                    overrides,
                    disableSelection: false
                });
                console.log(`[DrawingSidebar] Created ${shapeType} at ${time}, ${price}`);
            }
        });
    };
    const btnClass = "p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-slate-500 dark:text-slate-400";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center gap-4 py-4 w-16 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 relative z-[100] pointer-events-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>handleToolClick('Cursor'),
                className: btnClass,
                title: "Crosshair",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer2$3e$__["MousePointer2"], {
                    size: 20,
                    strokeWidth: 1.5,
                    className: "pointer-events-none"
                }, void 0, false, {
                    fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                    lineNumber: 123,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 118,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-6 h-px bg-slate-200 dark:bg-slate-800"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 126,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleToolClick('HorizontalLine'),
                        className: btnClass,
                        title: "Horizontal Line",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Minus$3e$__["Minus"], {
                            size: 20,
                            strokeWidth: 1.5,
                            className: "pointer-events-none"
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                            lineNumber: 135,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                        lineNumber: 130,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleToolClick('VerticalLine'),
                        className: btnClass,
                        title: "Vertical Line",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Minus$3e$__["Minus"], {
                            size: 20,
                            strokeWidth: 1.5,
                            className: "pointer-events-none rotate-90"
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                            lineNumber: 142,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                        lineNumber: 137,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleToolClick('HorizontalRay'),
                        className: btnClass,
                        title: "Horizontal Ray",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                            size: 20,
                            strokeWidth: 1.5,
                            className: "pointer-events-none"
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                            lineNumber: 149,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                        lineNumber: 144,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 129,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-6 h-px bg-slate-200 dark:bg-slate-800"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 153,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleToolClick('Long'),
                        className: btnClass,
                        title: "Long Position",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LongPosIcon, {}, void 0, false, {
                            fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                            lineNumber: 162,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                        lineNumber: 157,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleToolClick('Short'),
                        className: btnClass,
                        title: "Short Position",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ShortPosIcon, {}, void 0, false, {
                            fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                            lineNumber: 169,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                        lineNumber: 164,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 156,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-6 h-px bg-slate-200 dark:bg-slate-800"
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 173,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "scale-75 origin-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$MagnetControl$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MagnetControl"], {
                    side: "right"
                }, void 0, false, {
                    fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                    lineNumber: 177,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
                lineNumber: 176,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/DrawingSidebar.tsx",
        lineNumber: 116,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(DrawingSidebar, "M86Yn14K8u61a1vLE8/sL1y3l3k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useChartRegistryStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartRegistryStore"]
    ];
});
_c2 = DrawingSidebar;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "LongPosIcon");
__turbopack_context__.k.register(_c1, "ShortPosIcon");
__turbopack_context__.k.register(_c2, "DrawingSidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/workspaces/LayoutSwitcher.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LayoutSwitcher",
    ()=>LayoutSwitcher
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square.js [app-client] (ecmascript) <export default as Square>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$columns$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Columns$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/columns-2.js [app-client] (ecmascript) <export default as Columns>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rows$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Rows$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rows-2.js [app-client] (ecmascript) <export default as Rows>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grid$2d$2x2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Grid2x2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/grid-2x2.js [app-client] (ecmascript) <export default as Grid2x2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$template$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutTemplate$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-template.js [app-client] (ecmascript) <export default as LayoutTemplate>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const LayoutSwitcher = ()=>{
    _s();
    const { activeWorkspaceId, updateWorkspaceLayout, workspaces } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])();
    const activeWorkspace = workspaces.find((w)=>w.id === activeWorkspaceId);
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Close on click outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LayoutSwitcher.useEffect": ()=>{
            const handleClickOutside = {
                "LayoutSwitcher.useEffect.handleClickOutside": (event)=>{
                    if (containerRef.current && !containerRef.current.contains(event.target)) {
                        setIsOpen(false);
                    }
                }
            }["LayoutSwitcher.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "LayoutSwitcher.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
            })["LayoutSwitcher.useEffect"];
        }
    }["LayoutSwitcher.useEffect"], []);
    if (!activeWorkspace) return null;
    const currentLayout = activeWorkspace.layoutType;
    const setLayout = (layout)=>{
        updateWorkspaceLayout(activeWorkspaceId, layout);
        setIsOpen(false);
    };
    const options = [
        {
            id: 'single',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                size: 14
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                lineNumber: 33,
                columnNumber: 31
            }, ("TURBOPACK compile-time value", void 0)),
            label: 'Single Config'
        },
        {
            id: 'split-vertical',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$columns$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Columns$3e$__["Columns"], {
                size: 14
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                lineNumber: 34,
                columnNumber: 39
            }, ("TURBOPACK compile-time value", void 0)),
            label: 'Split Vertical'
        },
        {
            id: 'split-horizontal',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rows$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Rows$3e$__["Rows"], {
                size: 14
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                lineNumber: 35,
                columnNumber: 41
            }, ("TURBOPACK compile-time value", void 0)),
            label: 'Split Horizontal'
        },
        {
            id: 'grid-2x2',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$grid$2d$2x2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Grid2x2$3e$__["Grid2x2"], {
                size: 14
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                lineNumber: 36,
                columnNumber: 33
            }, ("TURBOPACK compile-time value", void 0)),
            label: 'Grid 2x2'
        },
        {
            id: 'grid-1-2',
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$template$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutTemplate$3e$__["LayoutTemplate"], {
                size: 14
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                lineNumber: 37,
                columnNumber: 33
            }, ("TURBOPACK compile-time value", void 0)),
            label: 'Grid 1+2'
        }
    ];
    const activeOption = options.find((o)=>o.id === currentLayout) || options[0];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        ref: containerRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsOpen(!isOpen),
                className: "flex items-center gap-2 h-8 px-2 bg-transparent rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300",
                title: "Change Layout",
                children: [
                    activeOption.icon,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 12,
                        className: `transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                        lineNumber: 50,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                lineNumber: 44,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col py-1",
                children: options.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setLayout(opt.id),
                        className: `
                                flex items-center gap-3 px-3 py-2 w-full text-left transition-colors
                                ${currentLayout === opt.id ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                            `,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: currentLayout === opt.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500',
                                children: opt.icon
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                                lineNumber: 66,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-medium",
                                children: opt.label
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                                lineNumber: 69,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, opt.id, true, {
                        fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                        lineNumber: 56,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
                lineNumber: 54,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/LayoutSwitcher.tsx",
        lineNumber: 43,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(LayoutSwitcher, "fCLgnAOEp5N/zj3k+lj5FTJQxSw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"]
    ];
});
_c = LayoutSwitcher;
var _c;
__turbopack_context__.k.register(_c, "LayoutSwitcher");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/workspaces/FinancialToolbar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FinancialToolbar",
    ()=>FinancialToolbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$no$2d$axes$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-no-axes-column.js [app-client] (ecmascript) <export default as BarChart2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layers.js [app-client] (ecmascript) <export default as Layers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cpu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Cpu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/cpu.js [app-client] (ecmascript) <export default as Cpu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/briefcase.js [app-client] (ecmascript) <export default as Briefcase>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-client] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
const FinancialToolbar = ({ botId, isOnline, onToggleTrades, onToggleHistory, isTradesOpen, isHistoryOpen })=>{
    _s();
    const { activeWorkspaceId, workspaces } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-9 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 shrink-0 z-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onToggleTrades,
                        className: `flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${isTradesOpen ? "text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-900" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900"}`,
                        title: "Active Trades",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                                lineNumber: 33,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Trades"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                                lineNumber: 34,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                        lineNumber: 28,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onToggleHistory,
                        className: `flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${isHistoryOpen ? "text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-900" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900"}`,
                        title: "Trade History",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                                lineNumber: 41,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "History"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                                lineNumber: 42,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                        lineNumber: 36,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1"
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                        lineNumber: 45,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1 rounded transition-colors",
                        title: "Strategy Lab",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cpu$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Cpu$3e$__["Cpu"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                                lineNumber: 48,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Strategies"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                                lineNumber: 49,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                        lineNumber: 47,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1 rounded transition-colors",
                        title: "Performance",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$no$2d$axes$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart2$3e$__["BarChart2"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                                lineNumber: 52,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Stats"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                                lineNumber: 53,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                        lineNumber: 51,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                lineNumber: 27,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 text-[10px] text-slate-500 font-mono",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-1.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Layers$3e$__["Layers"], {
                            size: 10
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                            lineNumber: 60,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Workplace v2.1"
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                            lineNumber: 61,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                    lineNumber: 59,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
                lineNumber: 58,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/FinancialToolbar.tsx",
        lineNumber: 25,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(FinancialToolbar, "93LjgdjHvHKV/W1s7iTJ9Aq/zdU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"]
    ];
});
_c = FinancialToolbar;
var _c;
__turbopack_context__.k.register(_c, "FinancialToolbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/workspaces/SyncCenter.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SyncCenter",
    ()=>SyncCenter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$LayoutStateManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/LayoutStateManager.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/link.js [app-client] (ecmascript) <export default as Link>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/link-2.js [app-client] (ecmascript) <export default as Link2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scan$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ScanLine$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/scan-line.js [app-client] (ecmascript) <export default as ScanLine>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
const SyncCenter = ()=>{
    _s();
    const [options, setOptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isTimeframeSync: false,
        isPositionSync: false
    });
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const manager = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$LayoutStateManager$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LayoutStateManager"].getInstance();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SyncCenter.useEffect": ()=>{
            setOptions(manager.getOptions());
            // Simple polling to keep UI in sync if changed elsewhere
            const interval = setInterval({
                "SyncCenter.useEffect.interval": ()=>{
                    const current = manager.getOptions();
                    setOptions({
                        "SyncCenter.useEffect.interval": (prev)=>{
                            if (prev.isTimeframeSync !== current.isTimeframeSync || prev.isPositionSync !== current.isPositionSync) {
                                return current;
                            }
                            return prev;
                        }
                    }["SyncCenter.useEffect.interval"]);
                }
            }["SyncCenter.useEffect.interval"], 1000);
            return ({
                "SyncCenter.useEffect": ()=>clearInterval(interval)
            })["SyncCenter.useEffect"];
        }
    }["SyncCenter.useEffect"], []);
    // Close on click outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SyncCenter.useEffect": ()=>{
            const handleClickOutside = {
                "SyncCenter.useEffect.handleClickOutside": (event)=>{
                    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                        setIsOpen(false);
                    }
                }
            }["SyncCenter.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "SyncCenter.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
            })["SyncCenter.useEffect"];
        }
    }["SyncCenter.useEffect"], []);
    const toggleTimeframe = ()=>{
        const newVal = !options.isTimeframeSync;
        const newOpts = {
            ...options,
            isTimeframeSync: newVal
        };
        setOptions(newOpts);
        manager.setOptions({
            isTimeframeSync: newVal
        });
    };
    const togglePosition = ()=>{
        const newVal = !options.isPositionSync;
        const newOpts = {
            ...options,
            isPositionSync: newVal
        };
        setOptions(newOpts);
        manager.setOptions({
            isPositionSync: newVal
        });
    };
    const toggleTotalSync = ()=>{
        // If anything is off, turn all on. If all on, turn all off.
        const allOn = options.isTimeframeSync && options.isPositionSync;
        const newState = !allOn;
        const newOpts = {
            isTimeframeSync: newState,
            isPositionSync: newState
        };
        setOptions(newOpts);
        manager.setOptions(newOpts);
    };
    const isAnyActive = options.isTimeframeSync || options.isPositionSync;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        ref: dropdownRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `flex items-center h-8 rounded-md transition-all ${isAnyActive ? 'bg-blue-500/20 text-blue-400' : 'bg-transparent text-slate-400'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: toggleTotalSync,
                        className: `flex items-center justify-center pl-2 pr-1 h-full transition-colors rounded-l-md ${isAnyActive ? 'hover:bg-blue-500/30' : 'hover:bg-slate-800'}`,
                        title: isAnyActive ? "Disable All Sync" : "Enable All Sync",
                        children: isAnyActive ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link$3e$__["Link"], {
                            size: 14
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                            lineNumber: 74,
                            columnNumber: 36
                        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link2$3e$__["Link2"], {
                            size: 14
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                            lineNumber: 74,
                            columnNumber: 57
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                        lineNumber: 69,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setIsOpen(!isOpen),
                        className: `flex items-center justify-center px-1 h-full transition-colors rounded-r-md ${isAnyActive ? 'hover:bg-blue-500/30' : 'hover:bg-slate-800'}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                            size: 12
                        }, void 0, false, {
                            fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                            lineNumber: 82,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                        lineNumber: 78,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                lineNumber: 66,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-full right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col py-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between px-3 py-2 hover:bg-slate-800 cursor-pointer group",
                        onClick: toggleTimeframe,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 text-slate-300 group-hover:text-slate-100",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scan$2d$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ScanLine$3e$__["ScanLine"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                        lineNumber: 96,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-medium",
                                        children: "Timeframe"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                        lineNumber: 97,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                lineNumber: 95,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `w-8 h-4 rounded-full relative transition-colors ${options.isTimeframeSync ? 'bg-blue-600' : 'bg-slate-600'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${options.isTimeframeSync ? 'left-4.5' : 'left-0.5'}`,
                                    style: {
                                        left: options.isTimeframeSync ? 'calc(100% - 14px)' : '2px'
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                    lineNumber: 102,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                lineNumber: 101,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                        lineNumber: 91,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between px-3 py-2 hover:bg-slate-800 cursor-pointer group",
                        onClick: togglePosition,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 text-slate-300 group-hover:text-slate-100",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Link$3e$__["Link"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                        lineNumber: 112,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-medium",
                                        children: "Cross/Scroll"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                        lineNumber: 113,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                lineNumber: 111,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `w-8 h-4 rounded-full relative transition-colors ${options.isPositionSync ? 'bg-blue-600' : 'bg-slate-600'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all`,
                                    style: {
                                        left: options.isPositionSync ? 'calc(100% - 14px)' : '2px'
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                    lineNumber: 118,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                                lineNumber: 117,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                        lineNumber: 107,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
                lineNumber: 88,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/SyncCenter.tsx",
        lineNumber: 64,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(SyncCenter, "yhndhTcwFKmzs9gzVKF8vyQlpKQ=");
_c = SyncCenter;
var _c;
__turbopack_context__.k.register(_c, "SyncCenter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/workspaces/WorkspaceShell.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WorkspaceShell",
    ()=>WorkspaceShell
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$WorkspaceTabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/WorkspaceTabs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$LayoutGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/LayoutGrid.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$DrawingSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/DrawingSidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$LayoutSwitcher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/LayoutSwitcher.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$FinancialToolbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/FinancialToolbar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$SyncCenter$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/SyncCenter.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/settings.js [app-client] (ecmascript) <export default as Settings>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/maximize.js [app-client] (ecmascript) <export default as Maximize>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minimize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Minimize$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/minimize.js [app-client] (ecmascript) <export default as Minimize>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$live$2f$ChartSettingsDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/live/ChartSettingsDialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$modals$2f$GoToDateModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts/modals/GoToDateModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useWorkspaceStore.ts [app-client] (ecmascript)");
// ... imports ...
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$trades$2f$TradesPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/trades/TradesPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$trades$2f$HistoryPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/trades/HistoryPanel.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
;
;
;
;
;
const WorkspaceShell = ({ onNavigate, accounts, datafeedBotId, isDatafeedOnline, datafeedConfigError })=>{
    _s();
    const [isSettingsOpen, setIsSettingsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isGoToDateOpen, setIsGoToDateOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Panel States
    const [showTrades, setShowTrades] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showHistory, setShowHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Browser Title Logic: Use the symbol of the currently ACTIVE chart pane
    const activeSymbol = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])({
        "WorkspaceShell.useWorkspaceStore[activeSymbol]": (state)=>{
            const activeW = state.workspaces.find({
                "WorkspaceShell.useWorkspaceStore[activeSymbol].activeW": (w)=>w.id === state.activeWorkspaceId
            }["WorkspaceShell.useWorkspaceStore[activeSymbol].activeW"]);
            if (!activeW) return null;
            // Find the active pane, or fallback to the first one
            const activePane = activeW.panes.find({
                "WorkspaceShell.useWorkspaceStore[activeSymbol].activePane": (p)=>p.isActive
            }["WorkspaceShell.useWorkspaceStore[activeSymbol].activePane"]);
            return activePane?.symbol || activeW.panes?.[0]?.symbol;
        }
    }["WorkspaceShell.useWorkspaceStore[activeSymbol]"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WorkspaceShell.useEffect": ()=>{
            if (activeSymbol) {
                document.title = `${activeSymbol} | Awesome Cockpit`;
            } else {
                // Fallback handled by layout or page unmount, but good to reset
                document.title = 'Awesome Cockpit';
            }
        }
    }["WorkspaceShell.useEffect"], [
        activeSymbol
    ]);
    const [isFullscreen, setIsFullscreen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WorkspaceShell.useEffect": ()=>{
            const handleFullscreenChange = {
                "WorkspaceShell.useEffect.handleFullscreenChange": ()=>{
                    setIsFullscreen(!!document.fullscreenElement);
                }
            }["WorkspaceShell.useEffect.handleFullscreenChange"];
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            return ({
                "WorkspaceShell.useEffect": ()=>document.removeEventListener('fullscreenchange', handleFullscreenChange)
            })["WorkspaceShell.useEffect"];
        }
    }["WorkspaceShell.useEffect"], []);
    const toggleFullscreen = ()=>{
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };
    const handleGoToDate = (timestamp)=>{
        const state = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"].getState();
        const activeWorkspace = state.workspaces.find((w)=>w.id === state.activeWorkspaceId);
        if (activeWorkspace) {
            // Find active pane or default to first
            const activePane = activeWorkspace.panes.find((p)=>p.isActive) || activeWorkspace.panes[0];
            if (activePane) {
                state.requestScrollToTime(activePane.id, timestamp);
            }
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 justify-between flex-shrink-0 z-20 gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$WorkspaceTabs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WorkspaceTabs"], {}, void 0, false, {
                            fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                            lineNumber: 94,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                        lineNumber: 93,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 mr-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"].getState().setIsTestMode(false),
                                        className: `
                            px-3 py-1 rounded-sm text-[10px] font-bold transition-all
                            ${!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])({
                                            "WorkspaceShell.useWorkspaceStore": (state)=>state.isTestMode
                                        }["WorkspaceShell.useWorkspaceStore"]) ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}
                            `,
                                        children: "LIVE"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                        lineNumber: 102,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"].getState().setIsTestMode(true),
                                        className: `
                            px-3 py-1 rounded-sm text-[10px] font-bold transition-all
                            ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"])({
                                            "WorkspaceShell.useWorkspaceStore": (state)=>state.isTestMode
                                        }["WorkspaceShell.useWorkspaceStore"]) ? "bg-amber-500 text-black shadow" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}
                            `,
                                        children: "TEST"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                        lineNumber: 113,
                                        columnNumber: 25
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 101,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-px h-4 bg-slate-200 dark:bg-slate-700"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 126,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setIsGoToDateOpen(true),
                                className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors",
                                title: "Go to Date...",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                    lineNumber: 134,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 129,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-6 flex items-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$LayoutSwitcher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LayoutSwitcher"], {}, void 0, false, {
                                    fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                    lineNumber: 139,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 138,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-px h-4 bg-slate-200 dark:bg-slate-700"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 143,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$SyncCenter$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SyncCenter"], {}, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 146,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-px h-4 bg-slate-200 dark:bg-slate-700"
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 149,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: toggleFullscreen,
                                className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors",
                                title: isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
                                children: isFullscreen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$minimize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Minimize$3e$__["Minimize"], {
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                    lineNumber: 157,
                                    columnNumber: 41
                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize$3e$__["Maximize"], {
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                    lineNumber: 157,
                                    columnNumber: 66
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 152,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setIsSettingsOpen(true),
                                className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors",
                                title: "Global Chart Settings",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$settings$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Settings$3e$__["Settings"], {
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                    lineNumber: 165,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 160,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                        lineNumber: 98,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                lineNumber: 91,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 relative flex flex-row min-h-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$DrawingSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DrawingSidebar"], {}, void 0, false, {
                        fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                        lineNumber: 173,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-950",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 relative overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$LayoutGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LayoutGrid"], {
                                    botId: datafeedBotId,
                                    accounts: accounts
                                }, void 0, false, {
                                    fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                    lineNumber: 180,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 179,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            showTrades && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$trades$2f$TradesPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TradesPanel"], {
                                onClose: ()=>setShowTrades(false)
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 184,
                                columnNumber: 36
                            }, ("TURBOPACK compile-time value", void 0)),
                            showHistory && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$trades$2f$HistoryPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HistoryPanel"], {
                                onClose: ()=>setShowHistory(false)
                            }, void 0, false, {
                                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                                lineNumber: 185,
                                columnNumber: 37
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                        lineNumber: 176,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                lineNumber: 171,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$FinancialToolbar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FinancialToolbar"], {
                botId: datafeedBotId,
                isOnline: isDatafeedOnline,
                onToggleTrades: ()=>{
                    setShowTrades(!showTrades);
                    setShowHistory(false);
                },
                onToggleHistory: ()=>{
                    setShowHistory(!showHistory);
                    setShowTrades(false);
                },
                isTradesOpen: showTrades,
                isHistoryOpen: showHistory
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                lineNumber: 190,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$live$2f$ChartSettingsDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartSettingsDialog"], {
                isOpen: isSettingsOpen,
                onClose: ()=>setIsSettingsOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                lineNumber: 199,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2f$modals$2f$GoToDateModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GoToDateModal"], {
                isOpen: isGoToDateOpen,
                onClose: ()=>setIsGoToDateOpen(false),
                onGoTo: handleGoToDate
            }, void 0, false, {
                fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
                lineNumber: 204,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/workspaces/WorkspaceShell.tsx",
        lineNumber: 89,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(WorkspaceShell, "8GtLFinmfSeTXsv+EiD4j9jBuV4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useWorkspaceStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWorkspaceStore"]
    ];
});
_c = WorkspaceShell;
var _c;
__turbopack_context__.k.register(_c, "WorkspaceShell");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_workspaces_c54277fb._.js.map