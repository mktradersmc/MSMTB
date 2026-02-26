import React, { useState, useMemo, useEffect } from 'react';
import { Search, Folder, ChevronRight, ChevronDown, Server, X } from 'lucide-react';

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
    useEffect(() => {
        if (!isOpen) return;
        const bots = new Set(availableSymbols.map(s => s.botId || 'Default'));
        setExpandedFolders(prev => {
            const next = new Set(prev);
            bots.forEach(b => next.add(`ROOT_${b}`));
            return next;
        });
    }, [isOpen, availableSymbols]);

    const renderFolderRows = (node: FolderNode, level: number = 0): React.ReactNode[] => {
        const isExpanded = expandedFolders.has(node.fullPath);
        const rows: React.ReactNode[] = [];

        if (level > 0) {
            rows.push(
                <tr
                    key={`folder-${node.fullPath}`}
                    onClick={() => {
                        const next = new Set(expandedFolders);
                        if (next.has(node.fullPath)) next.delete(node.fullPath);
                        else next.add(node.fullPath);
                        setExpandedFolders(next);
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors select-none group"
                >
                    <td className="py-2 px-4">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${(level - 1) * 24 + 8}px` }}>
                            <div className="w-4 flex justify-center text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                            <div className="w-4 flex justify-center">
                                {level === 1 ? <Server size={16} className="text-emerald-500 dark:text-emerald-400" /> : <Folder size={14} className="text-indigo-500 dark:text-indigo-400" />}
                            </div>
                            <span className={`font-bold ${level === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 text-sm'}`}>
                                {node.name}
                            </span>
                        </div>
                    </td>
                    <td className="py-2 px-4 text-sm text-slate-500">
                    </td>
                </tr>
            );
        }

        if (isExpanded || level === 0) {
            Array.from(node.children.values())
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(child => {
                    rows.push(...renderFolderRows(child, level + 1));
                });

            if (node.items.length > 0) {
                node.items.forEach(s => {
                    const key = `item-${s.botId || 'Default'}-${s.path}-${s.name}`;
                    rows.push(
                        <tr
                            key={key}
                            onClick={() => onSelect(s)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors group select-none"
                        >
                            <td className="py-2 px-4" title={s.path}>
                                <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24 + 8}px` }}>
                                    <div className="w-4" /> {/* Aligns with arrow of folder */}
                                    <div className="w-4 flex justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                    </div>
                                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {s.name}
                                    </span>
                                </div>
                            </td>
                            <td className="py-2 px-4 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[300px]" title={s.desc}>
                                {s.desc}
                            </td>
                        </tr>
                    );
                });
            }
        }

        return rows;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Select Source Symbol</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search available symbols by name or description..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-white dark:bg-slate-900/50 relative scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-[#0f172a] shadow-[0_1px_2px_rgba(0,0,0,0.1)] z-10 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/2">
                                    Symbol
                                </th>
                                <th className="py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/2">
                                    Description
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filter ? (
                                availableSymbols
                                    .filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) || (s.desc && s.desc.toLowerCase().includes(filter.toLowerCase())))
                                    .map(s => (
                                        <tr key={`search-${s.botId}:${s.name}`} onClick={() => onSelect(s)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 transition-colors group select-none">
                                            <td className="py-2 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{s.name}</span>
                                                    <span className="text-xs text-slate-500">({getBrokerName(s.botId || '')})</span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-4 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[300px]" title={s.desc}>
                                                {s.desc}
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                Array.from(tree.children.values())
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(brokerNode => renderFolderRows(brokerNode, 1))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
