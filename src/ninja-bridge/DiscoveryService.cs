using System;
using System.Collections.Generic;
using System.Linq;
using NinjaTrader.Cbi;
using Newtonsoft.Json;

namespace AwesomeCockpit.NT8.Bridge
{
    public class DiscoveryService
    {
        private readonly BridgeWebSocket _socket;

        public DiscoveryService(BridgeWebSocket socket)
        {
            _socket = socket;
        }

        public void SendSymbols()
        {
            // TEMPORARY: Hardcoded Common Futures to unblock Discovery
            // TODO: Find correct API to list all instruments in C# class library context
            var commonFutures = new string[] {
                "ES 03-25", "NQ 03-25", "YM 03-25", "RTY 03-25",
                "GC 04-25", "CL 04-25", "SI 05-25", "HG 05-25",
                "6E 03-25", "6B 03-25", "6J 03-25", "6C 03-25",
                "ZC 05-25", "ZS 05-25", "ZW 05-25"
            };

            var payload = new List<object>();
            int count = 0;

            foreach (string name in commonFutures)
            {
                try
                {
                    // Try to get instrument details if possible, or just mock
                    Instrument inst = Instrument.GetInstrument(name);
                    if (inst != null)
                    {
                        payload.Add(new
                        {
                            name = inst.FullName, // MT5 Standard: name is the Identifier (e.g. "ES 03-25")
                            desc = inst.MasterInstrument.Name, // Description goes here
                            path = "Futures/" + inst.Exchange.ToString(), // Mock Path
                            digits = GetDigits(inst.MasterInstrument.TickSize),
                            tick_size = inst.MasterInstrument.TickSize,
                            point_value = inst.MasterInstrument.PointValue,
                            currency = inst.MasterInstrument.Currency.ToString(),
                            exchange = inst.Exchange.ToString()
                        });
                        count++;
                    }
                    else
                    {
                        // Fallback if not found locally
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Instrument '{name}' not found locally.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                }
                catch { }
            }

            NinjaTrader.Code.Output.Process($"AwesomeCockpit: Sending {count} Instruments (Broadcasting to Datafeed Accounts)...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            // LOG for User Verification
            string symbolListStr = string.Join(", ", commonFutures);
            _socket.Send("LOG", new { msg = $"[Discovery] Found Sim Futures: {symbolListStr}" });

            // BROADCAST STRATEGY: Send on behalf of ALL Datafeed Accounts
            // This ensures every registered account gets the symbols assigned.
            // We need to iterate known accounts and spoof the sender ID.

            lock (Account.All)
            {
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: Iterating {Account.All.Count} accounts for symbol broadcast...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                foreach (Account acc in Account.All)
                {
                    if (acc == null) continue;
                    string n = acc.Name.ToUpper();
                    if (n.Contains("BACKTEST") || n.Contains("PLAYBACK") || n.StartsWith("SIM")) continue;

                    string safeName = acc.Name.Replace(" ", "_");
                    string datafeedBotId = safeName + "_DATAFEED";

                    NinjaTrader.Code.Output.Process($"AwesomeCockpit: Broadcasting Symbols for {datafeedBotId}...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                    // We need to wrap this manually because BridgeWebSocket.Send uses internal socket identity
                    _socket.SendWithType("SYMBOLS_LIST", payload, datafeedBotId);
                }
            }
        }

        private int GetDigits(double tickSize)
        {
            // Simple heuristic to count decimals
            string s = tickSize.ToString(System.Globalization.CultureInfo.InvariantCulture);
            int i = s.IndexOf('.');
            if (i < 0) return 0;
            return s.Length - i - 1;
        }
        public void SendAccounts()
        {
            try
            {
                NinjaTrader.Code.Output.Process("AwesomeCockpit: DiscoveryService - Reporting Accounts...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                lock (Account.All)
                {
                    var accountList = new List<object>();
                    int count = 0;

                    foreach (Account acc in Account.All)
                    {
                        if (acc == null) continue;

                        // FILTER: Exclude Backtest/Playback/Sim
                        // User requested to filter "Backtest" and "Playback"
                        string n = acc.Name.ToUpper();
                        if (n.Contains("BACKTEST") || n.Contains("PLAYBACK") || n.StartsWith("SIM")) continue;

                        count++;
                        try
                        {
                            NinjaTrader.Code.Output.Process($"[Discovery] Processing Account: {acc.Name}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                            string providerName = "Unknown";
                            if (acc.Connection != null)
                            {
                                if (acc.Connection.Options != null)
                                {
                                    providerName = acc.Connection.Options.Name;
                                    NinjaTrader.Code.Output.Process($"[Discovery] Connection: {providerName} (Type: {acc.Connection.GetType().Name})", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                                }
                                else
                                {
                                    NinjaTrader.Code.Output.Process($"[Discovery] Connection Options is NULL for {acc.Name}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                                }
                            }
                            else
                            {
                                NinjaTrader.Code.Output.Process($"[Discovery] Connection is NULL for {acc.Name}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                                // Fallback: Check if we can find it in Connections collection?
                                // For now just log.
                            }

                            bool isTest = true;
                            if (acc.Name.IndexOf("Live", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                acc.Name.IndexOf("Real", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                acc.Name.IndexOf("PA", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                acc.Name.IndexOf("Funded", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                isTest = false;
                            }

                            string safeName = acc.Name.Replace(" ", "_");

                            accountList.Add(new
                            {
                                name = safeName,
                                provider = providerName,
                                isTest = isTest
                            });

                            // 2. Report DATAFEED Account (Shadow Account)
                            // Allows separate configuration in Frontend
                            accountList.Add(new
                            {
                                name = safeName + "_DATAFEED",
                                provider = providerName, // Same Broker
                                isTest = isTest,
                                isDatafeed = true // Optional flag if backend uses it
                            });
                        }
                        catch (Exception ex)
                        {
                            NinjaTrader.Code.Output.Process($"AwesomeCockpit: Error reading account: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        }
                    }

                    _socket.Send("CMD_REPORT_ACCOUNTS", accountList);
                    NinjaTrader.Code.Output.Process($"AwesomeCockpit: Sent {accountList.Count} accounts.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: SendAccounts CRITICAL Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        public void RegisterAccountBots()
        {
            NinjaTrader.Code.Output.Process("AwesomeCockpit: DiscoveryService - Registering Account Bots...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            lock (Account.All)
            {
                foreach (Account acc in Account.All)
                {
                    if (acc == null) continue;

                    // FILTER: Exclude Backtest/Playback/Sim
                    // User requested to filter "Backtest" and "Playback" and "Sim*"
                    string n = acc.Name.ToUpper();
                    if (n.Contains("BACKTEST") || n.Contains("PLAYBACK") || n.StartsWith("SIM")) continue;

                    try
                    {
                        string safeName = acc.Name.Replace(" ", "_");
                        string providerName = (acc.Connection != null && acc.Connection.Options != null) ? acc.Connection.Options.Name : "Unknown";
                        bool isTest = !(acc.Name.IndexOf("Live", StringComparison.OrdinalIgnoreCase) >= 0 || acc.Name.IndexOf("Real", StringComparison.OrdinalIgnoreCase) >= 0);

                        // 1. Register TRADING Bot
                        var tradingPayload = new
                        {
                            id = safeName,
                            func = "TRADING",
                            symbol = "ALL",
                            provider = providerName,
                            isTest = isTest
                        };
                        _socket.Send("REGISTER", tradingPayload);
                        _socket.RegisterBot(safeName, "TRADING", "ALL"); // Track for Heartbeat

                        // 2. Register DATAFEED Bot
                        var datafeedPayload = new
                        {
                            id = safeName + "_DATAFEED",
                            func = "DATAFEED",
                            symbol = "ALL"
                        };
                        _socket.Send("REGISTER", datafeedPayload);
                        _socket.RegisterBot(safeName, "DATAFEED", "ALL"); // Track for Heartbeat

                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Registered Bots for {safeName}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                    catch (Exception ex)
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Error registering account {acc.Name}: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                }
            }
        }
    }
}
