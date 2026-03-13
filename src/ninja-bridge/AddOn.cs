using System;
using System.Collections.Generic;
using System.Text;
using System.Windows;
using NinjaTrader.Cbi;
using NinjaTrader.Gui;
using NinjaTrader.Gui.Tools;
using NinjaTrader.NinjaScript;
using NinjaTrader.Data;

namespace AwesomeCockpit.NT8.Bridge
{
    public class AwesomeCockpitAddOn : AddOnBase
    {
        private BridgeWebSocket _webSocket;
        private object _lock = new object();

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "Bridge for Awesome Cockpit Integration";
                Name = "Awesome Cockpit Bridge";
            }
            else if (State == State.Configure)
            {
                // Initialize resources
            }
            else if (State == State.Active)
            {
                // Startup
                try
                {
                    lock (_lock)
                    {
                        if (_webSocket == null)
                        {
                            BridgeLogger.Log("AwesomeCockpit: Starting Bridge...");
                            _webSocket = new BridgeWebSocket();
                            _webSocket.Connect("ws://localhost:3000"); // TODO: Configurable
                        }
                    }
                }
                catch (Exception ex)
                {
                    BridgeLogger.Log($"AwesomeCockpit AddOn INIT ERROR: {ex.Message} {ex.StackTrace}");
                }
            }
            else if (State == State.Terminated)
            {
                // Shutdown
                lock (_lock)
                {
                    if (_webSocket != null)
                    {
                        BridgeLogger.Log("AwesomeCockpit: Stopping Bridge...");
                        _webSocket.Disconnect();
                        _webSocket = null;
                    }
                }
            }
        }

        protected override void OnWindowCreated(Window window)
        {
            // We don't need a specific window, but good hook if needed
        }

        protected override void OnWindowDestroyed(Window window)
        {

        }
    }
}
