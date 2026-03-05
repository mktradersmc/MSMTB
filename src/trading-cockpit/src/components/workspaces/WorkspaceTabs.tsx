import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';

export const WorkspaceTabs: React.FC = () => {
    const { workspaces, activeWorkspaceId, setActiveWorkspace, addWorkspace, removeWorkspace } = useWorkspaceStore();

    // Tab Scroll Logic
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 4);
            setCanScrollRight(Math.ceil(scrollWidth) > Math.ceil(clientWidth + scrollLeft) + 4);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(checkScroll, 50);
            const el = scrollRef.current;
            el.addEventListener('scroll', checkScroll);
            const observer = new ResizeObserver(() => checkScroll());
            observer.observe(el);
            return () => {
                el.removeEventListener('scroll', checkScroll);
                observer.disconnect();
            };
        }
    }, [workspaces.length]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = direction === 'left' ? -200 : 200;
            scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    const handleAdd = () => {
        addWorkspace(`Workspace ${workspaces.length + 1}`);
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: 1000, behavior: 'smooth' });
            }
        }, 100);
    };

    return (
        <div className="relative flex-1 flex min-w-0 items-center overflow-hidden h-full">
            {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 z-30 flex items-center pl-1 pr-6 bg-gradient-to-r from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950">
                    <button
                        onClick={() => scroll('left')}
                        className="relative z-40 px-0.5 py-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-sm flex items-center justify-center hover:shadow-md h-7"
                    >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            <div
                ref={scrollRef}
                className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth w-full h-full pt-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}</style>
                {workspaces.map(w => (
                    <div
                        key={w.id}
                        onClick={() => setActiveWorkspace(w.id)}
                        className={`
                            group flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-l border-r border-transparent cursor-pointer select-none text-xs font-medium transition-all shrink-0
                            ${w.id === activeWorkspaceId
                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50'}
                        `}
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="font-bold">{w.panes?.[0]?.symbol || w.name}</span>
                        </span>

                        <button
                            onClick={(e) => { e.stopPropagation(); removeWorkspace(w.id); }}
                            className="relative z-20 p-0.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors ml-2 flex-shrink-0"
                            title="Close Workspace"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={handleAdd}
                    className="ml-1 p-1.5 shrink-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded transition-colors mr-6"
                    title="New Workspace"
                >
                    <Plus size={14} />
                </button>
            </div>

            {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 z-30 flex items-center justify-end pr-1 pl-6 bg-gradient-to-l from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950">
                    <button
                        onClick={() => scroll('right')}
                        className="relative z-40 px-0.5 py-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-sm flex items-center justify-center hover:shadow-md h-7"
                    >
                        <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </div>
    );
};
