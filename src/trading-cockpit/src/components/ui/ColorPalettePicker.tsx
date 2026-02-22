"use client";

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface ColorPalettePickerProps {
    color: string; // Hex or RGBA
    onChange: (color: string) => void;
    label?: string;
    opacity?: number;
    onOpacityChange?: (opacity: number) => void;
}


// --- CONSTANTS (Exact TradingView Palette) ---

// 1. Grayscale Row (10 Steps)
const TRADINGVIEW_GRAYSCALE = [
    '#FFFFFF', '#D9D9D9', '#B7B7B7', '#929292', '#737373', '#525252', '#3F3F3F', '#2B2B2B', '#0D0D0D', '#000000'
];

// 2. Base Hues Row (Vibrant)
const TRADINGVIEW_BASE_HUES = [
    '#D44E4D', '#EC9D3B', '#F1E452', '#6EB059', '#56967D', '#68C1D3', '#4E6CF3', '#6B40B7', '#9231AA', '#CD3F63'
];

// 3. Shade Matrix (6 Rows x 10 Cols)
const COLOR_GRID = [
    // Row 1
    ['#F1D4D3', '#F9E5C3', '#FBF8C9', '#D5E9CE', '#CFE5DD', '#D3EBF1', '#CFD9FB', '#D5CEE8', '#DEC7E6', '#ECC7D1'],
    // Row 2
    ['#E4AAAB', '#F4D294', '#F8F19E', '#B3D8AA', '#A6D3C3', '#AEE0E9', '#A8BAF8', '#B3A8DA', '#C399D5', '#E099AB'],
    // Row 3
    ['#D98586', '#EEBE6A', '#F4EB71', '#93C686', '#81C0AA', '#88D3E0', '#819BF4', '#9283CE', '#A86AC4', '#D36C89'],
    // Row 4
    ['#C14243', '#E8A232', '#EFDF46', '#67AB54', '#529A82', '#60C3D4', '#4F6AF1', '#6E45B9', '#8E2FA6', '#C63A62'],
    // Row 5
    ['#963131', '#B86F26', '#C2A52F', '#4F833F', '#3D7561', '#43909E', '#394EB1', '#513289', '#6B237C', '#972B49'],
    // Row 6
    ['#682221', '#BF5A2A', '#D78B39', '#3B612C', '#1B3C2D', '#336169', '#2B3D8A', '#29247E', '#4F1F83', '#731F41'],
];


export const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
    color,
    onChange,
    label,
    opacity = 100,
    onOpacityChange
}) => {
    const [hex, setHex] = useState(color);

    useEffect(() => {
        setHex(color);
    }, [color]);

    const handleColorClick = (c: string) => {
        setHex(c);
        onChange(c);
    };

    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (onOpacityChange) onOpacityChange(val);
    };

    return (
        <div className="w-[340px] bg-white dark:bg-[#2A2E39] border border-slate-300 dark:border-[#363A45] rounded-xl shadow-2xl p-4 flex flex-col gap-4 select-none animate-in zoom-in-95 duration-100">

            {/* HEADER SECTION: Grayscale + Base Hues */}
            <div className="flex flex-col gap-1.5">
                {/* 1. Grayscale Row (10 cols) */}
                <div className="grid grid-cols-10 gap-1.5 place-items-center">
                    {TRADINGVIEW_GRAYSCALE.map(c => (
                        <Swatch key={c} color={c} active={hex.toLowerCase() === c.toLowerCase()} onClick={handleColorClick} />
                    ))}
                </div>

                {/* 2. Base Hues Row (10 cols) */}
                <div className="grid grid-cols-10 gap-1.5 place-items-center">
                    {TRADINGVIEW_BASE_HUES.map(c => (
                        <Swatch key={c} color={c} active={hex.toLowerCase() === c.toLowerCase()} onClick={handleColorClick} />
                    ))}
                </div>
            </div>

            {/* SEPARATOR GAP */}
            {/* The gap-4 on the parent handles spacing, but let's double check if we need extra visual separation here as requested. 
                User said: "von diesen zwei reihen abgesetzt sind dann 6 reihen" 
                The 'gap-4' is quite large (16px). Let's stick with that, it effectively separates the blocks. 
                Wait, previous impl had 'flex flex-col gap-4'. 
                I'll keep the gap-4 between the header block and the body block.
            */}

            {/* BODY SECTION: Shades Matrix (6 rows) */}
            <div className="grid grid-cols-10 gap-1.5 place-items-center">
                {COLOR_GRID.map((row, rIdx) => (
                    <React.Fragment key={rIdx}>
                        {row.map((c, cIdx) => (
                            <Swatch key={`${rIdx}-${cIdx}`} color={c} active={hex.toLowerCase() === c.toLowerCase()} onClick={handleColorClick} />
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <div className="h-px bg-slate-200 dark:bg-[#363A45] w-full" />

            {/* 3. Bottom Controls */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <button
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E222D] border border-slate-300 dark:border-[#363A45] flex items-center justify-center text-slate-500 dark:text-[#B2B5BE] hover:text-black dark:hover:text-white hover:border-slate-400 dark:hover:border-[#5d606b] transition-colors"
                        title="Add Custom Color"
                    >
                        <Plus size={16} />
                    </button>

                    <div className="flex-1 flex flex-col justify-center gap-1">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 dark:text-[#787b86]">
                            <span>Opacity</span>
                            <span>{opacity}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={opacity}
                            onChange={handleOpacityChange}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                            style={{
                                backgroundImage: `linear-gradient(to right, transparent, ${hex})`,
                                backgroundColor: 'transparent',
                                border: 'none'
                            }}
                        />
                        <style jsx>{`
                            input[type=range]::-webkit-slider-thumb {
                                -webkit-appearance: none;
                                height: 14px;
                                width: 14px;
                                border-radius: 50%;
                                background: #ffffff;
                                border: 2px solid #CBD5E1;
                                cursor: pointer;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.5);
                                margin-top: -5px; 
                            }
                            input[type=range]::-moz-range-thumb {
                                height: 14px;
                                width: 14px;
                                border-radius: 50%;
                                background: #ffffff;
                                border: 2px solid #CBD5E1;
                                cursor: pointer;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.5);
                            }
                            input[type=range]::-webkit-slider-runnable-track {
                                width: 100%;
                                height: 4px;
                                cursor: pointer;
                                border-radius: 2px;
                            }
                        `}</style>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Swatch = ({ color, active, onClick }: { color: string, active: boolean, onClick: (c: string) => void }) => (
    <button
        onClick={() => onClick(color)}
        className={`w-6 h-6 rounded-[4px] cursor-pointer transition-transform hover:scale-110 relative
            ${active ? 'ring-2 ring-blue-500 dark:ring-white z-10' : 'hover:brightness-110'}
        `}
        style={{ backgroundColor: color }}
        title={color}
    />
);
