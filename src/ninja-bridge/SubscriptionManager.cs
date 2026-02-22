using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using NinjaTrader.Cbi;
using NinjaTrader.Data;

namespace AwesomeCockpit.NT8.Bridge
{
    public class SubscriptionManager
    {
        private readonly BridgeWebSocket _socket;
        private readonly ConcurrentDictionary<string, Instrument> _activeSubscriptions;

        // We need a way to hook OnMarketData. 
        // In NT8 AddOns, we don't have a direct "OnMarketData" override like Strategies.
        // We must subscribe to the Instrument's MarketData event manually.

        public SubscriptionManager(BridgeWebSocket socket)
        {
            _socket = socket;
            _activeSubscriptions = new ConcurrentDictionary<string, Instrument>();
        }

        public void Subscribe(string symbol)
        {
            if (_activeSubscriptions.ContainsKey(symbol)) return;

            Instrument inst = Instrument.GetInstrument(symbol);
            if (inst == null)
            {
                NinjaTrader.Code.Output.Process($"Antigravity: Unknown symbol {symbol}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                return;
            }

            NinjaTrader.Code.Output.Process($"AwesomeCockpit: Subscribing to {symbol}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            // Subscribe to Market Data (Instance Event)
            inst.MarketData.Update += OnMarketDataUpdate;

            _activeSubscriptions.TryAdd(symbol, inst);
        }

        public void Unsubscribe(string symbol)
        {
            if (_activeSubscriptions.TryRemove(symbol, out Instrument inst))
            {
                inst.MarketData.Update -= OnMarketDataUpdate;
            }
        }

        private void OnMarketDataUpdate(object sender, MarketDataEventArgs e)
        {
            // Filter: We care about 'Last' (Price) mainly. 
            // Also 'Ask'/'Bid' for spread if needed.
            // MSMTB 'TICK' packet: { symbol, price, vol, time }

            if (e.MarketDataType == MarketDataType.Last)
            {
                var tick = new
                {
                    type = "TICK", // Protocol specific? Or wrapped?
                    // MSMTB Protocol for TICK_SPY:
                    // { type: "TICK", symbol: "BTCUSD", price: 50000, volume: 1, time: 1234567890 }
                    symbol = e.Instrument.FullName,
                    price = e.Price,
                    volume = e.Volume,
                    time = e.Time.Ticks // Ticks or Unix Timestamp?
                    // MSMTB uses UNIX ms.
                };

                // Convert Time
                long unixTimestamp = new DateTimeOffset(e.Time).ToUnixTimeMilliseconds();

                var payload = new
                {
                    symbol = e.Instrument.FullName,
                    price = e.Price,
                    volume = e.Volume,
                    time = unixTimestamp
                };

                // Perf: Direct Send (Async)
                // Volume of ticks can be high. optimize later (Aggregator).
                _socket.Send("TICK", payload);
            }
        }
    }
}
