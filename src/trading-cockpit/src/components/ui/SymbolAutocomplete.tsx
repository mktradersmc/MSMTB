import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { usePopoverPosition } from "../../hooks/ui/usePopoverPosition";

export interface BrokerSymbol {
    name: string;
    path: string;
    description: string;
}

interface SymbolAutocompleteProps {
    brokerId: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    items?: (string | BrokerSymbol)[];
    className?: string;
}

export function SymbolAutocomplete({ brokerId, value, onChange, placeholder, disabled, items, className }: SymbolAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [symbols, setSymbols] = useState<BrokerSymbol[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Derived error state
    const error = !!errorMessage;

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Portal Positioning
    const { top, left, contentRef } = usePopoverPosition({
        triggerRef: wrapperRef as React.RefObject<HTMLElement>, // Cast for variance safety
        isOpen: open,
        gap: 4,
        contentHeight: 200 // Approx max height
    });

    // Fetch symbols when brokerId changes, or use provided items
    useEffect(() => {
        if (items) {
            // Use provided items
            const normalized = items.map((s) => typeof s === 'string' ? { name: s, path: '', description: '' } : s);
            setSymbols(normalized);
            setErrorMessage("");
            setLoading(false);
            return;
        }

        if (!brokerId) {
            setSymbols([]);
            return;
        }

        const fetchSymbols = async () => {
            setLoading(true);
            setErrorMessage("");
            try {
                const url = `/api/broker-symbols/${encodeURIComponent(brokerId)}`; // Fixed URL relative path
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Status ${res.status}`);
                const data = await res.json();

                // Data might be strings or objects
                const normalized = Array.isArray(data)
                    ? data.map((s: any) => typeof s === 'string' ? { name: s, path: '', description: '' } : s)
                    : [];

                setSymbols(normalized);
                if (normalized.length === 0) {
                    // Valid but empty
                }
            } catch (e: any) {
                console.error("Symbol fetch failed", e);
                setErrorMessage(e.message || "Fetch Error");
            } finally {
                setLoading(false);
            }
        };

        fetchSymbols();
    }, [brokerId, items]);

    // Close on click outside (Portal friendly)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // Check if click is inside input wrapper OR inside portal content
            const clickedWrapper = wrapperRef.current && wrapperRef.current.contains(event.target as Node);

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
                if ((event.target as Element).closest('.symbol-autocomplete-dropdown')) return;

                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // Filter logic
    const filteredSymbols = query === ""
        ? symbols
        : symbols.filter((s) =>
            s.name.toLowerCase().includes(query.toLowerCase())
        );

    const isOffline = error || (symbols.length === 0 && !loading && brokerId && !items);

    const inputWidth = wrapperRef.current?.offsetWidth || 200;

    return (
        <div className={`relative w-full ${className || ''}`} ref={wrapperRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    disabled={disabled}
                    className={`w-full bg-white dark:bg-slate-950 border rounded px-3 py-2 text-sm outline-none transition-all font-mono
                        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-text"}
                        ${isOffline
                            ? "border-amber-500/50 dark:border-amber-700/50 text-amber-600 dark:text-amber-200 placeholder:text-amber-400 dark:placeholder:text-amber-500/50 focus:border-amber-500"
                            : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-emerald-300 placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:border-blue-500 dark:focus:border-emerald-500"
                        }
                    `}
                    placeholder={isOffline ? "Manual Input (Broker Offline)" : (placeholder || "Select Symbol...")}
                    value={(open ? query : value) || ""}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (isOffline) {
                            onChange(e.target.value);
                        } else {
                            setOpen(true);
                        }
                    }}
                    onFocus={() => {
                        if (!disabled) {
                            setOpen(true);
                        }
                    }}
                />

                {/* Icons */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                    {loading && <div className="w-3 h-3 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>}
                    {isOffline && !loading && !disabled && (
                        <div title={`Offline/Error: ${errorMessage || "No Symbols"}`} className="flex items-center">
                            <AlertTriangle size={14} className="text-amber-500" />
                        </div>
                    )}
                    {!loading && !isOffline && !disabled && <ChevronsUpDown size={14} className="text-slate-600" />}
                </div>
            </div>

            {/* Portal Dropdown */}
            {open && !isOffline && !disabled && typeof document !== 'undefined' && createPortal(
                <div
                    ref={contentRef}
                    className="fixed z-[100000] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xl max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100 symbol-autocomplete-dropdown custom-scrollbar"
                    style={{
                        top,
                        left,
                        width: inputWidth // Match input width
                    }}
                >
                    {filteredSymbols.length === 0 ? (
                        <div className="p-2 text-xs text-slate-500 text-center">No symbols found.</div>
                    ) : (
                        filteredSymbols.map((s) => (
                            <div
                                key={s.name}
                                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                    ${value === s.name ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}
                                `}
                                onClick={() => {
                                    onChange(s.name);
                                    setOpen(false);
                                    setQuery("");
                                }}
                            >
                                <span className="font-mono">{s.name}</span>
                                {value === s.name && <Check size={14} className="text-emerald-500" />}
                            </div>
                        ))
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
