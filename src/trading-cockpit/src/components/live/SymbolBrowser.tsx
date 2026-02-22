import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';
import { useSymbolStore } from '../../stores/useSymbolStore';

interface SymbolBrowserProps {
    onSelectSymbol: (symbol: string, info?: any) => void;
    currentSymbol?: string;
    className?: string;
    botId?: string;
    variant?: 'input' | 'button'; // Defaults to 'input'
}

export interface SymbolBrowserHandle {
    close: () => void;
}

export const SymbolBrowser = React.forwardRef<SymbolBrowserHandle, SymbolBrowserProps>(({ onSelectSymbol, currentSymbol, className, botId, variant = 'input' }, ref) => {
    // Global Store
    const { symbols, symbolMap, isLoading, error, fetchSymbols } = useSymbolStore();

    const [filter, setFilter] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownSearch, setDropdownSearch] = useState('');

    // Expose close method
    React.useImperativeHandle(ref, () => ({
        close: () => setIsOpen(false)
    }));

    // Portal Positioning State
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

    // Initial Load & Refetch on Bot Change
    useEffect(() => {
        fetchSymbols(botId);
    }, [botId, fetchSymbols]);

    // Outside Click Handler (Updated for Portal)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedWrapper = wrapperRef.current && wrapperRef.current.contains(target);
            const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(target);

            if (!clickedWrapper && !clickedDropdown) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset dropdown search when opening
    useEffect(() => {
        if (isOpen && variant === 'button') {
            setDropdownSearch('');
        }
    }, [isOpen, variant]);

    // Calculate Position on Open
    useLayoutEffect(() => {
        if (isOpen && wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom - 10; // 10px buffer

            // Constrain height if space is limited, but ensure at least 150px usability if possible
            const maxHeight = Math.max(150, Math.min(400, spaceBelow));

            setCoords({
                top: rect.bottom + 4, // 4px gap
                left: rect.left,
                width: 288, // w-72 = 18rem = 288px
                maxHeight: maxHeight
            });
        }
    }, [isOpen]);

    const handleRefresh = (e: React.MouseEvent) => {
        e.stopPropagation();
        fetchSymbols(botId);
    };

    const handleSelect = (sym: string) => {
        const info = symbolMap.get(sym);
        onSelectSymbol(sym, info);
        setFilter('');
        setDropdownSearch('');
        setIsOpen(false);
    };

    const activeFilter = variant === 'button' ? dropdownSearch : filter;

    const filteredSymbols = symbols.filter(s =>
        s && typeof s === 'string' && s.toLowerCase().includes(activeFilter.toLowerCase())
    );

    return (
        <div ref={wrapperRef} className={`relative ${className || ''}`}>
            {/* Input Trigger (Default) */}
            {variant !== 'button' && (
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder={currentSymbol || "Search Symbol..."}
                        className="w-64 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/50 rounded-lg py-2 pl-9 pr-10 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                            onClick={handleRefresh}
                            className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-colors"
                            title="Refresh Symbols"
                        >
                            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <ChevronDown size={14} className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            )}

            {/* Button Trigger (New) */}
            {variant === 'button' && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-2 py-1 transition-colors group"
                >
                    <div className="flex flex-col items-start">
                        <span className={`text-sm font-bold ${currentSymbol ? 'text-slate-700 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {currentSymbol || "Select Symbol"}
                        </span>
                    </div>
                    <ChevronDown size={12} className={`text-slate-500 group-hover:text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            )}

            {/* Portal Dropdown */}
            {isOpen && coords && createPortal(
                <div
                    ref={dropdownRef}
                    className="symbol-browser-dropdown fixed bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        maxHeight: coords.maxHeight
                    }}
                >

                    {/* Embedded Search for Button Mode */}
                    {variant === 'button' && (
                        <div className="p-2 border-b border-slate-200 dark:border-slate-800/50 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md py-1.5 pl-8 pr-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                                    value={dropdownSearch}
                                    onChange={(e) => setDropdownSearch(e.target.value)}
                                />
                                <button
                                    onClick={handleRefresh}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-400"
                                >
                                    <RefreshCw size={10} className={isLoading ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-blue-600 scrollbar-track-transparent flex-1">
                        {/* Status Messages */}
                        {isLoading && symbols.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-500 animate-pulse">Updating Market Watch...</div>
                        )}
                        {error && (
                            <div className="p-4 text-center text-xs text-red-500 font-medium bg-red-500/10 m-2 rounded">
                                {error}
                            </div>
                        )}
                        {!isLoading && !error && filteredSymbols.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-500">
                                No matching symbols found.
                            </div>
                        )}

                        {/* List Items */}
                        <div className="p-1.5 space-y-0.5">
                            {filteredSymbols.map(sym => (
                                <button
                                    key={sym}
                                    onClick={() => handleSelect(sym)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all group flex items-center justify-between ${currentSymbol === sym
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                                        }`}
                                >
                                    <span>{sym}</span>
                                    {currentSymbol === sym && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Header/Footer of Dropdown */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 px-3 py-2 border-t border-slate-200 dark:border-slate-800/50 text-[10px] text-slate-500 flex justify-between shrink-0">
                        <span>{filteredSymbols.length} Symbols</span>
                        <span>MT5 Live Feed</span>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
});

SymbolBrowser.displayName = 'SymbolBrowser';
