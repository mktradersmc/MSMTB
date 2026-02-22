(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/live/SymbolBrowser.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SymbolBrowser",
    ()=>SymbolBrowser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useSymbolStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/stores/useSymbolStore.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const SymbolBrowser = /*#__PURE__*/ _s(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].forwardRef(_c = _s(({ onSelectSymbol, currentSymbol, className, botId, variant = 'input' }, ref)=>{
    _s();
    // Global Store
    const { symbols, symbolMap, isLoading, error, fetchSymbols } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useSymbolStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSymbolStore"])();
    const [filter, setFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const wrapperRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [dropdownSearch, setDropdownSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    // Expose close method
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useImperativeHandle(ref, {
        "SymbolBrowser.useImperativeHandle": ()=>({
                close: ({
                    "SymbolBrowser.useImperativeHandle": ()=>setIsOpen(false)
                })["SymbolBrowser.useImperativeHandle"]
            })
    }["SymbolBrowser.useImperativeHandle"]);
    // Portal Positioning State
    const [coords, setCoords] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Initial Load & Refetch on Bot Change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SymbolBrowser.useEffect": ()=>{
            fetchSymbols(botId);
        }
    }["SymbolBrowser.useEffect"], [
        botId,
        fetchSymbols
    ]);
    // Outside Click Handler (Updated for Portal)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SymbolBrowser.useEffect": ()=>{
            const handleClickOutside = {
                "SymbolBrowser.useEffect.handleClickOutside": (event)=>{
                    const target = event.target;
                    const clickedWrapper = wrapperRef.current && wrapperRef.current.contains(target);
                    const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(target);
                    if (!clickedWrapper && !clickedDropdown) {
                        setIsOpen(false);
                    }
                }
            }["SymbolBrowser.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "SymbolBrowser.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
            })["SymbolBrowser.useEffect"];
        }
    }["SymbolBrowser.useEffect"], []);
    // Reset dropdown search when opening
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SymbolBrowser.useEffect": ()=>{
            if (isOpen && variant === 'button') {
                setDropdownSearch('');
            }
        }
    }["SymbolBrowser.useEffect"], [
        isOpen,
        variant
    ]);
    // Calculate Position on Open
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "SymbolBrowser.useLayoutEffect": ()=>{
            if (isOpen && wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom - 10; // 10px buffer
                // Constrain height if space is limited, but ensure at least 150px usability if possible
                const maxHeight = Math.max(150, Math.min(400, spaceBelow));
                setCoords({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: 288,
                    maxHeight: maxHeight
                });
            }
        }
    }["SymbolBrowser.useLayoutEffect"], [
        isOpen
    ]);
    const handleRefresh = (e)=>{
        e.stopPropagation();
        fetchSymbols(botId);
    };
    const handleSelect = (sym)=>{
        const info = symbolMap.get(sym);
        onSelectSymbol(sym, info);
        setFilter('');
        setDropdownSearch('');
        setIsOpen(false);
    };
    const activeFilter = variant === 'button' ? dropdownSearch : filter;
    const filteredSymbols = symbols.filter((s)=>s && typeof s === 'string' && s.toLowerCase().includes(activeFilter.toLowerCase()));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: wrapperRef,
        className: `relative ${className || ''}`,
        children: [
            variant !== 'button' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative group",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                        className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                        lineNumber: 106,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        placeholder: currentSymbol || "Search Symbol...",
                        className: "w-64 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/50 rounded-lg py-2 pl-9 pr-10 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium",
                        value: filter,
                        onChange: (e)=>setFilter(e.target.value),
                        onFocus: ()=>setIsOpen(true)
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                        lineNumber: 107,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleRefresh,
                                className: "p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-colors",
                                title: "Refresh Symbols",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                    size: 12,
                                    className: isLoading ? "animate-spin" : ""
                                }, void 0, false, {
                                    fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                    lineNumber: 121,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                lineNumber: 116,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                size: 14,
                                className: `text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`
                            }, void 0, false, {
                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                lineNumber: 123,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                        lineNumber: 115,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                lineNumber: 105,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            variant === 'button' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setIsOpen(!isOpen),
                className: "flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-2 py-1 transition-colors group",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-start",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `text-sm font-bold ${currentSymbol ? 'text-slate-700 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`,
                            children: currentSymbol || "Select Symbol"
                        }, void 0, false, {
                            fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                            lineNumber: 135,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                        lineNumber: 134,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 12,
                        className: `text-slate-500 group-hover:text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                        lineNumber: 139,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                lineNumber: 130,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            isOpen && coords && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: dropdownRef,
                className: "symbol-browser-dropdown fixed bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col",
                style: {
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                    maxHeight: coords.maxHeight
                },
                children: [
                    variant === 'button' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-2 border-b border-slate-200 dark:border-slate-800/50 shrink-0",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                    className: "absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                    lineNumber: 160,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    autoFocus: true,
                                    type: "text",
                                    placeholder: "Search...",
                                    className: "w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md py-1.5 pl-8 pr-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500",
                                    value: dropdownSearch,
                                    onChange: (e)=>setDropdownSearch(e.target.value)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                    lineNumber: 161,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleRefresh,
                                    className: "absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-400",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                        size: 10,
                                        className: isLoading ? "animate-spin" : ""
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                        lineNumber: 173,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                    lineNumber: 169,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                            lineNumber: 159,
                            columnNumber: 29
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                        lineNumber: 158,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-blue-600 scrollbar-track-transparent flex-1",
                        children: [
                            isLoading && symbols.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 text-center text-xs text-slate-500 animate-pulse",
                                children: "Updating Market Watch..."
                            }, void 0, false, {
                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                lineNumber: 182,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 text-center text-xs text-red-500 font-medium bg-red-500/10 m-2 rounded",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                lineNumber: 185,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            !isLoading && !error && filteredSymbols.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 text-center text-xs text-slate-500",
                                children: "No matching symbols found."
                            }, void 0, false, {
                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                lineNumber: 190,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-1.5 space-y-0.5",
                                children: filteredSymbols.map((sym)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>handleSelect(sym),
                                        className: `w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all group flex items-center justify-between ${currentSymbol === sym ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: sym
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                                lineNumber: 206,
                                                columnNumber: 37
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            currentSymbol === sym && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                                lineNumber: 207,
                                                columnNumber: 63
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, sym, true, {
                                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                        lineNumber: 198,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0)))
                            }, void 0, false, {
                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                lineNumber: 196,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                        lineNumber: 179,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-slate-50 dark:bg-slate-950/50 px-3 py-2 border-t border-slate-200 dark:border-slate-800/50 text-[10px] text-slate-500 flex justify-between shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    filteredSymbols.length,
                                    " Symbols"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                lineNumber: 214,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "MT5 Live Feed"
                            }, void 0, false, {
                                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                                lineNumber: 215,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                        lineNumber: 213,
                        columnNumber: 21
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/live/SymbolBrowser.tsx",
                lineNumber: 145,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)), document.body)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/live/SymbolBrowser.tsx",
        lineNumber: 102,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
}, "gQRCG7X2XicgCgNzQmUM35+3JYg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useSymbolStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSymbolStore"]
    ];
})), "gQRCG7X2XicgCgNzQmUM35+3JYg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$stores$2f$useSymbolStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSymbolStore"]
    ];
});
_c1 = SymbolBrowser;
SymbolBrowser.displayName = 'SymbolBrowser';
var _c, _c1;
__turbopack_context__.k.register(_c, "SymbolBrowser$React.forwardRef");
__turbopack_context__.k.register(_c1, "SymbolBrowser");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/live/ChartSettingsDialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartSettingsDialog",
    ()=>ChartSettingsDialog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/ChartThemeContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ColorPalettePicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/ColorPalettePicker.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/ui/usePopoverPosition.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
const ChartSettingsDialog = ({ isOpen, onClose })=>{
    _s();
    const { theme, updateTheme, resetTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"])();
    if (!isOpen) return null;
    const handleUpdate = (section, key, value)=>{
        updateTheme({
            [section]: {
                ...theme[section],
                [key]: value
            }
        });
    };
    const handleGridUpdate = (axis, key, value)=>{
        updateTheme({
            grid: {
                ...theme.grid,
                [axis]: {
                    ...theme.grid[axis],
                    [key]: value
                }
            }
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-[600px] bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-12 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 bg-slate-50 dark:bg-slate-800/50",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "font-semibold text-slate-900 dark:text-slate-200 text-lg",
                            children: "Chart Settings"
                        }, void 0, false, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 46,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                lineNumber: 48,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 47,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                    lineNumber: 45,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-6 space-y-6 overflow-y-auto max-h-[600px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                            children: "Symbol"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                            lineNumber: 60,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col gap-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-end gap-5 px-1 mb-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[10px] uppercase font-bold text-slate-500 w-6 text-center",
                                                            children: "Buy"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 63,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[10px] uppercase font-bold text-slate-500 w-6 text-center",
                                                            children: "Sell"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 64,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 62,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DualColorRow, {
                                                    label: "Body",
                                                    upColor: theme.candles.upColor,
                                                    downColor: theme.candles.downColor,
                                                    onUpChange: (c)=>handleUpdate('candles', 'upColor', c),
                                                    onDownChange: (c)=>handleUpdate('candles', 'downColor', c)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 66,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DualColorRow, {
                                                    label: "Borders",
                                                    upColor: theme.candles.borderUpColor,
                                                    downColor: theme.candles.borderDownColor,
                                                    onUpChange: (c)=>handleUpdate('candles', 'borderUpColor', c),
                                                    onDownChange: (c)=>handleUpdate('candles', 'borderDownColor', c)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 71,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DualColorRow, {
                                                    label: "Wicks",
                                                    upColor: theme.candles.wickUpColor,
                                                    downColor: theme.candles.wickDownColor,
                                                    onUpChange: (c)=>handleUpdate('candles', 'wickUpColor', c),
                                                    onDownChange: (c)=>handleUpdate('candles', 'wickDownColor', c)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 76,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                            lineNumber: 61,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                    lineNumber: 59,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                            children: "Appearance"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                            lineNumber: 86,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col gap-4 pt-6",
                                            children: [
                                                " ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorControl, {
                                                    label: "Background",
                                                    color: typeof theme.layout.background === 'string' ? theme.layout.background : theme.layout.background.color,
                                                    onChange: (c)=>handleUpdate('layout', 'background', {
                                                            type: 'solid',
                                                            color: c
                                                        })
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 88,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorControl, {
                                                    label: "Text Color",
                                                    color: theme.layout.textColor,
                                                    onChange: (c)=>handleUpdate('layout', 'textColor', c)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 93,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorControl, {
                                                    label: "Crosshair",
                                                    color: theme.crosshair.color,
                                                    onChange: (c)=>handleUpdate('crosshair', 'color', c)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 98,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                            lineNumber: 87,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                    lineNumber: 85,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 56,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-px bg-slate-200 dark:bg-slate-800 w-full"
                        }, void 0, false, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 107,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                    children: "Grid Lines"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                    lineNumber: 111,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-8",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            checked: theme.grid.vertLines.visible,
                                                            onChange: (e)=>handleGridUpdate('vertLines', 'visible', e.target.checked),
                                                            className: "w-3.5 h-3.5 rounded border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-500 focus:ring-0 cursor-pointer"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 116,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-slate-700 dark:text-slate-300",
                                                            children: "Vert. Grid"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 122,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 115,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorControl, {
                                                            compact: true,
                                                            color: theme.grid.vertLines.color,
                                                            onChange: (c)=>handleGridUpdate('vertLines', 'color', c)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 125,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LineStyleDropdown, {
                                                            value: theme.grid.vertLines.style,
                                                            onChange: (s)=>handleGridUpdate('vertLines', 'style', s)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 126,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 124,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                            lineNumber: 114,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            checked: theme.grid.horzLines.visible,
                                                            onChange: (e)=>handleGridUpdate('horzLines', 'visible', e.target.checked),
                                                            className: "w-3.5 h-3.5 rounded border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-500 focus:ring-0 cursor-pointer"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 133,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-slate-700 dark:text-slate-300",
                                                            children: "Horz. Grid"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 139,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 132,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorControl, {
                                                            compact: true,
                                                            color: theme.grid.horzLines.color,
                                                            onChange: (c)=>handleGridUpdate('horzLines', 'color', c)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 142,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LineStyleDropdown, {
                                                            value: theme.grid.horzLines.style,
                                                            onChange: (s)=>handleGridUpdate('horzLines', 'style', s)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                            lineNumber: 143,
                                                            columnNumber: 37
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                                    lineNumber: 141,
                                                    columnNumber: 33
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                            lineNumber: 131,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                    lineNumber: 112,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 110,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-px bg-slate-200 dark:bg-slate-800 w-full"
                        }, void 0, false, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 149,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-8",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                        children: "Scales"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                        lineNumber: 154,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pt-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorControl, {
                                            label: "Border Color",
                                            color: theme.timeScale.borderColor,
                                            onChange: (c)=>{
                                                handleUpdate('timeScale', 'borderColor', c);
                                                handleUpdate('priceScale', 'borderColor', c);
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                            lineNumber: 156,
                                            columnNumber: 33
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                        lineNumber: 155,
                                        columnNumber: 29
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                lineNumber: 153,
                                columnNumber: 25
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 152,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                    lineNumber: 53,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-14 border-t border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                if (confirm('Reset all chart settings?')) resetTheme();
                            },
                            className: "flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-medium",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                    lineNumber: 176,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                " Reset Defaults"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 172,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-1.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm",
                            children: "OK"
                        }, void 0, false, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 179,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                    lineNumber: 171,
                    columnNumber: 17
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
            lineNumber: 43,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
        lineNumber: 42,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ChartSettingsDialog, "a5QXJ2arurF01K3//xsAP7SEWo4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$ChartThemeContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useChartTheme"]
    ];
});
_c = ChartSettingsDialog;
// --- SUB-COMPONENTS ---
const SectionTitle = ({ children })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
        className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest",
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
        lineNumber: 195,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c1 = SectionTitle;
// New Component: portal-based popup wrapper
const PortalPopup = ({ children, onClose, triggerRef, align = 'left' })=>{
    _s1();
    const { top, left, contentRef } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePopoverPosition"])({
        triggerRef,
        isOpen: true,
        gap: 6,
        contentHeight: 380 // Estimate, but dynamic will take over
    });
    if (typeof document === 'undefined') return null;
    // Adjust for alignment if 'right' (requires width knowledge or CSS transforms)
    // For now, left align is safer default.
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-[100]",
                onClick: onClose
            }, void 0, false, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 213,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: contentRef,
                className: "fixed z-[101]",
                style: {
                    top,
                    left
                },
                children: children
            }, void 0, false, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 214,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true), document.body);
};
_s1(PortalPopup, "c77IPSxwEEDQrDkI54xknMBCHB0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$ui$2f$usePopoverPosition$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePopoverPosition"]
    ];
});
_c2 = PortalPopup;
const ColorControl = ({ label, color, onChange, compact })=>{
    _s2();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const triggerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `relative flex items-center justify-between group ${compact ? '' : 'w-full gap-4'}`,
        children: [
            !compact && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-sm text-slate-700 dark:text-slate-300 font-medium",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 232,
                columnNumber: 26
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                ref: triggerRef,
                onClick: ()=>setIsOpen(!isOpen),
                className: "w-6 h-6 rounded border border-slate-300 dark:border-slate-600 p-0.5 hover:border-slate-400 dark:hover:border-slate-300 transition-colors relative overflow-hidden shrink-0 shadow-sm",
                title: label || color,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 z-0 opacity-20",
                        style: {
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M3 0h3v3H3zM0 3h3v3H0z'/%3E%3C/g%3E%3C/svg%3E")`
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                        lineNumber: 240,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full h-full rounded-[1px] relative z-10",
                        style: {
                            backgroundColor: color
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                        lineNumber: 243,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 234,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PortalPopup, {
                onClose: ()=>setIsOpen(false),
                triggerRef: triggerRef,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ColorPalettePicker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ColorPalettePicker"], {
                    color: color,
                    onChange: (c)=>{
                        onChange(c);
                        setIsOpen(false);
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                    lineNumber: 248,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 247,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
        lineNumber: 231,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s2(ColorControl, "+2azdcoF4TyeEByj7rXwUuXLXic=");
_c3 = ColorControl;
const DualColorRow = ({ label, upColor, downColor, onUpChange, onDownChange })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center justify-between py-1 px-1 hover:bg-slate-100 dark:hover:bg-slate-800/30 rounded",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-sm text-slate-700 dark:text-slate-300 font-medium",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 261,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorControl, {
                        compact: true,
                        color: upColor,
                        onChange: onUpChange
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                        lineNumber: 263,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ColorControl, {
                        compact: true,
                        color: downColor,
                        onChange: onDownChange
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                        lineNumber: 264,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 262,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
        lineNumber: 260,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_c4 = DualColorRow;
// Compact Line Style Dropdown
const LineStyleDropdown = ({ value, onChange })=>{
    _s3();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const triggerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const styles = [
        {
            val: 0,
            label: 'Solid',
            borderClass: 'border-b-2'
        },
        {
            val: 1,
            label: 'Dotted',
            borderClass: 'border-b-2 border-dotted'
        },
        {
            val: 2,
            label: 'Dashed',
            borderClass: 'border-b-2 border-dashed'
        },
        {
            val: 3,
            label: 'L.Dash',
            borderClass: 'border-b-4 border-dashed'
        }
    ];
    const current = styles.find((s)=>s.val === value) || styles[0];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                ref: triggerRef,
                onClick: ()=>setIsOpen(!isOpen),
                className: "flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 hover:border-slate-400 transition-colors h-6 w-20 justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `w-8 h-px ${current.borderClass} translate-y-[1px] border-slate-700 dark:border-slate-300`
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                        lineNumber: 292,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 12,
                        className: "text-slate-500 dark:text-slate-400"
                    }, void 0, false, {
                        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                        lineNumber: 293,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 286,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0)),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PortalPopup, {
                onClose: ()=>setIsOpen(false),
                triggerRef: triggerRef,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-xl flex flex-col p-1 gap-0.5 w-32 animate-in zoom-in-95 duration-100",
                    children: styles.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                onChange(s.val);
                                setIsOpen(false);
                            },
                            className: `flex items-center gap-3 px-3 py-2 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
                                    ${value === s.val ? 'text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300'}
                                `,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `w-8 h-px ${s.borderClass} translate-y-[1px] border-slate-700 dark:border-slate-300`
                                }, void 0, false, {
                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                    lineNumber: 307,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: s.label
                                }, void 0, false, {
                                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                                    lineNumber: 308,
                                    columnNumber: 33
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, s.val, true, {
                            fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                            lineNumber: 300,
                            columnNumber: 29
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                    lineNumber: 298,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
                lineNumber: 297,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/live/ChartSettingsDialog.tsx",
        lineNumber: 285,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
_s3(LineStyleDropdown, "+2azdcoF4TyeEByj7rXwUuXLXic=");
_c5 = LineStyleDropdown;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "ChartSettingsDialog");
__turbopack_context__.k.register(_c1, "SectionTitle");
__turbopack_context__.k.register(_c2, "PortalPopup");
__turbopack_context__.k.register(_c3, "ColorControl");
__turbopack_context__.k.register(_c4, "DualColorRow");
__turbopack_context__.k.register(_c5, "LineStyleDropdown");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/live/LiveChartPage.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LiveChartPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$WorkspaceShell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/workspaces/WorkspaceShell.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function LiveChartPage({ onNavigate }) {
    _s();
    const [accounts, setAccounts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [datafeedBotId, setDatafeedBotId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [datafeedConfigError, setDatafeedConfigError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isDatafeedOnline, setIsDatafeedOnline] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Fetch Configured Datafeed Bot & Accounts (Kept from original)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LiveChartPage.useEffect": ()=>{
            const resolveDatafeedBot = {
                "LiveChartPage.useEffect.resolveDatafeedBot": async ()=>{
                    try {
                        const [accRes, brokerRes] = await Promise.all([
                            fetch('/api/accounts'),
                            fetch('/api/brokers')
                        ]);
                        if (accRes.ok && brokerRes.ok) {
                            const accData = await accRes.json();
                            const accountsList = Array.isArray(accData) ? accData : accData.accounts || [];
                            const brokers = await brokerRes.json();
                            setAccounts(accountsList);
                            const feedAccount = accountsList.find({
                                "LiveChartPage.useEffect.resolveDatafeedBot.feedAccount": (a)=>a.accountType === 'DATAFEED' || a.isDatafeed
                            }["LiveChartPage.useEffect.resolveDatafeedBot.feedAccount"]);
                            if (feedAccount) {
                                const broker = brokers.find({
                                    "LiveChartPage.useEffect.resolveDatafeedBot.broker": (b)=>b.id === feedAccount.brokerId
                                }["LiveChartPage.useEffect.resolveDatafeedBot.broker"]);
                                if (broker) {
                                    const shorthand = broker.shorthand.replace(/\s+/g, '');
                                    let botId = `${shorthand}_${feedAccount.login}`;
                                    if (feedAccount.accountType === 'DATAFEED' || feedAccount.isDatafeed) {
                                        botId += '_DATAFEED';
                                    }
                                    setDatafeedBotId(botId);
                                    setDatafeedConfigError(false);
                                    return;
                                }
                            }
                        }
                        setDatafeedConfigError(true);
                        setDatafeedBotId('');
                    } catch (e) {
                        console.error("Bot Resolution Error", e);
                        setDatafeedConfigError(true);
                    }
                }
            }["LiveChartPage.useEffect.resolveDatafeedBot"];
            const checkStatus = {
                "LiveChartPage.useEffect.checkStatus": async ()=>{
                    try {
                        const res = await fetch(`http://127.0.0.1:3005/status/heartbeat`);
                        const data = await res.json();
                        if (data.success) {
                            if (datafeedBotId) {
                                const status = data.services[datafeedBotId];
                                const alive = status?.alive === true;
                                setIsDatafeedOnline(alive);
                            } else {
                                setIsDatafeedOnline(true);
                            }
                        }
                    } catch (e) {
                        setIsDatafeedOnline(false);
                    }
                }
            }["LiveChartPage.useEffect.checkStatus"];
            resolveDatafeedBot();
            checkStatus();
            const timer = setInterval({
                "LiveChartPage.useEffect.timer": ()=>{
                    resolveDatafeedBot();
                    checkStatus();
                }
            }["LiveChartPage.useEffect.timer"], 5000);
            return ({
                "LiveChartPage.useEffect": ()=>clearInterval(timer)
            })["LiveChartPage.useEffect"];
        }
    }["LiveChartPage.useEffect"], [
        datafeedBotId
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$workspaces$2f$WorkspaceShell$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WorkspaceShell"], {
        onNavigate: onNavigate,
        accounts: accounts,
        datafeedBotId: datafeedBotId,
        isDatafeedOnline: isDatafeedOnline,
        datafeedConfigError: datafeedConfigError
    }, void 0, false, {
        fileName: "[project]/src/components/live/LiveChartPage.tsx",
        lineNumber: 84,
        columnNumber: 9
    }, this);
}
_s(LiveChartPage, "Ao0dLmrN/smRdJeBG8H6m7OYs+8=");
_c = LiveChartPage;
var _c;
__turbopack_context__.k.register(_c, "LiveChartPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_components_live_f2eb6353._.js.map