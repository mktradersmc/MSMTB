#region Using declarations
using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
#endregion

namespace AwesomeCockpit.NT8.Bridge
{
    public class BridgeWebSocket
    {
        private ClientWebSocket _ws;
        private CancellationTokenSource _cts;
        private SemaphoreSlim _sendLock = new SemaphoreSlim(1, 1);
        private Timer _heartbeatTimer;
        private const string BACKEND_URL = "ws://localhost:3000";

        // Components
        private SubscriptionManager _subscriptionManager;
        private DiscoveryService _discoveryService;
        private ExecutionManager _executionManager;

        public BridgeWebSocket()
        {
            NinjaTrader.Code.Output.Process($"[Bridge] Initializing Bridge Components...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            _subscriptionManager = new SubscriptionManager(this);
            _discoveryService = new DiscoveryService(this);
            _executionManager = new ExecutionManager(this, _subscriptionManager);
            NinjaTrader.Code.Output.Process($"[Bridge] Component Initialization Complete.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
        }

        public void Connect(string url)
        {
            _cts = new CancellationTokenSource();

            // Run in background to not block UI thread
            _ = Task.Run(async () => await ConnectionLoop(url, _cts.Token));
        }

        private async Task ConnectionLoop(string url, CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    NinjaTrader.Code.Output.Process($"AwesomeCockpit: Connecting to {url}...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                    _ws = new ClientWebSocket();
                    await _ws.ConnectAsync(new Uri(url), token);

                    NinjaTrader.Code.Output.Process("AwesomeCockpit: Connected!", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                    // 1. Start Heartbeat
                    _heartbeatTimer?.Dispose();
                    _heartbeatTimer = new Timer(SendHeartbeat, null, 1000, 1000);

                    // 2. Register (Handshake)
                    PerformHandshake();

                    // 3. Block in Receive Loop until closed/error
                    await ReceiveLoop();
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    NinjaTrader.Code.Output.Process($"AwesomeCockpit: Connection Lost/Failed: {ex.Message}. Retrying in 5s...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                }
                finally
                {
                    // Cleanup before retry
                    _heartbeatTimer?.Dispose();
                    try { _ws?.Dispose(); } catch { }
                    _ws = null;
                }

                // Wait before reconnect (unless cancelled)
                if (!token.IsCancellationRequested)
                {
                    await Task.Delay(5000, token);
                }
            }
        }

        public void Disconnect()
        {
            _heartbeatTimer?.Dispose();
            _cts?.Cancel();
            _ws?.Dispose();
            _ws = null;
        }

        // Tracking for Heartbeats
        private HashSet<string> _registeredBots = new HashSet<string>();

        public void RegisterBot(string id, string func, string symbol)
        {
            // Format: id:func:symbol (Strict)
            // But wait, the socket server expects heartbeats for specific ROUTING KEYS or IDs?
            // The conceptual requirement says "HEARTBEAT for every endpoint".
            // Backend SystemOrchestrator tracks by RoutingKey.
            // Heartbeat payload usually contains "id" or is just a ping on the socket?
            // SocketServer.js: socket.on('heartbeat', (data) => ...).
            // It uses the socket's bound ID if available, or data.id.
            // If we have multiple IDs on one socket, we should probably send a heartbeat for EACH, or a composite one?
            // MT5 sends specific frames.
            // Let's send a HEARTBEAT frame for EACH registered functionality to be safe and explicit.

            // We store the "ID" (e.g. "Sim101") and "Func" (e.g. "TRADING") to construct the payload.
            // Composite key for Set
            string key = $"{id}|{func}|{symbol}";
            lock (_registeredBots)
            {
                if (!_registeredBots.Contains(key))
                {
                    _registeredBots.Add(key);
                    NinjaTrader.Code.Output.Process($"AwesomeCockpit: Tracking Heartbeat for {id}:{func}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                }
            }
        }

        private void PerformHandshake()
        {
            // 1. Register DISCOVERY Bot (Strict)
            var payload = new { id = "NT8", func = "DISCOVERY", symbol = "ALL" };
            SendProtocolMessage("REGISTER", payload, "NT8", "DISCOVERY", "ALL");
            RegisterBot("NT8", "DISCOVERY", "ALL");
        }

        private void SendHeartbeat(object state)
        {
            if (_ws != null && _ws.State == WebSocketState.Open)
            {
                // Iterate all registered bots and send a heartbeat for each
                lock (_registeredBots)
                {
                    foreach (string key in _registeredBots)
                    {
                        var parts = key.Split('|');
                        if (parts.Length == 3)
                        {
                            var hb = new
                            {
                                id = parts[0],
                                func = parts[1], // Include Func to distinguish
                                symbol = parts[2],
                                timestamp = DateTime.UtcNow.Ticks
                            };
                            SendProtocolMessage("HEARTBEAT", hb, parts[0], parts[1], parts[2]);
                        }
                    }
                }
            }
        }

        public async void SendProtocolMessage(string command, object payload, string botId, string func, string symbol = "ALL", string requestId = "")
        {
            if (_ws == null || _ws.State != WebSocketState.Open) return;

            try
            {
                var envelope = new
                {
                    header = new
                    {
                        botId = botId,
                        func = func,
                        symbol = symbol,
                        command = command,
                        requestId = requestId,
                        request_id = requestId
                    },
                    payload = payload
                };

                var json = JsonConvert.SerializeObject(envelope);

                // USER REQUEST: Log Outgoing JSONs - Disabled for noise reduction
                // if (command != "HEARTBEAT" && command != "EV_BAR_UPDATE" && command != "EV_BAR_CLOSED")
                // {
                //     string logJson = json.Length > 500 ? json.Substring(0, 500) + "... [TRUNCATED]" : json;
                //     NinjaTrader.Code.Output.Process($"AwesomeCockpit: TX -> {logJson}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                // }

                var buffer = Encoding.UTF8.GetBytes(json);

                await _sendLock.WaitAsync();
                try
                {
                    if (_ws.State == WebSocketState.Open)
                    {
                        await _ws.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, _cts.Token);
                    }
                }
                finally
                {
                    _sendLock.Release();
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: Send Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        private async Task ReceiveLoop()
        {
            var buffer = new byte[8192];
            while (_ws.State == WebSocketState.Open && !_cts.IsCancellationRequested)
            {
                try
                {
                    var result = await _ws.ReceiveAsync(new ArraySegment<byte>(buffer), _cts.Token);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", _cts.Token);
                        break;
                    }

                    var json = Encoding.UTF8.GetString(buffer, 0, result.Count);

                    // USER REQUEST: Log Incoming JSONs - Disabled for noise reduction
                    // if (!json.Contains("\"command\":\"HEARTBEAT\"") && !json.Contains("\"type\":\"HEARTBEAT\""))
                    // {
                    //     string logJson = json.Length > 500 ? json.Substring(0, 500) + "... [TRUNCATED]" : json;
                    //     NinjaTrader.Code.Output.Process($"AwesomeCockpit: RX <- {logJson}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    // }

                    HandleMessage(json);
                }
                catch (Exception ex)
                {
                    if (!_cts.IsCancellationRequested)
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Socket Receive Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                    break;
                }
            }
        }

        private void HandleMessage(string json)
        {
            try
            {
                // DEBUG: Direct Feedback to Backend
                if (json.Contains("CMD_INIT"))
                {
                    NinjaTrader.Code.Output.Process($"AwesomeCockpit: RAW RX: {json}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                }

                var msg = JObject.Parse(json);
                string type = msg["type"]?.ToString();

                // Support SystemOrchestrator Envelope (header/payload)
                // If "type" is missing, check if "header" exists and has "command"
                if (string.IsNullOrEmpty(type) && msg["header"] != null)
                {
                    var header = msg["header"];
                    string cmd = header["command"]?.ToString();
                    var content = msg["payload"];

                    if (!string.IsNullOrEmpty(cmd))
                    {
                        // Map to COMMAND logic
                        type = "COMMAND";
                        // Inject for consistency in following block (hacky but effective)
                        msg["command"] = cmd;
                        msg["content"] = content;
                    }
                }

                // Check for "command" property if type is "COMMAND" (Standardized)
                if (type == "COMMAND")
                {
                    string cmd = msg["command"]?.ToString();

                    if (cmd == "CMD_INIT")
                    {
                        string requestId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_INIT. Waiting 10s for Datafeeds to connect...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                        Task.Run(async () =>
                        {
                            await Task.Delay(10000);
                            NinjaTrader.Code.Output.Process($"AwesomeCockpit: 10s delay over. Syncing Accounts via RPC...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            _discoveryService.SendAccounts(requestId);
                        });
                    }
                    else if (cmd == "CMD_DB_SYNC_CONFIRMED") // Backend confirms DB Sync
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_DB_SYNC_CONFIRMED. Registering Bots...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        _discoveryService.RegisterAccountBots();
                    }
                    else if (cmd == "CMD_ACCOUNTS_SYNCED") // Alias
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_ACCOUNTS_SYNCED. Registering Bots...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        _discoveryService.RegisterAccountBots();
                    }
                    else if (cmd == "CMD_CONFIG_SYMBOLS")
                    {
                        string requestId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        string targetBotId = msg["header"]?["botId"]?.ToString() ?? msg["header"]?["bot_id"]?.ToString() ?? "";

                        _discoveryService.AcknowledgeConfig(requestId, targetBotId);

                        string directSymbol = msg["payload"]?["symbol"]?.ToString() ?? msg["payload"]?["name"]?.ToString();
                        if (!string.IsNullOrEmpty(directSymbol))
                        {
                            NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_CONFIG_SYMBOLS for direct symbol '{directSymbol}' targeted at '{targetBotId}'. Simulating Bot Registration...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            _discoveryService.RegisterVirtualBots(targetBotId, directSymbol);
                        }

                        if (msg["payload"]?["symbols"] != null)
                        {
                            var syms = msg["payload"]["symbols"] as Newtonsoft.Json.Linq.JArray;
                            if (syms != null)
                            {
                                foreach (var sym in syms)
                                {
                                    string symName = sym["broker"]?.ToString() ?? sym["internal"]?.ToString() ?? sym["symbol"]?.ToString();
                                    if (!string.IsNullOrEmpty(symName))
                                    {
                                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_CONFIG_SYMBOLS for '{symName}' targeted at '{targetBotId}'. Simulating Bot Registration...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                                        _discoveryService.RegisterVirtualBots(targetBotId, symName);
                                    }
                                }
                            }
                        }
                    }
                    else if (cmd == "CMD_START_SYNCHRONIZED_UPDATE")
                    {
                        string syncSymbol = msg["payload"]?["symbol"]?.ToString() ?? msg["symbol"]?.ToString();
                        string tf = msg["payload"]?["timeframe"]?.ToString() ?? msg["timeframe"]?.ToString();
                        string mode = msg["payload"]?["mode"]?.ToString() ?? msg["mode"]?.ToString();

                        int count = 1000;
                        if (msg["payload"]?["count"] != null) count = (int)msg["payload"]["count"];
                        else if (msg["count"] != null) count = (int)msg["count"];

                        long lastTime = 0;
                        if (msg["payload"]?["lastTime"] != null) lastTime = (long)msg["payload"]["lastTime"];
                        else if (msg["lastTime"] != null) lastTime = (long)msg["lastTime"];

                        string reqId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        string targetBotId = msg["header"]?["botId"]?.ToString() ?? msg["header"]?["bot_id"]?.ToString() ?? "NT8";
                        string func = msg["header"]?["func"]?.ToString() ?? "HISTORY";

                        _subscriptionManager.StartSynchronizedUpdate(syncSymbol, tf, mode, count, lastTime, reqId, targetBotId, func);
                    }
                    else if (cmd == "CMD_FETCH_HISTORY")
                    {
                        string syncSymbol = msg["payload"]?["symbol"]?.ToString() ?? msg["symbol"]?.ToString();
                        string tf = msg["payload"]?["timeframe"]?.ToString() ?? msg["timeframe"]?.ToString();
                        string mode = msg["payload"]?["mode"]?.ToString() ?? msg["mode"]?.ToString() ?? "FETCH";

                        int count = 1000;
                        if (msg["payload"]?["count"] != null) count = (int)msg["payload"]["count"];
                        else if (msg["count"] != null) count = (int)msg["count"];

                        long lastTime = 0;
                        // Frontend and HistoryWorker specify 'startTime' or 'from' which is our upper boundary going backwards.
                        if (msg["payload"]?["startTime"] != null) lastTime = (long)msg["payload"]["startTime"];
                        else if (msg["startTime"] != null) lastTime = (long)msg["startTime"];
                        else if (msg["payload"]?["from"] != null) lastTime = (long)msg["payload"]["from"];
                        else if (msg["from"] != null) lastTime = (long)msg["from"];

                        string reqId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        string targetBotId = msg["header"]?["botId"]?.ToString() ?? msg["header"]?["bot_id"]?.ToString() ?? "NT8";
                        string func = msg["header"]?["func"]?.ToString() ?? "HISTORY";

                        _subscriptionManager.StartSynchronizedUpdate(syncSymbol, tf, mode, count, lastTime, reqId, targetBotId, func);
                    }
                    else if (cmd == "CMD_REQ_SYMBOLS")
                    {
                        string requestId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_REQ_SYMBOLS. Scanning Instruments...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        _discoveryService.SendSymbols(requestId);
                    }
                    else if (cmd == "CMD_GET_SYMBOLS")
                    {
                        string requestId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_GET_SYMBOLS. Scanning Instruments...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        _discoveryService.SendSymbols(requestId);
                    }
                    else if (cmd == "CMD_SUBSCRIBE_TICKS")
                    {
                        string subSymbol = msg["payload"]?["symbol"]?.ToString() ?? msg["symbol"]?.ToString();
                        string tf = msg["payload"]?["timeframe"]?.ToString() ?? msg["timeframe"]?.ToString();
                        string reqId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        string targetBotId = msg["header"]?["botId"]?.ToString() ?? msg["header"]?["bot_id"]?.ToString() ?? "NT8";

                        _subscriptionManager.SubscribeAndSendResponse(subSymbol, tf, reqId, targetBotId);
                    }
                    else if (cmd == "CMD_UNSUBSCRIBE_TICKS")
                    {
                        string subSymbol = msg["payload"]?["symbol"]?.ToString() ?? msg["symbol"]?.ToString();
                        string tf = msg["payload"]?["timeframe"]?.ToString() ?? msg["timeframe"]?.ToString();
                        string reqId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        string targetBotId = msg["header"]?["botId"]?.ToString() ?? msg["header"]?["bot_id"]?.ToString() ?? "NT8";
                        _subscriptionManager.Unsubscribe(subSymbol, tf);

                        var responseObj = new { status = "OK", timeframe = tf };
                        SendProtocolMessage("CMD_UNSUBSCRIBE_TICKS_RESPONSE", responseObj, targetBotId, "TICK_SPY", subSymbol, reqId);
                    }
                    else if (cmd == "CMD_GET_CURRENT_BAR")
                    {
                        string subSymbol = msg["payload"]?["symbol"]?.ToString() ?? msg["symbol"]?.ToString();
                        string tf = msg["payload"]?["timeframe"]?.ToString() ?? msg["timeframe"]?.ToString();
                        string reqId = msg["header"]?["requestId"]?.ToString() ?? msg["header"]?["request_id"]?.ToString() ?? "";
                        string targetBotId = msg["header"]?["botId"]?.ToString() ?? msg["header"]?["bot_id"]?.ToString() ?? "NT8";
                        _subscriptionManager.SendCurrentBar(subSymbol, tf, reqId, targetBotId);
                    }
                    else if (cmd == "CMD_EXECUTE_TRADE" || cmd == "CMD_MODIFY_POSITION" || cmd == "CMD_CLOSE_POSITION" || cmd == "CMD_ACK_TRADE")
                    {
                        _executionManager.ExecuteCommand(msg);
                    }
                }

                switch (type)
                {
                    // Legacy or Direct Commands
                    case "CMD_REQ_SYMBOLS":
                        _discoveryService.SendSymbols();
                        break;
                    case "CMD_SUBSCRIBE_TICKS":
                        string subSymbolLeg = msg["symbol"]?.ToString();
                        string tfLeg = msg["timeframe"]?.ToString();
                        _subscriptionManager.Subscribe(subSymbolLeg, tfLeg);
                        break;
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: Parse Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }
    }
}
