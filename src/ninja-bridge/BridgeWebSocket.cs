using System;
using System.Net.WebSockets;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using NinjaTrader.Cbi;
using Newtonsoft.Json; // Uses NT8's bundled Newtonsoft or we need to check if available. NT8 has it.
using Newtonsoft.Json.Linq;

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

        public BridgeWebSocket()
        {
            _subscriptionManager = new SubscriptionManager(this);
            _discoveryService = new DiscoveryService(this);
        }

        public async void Connect(string url)
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

        private async void PerformHandshake()
        {
            // 1. Register DISCOVERY Bot (Strict)
            var payload = new { id = "NT8", func = "DISCOVERY", symbol = "ALL" };
            Send("REGISTER", payload);
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
                            Send("HEARTBEAT", hb);
                        }
                    }
                }
            }
        }

        public void SendWithType(string command, object symbolsList, string botId)
        {
            // Helper to wrap payload with botId for Masquerading
            var wrapper = new
            {
                symbols = symbolsList,
                botId = botId
            };
            Send(command, wrapper);
        }

        public async void Send(string command, object payload)
        {
            if (_ws == null || _ws.State != WebSocketState.Open) return;

            try
            {
                // Fix: Wrap everything in a standard envelope to handle Arrays (List<Account>) correctly.
                // Previously JObject.FromObject(list) caused JArray casting errors when setting ["type"].
                var envelope = new
                {
                    type = command,
                    payload = payload
                };

                var json = JsonConvert.SerializeObject(envelope);
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
                    Send("LOG", new { msg = $"[Bridge] RAW RX: {json}" });
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

                        Send("LOG", new { msg = $"[Bridge] Envelope Parsed. CMD: {cmd}" });
                    }
                }

                // Check for "command" property if type is "COMMAND" (Standardized)
                if (type == "COMMAND")
                {
                    string cmd = msg["command"]?.ToString();

                    Send("LOG", new { msg = $"[Bridge] Dispatching COMMAND: {cmd}" });

                    if (cmd == "CMD_INIT")
                    {
                        Send("LOG", new { msg = $"[Bridge] Executing CMD_INIT handler (Delayed 15s)..." });
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_INIT (Version: {msg["content"]?["version"]}). Waiting 15s for Connections...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                        // Fire-and-forget task to avoid blocking WS Loop
                        System.Threading.Tasks.Task.Run(async () =>
                        {
                            await System.Threading.Tasks.Task.Delay(15000);
                            NinjaTrader.Code.Output.Process($"AwesomeCockpit: 15s Wait Over. Syncing Accounts...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            _discoveryService.SendAccounts();
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
                    else if (cmd == "CMD_REQ_SYMBOLS")
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_REQ_SYMBOLS. Scanning Instruments...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        _discoveryService.SendSymbols();
                    }
                    else if (cmd == "CMD_GET_SYMBOLS")
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Received CMD_GET_SYMBOLS. Scanning Instruments...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        _discoveryService.SendSymbols();
                    }
                }

                switch (type)
                {
                    // Legacy or Direct Commands
                    case "CMD_REQ_SYMBOLS":
                        _discoveryService.SendSymbols();
                        break;
                    case "CMD_SUBSCRIBE_TICKS":
                        string symbol = msg["symbol"]?.ToString();
                        _subscriptionManager.Subscribe(symbol);
                        break;
                    case "EXECUTE_TRADE":
                        // _executionManager.Execute(msg);
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
