using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using NinjaTrader.Cbi;
using NinjaTrader.Core;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
using Newtonsoft.Json.Linq;

namespace AwesomeCockpit.NT8.Bridge
{
    public class TradeMetric
    {
        public string Id { get; set; }
        public string Symbol { get; set; }
        public int Type { get; set; } // 0=Buy, 1=Sell
        public double Vol { get; set; }
        public double Open { get; set; }
        public double Sl { get; set; }
        public double Tp { get; set; }
        public bool SlAtBe { get; set; }

        public double RealizedPl { get; set; }
        public double HistoryCommission { get; set; }
        public double HistorySwap { get; set; }
        public long OpenTime { get; set; }

        // Tracking internal NT8 state
        public List<Execution> Executions { get; set; } = new List<Execution>();
    }

    public class ExecutionManager
    {
        private readonly BridgeWebSocket _socket;
        private readonly SubscriptionManager _subs;

        public static bool IsDiscoveryComplete = false;

        // Maps a UUID (signalName) to its combined TradeMetric state
        private readonly ConcurrentDictionary<string, TradeMetric> _activeTrades = new ConcurrentDictionary<string, TradeMetric>();

        // Idempotency cache (UUID -> bool) to prevent multi-executions
        private readonly ConcurrentDictionary<string, bool> _processedTradeIds = new ConcurrentDictionary<string, bool>();

        // Used for acknowledging terminal states
        private readonly ConcurrentDictionary<string, TradeMetric> _awaitingAckTrades = new ConcurrentDictionary<string, TradeMetric>();

        // Daily Stat Tracking
        private int _currentDay = -1;
        private double _dailyStartBalance = 0.0;
        private bool _tradingStoppedForDay = false;

        // Limits from Backend Config (Mocked default for now, can be updated via CMD_UPDATE_CONFIG)
        private double _lossProtectionPercent = 5.0; // 5% default
        private bool _lossProtectionEnabled = false;
        private int _takeProfitOption = 0; // 0=None, 1=Percent, 2=Fixed Value
        private double _takeProfitValue = 0.0;

        public ExecutionManager(BridgeWebSocket socket, SubscriptionManager subs)
        {
            _socket = socket;
            _subs = subs;

            // Hook into NT8 Global Account events safely
            try
            {
                if (Account.All != null)
                {
                    foreach (Account acc in Account.All)
                    {
                        SubscribeToAccount(acc);
                    }
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[ExecutionManager] Constructor Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
            // We should also listen for newly added accounts if possible, but bridging usually runs with pre-existing accounts.

            // We should also listen for newly added accounts if possible, but bridging usually runs with pre-existing accounts.

            NinjaTrader.Code.Output.Process($"[ExecutionManager] Constructor: Initialized.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
        }

        private void SubscribeToAccount(Account acc)
        {
            if (acc == null) return;
            acc.AccountItemUpdate += OnAccountItemUpdate;
            acc.ExecutionUpdate += OnExecutionUpdate;
            acc.OrderUpdate += OnOrderUpdate;
            acc.PositionUpdate += OnPositionUpdate;
        }

        private void UnsubscribeFromAccount(Account acc)
        {
            if (acc == null) return;
            acc.AccountItemUpdate -= OnAccountItemUpdate;
            acc.ExecutionUpdate -= OnExecutionUpdate;
            acc.OrderUpdate -= OnOrderUpdate;
            acc.PositionUpdate -= OnPositionUpdate;
        }

        public void Destroy()
        {

            lock (Account.All)
            {
                foreach (Account acc in Account.All)
                {
                    UnsubscribeFromAccount(acc);
                }
            }
        }

        private void OnAccountItemUpdate(object sender, AccountItemEventArgs e)
        {
            try
            {
                Account acc = sender as Account;
                if (acc == null) return;

                // When balance/equity/PnL changes, Broadcast Status
                if (e.AccountItem == AccountItem.CashValue ||
                    e.AccountItem == AccountItem.RealizedProfitLoss ||
                    e.AccountItem == AccountItem.UnrealizedProfitLoss ||
                    e.AccountItem == AccountItem.GrossRealizedProfitLoss ||
                    e.AccountItem == AccountItem.InitialMargin)
                {
                    CheckAndResetDailyStats(acc);
                    CheckDailyEquityLimits(acc);
                    BroadcastStatus(acc);

                    // When Unrealized PnL ticks, the market is moving. Use this native C# event 
                    // to safely sync Real-Time Trade Metric updates without background Timers!
                    if (e.AccountItem == AccountItem.UnrealizedProfitLoss && IsDiscoveryComplete)
                    {
                        if (!_activeTrades.IsEmpty || !_awaitingAckTrades.IsEmpty)
                        {
                            ReportPositions(acc);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[ExecutionManager] OnAccountItemUpdate Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        private void OnOrderUpdate(object sender, OrderEventArgs e)
        {
            if (e.OrderState == OrderState.Rejected)
            {
                NinjaTrader.Code.Output.Process($"[ExecutionManager] ORDER REJECTED: {e.Order.Name}, Action: {e.Order.OrderAction}, Type: {e.Order.OrderType}, OCO: {e.Order.Oco}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
            // Trace all updates during debug
            if (e.Order.Name.Contains("_SL") || e.Order.Name.Contains("_TP"))
            {
                NinjaTrader.Code.Output.Process($"[ExecutionManager] OrderUpdate: {e.Order.Name} -> {e.OrderState}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        private void OnPositionUpdate(object sender, PositionEventArgs e) { }

        private void OnExecutionUpdate(object sender, ExecutionEventArgs e)
        {
            if (e.Execution == null || e.Execution.Order == null || string.IsNullOrEmpty(e.Execution.Order.Name)) return;

            string id = e.Execution.Order.Name;
            // Orders might be named uuid, uuid_SL, uuid_TP for the same trade. 
            // We strip the suffix to find the master TradeMetric.
            string baseId = id.Replace("_SL", "").Replace("_TP", "");

            TradeMetric tm = null;
            if (!_activeTrades.TryGetValue(baseId, out tm))
            {
                // Sub-match for timestamped close orders (e.g., 1501_6381234456789)
                var activeKey = _activeTrades.Keys.FirstOrDefault(k => baseId.StartsWith(k + "_"));
                if (activeKey != null)
                {
                    _activeTrades.TryGetValue(activeKey, out tm);
                }
            }

            if (tm != null)
            {
                lock (tm)
                {
                    tm.Executions.Add(e.Execution);
                    tm.HistoryCommission += e.Execution.Commission;

                    // Determine if this execution increases or decreases our net position
                    bool isEntry = (tm.Type == 0 && (e.Execution.Order.OrderAction == OrderAction.Buy || e.Execution.Order.OrderAction == OrderAction.BuyToCover)) ||
                                   (tm.Type == 1 && (e.Execution.Order.OrderAction == OrderAction.Sell || e.Execution.Order.OrderAction == OrderAction.SellShort));

                    // To be strictly correct: Buy opens a Long(0), SellShort opens a Short(1). 
                    // BuyToCover closes a Short, Sell closes a Long.
                    isEntry = (tm.Type == 0 && e.Execution.Order.OrderAction == OrderAction.Buy) ||
                              (tm.Type == 1 && e.Execution.Order.OrderAction == OrderAction.SellShort);

                    if (isEntry)
                    {
                        // Open event
                        var entryExecutions = tm.Executions.Where(ex => (tm.Type == 0 && ex.Order.OrderAction == OrderAction.Buy) || (tm.Type == 1 && ex.Order.OrderAction == OrderAction.SellShort)).ToList();
                        
                        int totalEntryVol = entryExecutions.Sum(ex => ex.Quantity);
                        tm.Vol = totalEntryVol;

                        if (totalEntryVol > 0)
                        {
                            // Calculate exact Volume-Weighted Average Price (VWAP) of all entry fills
                            double totalCost = entryExecutions.Sum(ex => ex.Price * ex.Quantity);
                            tm.Open = totalCost / totalEntryVol;
                            NinjaTrader.Code.Output.Process($"[ExecutionManager] Updated VWAP Entry Price for {tm.Id} to {tm.Open} (Vol: {totalEntryVol})", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        }
                    }
                    else
                    {
                        // Exit event - aggregate PnL
                        double diff = tm.Type == 0 ? (e.Execution.Price - tm.Open) : (tm.Open - e.Execution.Price);
                        double pnl = diff * e.Execution.Quantity * e.Execution.Instrument.MasterInstrument.PointValue;
                        tm.RealizedPl += pnl;

                        // Check if closed
                        int entryVol = tm.Executions.Where(ex => (tm.Type == 0 && ex.Order.OrderAction == OrderAction.Buy) || (tm.Type == 1 && ex.Order.OrderAction == OrderAction.SellShort)).Sum(ex => ex.Quantity);
                        int exitVol = tm.Executions.Where(ex => (tm.Type == 0 && (ex.Order.OrderAction == OrderAction.Sell || ex.Order.OrderAction == OrderAction.SellShort)) || (tm.Type == 1 && (ex.Order.OrderAction == OrderAction.Buy || ex.Order.OrderAction == OrderAction.BuyToCover))).Sum(ex => ex.Quantity);

                        NinjaTrader.Code.Output.Process($"[ExecutionManager] OnExecutionUpdate - Trade: {tm.Id}, entryVol: {entryVol}, exitVol: {exitVol}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                        if (entryVol > 0 && entryVol == exitVol)
                        {
                            // Trade closed
                            if (_activeTrades.TryRemove(tm.Id, out TradeMetric closedTm))
                            {
                                closedTm.Vol = 0; // Ensure 0 for payload

                                // Broadcast CLOSED event immediately to remove it from frontend tracking
                                var closedPayloadObj = new
                                {
                                    id = closedTm.Id,
                                    customStatus = "CLOSED",
                                    time = NinjaTrader.Core.Globals.Now.Ticks,
                                    profit = closedTm.RealizedPl, // Total profit
                                    vol = 0,
                                    open = closedTm.Open,
                                    sl = closedTm.Sl,
                                    tp = closedTm.Tp,
                                    symbol = closedTm.Symbol,
                                    type = closedTm.Type,
                                    metrics = new
                                    {
                                        realizedPl = closedTm.RealizedPl,
                                        unrealizedPl = 0.0,
                                        historyCommission = closedTm.HistoryCommission,
                                        historySwap = closedTm.HistorySwap,
                                        openTime = closedTm.OpenTime,
                                        entryPrice = closedTm.Open
                                    }
                                };

                                var updatePayload = new { positions = new[] { closedPayloadObj } };
                                _socket.SendProtocolMessage("EV_TRADE_CLOSED", updatePayload, e.Execution.Account.Name, "TRADING", "ALL");

                                NinjaTrader.Code.Output.Process($"[ExecutionManager] Trade {baseId} Fully Closed. Emitted EV_TRADE_CLOSED. Realized: {closedTm.RealizedPl}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            }
                        }
                    }
                }

                // Trigger an immediate update to the frontend since our trades just changed
                ReportPositions(e.Execution.Account);
            }
        }

        // Removed _reportTimer polling callback

        // Removed GetTargetAccount fallback scanner

        private void CheckAndResetDailyStats(Account acc)
        {
            if (acc == null) return;
            int day = NinjaTrader.Core.Globals.Now.Day;
            if (day != _currentDay)
            {
                _currentDay = day;
                _dailyStartBalance = acc.Get(AccountItem.RealizedProfitLoss, Currency.UsDollar) + acc.Get(AccountItem.InitialMargin, Currency.UsDollar);
                if (_dailyStartBalance <= 0) _dailyStartBalance = 50000; // Fallback sim size

                _tradingStoppedForDay = false;
                NinjaTrader.Code.Output.Process($"[ExecutionManager] New Day Detected for {acc.Name}. Reset Daily Balance: {_dailyStartBalance}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        private void CheckDailyEquityLimits(Account acc)
        {
            if (acc == null) return;

            double currentEquity = acc.Get(AccountItem.RealizedProfitLoss, Currency.UsDollar) + acc.Get(AccountItem.GrossRealizedProfitLoss, Currency.UsDollar) + acc.Get(AccountItem.InitialMargin, Currency.UsDollar); // Approx Equity
            if (currentEquity <= 0) currentEquity = 50000;

            bool limitReached = false;

            if (_lossProtectionEnabled)
            {
                double minEquity = _dailyStartBalance - (_dailyStartBalance * (_lossProtectionPercent / 100.0));
                if (currentEquity <= minEquity)
                {
                    limitReached = true;
                    if (!_tradingStoppedForDay)
                    {
                        NinjaTrader.Code.Output.Process($"[ExecutionManager] EQUITY STOP LOSS REACHED on {acc.Name}! Eq: {currentEquity}, Min: {minEquity}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        CloseAllPositions("Equity Stop Loss", acc);
                    }
                }
            }

            if (_takeProfitOption > 0)
            {
                double targetEquity = 0;
                if (_takeProfitOption == 1) targetEquity = _dailyStartBalance * (1.0 + (_takeProfitValue / 100.0));
                else if (_takeProfitOption == 2) targetEquity = _dailyStartBalance + _takeProfitValue;

                if (targetEquity > 0 && currentEquity >= targetEquity)
                {
                    limitReached = true;
                    if (!_tradingStoppedForDay)
                    {
                        NinjaTrader.Code.Output.Process($"[ExecutionManager] DAILY PROFIT TARGET REACHED on {acc.Name}! Eq: {currentEquity}, Target: {targetEquity}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        CloseAllPositions("Profit Target", acc);
                    }
                }
            }

            if (limitReached)
            {
                _tradingStoppedForDay = true;
            }
            else if (_tradingStoppedForDay)
            {
                // Config changed/Recovery?
                _tradingStoppedForDay = false;
            }
        }

        private void CloseAllPositions(string reason, Account acc)
        {
            if (acc == null) return;

            foreach (Position pos in acc.Positions)
            {
                if (pos.MarketPosition != MarketPosition.Flat)
                {
                    OrderAction action = pos.MarketPosition == MarketPosition.Long ? OrderAction.Sell : OrderAction.BuyToCover;
#pragma warning disable 0618
                    Order o = acc.CreateOrder(pos.Instrument, action, OrderType.Market, TimeInForce.Gtc, pos.Quantity, 0, 0, string.Empty, "CLOSE_ALL", null);
                    if (o != null) acc.Submit(new[] { o });
#pragma warning restore 0618
                }
            }
        }

        private void BroadcastStatus(Account acc)
        {
            if (!IsDiscoveryComplete) return;

            try
            {
                if (acc == null) return;

                double balance = acc.Get(AccountItem.CashValue, Currency.UsDollar);
                if (balance <= 0) balance = acc.Get(AccountItem.RealizedProfitLoss, Currency.UsDollar) + acc.Get(AccountItem.InitialMargin, Currency.UsDollar);
                if (balance <= 0) balance = 50000;

                double equity = balance + acc.Get(AccountItem.UnrealizedProfitLoss, Currency.UsDollar);

                // NinjaTrader.Code.Output.Process($"[ExecutionManager] EV_ACCOUNT_STATUS_UPDATE on '{acc.Name}'. Balance: {balance}, Equity: {equity}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                var accountObj = new
                {
                    login = 12345, // Mock NT8 login
                    currency = "USD",
                    leverage = 1,
                    balance = balance,
                    equity = equity,
                    profit = acc.Get(AccountItem.UnrealizedProfitLoss, Currency.UsDollar),
                    margin = 0.0,
                    margin_free = equity,
                    margin_level = 0.0,
                    trade_allowed = true,
                    connected = true,
                    dayProfit = equity - _dailyStartBalance,
                    dayStartBalance = _dailyStartBalance,
                    tradingStopped = _tradingStoppedForDay
                };

                var expertObj = new
                {
                    active = true,
                    allowed = true
                };

                var payload = new
                {
                    account = accountObj,
                    expert = expertObj
                };

                // FIX: Use actual Account Name as botId instead of "ALL"
                string botId = acc.Name;
                if (string.IsNullOrEmpty(botId)) botId = "NT8";

                _socket.SendProtocolMessage("EV_ACCOUNT_STATUS_UPDATE", payload, botId, "TRADING", "ALL");
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[ExecutionManager] BroadcastStatus Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        private void ReportPositions(Account acc)
        {
            // Report Active Positions
            if (!_activeTrades.IsEmpty)
            {
                var positionsPayload = new List<object>();
                foreach (var kvp in _activeTrades)
                {
                    var tm = kvp.Value;

                    int entryVol = tm.Executions.Where(ex => (tm.Type == 0 && ex.Order.OrderAction == OrderAction.Buy) || (tm.Type == 1 && ex.Order.OrderAction == OrderAction.SellShort)).Sum(ex => ex.Quantity);
                    int exitVol = tm.Executions.Where(ex => (tm.Type == 0 && (ex.Order.OrderAction == OrderAction.Sell || ex.Order.OrderAction == OrderAction.SellShort)) || (tm.Type == 1 && (ex.Order.OrderAction == OrderAction.Buy || ex.Order.OrderAction == OrderAction.BuyToCover))).Sum(ex => ex.Quantity);
                    int remainingVol = entryVol - exitVol;

                    // The user explicitly requested NO updates for pending orders without active volume.
                    if (remainingVol == 0) continue;

                    double payloadVol = remainingVol > 0 ? remainingVol : tm.Vol;

                    double currentPrice = 0.0;
                    double unrealized = 0.0;

                    // Extract Live MarketPrice from SubscriptionManager if available
                    currentPrice = _subs.GetCurrentPrice(tm.Symbol);

                    // CRITICAL FIX: Only calculate Unrealized PnL for ACTUAL filled volume, NOT pending volume.
                    if (currentPrice > 0 && remainingVol > 0)
                    {
                        double diff = tm.Type == 0 ? (currentPrice - tm.Open) : (tm.Open - currentPrice);
                        // Convert to currency value
                        Instrument inst = ResolveInstrument(tm.Symbol);
                        if (inst != null)
                        {
                            unrealized = diff * remainingVol * inst.MasterInstrument.PointValue;
                        }
                    }

                    positionsPayload.Add(new
                    {
                        id = tm.Id,
                        symbol = tm.Symbol,
                        type = tm.Type,
                        vol = payloadVol,
                        open = tm.Open,
                        current = currentPrice,
                        sl = tm.Sl,
                        tp = tm.Tp,
                        slAtBe = tm.SlAtBe, // Sync with DB mapping
                        swap = tm.HistorySwap,
                        profit = unrealized,
                        commission = tm.HistoryCommission,
                        comment = "AwesomeCockpit NT8 Bridge",
                        metrics = new
                        {
                            realizedPl = tm.RealizedPl,
                            historyCommission = tm.HistoryCommission,
                            historySwap = tm.HistorySwap,
                            openTime = tm.OpenTime,
                            entryPrice = tm.Open
                        }
                    });
                }

                if (positionsPayload.Count > 0)
                {
                    string botId = acc != null ? acc.Name : "ALL";
                    var updatePayload = new { positions = positionsPayload };
                    _socket.SendProtocolMessage("EV_TRADE_UPDATE", updatePayload, botId, "TRADING", "ALL");
                }
            }

            // Awaiting ACK reporting loop removed - Trades immediately fire EV_TRADE_CLOSED on execution fill.
        }

        public void ExecuteCommand(JObject msg)
        {
            string cmd = msg["command"]?.ToString();
            switch (cmd)
            {
                case "CMD_EXECUTE_TRADE":
                    HandleExecuteTrade(msg);
                    break;
                case "CMD_MODIFY_POSITION":
                    HandleModifyPosition(msg);
                    break;
                case "CMD_CLOSE_POSITION":
                    HandleModifyPosition(msg);
                    break;
                case "CMD_ACK_TRADE":
                    HandleAckTrade(msg);
                    break;
            }
        }

        private void HandleExecuteTrade(JObject msg)
        {
            try
            {
                var payload = msg["payload"];
                var header = msg["header"];
                if (payload == null || header == null) return;

                string botId = header["botId"]?.ToString() ?? "NT8";
                string reqId = header["request_id"]?.ToString() ?? header["requestId"]?.ToString() ?? "";

                string id = payload["id"]?.ToString();
                if (string.IsNullOrEmpty(id)) return;

                // 1. Idempotency Guard
                if (!_processedTradeIds.TryAdd(id, true))
                {
                    NinjaTrader.Code.Output.Process($"[ExecutionManager] Blocked duplicate execution for ID {id}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    return;
                }

                string symbol = payload["symbol"]?.ToString();
                string operation = payload["operation"]?.ToString()?.ToUpper() ?? payload["direction"]?.ToString()?.ToUpper();
                string orderType = payload["orderType"]?.ToString()?.ToUpper(); // MARKET, LIMIT, STOP

                // Wrap everything in Dispatcher to prevent silent background thread InvalidOperationExceptions
                if (NinjaTrader.Core.Globals.RandomDispatcher != null)
                {
                    Action executeAction = () =>
                    {
                        try
                        {
                            NinjaTrader.Code.Output.Process($"[ExecutionManager] Executing {operation} {orderType} for {symbol} (ID: {id})", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                            if (_tradingStoppedForDay)
                            {
                                SendRejectResponse("Trading Stopped: Daily Limit Reached", id, reqId, botId);
                                return;
                            }

                            // 2. Resolve Instrument (Using SubscriptionManager logic)
                            Instrument inst = ResolveInstrument(symbol);
                            if (inst == null)
                            {
                                SendRejectResponse("Symbol not found or continuous contract resolution failed", id, reqId, botId);
                                return;
                            }

                            // 3. Resolve Price Levels (Anchor vs Absolute)
                            double entryPrice = ResolveAnchor(payload["entry"]?["anchor"], inst);
                            if (entryPrice == 0.0 && payload["entry"]?["price"] != null && payload["entry"]["price"].Type != JTokenType.Null)
                                entryPrice = Convert.ToDouble(payload["entry"]["price"]);

                            double slPrice = ResolveAnchor(payload["sl"]?["anchor"], inst);
                            if (slPrice == 0.0 && payload["sl"]?["price"] != null && payload["sl"]["price"].Type != JTokenType.Null)
                                slPrice = Convert.ToDouble(payload["sl"]["price"]);

                            double tpPrice = ResolveAnchor(payload["tp"]?["anchor"], inst);
                            if (tpPrice == 0.0 && payload["tp"]?["price"] != null && payload["tp"]["price"].Type != JTokenType.Null)
                                tpPrice = Convert.ToDouble(payload["tp"]["price"]);

                            double riskReward = 0.0;
                            if (payload["riskReward"] != null && payload["riskReward"].Type != JTokenType.Null)
                            {
                                if (payload["riskReward"].Type == JTokenType.Object && payload["riskReward"]["value"] != null)
                                    riskReward = Convert.ToDouble(payload["riskReward"]["value"]);
                                else if (payload["riskReward"].Type != JTokenType.Object)
                                    riskReward = Convert.ToDouble(payload["riskReward"]);
                            }

                            // Fallback for MARKET
                            if (entryPrice == 0 && orderType == "MARKET")
                            {
                                // To calculate dynamic risk for Market Orders, we must know the current price to determine Stop Loss distance
                                double currentMarketPrice = _subs.GetCurrentPrice(inst.FullName);
                                if (currentMarketPrice > 0)
                                {
                                    entryPrice = currentMarketPrice;
                                    NinjaTrader.Code.Output.Process($"[ExecutionManager] Dynamic MARKET Entry Fallback -> Using Current Price: {entryPrice} for Risk Calc", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                                }
                                else
                                {
                                    // Soft fallback so the order doesn't completely fail if no datafeed is subscribed yet
                                    entryPrice = 0;
                                }
                            }

                            // Validations
                            if (orderType != "MARKET" && entryPrice <= 0)
                            {
                                SendRejectResponse("Pending orders require a valid entry anchor or price", id, reqId, botId);
                                return;
                            }
                            if (orderType != "MARKET" && slPrice == 0 && tpPrice == 0)
                            {
                                SendRejectResponse("Pending orders require at least SL or TP", id, reqId, botId);
                                return;
                            }

                            // Basic Auto-Calc just like MT5
                            if (riskReward > 0 && entryPrice > 0)
                            {
                                if (slPrice > 0 && tpPrice == 0)
                                {
                                    double dist = Math.Abs(entryPrice - slPrice);
                                    tpPrice = (operation == "BUY" || operation == "LONG") ? entryPrice + (dist * riskReward) : entryPrice - (dist * riskReward);
                                }
                                else if (tpPrice > 0 && slPrice == 0 && orderType != "MARKET")
                                {
                                    double dist = Math.Abs(entryPrice - tpPrice);
                                    slPrice = (operation == "BUY" || operation == "LONG") ? entryPrice - (dist / riskReward) : entryPrice + (dist / riskReward);
                                }
                            }

                            // 4. Calculate Risk / Quantity
                            double riskPercent = 1.0;
                            if (payload["risk"] != null && payload["risk"].Type != JTokenType.Null)
                            {
                                if (payload["risk"].Type == JTokenType.Object && payload["risk"]["value"] != null)
                                    riskPercent = Convert.ToDouble(payload["risk"]["value"]);
                                else if (payload["risk"].Type != JTokenType.Object)
                                    riskPercent = Convert.ToDouble(payload["risk"]);
                            }

                            string safeName = botId.Replace("_DATAFEED", "");
                            Account targetAccount = Account.All.FirstOrDefault(a => a != null && (a.Name == safeName || a.Name == botId));
                            if (targetAccount == null)
                                targetAccount = Account.All.FirstOrDefault(a => a != null && a.Name.StartsWith("Sim"));

                            if (targetAccount == null)
                            {
                                SendRejectResponse("No suitable trading account found", id, reqId, botId);
                                return;
                            }

                            // 5. Account Balance Check
                            double balance = targetAccount.Get(AccountItem.CashValue, Currency.UsDollar);
                            if (balance <= 0)
                            {
                                // Alternative fallback if CashValue isn't immediately available on Sim
                                balance = targetAccount.Get(AccountItem.RealizedProfitLoss, Currency.UsDollar) + targetAccount.Get(AccountItem.InitialMargin, Currency.UsDollar);
                                if (balance <= 0) balance = 50000;
                            }

                            double riskAmount = balance * (riskPercent / 100.0);
                            int finalQuantity = CalculateLotSize(inst, entryPrice, slPrice, riskAmount);

                            NinjaTrader.Code.Output.Process($"[ExecutionManager] Target Vol: {finalQuantity} contracts (Balance: {balance}, Risk: {riskPercent}%)", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                            // 5. Submit Order
                            OrderAction action = OrderAction.Buy;
                            if (operation == "SELL" || operation == "SHORT") action = OrderAction.SellShort;

                            string ocoGroup = $"OCO_{id}";
                            NinjaTrader.Code.Output.Process($"[ExecutionManager] Submitting {action} {orderType} Volume: {finalQuantity} (Entry: {entryPrice}, SL: {slPrice}, TP: {tpPrice}, OCO: {ocoGroup})", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                            var metric = new TradeMetric
                            {
                                Id = id,
                                Symbol = inst.FullName,
                                Type = (action == OrderAction.Buy) ? 0 : 1,
                                Vol = finalQuantity,
                                Open = entryPrice,
                                Sl = slPrice,
                                Tp = tpPrice,
                                OpenTime = NinjaTrader.Core.Globals.Now.Ticks
                            };
                            _activeTrades.TryAdd(id, metric);

#pragma warning disable 0618
                            if (orderType == "MARKET")
                            {
                                Order order = targetAccount.CreateOrder(inst, action, OrderType.Market, TimeInForce.Gtc, finalQuantity, 0, 0, "", id, null);
                                if (order != null) targetAccount.Submit(new[] { order });
                            }
                            else if (orderType == "LIMIT")
                            {
                                Order order = targetAccount.CreateOrder(inst, action, OrderType.Limit, TimeInForce.Gtc, finalQuantity, entryPrice, 0, "", id, null);
                                if (order != null) targetAccount.Submit(new[] { order });
                            }
                            else if (orderType == "STOP")
                            {
                                Order order = targetAccount.CreateOrder(inst, action, OrderType.StopMarket, TimeInForce.Gtc, finalQuantity, 0, entryPrice, "", id, null);
                                if (order != null) targetAccount.Submit(new[] { order });
                            }
#pragma warning restore 0618

                            if (slPrice > 0)
                            {
                                OrderAction slAction = (action == OrderAction.Buy) ? OrderAction.Sell : OrderAction.BuyToCover;
#pragma warning disable 0618
                                Order order = targetAccount.CreateOrder(inst, slAction, OrderType.StopMarket, TimeInForce.Gtc, finalQuantity, 0, slPrice, ocoGroup, id + "_SL", null);
#pragma warning restore 0618
                                if (order != null) targetAccount.Submit(new[] { order });
                            }

                            if (tpPrice > 0)
                            {
                                OrderAction tpAction = (action == OrderAction.Buy) ? OrderAction.Sell : OrderAction.BuyToCover;
#pragma warning disable 0618
                                Order order = targetAccount.CreateOrder(inst, tpAction, OrderType.Limit, TimeInForce.Gtc, finalQuantity, tpPrice, 0, ocoGroup, id + "_TP", null);
#pragma warning restore 0618
                                if (order != null) targetAccount.Submit(new[] { order });
                            }

                            var successPayload = new
                            {
                                status = (orderType == "MARKET") ? "OK" : "CREATED",
                                message = "Execution Dispatched",
                                id = id,
                                masterId = id,
                                requested = finalQuantity,
                                executed = finalQuantity,
                                entry_price = entryPrice
                            };
                            _socket.SendProtocolMessage("CMD_EXECUTE_TRADE_RESPONSE", successPayload, botId, "TRADING", "ALL", reqId);

                            try
                            {
                                // Trigger immediate frontend update to register the tracked trades
                                ReportPositions(targetAccount);
                            }
                            catch (Exception rpEx)
                            {
                                NinjaTrader.Code.Output.Process($"[ExecutionManager] ReportPositions Error: {rpEx.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            }
                        }
                        catch (Exception innerEx)
                        {
                            NinjaTrader.Code.Output.Process($"[ExecutionManager] Dispatcher Execute Error: {innerEx.Message}\n{innerEx.StackTrace}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            SendRejectResponse($"NT8 Integration Error: {innerEx.Message}", id, reqId, botId);
                        }
                    };

                    if (NinjaTrader.Core.Globals.RandomDispatcher.CheckAccess()) executeAction();
                    else NinjaTrader.Core.Globals.RandomDispatcher.BeginInvoke(executeAction);
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[ExecutionManager] ExecuteTrade Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        private Instrument ResolveInstrument(string symbol)
        {
            bool isMasterSymbol = false;
            MasterInstrument master = null;

            foreach (MasterInstrument m in MasterInstrument.All)
            {
                if (m.Name == symbol) { isMasterSymbol = true; master = m; break; }
            }

            if (isMasterSymbol && master != null)
            {
                if (master.RolloverCollection != null)
                {
                    var sortedRollovers = master.RolloverCollection.Where(r => r.Date.Date <= NinjaTrader.Core.Globals.Now.Date.AddDays(15)).OrderByDescending(r => r.Date).ToList();
                    foreach (var ro in sortedRollovers)
                    {
                        string suffix = " " + ro.ContractMonth.ToString("MM-yy");
                        Instrument frontMonthInst = Instrument.GetInstrument(symbol + suffix);
                        if (frontMonthInst != null) return frontMonthInst;
                    }
                }
            }
            return Instrument.GetInstrument(symbol);
        }

        private int CalculateLotSize(Instrument inst, double entryPrice, double stopLoss, double riskAmount)
        {
            if (inst == null || entryPrice == 0 || stopLoss == 0 || riskAmount <= 0)
            {
                NinjaTrader.Code.Output.Process($"[ExecutionManager] Risk Calc Skipped. Defaulting 1 Lot. (entry={entryPrice}, sl={stopLoss}, risk={riskAmount})", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                return 1;
            }

            double slDistance = Math.Abs(entryPrice - stopLoss);
            double ticks = slDistance / inst.MasterInstrument.TickSize;
            double tickValue = inst.MasterInstrument.PointValue * inst.MasterInstrument.TickSize;

            double contractQuantity = riskAmount / (ticks * tickValue);
            int finalQuantity = (int)Math.Floor(contractQuantity);

            NinjaTrader.Code.Output.Process($"[ExecutionManager] Risk Calc: SL Dist={slDistance} ({ticks:F1} Ticks). TickVal={tickValue:F2}. Max Contracts={contractQuantity:F2} -> Floor={finalQuantity}. RiskAmt={riskAmount:F2}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            if (finalQuantity < 1) finalQuantity = 1;
            return finalQuantity;
        }

        private void SendRejectResponse(string message, string id, string reqId, string botId)
        {
            var payload = new
            {
                status = "REJECTED",
                message = message,
                id = id
            };
            _socket.SendProtocolMessage("CMD_EXECUTE_TRADE_RESPONSE", payload, botId, "TRADING", "ALL", reqId);
        }

        private double ResolveAnchor(JToken anchor, Instrument inst)
        {
            if (anchor == null || anchor.Type == JTokenType.Null) return 0.0;

            // 1. Check for raw price fallback
            double fallback = 0.0;
            if (anchor["value"] != null && anchor["value"].Type != JTokenType.Null) fallback = Convert.ToDouble(anchor["value"]);
            else if (anchor["price"] != null && anchor["price"].Type != JTokenType.Null) fallback = Convert.ToDouble(anchor["price"]);

            // If no timeframe/time, return fallback (Raw Price Payload)
            if (anchor["timeframe"] == null || anchor["time"] == null)
            {
                return fallback;
            }

            long checkTime = 0;
            if (long.TryParse(anchor["time"].ToString(), out checkTime) && checkTime <= 0)
                return fallback;

            string tfStr = anchor["timeframe"].ToString();
            string type = anchor["type"]?.ToString()?.ToLower() ?? "close"; // open, high, low, close

            // Convert MT5 timestamp (seconds) to C# DateTime (UTC -> Local if needed, assuming UTC from backend)
            DateTime requestedTime = DateTimeOffset.FromUnixTimeSeconds(checkTime).UtcDateTime;

            int periodValue = 1;
            BarsPeriodType periodType = BarsPeriodType.Minute;

            // Parse Timeframe (Simplified for common M1-H4)
            if (tfStr.StartsWith("M") && tfStr != "MN1") { periodType = BarsPeriodType.Minute; int.TryParse(tfStr.Substring(1), out periodValue); }
            else if (tfStr.StartsWith("H")) { periodType = BarsPeriodType.Minute; if (int.TryParse(tfStr.Substring(1), out int h)) periodValue = h * 60; }
            else if (tfStr == "D1") { periodType = BarsPeriodType.Day; periodValue = 1; }

            // To query historical data synchronously in NT8 we use BarsRequest
            NinjaTrader.Code.Output.Process($"[ExecutionManager] Resolving Anchor for time {requestedTime} ({tfStr}) type: {type}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            double resolvedPrice = fallback;
            try
            {
                // Request a small window around the target time (e.g. 5 days back)
                BarsRequest br = new BarsRequest(inst, requestedTime.AddDays(-5), requestedTime.AddDays(1));
                br.BarsPeriod = new BarsPeriod { BarsPeriodType = periodType, Value = periodValue };
                br.TradingHours = inst.MasterInstrument.TradingHours;

                // Perform synchronous request (Bridge runs in background task usually, so sync is fine, but be careful of deadlocks)
                br.Request(new Action<BarsRequest, ErrorCode, string>((req, errorCode, msg) =>
                {
                    if (errorCode == ErrorCode.NoError && req.Bars != null && req.Bars.Count > 0)
                    {
                        // Find the bar that contains or is closest to requestedTime
                        // Note: NT8 bar times are typically the END of the bar.
                        int barIdx = req.Bars.GetBar(requestedTime);
                        if (barIdx >= 0 && barIdx < req.Bars.Count)
                        {
                            switch (type)
                            {
                                case "high": resolvedPrice = req.Bars.GetHigh(barIdx); break;
                                case "low": resolvedPrice = req.Bars.GetLow(barIdx); break;
                                case "open": resolvedPrice = req.Bars.GetOpen(barIdx); break;
                                case "close": resolvedPrice = req.Bars.GetClose(barIdx); break;
                            }
                        }
                    }
                }));

                // Wait for the request to finish (since Request is asynchronous but we need a result now)
                // In a perfect world we wrap this in a TaskCompletionSource, but NinjaTrader's BarsRequest is notoriously tricky.
                // A simpler fallback for live execution is caching the most recent bars via SubscriptionManager, 
                // but let's assume the above callback fires synchronously enough or we need a proper awaiter.

                // --- HACK PREVENTION ---
                // If BarsRequest doesn't fire synchronously inline (it rarely does fast enough), 
                // we should actually rely on the `SubscriptionManager`'s cached bars if possible, 
                // OR we must convert `ResolveAnchor` to an `async Task<double>` and await a `TaskCompletionSource`.
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[AnchorResolver] Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }

            return resolvedPrice;
        }

        private void HandleModifyPosition(JObject msg)
        {
            try
            {
                var payload = msg["payload"];
                var header = msg["header"];
                if (payload == null || header == null) return;

                string botId = header["botId"]?.ToString() ?? "NT8";
                string reqId = header["request_id"]?.ToString() ?? header["requestId"]?.ToString() ?? "";

                string id = payload["id"]?.ToString();
                if (string.IsNullOrEmpty(id)) return;

                NinjaTrader.Code.Output.Process($"[ExecutionManager] Modifying Trade {id}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                // Need the target account again to find working orders attached to this ID
                string safeName = botId.Replace("_DATAFEED", "");
                Account targetAccount = null;

                if (NinjaTrader.Core.Globals.RandomDispatcher != null)
                {
                    Action modifyAction = () =>
                    {
                        try
                        {
                            targetAccount = Account.All.FirstOrDefault(a => a != null && (a.Name == safeName || a.Name == botId));
                            if (targetAccount == null)
                                targetAccount = Account.All.FirstOrDefault(a => a != null && a.Name.StartsWith("Sim"));

                if (targetAccount == null)
                {
                    SendRejectResponse("No suitable trading account found for modification", id, reqId, botId);
                    return;
                }

                // In NT8, modifications mean finding the existing working Order and calling ChangeOrder
                bool modified = false;

                // Let's resolve the new SL / TP 
                // We need an Instrument to properly Resolve anchors, so we MUST find the existing order or position first to get the Instrument
                Instrument targetInst = null;

                // Find all working orders for this ID
                var workingOrders = targetAccount.Orders.Where(o => o.OrderState == OrderState.Working || o.OrderState == OrderState.Accepted).ToList();
                var associatedOrders = workingOrders.Where(o => o.Name.StartsWith(id)).ToList(); // Matches id, id_SL, id_TP

                if (associatedOrders.Count > 0)
                {
                    targetInst = associatedOrders.First().Instrument;
                }
                else
                {
                    // Maybe we only have a Position, no SL/TP yet?
                    var pos = targetAccount.Positions.FirstOrDefault(p => p.MarketPosition != MarketPosition.Flat /* Can't easily link ID to position unless we use Executions */);
                    // This is hard in NT8 since Positions don't track Name. The Executions do.
                    // If no orders exist, we need to know the symbol from the payload or tracking map.
                    if (_activeTrades.TryGetValue(id, out TradeMetric tm) && !string.IsNullOrEmpty(tm.Symbol))
                    {
                        targetInst = ResolveInstrument(tm.Symbol);
                    }
                }

                if (targetInst == null)
                {
                    SendRejectResponse("Cannot resolve instrument for modification", id, reqId, botId);
                    return;
                }

                double newSl = ResolveAnchor(payload["sl"]?["anchor"], targetInst);
                if (newSl == 0.0 && payload["sl"]?["price"] != null && payload["sl"]["price"].Type != JTokenType.Null)
                    newSl = Convert.ToDouble(payload["sl"]["price"]);

                double newTp = ResolveAnchor(payload["tp"]?["anchor"], targetInst);
                if (newTp == 0.0 && payload["tp"]?["price"] != null && payload["tp"]["price"].Type != JTokenType.Null)
                    newTp = Convert.ToDouble(payload["tp"]["price"]);

                // Modify SL Order
                if (newSl > 0)
                {
                    var slOrder = associatedOrders.FirstOrDefault(o => o.Name == id + "_SL");
                    var tpOrder = associatedOrders.FirstOrDefault(o => o.Name == id + "_TP");
                    if (slOrder != null)
                    {
                        // Canceling one OCO leg cancels both in NT8. We must rebuild both.
                        string newOco = $"OCO_MOD_{id}_{NinjaTrader.Core.Globals.Now.Ticks}";
                        
#pragma warning disable 0618
                        Order newSlOrder = targetAccount.CreateOrder(targetInst, slOrder.OrderAction, OrderType.StopMarket, TimeInForce.Gtc, slOrder.Quantity, 0, newSl, newOco, id + "_SL", null);
                        if (newSlOrder != null) targetAccount.Submit(new[] { newSlOrder });

                        if (tpOrder != null)
                        {
                            Order newTpOrder = targetAccount.CreateOrder(targetInst, tpOrder.OrderAction, OrderType.Limit, TimeInForce.Gtc, tpOrder.Quantity, tpOrder.LimitPrice, 0, newOco, id + "_TP", null);
                            if (newTpOrder != null) targetAccount.Submit(new[] { newTpOrder });
                        }
#pragma warning restore 0618
                        
                        // Safety: Only cancel the old pair AFTER the new pair has been dispatched
                        targetAccount.Cancel(new[] { slOrder }); // This drops the TP as well
                        
                        if (_activeTrades.TryGetValue(id, out TradeMetric tm)) tm.Sl = newSl;
                        
                        modified = true;
                    }
                }

                // Modify TP Order
                if (newTp > 0)
                {
                    var slOrder = associatedOrders.FirstOrDefault(o => o.Name == id + "_SL");
                    var tpOrder = associatedOrders.FirstOrDefault(o => o.Name == id + "_TP");
                    if (tpOrder != null)
                    {
                        string newOco = $"OCO_MOD_{id}_{NinjaTrader.Core.Globals.Now.Ticks}";
                        
#pragma warning disable 0618
                        Order newTpOrder = targetAccount.CreateOrder(targetInst, tpOrder.OrderAction, OrderType.Limit, TimeInForce.Gtc, tpOrder.Quantity, newTp, 0, newOco, id + "_TP", null);
                        if (newTpOrder != null) targetAccount.Submit(new[] { newTpOrder });

                        if (slOrder != null)
                        {
                            Order newSlOrder = targetAccount.CreateOrder(targetInst, slOrder.OrderAction, OrderType.StopMarket, TimeInForce.Gtc, slOrder.Quantity, 0, slOrder.StopPrice, newOco, id + "_SL", null);
                            if (newSlOrder != null) targetAccount.Submit(new[] { newSlOrder });
                        }
#pragma warning restore 0618
                        
                        // Safety: Only cancel the old pair AFTER the new pair has been dispatched
                        targetAccount.Cancel(new[] { tpOrder }); // This drops the SL as well
                        
                        if (_activeTrades.TryGetValue(id, out TradeMetric tm)) tm.Tp = newTp;
                        
                        modified = true;
                    }
                }

                string action = payload["action"]?.ToString()?.ToUpper();

                if (action == "CANCEL")
                {
                    if (associatedOrders.Count > 0)
                    {
                        targetAccount.Cancel(associatedOrders);
                        modified = true;
                        NinjaTrader.Code.Output.Process($"[ExecutionManager] Cancelled {associatedOrders.Count} Pending Orders (Entry, SL, TP) for: {id}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                    else
                    {
                        NinjaTrader.Code.Output.Process($"[ExecutionManager] Cancel Failed: Could not find working orders for {id}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                }
                else if (action == "SL_BE")
                {
                    if (_activeTrades.TryGetValue(id, out TradeMetric tm))
                    {
                        var slOrder = associatedOrders.FirstOrDefault(o => o.Name == id + "_SL");
                        if (slOrder != null)
                        {
                            // STRICT CALCULATION: Find the EXACT entry execution price, overriding any theoretical tm.Open value
                            double bePrice = tm.Open;
                            var entryExecution = tm.Executions.FirstOrDefault(ex => (tm.Type == 0 && ex.Order.OrderAction == OrderAction.Buy) || (tm.Type == 1 && ex.Order.OrderAction == OrderAction.SellShort));
                            if (entryExecution != null && entryExecution.Price > 0)
                            {
                                bePrice = entryExecution.Price;
                            }

                            double tickSize = targetInst.MasterInstrument.TickSize;
                            bePrice = Math.Round(bePrice / tickSize) * tickSize;

                            // Modify the StopPrice property by Rebuilding the OCO Pair
                            var tpOrder = associatedOrders.FirstOrDefault(o => o.Name == id + "_TP");
                            string newOco = $"OCO_MOD_{id}_{NinjaTrader.Core.Globals.Now.Ticks}";
                            
#pragma warning disable 0618
                            Order newSlOrder = targetAccount.CreateOrder(targetInst, slOrder.OrderAction, OrderType.StopMarket, TimeInForce.Gtc, slOrder.Quantity, 0, bePrice, newOco, id + "_SL", null);
                            if (newSlOrder != null) targetAccount.Submit(new[] { newSlOrder });

                            if (tpOrder != null)
                            {
                                Order newTpOrder = targetAccount.CreateOrder(targetInst, tpOrder.OrderAction, OrderType.Limit, TimeInForce.Gtc, tpOrder.Quantity, tpOrder.LimitPrice, 0, newOco, id + "_TP", null);
                                if (newTpOrder != null) targetAccount.Submit(new[] { newTpOrder });
                            }
#pragma warning restore 0618
                            
                            // Safety: Only cancel the old pair AFTER the new pair has been dispatched
                            targetAccount.Cancel(new[] { slOrder }); // Drops both
                            
                            tm.Sl = bePrice;
                            tm.SlAtBe = true;
                            
                            modified = true;

                            NinjaTrader.Code.Output.Process($"[ExecutionManager] Moved Stop Loss for {id} to Breakeven exactly at Execution Price: {bePrice}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        }
                    }
                }
                else if (action == "CLOSE" || action == "CLOSE_FULL" || action == "CLOSE_PARTIAL")
                {
                    if (_activeTrades.TryGetValue(id, out TradeMetric tm))
                    {
                        int entryVol = tm.Executions.Where(ex => (tm.Type == 0 && ex.Order.OrderAction == OrderAction.Buy) || (tm.Type == 1 && ex.Order.OrderAction == OrderAction.SellShort)).Sum(ex => ex.Quantity);
                        int exitVol = tm.Executions.Where(ex => (tm.Type == 0 && (ex.Order.OrderAction == OrderAction.Sell || ex.Order.OrderAction == OrderAction.SellShort)) || (tm.Type == 1 && (ex.Order.OrderAction == OrderAction.Buy || ex.Order.OrderAction == OrderAction.BuyToCover))).Sum(ex => ex.Quantity);

                        int remainingVol = entryVol - exitVol;

                        if (remainingVol > 0)
                        {
                            int closeVol = remainingVol;
                            if (action == "CLOSE_PARTIAL" && payload["percent"] != null)
                            {
                                double percent = (double)payload["percent"];
                                if (percent > 1.0) percent = percent / 100.0;

                                // EXACT MQL5 Match: use Epsilon for 100% close
                                if (percent < 0.9999)
                                {
                                    closeVol = (int)Math.Floor(remainingVol * percent);
                                    if (closeVol < 1) closeVol = 1;
                                    if (closeVol > remainingVol) closeVol = remainingVol;
                                }
                            }

                            int newWorkingVol = remainingVol - closeVol;

                            // Cleanup / Reduce orphaned SL and TP Orders
                            var currentWorkingOrders = targetAccount.Orders.Where(o => o.OrderState == OrderState.Working || o.OrderState == OrderState.Accepted).ToList();
                            var slOrder = currentWorkingOrders.FirstOrDefault(o => o.Name == id + "_SL");
                            var tpOrder = currentWorkingOrders.FirstOrDefault(o => o.Name == id + "_TP");

                            long ts = NinjaTrader.Core.Globals.Now.Ticks;

                            if (newWorkingVol <= 0)
                            {
                                // Full Close -> Cancel all orphaned protective orders
                                if (slOrder != null) targetAccount.Cancel(new[] { slOrder });
                                if (tpOrder != null) targetAccount.Cancel(new[] { tpOrder });
                                NinjaTrader.Code.Output.Process($"[ExecutionManager] FULL CLOSE: Cancelled orphaned SL/TP orders for {id}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            }
                            else
                            {
                                // Partial Close -> Cancel old and replace with new reduced volume
                                string newOco = $"OCO_SLTP_{id}_{ts}";
                                if (slOrder != null)
                                {
                                    targetAccount.Cancel(new[] { slOrder });
#pragma warning disable 0618
                                    Order scaledSl = targetAccount.CreateOrder(targetInst, slOrder.OrderAction, OrderType.StopMarket, TimeInForce.Gtc, newWorkingVol, 0, slOrder.StopPrice, newOco, id + "_SL", null);
                                    if (scaledSl != null) targetAccount.Submit(new[] { scaledSl });
#pragma warning restore 0618
                                }
                                if (tpOrder != null)
                                {
                                    targetAccount.Cancel(new[] { tpOrder });
#pragma warning disable 0618
                                    Order scaledTp = targetAccount.CreateOrder(targetInst, tpOrder.OrderAction, OrderType.Limit, TimeInForce.Gtc, newWorkingVol, tpOrder.LimitPrice, 0, newOco, id + "_TP", null);
                                    if (scaledTp != null) targetAccount.Submit(new[] { scaledTp });
#pragma warning restore 0618
                                }
                                NinjaTrader.Code.Output.Process($"[ExecutionManager] PARTIAL CLOSE: Reduced orphaned SL/TP orders to {newWorkingVol} for {id}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            }

                            OrderAction closeAction = tm.Type == 0 ? OrderAction.Sell : OrderAction.BuyToCover;

                            // Prevent Duplicate Order / OCO conflicts on multiple partial closes
                            string closeOco = $"OCO_{id}_{ts}";
                            string closeOrderId = $"{id}_C_{ts}";

#pragma warning disable 0618
                            Order closeOrder = targetAccount.CreateOrder(targetInst, closeAction, OrderType.Market, TimeInForce.Gtc, closeVol, 0, 0, closeOco, closeOrderId, null);
                            if (closeOrder != null)
                            {
                                targetAccount.Submit(new[] { closeOrder });
                                modified = true;
                                NinjaTrader.Code.Output.Process($"[ExecutionManager] Submitted {closeAction} Market Order to CLOSE {closeVol} contracts for {id}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            }
#pragma warning restore 0618
                        }
                    }
                }

                if (modified)
                {
                    string reqCmd = msg["command"]?.ToString() ?? "CMD_MODIFY_POSITION";
                    var successPayload = new
                    {
                        status = "OK",
                        message = "Command Dispatched",
                        id = id,
                        sl_at_be_success = (action == "SL_BE")
                    };
                    _socket.SendProtocolMessage($"{reqCmd}_RESPONSE", successPayload, botId, "TRADING", "ALL", reqId);
                }
                else
                {
                    string reqCmd = msg["command"]?.ToString() ?? "CMD_MODIFY_POSITION";
                    var rejectPayload = new
                    {
                        status = "REJECTED",
                        message = "Could not find working orders to modify or cancel",
                        id = id
                    };
                    _socket.SendProtocolMessage($"{reqCmd}_RESPONSE", rejectPayload, botId, "TRADING", "ALL", reqId);
                }

                        }
                        catch (Exception innerEx)
                        {
                            NinjaTrader.Code.Output.Process($"[ExecutionManager] Dispatcher Modify Error: {innerEx.Message}\n{innerEx.StackTrace}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            
                            string reqCmd = msg["command"]?.ToString() ?? "CMD_MODIFY_POSITION";
                            var errorPayload = new { status = "ERROR", message = $"Dispatcher Mod Error: {innerEx.Message}", id = id };
                            _socket.SendProtocolMessage($"{reqCmd}_RESPONSE", errorPayload, botId, "TRADING", "ALL", reqId);
                        }
                    };

                    if (NinjaTrader.Core.Globals.RandomDispatcher.CheckAccess()) modifyAction();
                    else NinjaTrader.Core.Globals.RandomDispatcher.BeginInvoke(modifyAction);
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[ExecutionManager] Modify/Close Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        private void HandleAckTrade(JObject msg)
        {
            string id = msg["payload"]?["id"]?.ToString();
            if (!string.IsNullOrEmpty(id))
            {
                _awaitingAckTrades.TryRemove(id, out _);
                NinjaTrader.Code.Output.Process($"[ExecutionManager] Trade {id} ACKed and removed from terminal queue.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }
    }
}
