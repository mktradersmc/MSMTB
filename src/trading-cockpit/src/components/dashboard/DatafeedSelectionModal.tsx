import React, { useState, useMemo } from 'react';
import { Search, Folder, ChevronRight, ChevronDown, Server, CheckCircle2, X } from 'lucide-react';

interface SymbolItem {
    name: string;
    path: string;
    desc: string;
    botId?: string;
}

interface FolderNode {
    name: string;
    fullPath: string;
    children: Map<string, FolderNode>;
    items: SymbolItem[];
}

interface BrokerInfo {
    id: string;
    name: string;
    shorthand: string;
}

interface DatafeedSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (symbol: SymbolItem) => void;
    availableSymbols: SymbolItem[];
    brokers: BrokerInfo[];
}

function buildBotTree(symbols: SymbolItem[], prefixPath: string): Map<string, FolderNode> {
    const root: FolderNode = { name: "Root", fullPath: prefixPath, children: new Map(), items: [] };

    symbols.forEach(sym => {
        const rawPath = sym.path || 'Uncategorized';
        const parts = rawPath.split('\\').filter(p => p);
        if (parts.length > 0 && parts[parts.length - 1] === sym.name) parts.pop();

        let current = root;
        let pathAccumulator = prefixPath;

        parts.forEach(part => {
            pathAccumulator = `${pathAccumulator}\\${part}`;
            if (!current.children.has(part)) {
                current.children.set(part, {
                    name: part,
                    fullPath: pathAccumulator,
                    children: new Map(),
                    items: []
                });
            }
            current = current.children.get(part)!;
        });
        current.items.push(sym);
    });
    return root.children;
}

export function DatafeedSelectionModal({ isOpen, onClose, onSelect, availableSymbols, brokers }: DatafeedSelectionModalProps) {
    const [filter, setFilter] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const getBrokerName = (botId: string) => {
        const broker = brokers.find(b => botId.startsWith(b.shorthand));
        return broker ? broker.name : botId.replace('_DATAFEED', '');
    };

    const tree = useMemo(() => {
        const botGroups = new Map<string, SymbolItem[]>();
        availableSymbols.forEach(s => {
            const id = s.botId || 'Default';
            if (!botGroups.has(id)) botGroups.set(id, []);
            botGroups.get(id)!.push(s);
        });

        const root: FolderNode = { name: "Root", fullPath: "ROOT", children: new Map(), items: [] };
        Array.from(botGroups.entries()).forEach(([botId, syms]) => {
            const brokerNode: FolderNode = { name: getBrokerName(botId), fullPath: `ROOT_${botId}`, children: new Map(), items: [] };
            brokerNode.children = buildBotTree(syms, `ROOT_${botId}`);
            root.children.set(botId, brokerNode);
        });
        return root;
    }, [availableSymbols, brokers]);

    // Auto-expand broker nodes on load
    useMemo(() => {
        if (!isOpen) return;
        const bots = new Set(availableSymbols.map(s => s.botId || 'Default'));
        setExpandedFolders(prev => {
            const next = new Set(prev);
            bots.forEach(b => next.add(`ROOT_${b}`));
            return next;
        });
    }, [isOpen, availableSymbols]);

    const renderFolder = (node: FolderNode, level: number = 0): React.ReactNode => {
        const isExpanded = expandedFolders.has(node.fullPath);
        if (level === 0) return null;

        return (
            <div key={node.fullPath} className="mb-1">
                <div
                    onClick={() => {
                        const next = new Set(expandedFolders);
                        if (next.has(node.fullPath)) next.delete(node.fullPath);
                        else next.add(node.fullPath);
                        setExpandedFolders(next);
                    }}
                    className={`flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer select-none text-slate-600 dark:text-slate-300 transition-colors ${level === 1 ? 'bg-slate-50 dark:bg-slate-800 mb-2 mt-2 border border-slate-200 dark:border-slate-700' : ''}`}
                    style={{ paddingLeft: `${Math.max(0, (level - 1)) * 12 + 8}px` }}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {level === 1 ? <Server size={16} className="text-emerald-500 dark:text-emerald-400" /> : <Folder size={14} className="text-indigo-500 dark:text-indigo-400" />}
                    <span className={`font-bold ${level === 1 ? 'text-sm text-slate-900 dark:text-white' : 'text-xs'}`}>{node.name}</span>
                </div>
                {isExpanded && (
                    <div className={level === 1 ? "mb-2" : "ml-2 border-l border-slate-700/50"}>
                        {Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name)).map(child => renderFolder(child, level + 1))}
                        {node.items.length > 0 && (
                            <div className="pl-4 pr-2 py-1 space-y-1">
                                {node.items.map(s => {
                                    const key = `${s.botId || 'Default'}:${s.name}`;
                                    return (
                                        <div key={key} onClick={() => onSelect(s)} className="cursor-pointer px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-all select-none text-xs text-slate-600 dark:text-slate-400">
                                            <span className="font-mono truncate">{s.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Source Symbol</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search available symbols..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {filter
                        ? <div className="grid grid-cols-1 gap-1">
                            {availableSymbols.filter(s => s.name.toLowerCase().includes(filter.toLowerCase())).map(s => (
                                <div key={`${s.botId}:${s.name}`} onClick={() => onSelect(s)} className="cursor-pointer px-3 py-2 rounded border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center transition-colors">
                                    <div>
                                        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{s.name}</span>
                                        <span className="ml-2 text-xs text-slate-500">({getBrokerName(s.botId || '')})</span>
                                    </div>
                                    <CheckCircle2 size={14} className="text-emerald-500 dark:text-slate-600 opacity-0 hover:opacity-100" />
                                </div>
                            ))}
                        </div>
                        : Array.from(tree.children.values()).sort((a, b) => a.name.localeCompare(b.name)).map(brokerNode => renderFolder(brokerNode, 1))
                    }
                </div>
            </div>
        </div>
    );
}
