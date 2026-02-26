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
                            NinjaTrader.Code.Output.Process("AwesomeCockpit: Starting Bridge...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                            _webSocket = new BridgeWebSocket();
                            _webSocket.Connect("ws://localhost:3000"); // TODO: Configurable
                        }
                    }
                }
                catch (Exception ex)
                {
                    NinjaTrader.Code.Output.Process($"AwesomeCockpit AddOn INIT ERROR: {ex.Message} {ex.StackTrace}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                }
            }
            else if (State == State.Terminated)
            {
                // Shutdown
                lock (_lock)
                {
                    if (_webSocket != null)
                    {
                        NinjaTrader.Code.Output.Process("AwesomeCockpit: Stopping Bridge...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
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
