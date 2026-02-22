import { useState, useEffect, RefObject } from 'react';

interface PopoverPosition {
    top: number;
    left: number;
    placement: 'top' | 'bottom';
}

interface UsePopoverPositionProps<T extends HTMLElement> {
    triggerRef: RefObject<T>;
    contentHeight?: number; // Optional fallback
    isOpen: boolean;
    gap?: number;
}

/**
 * Calculates the optimal position for a popover (top or bottom) using dynamic height measurement.
 */
export const usePopoverPosition = <T extends HTMLElement>({
    triggerRef,
    contentHeight: defaultContentHeight = 300,
    isOpen,
    gap = 5
}: UsePopoverPositionProps<T>) => {
    const [position, setPosition] = useState<PopoverPosition>({ top: 0, left: 0, placement: 'bottom' });
    const [contentElement, setContentElement] = useState<HTMLElement | null>(null);

    // Callback ref for the content element
    const contentRef = (node: HTMLElement | null) => {
        setContentElement(node);
    };

    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePosition = () => {
            if (!triggerRef.current) return;

            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Use actual measured height if available, otherwise fallback
            const height = contentElement ? contentElement.offsetHeight : defaultContentHeight;
            const spaceBelow = viewportHeight - rect.bottom;

            let placement: 'top' | 'bottom' = 'bottom';
            let top = rect.bottom + gap;

            // Flip to top if insufficient space below
            if (spaceBelow < height && rect.top > 50) {
                placement = 'top';
                // Position above: trigger top - content height - gap
                top = rect.top - height - gap;
            }

            setPosition({
                top,
                left: rect.left,
                placement
            });
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        let observer: ResizeObserver | null = null;
        if (contentElement) {
            observer = new ResizeObserver(() => updatePosition());
            observer.observe(contentElement);
        }

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            if (observer) observer.disconnect();
        };
    }, [isOpen, defaultContentHeight, gap, contentElement]);

    return { ...position, contentRef };
};
