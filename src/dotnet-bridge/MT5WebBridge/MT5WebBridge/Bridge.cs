using System.Net.WebSockets;
using System.Runtime.InteropServices;
using System.Runtime.CompilerServices;
using System.Text;
using System.Collections.Concurrent;

namespace MT5WebBridge
{
    public static class Bridge
    {
        // Handle -> Connection
        private static readonly ConcurrentDictionary<int, ConnectionManager> _connections = new();
        private static int _nextHandle = 1;
        private static readonly object _logLock = new object();

        private class ConnectionManager
        {
            public int Handle { get; set; }
            public ClientWebSocket? Socket { get; set; }
            public CancellationTokenSource? Cts { get; set; }
            public ConcurrentQueue<string> MessageQueue { get; set; } = new();
            public bool IsConnected { get; set; }
        }

        private static void WriteLog(string message)
        {
            try
            {
                lock (_logLock)
                {
                    File.AppendAllText(@"C:\Users\Michael\IdeaProjects\MSMTB\bridge_debug.log", $"{DateTime.Now:HH:mm:ss.fff} {message}{Environment.NewLine}");
                }
            }
            catch { }
        }

        [UnmanagedCallersOnly(EntryPoint = "WS_Init")]
        public static int WS_Init(IntPtr urlPtr, IntPtr botIdPtr)
        {
            try
            {
                string? url = Marshal.PtrToStringUni(urlPtr);
                string? botId = Marshal.PtrToStringUni(botIdPtr);
                if (string.IsNullOrEmpty(url)) return 0;

                int handle = Interlocked.Increment(ref _nextHandle);

                var mgr = new ConnectionManager
                {
                    Handle = handle,
                    Cts = new CancellationTokenSource(),
                    Socket = new ClientWebSocket()
                };

                WriteLog($"[Bridge] Init Handle {handle} for {botId}");

                var task = mgr.Socket.ConnectAsync(new Uri(url), mgr.Cts.Token);
                if (!task.Wait(5000, mgr.Cts.Token)) return 0;

                if (mgr.Socket.State == WebSocketState.Open)
                {
                    mgr.IsConnected = true;
                    _connections.TryAdd(handle, mgr);
                    Task.Factory.StartNew(() => ReceiveLoop(mgr), mgr.Cts.Token, TaskCreationOptions.LongRunning, TaskScheduler.Default);
                    return handle; // Return Handle instead of 1
                }
                return 0;
            }
            catch (Exception ex)
            {
                WriteLog($"[Bridge] Init Error: {ex}");
                return 0;
            }
        }

        [UnmanagedCallersOnly(EntryPoint = "WS_Cleanup")]
        public static void WS_Cleanup(int handle)
        {
            if (_connections.TryRemove(handle, out var mgr))
            {
                WriteLog($"[Bridge] Cleaning up Handle {handle}");
                mgr.IsConnected = false;
                mgr.Cts?.Cancel();
                mgr.Socket?.Dispose();
            }
        }

        // Overload for legacy single-instance cleanup (if called without handle) - NOT POSSIBLE with UnmanagedCallersOnly strict signature
        // We must change MQL5 to pass handle.

        [UnmanagedCallersOnly(EntryPoint = "WS_Send")]
        public static void WS_Send(int handle, IntPtr methodPtr, IntPtr payloadPtr)
        {
            if (_connections.TryGetValue(handle, out var mgr) && mgr.IsConnected)
            {
                try
                {
                    string? method = Marshal.PtrToStringUni(methodPtr);
                    string? payload = Marshal.PtrToStringUni(payloadPtr);
                    if (method == null || payload == null) return;

                    // Refactoring 2026-02-18: Raw Mode (No Wrapper)
                    // The MQL5 client is now responsible for ensuring 'payload' is a complete JSON object including 'type'.
                    string msg = payload;
                    byte[] bytes = Encoding.UTF8.GetBytes(msg);
                    mgr.Socket!.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None).Wait();
                }
                catch (Exception ex)
                {
                    WriteLog($"[Bridge] Send Error Handle {handle}: {ex}");
                }
            }
        }

        [UnmanagedCallersOnly(EntryPoint = "WS_SendBin")]
        public static void WS_SendBin(int handle, IntPtr data, int size)
        {
            if (_connections.TryGetValue(handle, out var mgr) && mgr.IsConnected)
            {
                try
                {
                    byte[] bytes = new byte[size];
                    Marshal.Copy(data, bytes, 0, size);
                    mgr.Socket!.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Binary, true, CancellationToken.None).Wait();
                }
                catch { }
            }
        }

        [UnmanagedCallersOnly(EntryPoint = "WS_GetNext")]
        public static int WS_GetNext(int handle, IntPtr buffer, int bufferSize)
        {
            if (_connections.TryGetValue(handle, out var mgr) && mgr.MessageQueue.TryDequeue(out string? msg))
            {
                if (msg == null) return 0;
                byte[] bytes = Encoding.Unicode.GetBytes(msg);
                if (bytes.Length + 2 > bufferSize) return -1;
                Marshal.Copy(bytes, 0, buffer, bytes.Length);
                Marshal.WriteInt16(buffer, bytes.Length, 0);
                return 1;
            }
            return 0;
        }

        [UnmanagedCallersOnly(EntryPoint = "WS_IsConnected")]
        public static int WS_IsConnected(int handle)
        {
            if (_connections.TryGetValue(handle, out var mgr))
            {
                return (mgr.Socket != null && mgr.Socket.State == WebSocketState.Open) ? 1 : 0;
            }
            return 0;
        }

        private static async Task ReceiveLoop(ConnectionManager mgr)
        {
            var buffer = new byte[65536];
            try
            {
                while (mgr.Socket!.State == WebSocketState.Open && !mgr.Cts!.IsCancellationRequested)
                {
                    using (var ms = new MemoryStream())
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await mgr.Socket.ReceiveAsync(new ArraySegment<byte>(buffer), mgr.Cts.Token);
                            if (result.MessageType == WebSocketMessageType.Close)
                            {
                                await mgr.Socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
                                mgr.IsConnected = false;
                                return;
                            }
                            ms.Write(buffer, 0, result.Count);
                        } while (!result.EndOfMessage);

                        ms.Seek(0, SeekOrigin.Begin);

                        if (result.MessageType == WebSocketMessageType.Text)
                        {
                            using (var reader = new StreamReader(ms, Encoding.UTF8))
                            {
                                string msg = await reader.ReadToEndAsync();
                                mgr.MessageQueue.Enqueue(msg);
                            }
                        }
                        else if (result.MessageType == WebSocketMessageType.Binary)
                        {
                            string base64 = Convert.ToBase64String(ms.ToArray());
                            mgr.MessageQueue.Enqueue("BIN:" + base64);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                WriteLog($"[Bridge] ReceiveLoop Error Handle {mgr.Handle}: {ex}");
                mgr.IsConnected = false;
            }
        }
    }
}
