import React from 'react';
import { Message } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Activity, Clock } from 'lucide-react';


// Fallback utility if @/lib/utils is missing (common in initialized projects)
function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

interface MessageCardProps {
    message: Message;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
    const { type, content, timestamp, symbol } = message;
    const isSetup = type === 'TradingSetup';

    // Extract details
    const strategy = content.strategy || 'Unknown Strategy';
    const status = content.status || ''; // Long / Short
    const isLong = status.toLowerCase() === 'long' || content.direction === 'BUY' || content.direction === 'Long';
    const isShort = status.toLowerCase() === 'short' || content.direction === 'SELL' || content.direction === 'Short';
    const description = content.description || JSON.stringify(content);

    // Format Time
    const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Status Badge Logic
    const getBadgeColor = () => {
        if (isLong) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (isShort) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    const StatusIcon = isLong ? ArrowUpCircle : isShort ? ArrowDownCircle : Activity;

    return (
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-4 shadow-lg transition-all hover:shadow-xl hover:border-slate-600 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* Glossy Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative flex justify-between items-start">

                {/* Left: Icon & Symbol */}
                <div className="flex items-center gap-3">
                    <div className={classNames("p-2 rounded-lg border", getBadgeColor())}>
                        <StatusIcon size={20} />
                    </div>
                    <div>
                        <h3 className="text-slate-100 font-bold text-lg tracking-tight">{symbol || 'Unknown'}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock size={12} />
                            <span className="font-mono">{timeString}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span>{message.botId}</span>
                        </div>
                        {/* Environment Badge */}
                        {(message.environment === 'BACKTEST' || message.environment === 'TEST') && (
                            <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                STRATEGY TESTER
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Badge */}
                <div className={classNames("px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border backdrop-blur-md", getBadgeColor())}>
                    {status || type}
                </div>
            </div>

            {/* Content Body */}
            <div className="mt-4 pl-[3.25rem]">
                <div className="text-sm font-medium text-slate-300 mb-1">{strategy}</div>
                <p className="text-xs text-slate-500 leading-relaxed font-mono line-clamp-3">
                    {isSetup ? description.replace(/,/g, '\n') : JSON.stringify(content, null, 2)}
                </p>
            </div>

        </div>
    );
};
