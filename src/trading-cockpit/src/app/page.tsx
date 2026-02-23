"use client";

import { useEffect, useState } from "react";
import { fetchMessages, sendCommand } from "../services/api";
import { Message } from "../types";
import { ChartContainer } from "../components/charts/ChartContainer";
import { MessageCard } from "../components/MessageCard";
import LiveChartPage from "../components/live/LiveChartPage";
import { ChartThemeProvider } from '../context/ChartThemeContext';
import { SystemView } from "../components/dashboard/SystemView";
import { SettingsView } from "../components/dashboard/SettingsView";
import { AccountsView } from "../components/dashboard/AccountsView";
import { DatafeedView } from "../components/dashboard/DatafeedView";
import { DistributionView } from "../components/dashboard/DistributionView";
import { Activity, LayoutDashboard, Users, Settings, FlaskConical, BarChart3, Radio, ChevronLeft, ChevronRight, Maximize2, LineChart, Database, FileJson, Share2, History, Cpu } from "lucide-react";
import AssetMappingPage from "./settings/mappings/page";
import Link from "next/link";
import { MainSidebar, ViewType } from "../components/navigation/MainSidebar";
import DataHistoryPage from "./data-history/page";
import { EconomicCalendarView } from "../components/dashboard/EconomicCalendarView";
import { fetchDirect } from "../lib/client-api";

// SIMPLE UTILS
const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(" ");

// --- MOCK CHART DATA ---
const generateDummyCandles = (count: number, startPrice: number) => {
  const data = [];
  let baseTime = Math.floor(Date.now() / 1000) - count * 300; // 5 min candles
  let basePrice = startPrice;
  for (let i = 0; i < count; i++) {
    const open = basePrice + (Math.random() - 0.5) * 0.0010;
    const close = open + (Math.random() - 0.5) * 0.0010;
    const high = Math.max(open, close) + Math.random() * 0.0005;
    const low = Math.min(open, close) - Math.random() * 0.0005;
    data.push({
      time: baseTime + i * 300,
      open, high, low, close
    });
    basePrice = close;
  }
  return data;
};

// --- VIEWS ENUM ---

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);

  // PERSISTENCE: Recover lastTimestamp to avoid refetching history
  const [lastTimestamp, setLastTimestamp] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lastMsgTimestamp');
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (lastTimestamp > 0) {
      localStorage.setItem('lastMsgTimestamp', lastTimestamp.toString());
    }
  }, [lastTimestamp]);
  const [activeView, setActiveView] = useState<ViewType>('LIVE_CHART');
  const [isFeedCollapsed, setIsFeedCollapsed] = useState(false);
  const [isLiveFeedCollapsed, setIsLiveFeedCollapsed] = useState(false);
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [timeframe, setTimeframe] = useState("H4");

  // Chart State
  const [dataA, setDataA] = useState(generateDummyCandles(100, 1.0500)); // EURUSD
  const [dataB, setDataB] = useState(generateDummyCandles(100, 1.2500)); // GBPUSD

  // --- DATA FETCHING ---
  useEffect(() => {
    const interval = setInterval(async () => {
      const newMessages = await fetchMessages(lastTimestamp);
      if (newMessages.length > 0) {
        setMessages(prev => {
          // Deduplicate by ID just in case
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));

          // Check for HISTORY_DATA response
          uniqueNew.forEach(msg => {
            if (msg.type === 'HISTORY_DATA' && msg.content && (msg.content as any).candles) {
              console.log("Applying History Data to Chart:", msg.symbol);
              const rawCandles = (msg.content as any).candles;
              const cleanData = rawCandles.map((c: any) => ({
                time: c.time,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close
              }));

              setDataA(cleanData);
              setIsLoadingHistory(false);
            }
          });

          return [...prev, ...uniqueNew];
        });
        setLastTimestamp(newMessages[newMessages.length - 1].timestamp);
      }
    }, 1000); // Faster polling
    return () => clearInterval(interval);
  }, [lastTimestamp]);

  // --- HANDLERS ---
  const handleSetupClick = async (msg: Message) => {
    setSelectedSetupId(msg.id);
    setIsLoadingHistory(true);
    setDataA([]); // Clear old data
    setDataB([]);

    const command = {
      type: "CMD_FETCH_HISTORY",
      symbol: msg.symbol || "EURUSD",
      timeframe: "PERIOD_H4",
      start: Math.floor(msg.timestamp / 1000),
      count: 500
    };

    console.log("Triggering Bot Fetch:", command);
    const success = await sendCommand(command);
    if (!success) {
      setIsLoadingHistory(false);
    }
  };

  // --- FILTERING ---
  const liveMessages = messages.filter(m => !m.environment || m.environment === 'LIVE');
  const backtestMessages = messages.filter(m => m.environment === 'BACKTEST');

  // --- SIDEBAR BADGE LOGIC ---
  const [hasPendingMappings, setHasPendingMappings] = useState(false);
  const [hasCalendarAlert, setHasCalendarAlert] = useState(false);

  const checkMappings = async () => {
    try {
      const [brokersRes, mappingsRes] = await Promise.all([
        fetchDirect('/api/brokers'),
        fetchDirect('/api/mappings')
      ]);

      if (brokersRes.ok && mappingsRes.ok) {
        const brokers: any[] = await brokersRes.json();
        const mappings: any[] = await mappingsRes.json();
        const IGNORE_SENTINEL = '__IGNORE__';

        let pending = false;
        for (const m of mappings) {
          for (const b of brokers) {
            const val = m.brokerMappings[b.shorthand];
            // Pending if:
            // 1. Value is missing (undefined/null)
            // 2. Value is empty string
            // 3. AND Value is NOT the ignore sentinel
            if (!val || (val !== IGNORE_SENTINEL && val.trim() === '')) {
              pending = true;
              break;
            }
          }
          if (pending) break;
        }
        setHasPendingMappings(pending);
      }
    } catch (e) {
      console.error("Failed to check mapping status", e);
    }
  };

  const checkCalendarAlert = async () => {
    try {
      const res = await fetchDirect('/api/economic-calendar');
      if (res.ok) {
        const data = await res.json();
        setHasCalendarAlert(data.missingNextMonth || false);
      }
    } catch (e) {
      console.error("Failed to check calendar status", e);
    }
  };

  useEffect(() => {
    // Initial check
    checkMappings();
    checkCalendarAlert();

    // Poll every 5 seconds to update badge when user fixes mappings
    const interval = setInterval(() => {
      checkMappings();
      checkCalendarAlert();
    }, 5000);
    return () => clearInterval(interval);
  }, []);


  return (
    <ChartThemeProvider>
      <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden">
        {/* ... (rest of sidebar) ... */}
        {/* --- SIDEBAR --- */}
        <MainSidebar
          activeView={activeView}
          onNavigate={setActiveView}
          badges={{ mappings: hasPendingMappings, calendar: hasCalendarAlert }}
        />

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* --- VIEW: DASHBOARD (Welcome) --- */}
          {activeView === 'DASHBOARD' && (
            <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center max-w-2xl space-y-8">
                <div className="inline-flex p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl shadow-indigo-500/10 mb-4">
                  <LayoutDashboard size={64} className="text-indigo-500" />
                </div>

                <div>
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Welcome to Awesome Cockpit</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    Centralized control for your algorithmic trading infrastructure.
                    Select a module from the sidebar to begin.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <button onClick={() => setActiveView('LIVE_CHART')} className="p-4 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all group shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-2">
                      <LineChart size={18} /> Live Chart
                    </h3>
                    <p className="text-sm text-slate-500">Real-time market analysis and datafeed monitoring.</p>
                  </button>
                  <button onClick={() => setActiveView('ACCOUNTS')} className="p-4 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all group shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-2">
                      <Users size={18} /> Accounts
                    </h3>
                    <p className="text-sm text-slate-500">Manage trading instances and datafeed sources.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: LIVE COCKPIT --- */}

          {activeView === 'LIVE_COCKPIT' && (
            <div className="h-full flex flex-col p-6 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
              <header className="mb-4 flex justify-between items-end border-b border-slate-800/50 pb-4 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Radio className="text-emerald-400" /> Live Feed
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">Real-time signals from Master Bot</p>
                </div>
              </header>

              <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Collapsible Feed Panel (Live) */}
                <div
                  className={cn(
                    "flex flex-col bg-slate-900/30 border border-slate-800/50 rounded-2xl h-full transition-all duration-300 ease-in-out relative flex-shrink-0",
                    isLiveFeedCollapsed ? "w-14 items-center pt-4" : "w-1/3 min-w-[320px] p-4"
                  )}
                >
                  {/* Header Row with Toggle */}
                  <div className={cn("flex justify-between items-center mb-4 shrink-0", isLiveFeedCollapsed && "flex-col gap-4 mb-2")}>
                    {!isLiveFeedCollapsed ? (
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                        <h3 className="font-semibold text-slate-200">Incoming Messages</h3>
                      </div>
                    ) : (
                      <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                    )}

                    <button
                      onClick={() => setIsLiveFeedCollapsed(!isLiveFeedCollapsed)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      {isLiveFeedCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                  </div>

                  {/* Content */}
                  {!isLiveFeedCollapsed ? (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 min-h-0 pb-2">
                      {liveMessages.length === 0 && <p className="text-slate-500 text-center mt-10 italic">No live signals yet...</p>}
                      {liveMessages.slice().reverse().map(msg => <MessageCard key={msg.id} message={msg} />)}
                    </div>
                  ) : (
                    // Collapsed State Icon
                    <div className="flex flex-col items-center gap-4 flex-1">
                      <Radio size={20} className="text-emerald-500 mt-4" />
                      <span className="text-[10px] text-slate-500 writing-vertical-rl rotate-180 uppercase tracking-widest font-mono mt-2">Live Monitor</span>
                    </div>
                  )}
                </div>

                {/* Charts (Expands to fill) */}
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden min-w-0">
                  <div className="p-4 border-b border-slate-800/50 flex justify-between items-center shrink-0">
                    <span className="font-semibold text-slate-300">Live Analysis</span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">LIVE</span>
                  </div>
                  <div className="flex-1 p-2 min-h-0 relative">
                    <div className="absolute inset-0">
                      <ChartContainer
                        symbol="EURUSD"
                        symbolB="GBPUSD"
                        dataA={dataA}
                        dataB={dataB}
                        timeframe={timeframe}
                        height="100%"
                        isActive={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: STRATEGY LAB --- */}
          {activeView === 'STRATEGY_LAB' && (
            <div className="h-full flex flex-col p-6 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
              <header className="mb-4 flex justify-between items-end border-b border-slate-800/50 pb-4 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FlaskConical className="text-amber-400" /> Strategy Lab
                  </h2>
                  <p className="text-slate-500 mt-1 text-sm">Backtest Results <span className="text-amber-500">Analysis Mode</span></p>
                </div>
              </header>

              <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Collapsible Feed Panel (Strategy) */}
                <div
                  className={cn(
                    "flex flex-col bg-slate-900/30 border border-slate-800/50 rounded-2xl h-full transition-all duration-300 ease-in-out relative flex-shrink-0",
                    isFeedCollapsed ? "w-14 items-center pt-4" : "w-1/3 min-w-[320px] p-4"
                  )}
                >
                  {/* Header Row with Toggle */}
                  <div className={cn("flex justify-between items-center mb-4 shrink-0", isFeedCollapsed && "flex-col gap-4 mb-2")}>
                    {!isFeedCollapsed ? (
                      <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                        <div className="w-1 h-5 bg-amber-500 rounded-full" />
                        Test Setups ({backtestMessages.length})
                      </h3>
                    ) : (
                      <div className="w-1 h-5 bg-amber-500 rounded-full" />
                    )}

                    <button
                      onClick={() => setIsFeedCollapsed(!isFeedCollapsed)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      {isFeedCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                  </div>

                  {/* Content */}
                  {!isFeedCollapsed ? (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 min-h-0 pb-2">
                      {backtestMessages.length === 0 && <p className="text-slate-500 text-center mt-10 italic">No backtest data found.</p>}
                      {backtestMessages.slice().reverse().map(msg => (
                        <div
                          key={msg.id}
                          onClick={() => handleSetupClick(msg)}
                          className={cn(
                            "cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                            selectedSetupId === msg.id ? "ring-2 ring-amber-500 rounded-xl shadow-lg shadow-amber-900/20" : ""
                          )}
                        >
                          <MessageCard message={msg} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Collapsed State Icon
                    <div className="flex flex-col items-center gap-4 flex-1">
                      <FlaskConical size={20} className="text-amber-500 mt-4" />
                      <span className="text-[10px] text-slate-500 writing-vertical-rl rotate-180 uppercase tracking-widest font-mono mt-2">Results</span>
                    </div>
                  )}
                </div>

                {/* Analysis Column (Chart) */}
                <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-2xl flex flex-col relative overflow-hidden shadow-2xl min-w-0">
                  {/* Chart Header */}
                  <div className="h-12 border-b border-slate-800/50 flex items-center justify-between px-4 shrink-0 bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-300">
                        {messages.find(m => m.id === selectedSetupId)?.symbol || "EURUSD"}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-[10px] text-slate-500 font-mono">Analysis H4</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-slate-800 rounded text-slate-400"><Maximize2 size={16} /></button>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="flex-1 relative flex flex-col min-h-0 bg-slate-950/30">
                    {selectedSetupId && !isLoadingHistory ? (
                      <div className="absolute inset-0 p-2">
                        <ChartContainer
                          symbol={messages.find(m => m.id === selectedSetupId)?.symbol || "EURUSD"}
                          symbolB="Correlation"
                          dataA={dataA}
                          dataB={dataB}
                          timeframe={timeframe}
                          height="100%"
                          isActive={true}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
                        {isLoadingHistory ? (
                          <>
                            <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">Loading History...</h3>
                            <p className="text-slate-500 text-sm mt-1">Bot is fetching OHLC data from MT5</p>
                          </>
                        ) : (
                          <>
                            <BarChart3 size={64} className="text-slate-700 mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-slate-500">Select a Setup</h3>
                            <p className="text-slate-600 text-sm mt-1">Select a card from the left panel to load historical context.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: ACCOUNTS --- */}
          {activeView === 'ACCOUNTS' && <AccountsView />}

          {/* --- VIEW: SETTINGS --- */}
          {activeView === 'SETTINGS' && <SettingsView />}

          {/* --- VIEW: SYSTEM --- */}
          {activeView === 'SYSTEM' && <SystemView />}

          {/* --- VIEW: ASSET MAPPINGS --- */}
          {activeView === 'ASSET_MAPPINGS' && (
            <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
              <AssetMappingPage onUpdate={checkMappings} />
            </div>
          )}

          {/* --- VIEW: DISTRIBUTION --- */}
          {activeView === 'DISTRIBUTION' && <DistributionView />}

          {/* --- VIEW: DATAFEED --- */}
          {activeView === 'DATAFEED' && <DatafeedView />}

          {/* --- VIEW: DATA HISTORY --- */}
          {activeView === 'DATA_HISTORY' && (
            <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300 overflow-hidden p-6">
              <DataHistoryPage />
            </div>
          )}

          {/* --- VIEW: ECONOMIC CALENDAR --- */}
          {activeView === 'ECONOMIC_CALENDAR' && (
            <EconomicCalendarView />
          )}

          {/* --- VIEW: LIVE CHART --- */}
          {activeView === 'LIVE_CHART' && (
            <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300">
              <LiveChartPage onNavigate={setActiveView} />
            </div>
          )}

        </main>
      </div>
    </ChartThemeProvider>
  );
}
