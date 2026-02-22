import React, { useState } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { Plus, X, LayoutTemplate } from 'lucide-react';

export const WorkspaceTabs: React.FC = () => {
    const { workspaces, activeWorkspaceId, setActiveWorkspace, addWorkspace, removeWorkspace } = useWorkspaceStore();
    const [isEditing, setIsEditing] = useState<string | null>(null);

    const handleAdd = () => {
        addWorkspace(`Workspace ${workspaces.length + 1}`);
    };

    return (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {workspaces.map(w => (
                <div
                    key={w.id}
                    onClick={() => setActiveWorkspace(w.id)}
                    className={`
                        group flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-l border-r border-transparent cursor-pointer select-none text-xs font-medium transition-all
                        ${w.id === activeWorkspaceId
                            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/50'}
                    `}
                >
                    <span className="flex items-center gap-1.5">
                        <span className="font-bold">{w.panes?.[0]?.symbol || w.name}</span>
                    </span>

                    {/* Close Button (Visible) */}
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
                className="ml-1 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                title="New Workspace"
            >
                <Plus size={14} />
            </button>
        </div>
    );
};
