
import { ReactNode } from 'react';

export interface DropdownMenuItem {
    id: string;
    label: string;
    icon?: ReactNode;
    isActive?: boolean;
    onClick?: () => void;
    /** For toggleable items */
    isToggle?: boolean;
    isChecked?: boolean;
    onToggle?: (checked: boolean) => void;
}

export type SyncType = 'timeframe' | 'position';

export interface SyncToggleHandler {
    (type: SyncType): void;
}
