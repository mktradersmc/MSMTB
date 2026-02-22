import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Settings,
    Database,
    FileJson,
    History,
    LineChart,
    Share2,
    Cpu,
    ChevronLeft,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';

// Define ViewType locally or import if it's shared (currently local in page.tsx, so we'll redefine or just use string)
export type ViewType = 'DASHBOARD' | 'LIVE_COCKPIT' | 'LIVE_CHART' | 'ACCOUNTS' | 'SETTINGS' | 'STRATEGY_LAB' | 'DATAFEED' | 'ASSET_MAPPINGS' | 'DISTRIBUTION' | 'DATA_HISTORY' | 'SYSTEM';

interface MainSidebarProps {
    activeView: ViewType;
    onNavigate: (view: ViewType) => void;
    badges?: {
        mappings?: boolean;
    };
}

const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(" ");

export const MainSidebar: React.FC<MainSidebarProps> = ({ activeView, onNavigate, badges }) => {
    // 1. State for Start/Collapse (Persisted)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebarCollapsed') === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    }, [isCollapsed]);

    // 2. Toggle Handler
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    // 3. Helper for Items
    const SidebarItem = ({ id, icon: Icon, label, badge }: { id: ViewType, icon: any, label: string, badge?: boolean }) => {
        const isActive = activeView === id;

        return (
            <div className="relative group/item w-full">
                <button
                    onClick={() => onNavigate(id)}
                    className={cn(
                        "flex items-center py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden",
                        isCollapsed ? "justify-center px-0 w-10 mx-auto" : "px-3 w-full gap-3",
                        isActive
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                >
                    <Icon size={20} className={cn("shrink-0 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300")} />

                    {/* Label - Hidden in Collapsed Mode */}
                    {!isCollapsed && (
                        <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-200 opacity-100 w-auto">
                            {label}
                        </span>
                    )}

                    {/* Badge */}
                    {badge && (
                        <div className={cn(
                            "absolute w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] transition-all",
                            isCollapsed ? "top-2 right-2" : "right-3 top-1/2 -translate-y-1/2"
                        )} />
                    )}


                </button>

                {/* Tooltip for Collapsed Mode only */}
                {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl border border-slate-700">
                        {label}
                    </div>
                )}
            </div>
        );
    };

    const SectionHeader = ({ label }: { label: string }) => (
        !isCollapsed ? (
            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 mt-4 transition-opacity whitespace-nowrap">
                {label}
            </p>
        ) : (
            <div className="h-4 w-full" /> // Spacer in collapsed mode
        )
    );

    return (
        <aside
            className={cn(
                "bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 flex flex-col z-20 shrink-0 transition-all duration-300 ease-in-out relative",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header Row: Logo + Toggle */}
                <div className={cn(
                    "h-20 shrink-0 border-b border-slate-300 dark:border-slate-800 flex items-center transition-all duration-300",
                    isCollapsed ? "justify-center px-0 bg-slate-50 dark:bg-slate-900/50" : "justify-between px-6 bg-white dark:bg-slate-900"
                )}>
                    {/* Logo */}
                    <div className={cn("flex items-center gap-3 overflow-hidden whitespace-nowrap", isCollapsed ? "justify-center" : "")}>
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <LayoutDashboard size={20} className="text-white" />
                        </div>

                        {!isCollapsed && (
                            <div className="flex flex-col justify-center animate-in fade-in duration-300">
                                <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">Awesome Cockpit</h1>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Terminal v2.0</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-1 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 p-3">


                    <SectionHeader label="System" />
                    <SidebarItem id="SYSTEM" icon={Cpu} label="System" />

                    <SectionHeader label="Environment" />
                    <SidebarItem id="ACCOUNTS" icon={Users} label="Accounts" />
                    <SidebarItem id="ASSET_MAPPINGS" icon={Settings} label="Brokers" />
                    <SidebarItem id="DATAFEED" icon={Database} label="Datafeeds" />


                    <SectionHeader label="Trading" />
                    <SidebarItem id="LIVE_CHART" icon={LineChart} label="Live Chart" />
                    <SidebarItem id="DISTRIBUTION" icon={Share2} label="Distribution" />
                </div>


            </div>

            {/* Edge Toggle Overlay */}
            <div
                className="absolute top-0 right-0 h-full w-4 z-[200] flex items-center justify-center cursor-pointer group"
                onClick={toggleSidebar}
                title={isCollapsed ? "Expand" : "Collapse"}
            >
                {/* Visual Strip Background */}
                <div className="absolute inset-y-0 right-0 w-0.5 bg-transparent group-hover:bg-indigo-500/50 transition-colors duration-200" />

                {/* Arrow Button - Dynamic Direction */}
                <div className={cn(
                    "absolute w-5 h-10 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100",
                    // Dynamic Positioning & Styling
                    isCollapsed
                        ? "right-0 translate-x-full rounded-r-md border-r border-l-0" // Pops Right (Expand)
                        : "right-0 translate-x-0 rounded-l-md border-l border-r-0" // Pops Left (Collapse) - Adjusted to be flush with edge
                )}>
                    {isCollapsed ? <ChevronRight size={14} className="text-indigo-500" /> : <ChevronLeft size={14} className="text-indigo-500" />}
                </div>
            </div>



        </aside >
    );
};
