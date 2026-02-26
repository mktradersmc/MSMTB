using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using NinjaTrader.Core;
using NinjaTrader.Cbi;
using NinjaTrader.Data;

namespace AwesomeCockpit.NT8.Bridge
{
    // Removed custom RealTimeBarTracker. Going native.

    public class StreamContext
    {
        public BarsRequest Request { get; set; }
        public int LastIndex { get; set; } = -1;
    }

    public class SymbolSubscription
    {
        public Instrument Inst { get; set; }
        public SessionIterator SessionIterator { get; set; }
        public HashSet<string> LivestreamedTimeframes { get; set; } = new HashSet<string>();
        public ConcurrentDictionary<string, StreamContext> ActiveStreams { get; set; } = new ConcurrentDictionary<string, StreamContext>();
    }

    public class SubscriptionManager
    {
        private readonly BridgeWebSocket _socket;
        private readonly ConcurrentDictionary<string, SymbolSubscription> _activeSubscriptions;
        private System.Threading.Timer _barMonitorTimer;

        // We need a way to hook OnMarketData. 
        // In NT8 AddOns, we don't have a direct "OnMarketData" override like Strategies.
        // We must subscribe to the Instrument's MarketData event manually.

        public SubscriptionManager(BridgeWebSocket socket)
        {
            _socket = socket;
            _activeSubscriptions = new ConcurrentDictionary<string, SymbolSubscription>();
        }

        private void InstantiateBarsStream(SymbolSubscription sub, string symbol, string timeframe)
        {
            try
            {
                BarsPeriod period = ParseTimeframe(timeframe);
                if (period == null) return;

                bool isContinuous = false;
                if (sub.Inst != null && sub.Inst.MasterInstrument != null && sub.Inst.MasterInstrument.Name == symbol)
                    isContinuous = true;

                // For live streaming, we only need a bit of recent context to assemble the current bar
                DateTime startTime = NinjaTrader.Core.Globals.Now.AddDays(-14);
                DateTime endTime = DateTime.MaxValue; // MaxValue keeps the request open for LIVE ticks

                BarsRequest req = new BarsRequest(sub.Inst, startTime, endTime)
                {
                    BarsPeriod = period,
                    TradingHours = sub.Inst.MasterInstrument.TradingHours,
                    MergePolicy = isContinuous ? MergePolicy.MergeBackAdjusted : MergePolicy.DoNotMerge
                };

                var ctx = new StreamContext { Request = req, LastIndex = -1 };
                sub.ActiveStreams.TryAdd(timeframe, ctx);

                req.Update += (sender, e) => OnBarsRequestUpdate(symbol, timeframe, period, sub.Inst, e, ctx);

                if (NinjaTrader.Core.Globals.RandomDispatcher != null)
                {
                    NinjaTrader.Core.Globals.RandomDispatcher.BeginInvoke(new Action(() =>
                    {
                        req.Request(new Action<BarsRequest, ErrorCode, string>((barsReq, errorCode, errorMsg) =>
                        {
                            if (errorCode != ErrorCode.NoError)
                                NinjaTrader.Code.Output.Process($"[Stream] Init Error {symbol} {timeframe}: {errorMsg}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            else
                                NinjaTrader.Code.Output.Process($"[Stream] Armed for {symbol} {timeframe} ({barsReq.Bars.Count} context)", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        }));
                    }));
                }
                else
                {
                    req.Request(new Action<BarsRequest, ErrorCode, string>((barsReq, errorCode, errorMsg) => { }));
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[Stream] Failed to init {symbol} {timeframe}: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        private DateTime GetOpenTimeFromExt(DateTime closeTime, BarsPeriod period, Instrument inst)
        {
            if (period == null) return closeTime;

            // Align closeTime to pure minute precision to remove erratic seconds/milliseconds 
            DateTime alignedClose = new DateTime(closeTime.Year, closeTime.Month, closeTime.Day, closeTime.Hour, closeTime.Minute, 0);

            if (period.BarsPeriodType == BarsPeriodType.Minute) return alignedClose.AddMinutes(-period.Value);
            if (period.BarsPeriodType == BarsPeriodType.Day) return alignedClose.AddDays(-period.Value).AddHours(12);
            if (period.BarsPeriodType == BarsPeriodType.Week) return alignedClose.AddDays(-7).AddHours(12);
            if (period.BarsPeriodType == BarsPeriodType.Month) return alignedClose.AddMonths(-period.Value).AddHours(12);
            return alignedClose;
        }

        private void OnBarsRequestUpdate(string symbol, string timeframe, BarsPeriod period, Instrument inst, BarsUpdateEventArgs e, StreamContext ctx)
        {
            if (!_activeSubscriptions.TryGetValue(symbol, out SymbolSubscription sub)) return;

            bool isLivestreamed;
            lock (sub.LivestreamedTimeframes)
            {
                isLivestreamed = sub.LivestreamedTimeframes.Contains(timeframe);
            }
            if (!isLivestreamed) return;

            if (e.BarsSeries == null || e.BarsSeries.Count == 0) return;

            int currentIdx = e.MaxIndex;
            if (currentIdx < 0) return;

            string currentBotId = "Unknown_DATAFEED";
            if (NinjaTrader.Core.Globals.RandomDispatcher != null)
            {
                Action getBotId = () =>
                {
                    foreach (Account acc in Account.All)
                    {
                        if (acc != null && acc.Connection != null && acc.Connection.Options != null)
                        {
                            currentBotId = acc.Connection.Options.Name + "_DATAFEED";
                            break;
                        }
                    }
                };

                if (NinjaTrader.Core.Globals.RandomDispatcher.CheckAccess()) getBotId();
                else NinjaTrader.Core.Globals.RandomDispatcher.Invoke(getBotId);
            }

            if (currentIdx > ctx.LastIndex)
            {
                if (ctx.LastIndex != -1 && ctx.LastIndex < e.BarsSeries.Count)
                {
                    // The PREVIOUS bar closed
                    DateTime openTimeClosed = GetOpenTimeFromExt(e.BarsSeries.GetTime(ctx.LastIndex), period, inst);
                    long unixTimeMsClosed = ((DateTimeOffset)DateTime.SpecifyKind(openTimeClosed, DateTimeKind.Local)).ToUniversalTime().ToUnixTimeMilliseconds();

                    var closedBarPayload = new
                    {
                        time = unixTimeMsClosed,
                        open = e.BarsSeries.GetOpen(ctx.LastIndex),
                        high = e.BarsSeries.GetHigh(ctx.LastIndex),
                        low = e.BarsSeries.GetLow(ctx.LastIndex),
                        close = e.BarsSeries.GetClose(ctx.LastIndex),
                        volume = e.BarsSeries.GetVolume(ctx.LastIndex)
                    };

                    var closedEventPayload = new { symbol = symbol, timeframe = timeframe, candle = closedBarPayload };
                    // NinjaTrader.Code.Output.Process($"[Stream] EV_BAR_CLOSED -> {symbol} {timeframe} Time: {e.BarsSeries.GetTime(ctx.LastIndex):yyyy-MM-dd HH:mm:ss} C: {e.BarsSeries.GetClose(ctx.LastIndex)}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    _socket.SendProtocolMessage("EV_BAR_CLOSED", closedEventPayload, currentBotId, "TICK_SPY", symbol);
                }
                ctx.LastIndex = currentIdx;
            }

            // Always actively update the forming bar
            DateTime openTimeAct = GetOpenTimeFromExt(e.BarsSeries.GetTime(currentIdx), period, inst);
            long unixTimeMsAct = ((DateTimeOffset)DateTime.SpecifyKind(openTimeAct, DateTimeKind.Local)).ToUniversalTime().ToUnixTimeMilliseconds();

            var updateBarPayload = new
            {
                time = unixTimeMsAct,
                open = e.BarsSeries.GetOpen(currentIdx),
                high = e.BarsSeries.GetHigh(currentIdx),
                low = e.BarsSeries.GetLow(currentIdx),
                close = e.BarsSeries.GetClose(currentIdx),
                volume = e.BarsSeries.GetVolume(currentIdx)
            };

            var updateEventPayload = new { symbol = symbol, timeframe = timeframe, candle = updateBarPayload };
            _socket.SendProtocolMessage("EV_BAR_UPDATE", updateEventPayload, currentBotId, "TICK_SPY", symbol);
        }

        public double GetCurrentPrice(string symbol)
        {
            if (string.IsNullOrEmpty(symbol)) return 0.0;

            // 1. Try exact match first
            if (_activeSubscriptions.TryGetValue(symbol, out SymbolSubscription sub))
            {
                return GetLatestCloseFromSubscription(sub);
            }

            // 2. Fallback: Aggressive Prefix Scan
            // NQ MAR26 -> Matches NQ
            // The UI subscribes to Master ("NQ"). Executions output ("NQ MAR26").
            foreach (var kvp in _activeSubscriptions)
            {
                if (symbol.StartsWith(kvp.Key + " ") || kvp.Key.StartsWith(symbol + " "))
                {
                    return GetLatestCloseFromSubscription(kvp.Value);
                }
            }

            return 0.0;
        }

        private double GetLatestCloseFromSubscription(SymbolSubscription sub)
        {
            if (sub == null) return 0.0;
            // Find any active stream to pull the latest Close price
            foreach (var ctxKvp in sub.ActiveStreams)
            {
                StreamContext ctx = ctxKvp.Value;
                if (ctx.Request != null && ctx.Request.Bars != null && ctx.Request.Bars.Count > 0)
                {
                    return ctx.Request.Bars.GetClose(ctx.Request.Bars.Count - 1);
                }
            }
            return 0.0;
        }

        private Instrument ResolveInstrument(string symbol)
        {
            // First, check if the symbol is literally exactly a Master Instrument name (like "ES", "NQ")
            // If it is, we NEVER want to return the pseudo-instrument. We MUST find its active contract.
            bool isMasterSymbol = false;
            MasterInstrument master = null;

            foreach (MasterInstrument m in MasterInstrument.All)
            {
                if (m.Name == symbol)
                {
                    isMasterSymbol = true;
                    master = m;
                    break;
                }
            }

            if (isMasterSymbol && master != null)
            {
                // FORCE dynamic front-month resolution
                if (master.RolloverCollection != null)
                {
                    // Sort rollovers backwards from Now, so we check nearest first
                    var sortedRollovers = System.Linq.Enumerable.ToList(
                        System.Linq.Enumerable.OrderByDescending(
                            System.Linq.Enumerable.Where(master.RolloverCollection, r => r.Date.Date <= NinjaTrader.Core.Globals.Now.Date.AddDays(15)), // Add 15 days margin for impending rolls
                        r => r.Date)
                    );

                    // Aggressively scan backwards to find ANY locally cached concrete contract!
                    foreach (var ro in sortedRollovers)
                    {
                        string suffix = " " + ro.ContractMonth.ToString("MM-yy");
                        Instrument frontMonthInst = Instrument.GetInstrument(symbol + suffix);
                        if (frontMonthInst != null)
                        {
                            NinjaTrader.Code.Output.Process($"AwesomeCockpit: Force-resolved Master '{symbol}' to active front-month '{frontMonthInst.FullName}'", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            return frontMonthInst;
                        }
                    }
                }

                // If we couldn't find ANY compiled valid contract, fallback but loudly warn
                NinjaTrader.Code.Output.Process($"[Sync] WARNING: Could not find ANY locally compiled contract for Master '{symbol}'. Falling back to Pseudo-Instrument (May return 0 bars in BarsRequest).", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }

            // It's not a master symbol string (e.g. it's already "ES 03-26" or "EURUSD" or AAPL)
            // Just resolve it normally.
            Instrument inst = Instrument.GetInstrument(symbol);
            if (inst != null) return inst;

            return null;
        }

        public void Subscribe(string symbol, string timeframe)
        {
            if (!_activeSubscriptions.TryGetValue(symbol, out SymbolSubscription sub))
            {
                Instrument inst = ResolveInstrument(symbol);
                if (inst == null)
                {
                    NinjaTrader.Code.Output.Process($"Antigravity: Unknown symbol {symbol} for subscription.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    return;
                }

                sub = new SymbolSubscription
                {
                    Inst = inst,
                    SessionIterator = new SessionIterator(inst.MasterInstrument.TradingHours)
                };
                if (_activeSubscriptions.TryAdd(symbol, sub))
                {
                    NinjaTrader.Code.Output.Process($"AwesomeCockpit: Initializing SymbolTracker for {symbol}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                }
                else
                {
                    _activeSubscriptions.TryGetValue(symbol, out sub); // Someone else added it
                }
            }

            if (!string.IsNullOrEmpty(timeframe))
            {
                lock (sub.LivestreamedTimeframes)
                {
                    if (sub.LivestreamedTimeframes.Add(timeframe))
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Unlocked EV_BAR_UPDATE live streaming for {symbol} {timeframe}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        if (!sub.ActiveStreams.ContainsKey(timeframe))
                        {
                            InstantiateBarsStream(sub, symbol, timeframe);
                        }
                    }
                }
            }
        }

        public async void SubscribeAndSendResponse(string symbol, string timeframe, string requestId, string targetBotId)
        {
            Subscribe(symbol, timeframe);

            if (_activeSubscriptions.TryGetValue(symbol, out SymbolSubscription sub))
            {
                if (sub.ActiveStreams.TryGetValue(timeframe, out StreamContext ctx))
                {
                    BarsRequest req = ctx.Request;
                    int waitMs = 0;
                    while ((req.Bars == null || req.Bars.Count == 0) && waitMs < 4000)
                    {
                        await Task.Delay(50);
                        waitMs += 50;
                    }

                    if (req.Bars != null && req.Bars.Count > 0)
                    {
                        int lastIdx = req.Bars.Count - 1;
                        BarsPeriod period = ParseTimeframe(timeframe);
                        DateTime openTime = GetOpenTimeFromExt(req.Bars.GetTime(lastIdx), period, sub.Inst);
                        long unixTimeMs = ((DateTimeOffset)DateTime.SpecifyKind(openTime, DateTimeKind.Local)).ToUniversalTime().ToUnixTimeMilliseconds();

                        var trackerPayload = new
                        {
                            time = unixTimeMs,
                            open = req.Bars.GetOpen(lastIdx),
                            high = req.Bars.GetHigh(lastIdx),
                            low = req.Bars.GetLow(lastIdx),
                            close = req.Bars.GetClose(lastIdx),
                            volume = req.Bars.GetVolume(lastIdx)
                        };

                        var responseObj = new
                        {
                            status = "OK",
                            timeframe = timeframe,
                            candle = trackerPayload
                        };
                        _socket.SendProtocolMessage("CMD_SUBSCRIBE_TICKS_RESPONSE", responseObj, targetBotId, "TICK_SPY", symbol, requestId);
                        return;
                    }
                }
            }

            // Fallback empty response
            var fallbackObj = new { status = "OK", timeframe = timeframe };
            _socket.SendProtocolMessage("CMD_SUBSCRIBE_TICKS_RESPONSE", fallbackObj, targetBotId, "TICK_SPY", symbol, requestId);
        }

        public void Unsubscribe(string symbol, string timeframe)
        {
            if (_activeSubscriptions.TryGetValue(symbol, out SymbolSubscription sub))
            {
                if (string.IsNullOrEmpty(timeframe))
                {
                    // If no timeframe specified, destroy the entire symbol tracker entirely.
                    if (_activeSubscriptions.TryRemove(symbol, out _))
                    {
                        // Streams will be Garbage Collected once ActiveRequests is dropped
                    }
                }
                else
                {
                    lock (sub.LivestreamedTimeframes)
                    {
                        sub.LivestreamedTimeframes.Remove(timeframe);
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Locked EV_BAR_UPDATE live streaming for {symbol} {timeframe}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                }
            }
        }

        public async void SendCurrentBar(string symbol, string timeframe, string requestId, string targetBotId)
        {
            if (_activeSubscriptions.TryGetValue(symbol, out SymbolSubscription sub))
            {
                if (sub.ActiveStreams.TryGetValue(timeframe, out StreamContext ctx))
                {
                    BarsRequest req = ctx.Request;
                    int waitMs = 0;
                    while ((req.Bars == null || req.Bars.Count == 0) && waitMs < 4000)
                    {
                        await Task.Delay(50);
                        waitMs += 50;
                    }

                    if (req.Bars != null && req.Bars.Count > 0)
                    {
                        int lastIdx = req.Bars.Count - 1;
                        BarsPeriod period = ParseTimeframe(timeframe);
                        DateTime openTime = GetOpenTimeFromExt(req.Bars.GetTime(lastIdx), period, sub.Inst);
                        long unixTimeMs = ((DateTimeOffset)DateTime.SpecifyKind(openTime, DateTimeKind.Local)).ToUniversalTime().ToUnixTimeMilliseconds();

                        var trackerPayload = new
                        {
                            time = unixTimeMs,
                            open = req.Bars.GetOpen(lastIdx),
                            high = req.Bars.GetHigh(lastIdx),
                            low = req.Bars.GetLow(lastIdx),
                            close = req.Bars.GetClose(lastIdx),
                            volume = req.Bars.GetVolume(lastIdx)
                        };

                        var responseObj = new
                        {
                            status = "OK",
                            timeframe = timeframe,
                            content = new
                            {
                                timeframe = timeframe,
                                candle = trackerPayload
                            }
                        };
                        _socket.SendProtocolMessage("CMD_GET_CURRENT_BAR_RESPONSE", responseObj, targetBotId, "TICK_SPY", symbol, requestId);
                        return;
                    }
                }
            }

            // Empty / Error
            var errObj = new
            {
                status = "NO_DATA",
                message = "Bar not initialized or not subscribed natively",
                timeframe = timeframe
            };
            _socket.SendProtocolMessage("CMD_GET_CURRENT_BAR_RESPONSE", errObj, targetBotId, "TICK_SPY", symbol, requestId);
        }

        // checkNewBarsTimer and OnMarketDataUpdate are DELETED. Strategy OnBarUpdate handles it natively.

        // --- SYNCHRONIZED UPDATE (HISTORY) ---

        public void StartSynchronizedUpdate(string symbol, string timeframe, string mode, int count, long lastTime, string requestId, string targetBotId, string targetFunc)
        {
            NinjaTrader.Code.Output.Process($"[Sync] Received CMD_START_SYNCHRONIZED_UPDATE for {symbol} {timeframe}. Mode: {mode}, Count: {count}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            // Step 1: Parse Timeframe
            BarsPeriod period = ParseTimeframe(timeframe);
            if (period == null)
            {
                NinjaTrader.Code.Output.Process($"[Sync] Unknown Timeframe: {timeframe}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                SendErrorResponse("Unknown Timeframe", timeframe, requestId, targetBotId, targetFunc, symbol);
                return;
            }

            // Step 2: Get Instrument
            NinjaTrader.Code.Output.Process($"[Sync] Attempting to load Instrument string: '{symbol}'", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            Instrument inst = ResolveInstrument(symbol);
            bool isContinuous = false;

            // If the requested symbol matches the Master Instrument Name exactly, the user requested continuous history
            // Even though 'inst' is now a specific contract (e.g. "ES 03-26"), we still want to merge historical expiries
            if (inst != null && inst.MasterInstrument.Name == symbol)
            {
                isContinuous = true; // We ALWAYS want merging for Master symbols to construct historical boundaries properly
            }

            if (inst == null)
            {
                NinjaTrader.Code.Output.Process($"[Sync] Instrument '{symbol}' not found locally.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                SendErrorResponse("Unknown Symbol", timeframe, requestId, targetBotId, targetFunc, symbol);
                return;
            }

            NinjaTrader.Code.Output.Process($"[Sync] Successfully resolved Instrument: '{inst.FullName}' (Master: '{inst.MasterInstrument.Name}', Continuous: {isContinuous})", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            // Step 3: Calculate Start/End Boundaries
            DateTime endTime = NinjaTrader.Core.Globals.Now;
            DateTime startTime = endTime;

            if (mode == "INITIAL_FILL" || mode == "FETCH")
            {
                if (mode == "FETCH" && lastTime > 0)
                {
                    long normalizedTs = lastTime;
                    if (normalizedTs > 9999999999) normalizedTs /= 1000;
                    // The backend sends 'Broker Time Seconds' which is effectively True UTC for NT8.
                    // We parse it as strict UTC, then safely translate it to NinjaTrader's Local Time format.
                    DateTime utcTime = DateTimeOffset.FromUnixTimeSeconds(normalizedTs).UtcDateTime;
                    endTime = TimeZoneInfo.ConvertTimeFromUtc(utcTime, TimeZoneInfo.Local);
                }

                double minutesPerBar = period.Value;
                if (period.BarsPeriodType == BarsPeriodType.Minute) minutesPerBar = period.Value;
                else if (period.BarsPeriodType == BarsPeriodType.Day) minutesPerBar = period.Value * 1440;
                else if (period.BarsPeriodType == BarsPeriodType.Week) minutesPerBar = period.Value * 10080;
                else if (period.BarsPeriodType == BarsPeriodType.Month) minutesPerBar = period.Value * 43200;

                int effectiveCount = count > 0 ? count : 1000;
                double daysNeeded = (effectiveCount * minutesPerBar) / 1440.0 * 3.0; // Overfetch multiplier
                if (daysNeeded < 10) daysNeeded = 10;
                if (daysNeeded > 5475) daysNeeded = 5475; // Clamp ~15 years
                startTime = endTime.AddDays(-daysNeeded);
            }
            else if (mode == "GAP_FILL")
            {
                endTime = NinjaTrader.Core.Globals.Now;

                if (lastTime > 0)
                {
                    long normalizedTs = lastTime;
                    if (normalizedTs > 9999999999) normalizedTs /= 1000;
                    // The backend sends 'Broker Time Seconds' which is effectively True UTC for NT8.
                    DateTime utcTime = DateTimeOffset.FromUnixTimeSeconds(normalizedTs).UtcDateTime;

                    // GAP_FILL fetches forwards from the last known candle up to Now
                    // Safely translate the UTC timestamp to NinjaTrader's Local Time format
                    startTime = TimeZoneInfo.ConvertTimeFromUtc(utcTime, TimeZoneInfo.Local);
                }
                else
                {
                    double minutesPerBar = period.Value;
                    if (period.BarsPeriodType == BarsPeriodType.Minute) minutesPerBar = period.Value;
                    else if (period.BarsPeriodType == BarsPeriodType.Day) minutesPerBar = period.Value * 1440;
                    else if (period.BarsPeriodType == BarsPeriodType.Week) minutesPerBar = period.Value * 10080;
                    else if (period.BarsPeriodType == BarsPeriodType.Month) minutesPerBar = period.Value * 43200;

                    int effectiveCount = count > 0 ? count : 1000; // If count is 0 from a GAP, fetch 1000 fully closed bars
                    double daysNeeded = (effectiveCount * minutesPerBar) / 1440.0 * 2.5; // Overfetch multiplier
                    if (daysNeeded < 10) daysNeeded = 10;
                    if (daysNeeded > 5475) daysNeeded = 5475; // Clamp ~15 years
                    startTime = endTime.AddDays(-daysNeeded);
                }
            }
            else
            {
                // Fallback or other modes
                NinjaTrader.Code.Output.Process($"[Sync] Mode {mode} not fully implemented yet for BarsRequest", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                SendErrorResponse("Mode not implemented", timeframe, requestId, targetBotId, targetFunc, symbol);
                return;
            }

            // Step 4: Execute on UI/NinjaScript Dispatcher Thread
            if (NinjaTrader.Core.Globals.RandomDispatcher != null)
            {
                NinjaTrader.Core.Globals.RandomDispatcher.BeginInvoke(new Action(() =>
                {
                    ExecuteBarsRequest(inst, period, startTime, endTime, mode, count, lastTime, timeframe, requestId, symbol, targetBotId, targetFunc, isContinuous);
                }));
            }
            else
            {
                ExecuteBarsRequest(inst, period, startTime, endTime, mode, count, lastTime, timeframe, requestId, symbol, targetBotId, targetFunc, isContinuous);
            }
        }

        private void ExecuteBarsRequest(Instrument inst, BarsPeriod period, DateTime startTime, DateTime endTime, string mode, int count, long lastTime, string timeframe, string requestId, string symbol, string targetBotId, string targetFunc, bool isContinuous)
        {
            try
            {
                bool isConnected = false;
                lock (NinjaTrader.Cbi.Connection.Connections)
                {
                    foreach (var conn in NinjaTrader.Cbi.Connection.Connections)
                    {
                        if (conn.Status == NinjaTrader.Cbi.ConnectionStatus.Connected)
                        {
                            isConnected = true;
                            break;
                        }
                    }
                }

                if (!isConnected)
                {
                    NinjaTrader.Code.Output.Process($"[Sync] WARNING: NT8 has NO active connections. BarsRequest for '{symbol}' will fail or return 0 bars.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    SendErrorResponse("No Active Connections", timeframe, requestId, targetBotId, targetFunc, symbol);
                    return;
                }

                NinjaTrader.Code.Output.Process($"[Sync] Requesting {period.Value} {period.BarsPeriodType} for {inst.FullName} from {startTime} to {endTime} (Merge: {isContinuous})", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                BarsRequest req = new BarsRequest(inst, startTime, endTime)
                {
                    BarsPeriod = period,
                    TradingHours = inst.MasterInstrument.TradingHours, // Use native exchange hours so H4/D1/W1 session buckets perfectly match TradingView
                    MergePolicy = isContinuous ? MergePolicy.MergeBackAdjusted : MergePolicy.DoNotMerge
                };

                req.Request(new Action<BarsRequest, ErrorCode, string>((barsReq, errorCode, errorMsg) =>
                {
                    if (errorCode != ErrorCode.NoError)
                    {
                        NinjaTrader.Code.Output.Process($"[Sync] BarsRequest Error: {errorMsg}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        SendErrorResponse(errorMsg, timeframe, requestId, targetBotId, targetFunc, symbol);
                        return;
                    }

                    ProcessBarsResponse(barsReq.Bars, period, mode, count, lastTime, timeframe, requestId, symbol, targetBotId, targetFunc, inst, startTime, endTime);
                }));
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[Sync] BarsRequest Exception: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                SendErrorResponse(ex.Message, timeframe, requestId, targetBotId, targetFunc, symbol);
            }
        }

        private void ProcessBarsResponse(Bars bars, BarsPeriod period, string mode, int count, long lastTime, string timeframe, string requestId, string symbol, string targetBotId, string targetFunc, Instrument inst, DateTime startTime, DateTime endTime)
        {
            var data = new System.Collections.Generic.List<object>();

            int barsCount = bars == null ? -1 : bars.Count;
            // Diagnostics for Timezones
            string tStart = barsCount > 0 ? bars.GetTime(0).ToString("yyyy-MM-dd HH:mm:ss") : "N/A";
            string tEnd = barsCount > 0 ? bars.GetTime(barsCount - 1).ToString("yyyy-MM-dd HH:mm:ss") : "N/A";
            string requestedLastTimeRaw = lastTime > 0 ? DateTimeOffset.FromUnixTimeSeconds(lastTime).UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss") : "0";

            NinjaTrader.Code.Output.Process($"[Sync] ProcessBarsResponse {symbol} {timeframe} | Mode: {mode} | ClientLastTimeUTC: {requestedLastTimeRaw} | NT8_Bars: {barsCount} | NT8_Range: [{tStart} to {tEnd}]", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            if (bars == null || bars.Count == 0 || barsCount <= 0)
            {
                NinjaTrader.Code.Output.Process($"[Sync] ❌ DIAGNOSTIC: BarsRequest returned 0 bars for '{symbol}' ({inst.FullName}). Mode: {mode}, Period: {period.Value} {period.BarsPeriodType}. MergePolicy: {(inst.MasterInstrument.Name == symbol ? "Continuous" : "Exact")}.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                SendSuccessResponse(data, timeframe, requestId, targetBotId, targetFunc, symbol);
                return;
            }

            // Identify if the very last bar is currently forming (active) OR was truncated by our endTime request
            bool isActiveBar = false;
            int startIndex = bars.Count - 1;

            if (barsCount > 0)
            {
                // Strict check: if the close time is past Now OR past request endTime, it's still forming or unconfirmed
                DateTime lastBarCloseTime = bars.GetTime(startIndex);
                if (lastBarCloseTime > NinjaTrader.Core.Globals.Now || lastBarCloseTime > endTime)
                {
                    isActiveBar = true;
                    NinjaTrader.Code.Output.Process($"[Sync] Last bar in history is incomplete/forming. Dropping from payload.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                }
            }

            if (isActiveBar && startIndex >= 0)
            {
                startIndex--; // Drop the partial live candle from the history response so we don't save it as closed!
            }

            if (mode == "INITIAL_FILL" || mode == "GAP_FILL")
            {
                // Iterate backwards. Include historical bars up to startIndex (skipping live bar if active)
                for (int i = startIndex; i >= 0; i--)
                {
                    DateTime openTime = GetOpenTime(bars.GetTime(i), period, inst);

                    // Filter out unrequested historical padding before our requested start time.
                    // Because we iterate backwards (newest -> oldest), once we hit a padding bar, we can STOP.
                    if (openTime < startTime)
                    {
                        break;
                    }

                    DateTimeOffset offsetTime = new DateTimeOffset(openTime, TimeZoneInfo.Local.GetUtcOffset(openTime));
                    data.Add(new
                    {
                        time = offsetTime.ToUnixTimeMilliseconds(),
                        open = bars.GetOpen(i),
                        high = bars.GetHigh(i),
                        low = bars.GetLow(i),
                        close = bars.GetClose(i),
                        volume = bars.GetVolume(i)
                    });
                }

                // Reverse to natural chronological order before sending (oldest first)
                data.Reverse();
            }
            else if (mode == "FETCH")
            {
                int effectiveCount = count > 0 ? count : 1000; // GAP_FILL might send count=0, so parse it robustly.
                int collected = 0;

                for (int i = startIndex; i >= 0 && collected < effectiveCount; i--)
                {
                    DateTime openTime = GetOpenTime(bars.GetTime(i), period, inst);

                    if (openTime < startTime) break; // Filter padding

                    DateTimeOffset offsetTime = new DateTimeOffset(openTime, TimeZoneInfo.Local.GetUtcOffset(openTime));
                    data.Add(new
                    {
                        time = offsetTime.ToUnixTimeMilliseconds(),
                        open = bars.GetOpen(i),
                        high = bars.GetHigh(i),
                        low = bars.GetLow(i),
                        close = bars.GetClose(i),
                        volume = bars.GetVolume(i)
                    });
                    collected++;
                }

                data.Reverse();
            }

            SendSuccessResponse(data, timeframe, requestId, targetBotId, targetFunc, symbol);
        }

        private void SendSuccessResponse(object data, string timeframe, string requestId, string targetBotId, string targetFunc, string symbol)
        {
            var responseObj = new
            {
                status = "OK",
                timeframe = timeframe,
                content = data
            };
            _socket.SendProtocolMessage("CMD_START_SYNCHRONIZED_UPDATE_RESPONSE", responseObj, targetBotId, targetFunc, symbol, requestId);
        }

        private void SendErrorResponse(string message, string timeframe, string requestId, string targetBotId, string targetFunc, string symbol)
        {
            var responseObj = new
            {
                status = "ERROR",
                message = message,
                timeframe = timeframe
            };
            _socket.SendProtocolMessage("CMD_START_SYNCHRONIZED_UPDATE_RESPONSE", responseObj, targetBotId, targetFunc, symbol, requestId);
        }

        private DateTime GetOpenTime(DateTime closeTime, BarsPeriod period, Instrument inst)
        {
            SessionIterator iterator = new SessionIterator(inst.MasterInstrument.TradingHours);

            // Align closeTime to pure minute precision before calculating sessions so seconds never leak
            DateTime alignedClose = new DateTime(closeTime.Year, closeTime.Month, closeTime.Day, closeTime.Hour, closeTime.Minute, 0);
            DateTime safeTime = alignedClose.AddTicks(-1);

            iterator.GetNextSession(safeTime, true);

            if (period.BarsPeriodType == BarsPeriodType.Minute)
            {
                DateTime sessionBegin = iterator.ActualSessionBegin;
                if (safeTime < sessionBegin)
                {
                    // Fallback mathematically and ensure 0 seconds
                    DateTime fb = alignedClose.AddMinutes(-period.Value);
                    return new DateTime(fb.Year, fb.Month, fb.Day, fb.Hour, fb.Minute, 0);
                }

                TimeSpan elapsed = safeTime - sessionBegin;
                int completedBars = (int)(elapsed.TotalMinutes / period.Value);
                DateTime projectedOpen = sessionBegin.AddMinutes(completedBars * period.Value);
                return new DateTime(projectedOpen.Year, projectedOpen.Month, projectedOpen.Day, projectedOpen.Hour, projectedOpen.Minute, 0);
            }
            DateTime tradingDay = iterator.ActualTradingDayExchange;

            if (period.BarsPeriodType == BarsPeriodType.Day) return tradingDay.AddHours(12);
            if (period.BarsPeriodType == BarsPeriodType.Week)
            {
                int diff = (7 + (tradingDay.DayOfWeek - DayOfWeek.Monday)) % 7;
                return tradingDay.AddDays(-diff).AddHours(12);
            }
            if (period.BarsPeriodType == BarsPeriodType.Month) return new DateTime(tradingDay.Year, tradingDay.Month, 1).AddHours(12);
            return closeTime;
        }



        private BarsPeriod ParseTimeframe(string tf)
        {
            if (tf == "M1") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = 1 };
            if (tf == "M5") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = 5 };
            if (tf == "M15") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = 15 };
            if (tf == "M30") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = 30 };
            if (tf == "H1") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = 60 };
            if (tf == "H4") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = 240 };
            if (tf == "D1") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Day, Value = 1 };
            if (tf == "W1") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Week, Value = 1 };
            if (tf == "MN1") return new BarsPeriod { BarsPeriodType = BarsPeriodType.Month, Value = 1 };

            if (tf.StartsWith("M") && int.TryParse(tf.Substring(1), out int mVal)) return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = mVal };
            if (tf.StartsWith("H") && int.TryParse(tf.Substring(1), out int hVal)) return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = hVal * 60 };

            return null;
        }
    }
}
