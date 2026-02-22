import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
    label: string;
    action: () => void;
    danger?: boolean;
}

export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true); // Capture scroll to close menu

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);

    // Adjust position if it flows out of viewport
    const style: React.CSSProperties = {
        top: y,
        left: x,
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[160px] py-1 bg-[#1E222D] border border-[#2A2E39] rounded shadow-lg text-sm text-[#D1D5DB]"
            style={style}
            onClick={(e) => e.stopPropagation()} // Prevent click from propagating to chart
        >
            <ul className="flex flex-col">
                {items.map((item, index) => (
                    <li key={index}>
                        <button
                            className={`w-full text-left px-4 py-2 hover:bg-[#2A2E39] transition-colors flex items-center gap-2 ${item.danger ? 'text-red-400 hover:text-red-300' : 'text-slate-200'
                                }`}
                            onClick={() => {
                                item.action();
                                onClose();
                            }}
                        >
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};
