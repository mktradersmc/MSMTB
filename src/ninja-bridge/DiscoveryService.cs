#region Using declarations
using System;
using System.IO;
using System.IO.Pipes;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using NinjaTrader.Code;
using NinjaTrader.Cbi;
using Newtonsoft.Json;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
#endregion

namespace AwesomeCockpit.NT8.Bridge
{
    public class DiscoveryService
    {
        private readonly BridgeWebSocket _socket;

        public DiscoveryService(BridgeWebSocket socket)
        {
            _socket = socket;
        }

        public void SendSymbols(string requestId = "")
        {
            var commonMasters = new string[] {
                // Indices (Die Klassiker)
                "NQ", "MNQ",   // Nasdaq 100 & Micro
                "ES", "MES",   // S&P 500 & Micro
                "YM", "MYM",   // Dow Jones & Micro
                "RTY", "M2K",  // Russell 2000 & Micro

                // Metalle
                "GC", "MGC",   // Gold & Micro
                "SI", "SIL",   // Silber & Micro (manchmal SIL oder MSI je nach Feed)
                "HG",          // Kupfer

                // Energie
                "CL", "MCL",   // Crude Oil & Micro
                "NG", "QG",    // Natural Gas & Mini

                // Währungen (FX Futures)
                "6E", "M6E",   // Euro & Micro
                "6B", "M6B",   // Britisches Pfund & Micro
                "6J",          // Japanischer Yen
                "6A",          // Australischer Dollar
                "6C",          // Kanadischer Dollar

                // Agrar (Vorsicht: Andere Handelszeiten!)
                "ZC", "ZS", "ZW" // Mais, Soja, Weizen
            };

            var payload = new List<object>();
            int count = 0;

            foreach (string name in commonMasters)
            {
                try
                {
                    MasterInstrument master = null;
                    foreach (MasterInstrument m in MasterInstrument.All)
                    {
                        if (m.Name == name)
                        {
                            master = m;
                            break;
                        }
                    }

                    if (master != null)
                    {
                        payload.Add(new
                        {
                            name = master.Name, // e.g. "ES"
                            desc = master.Description, // e.g. "E-mini S&P 500"
                            path = $"{master.InstrumentType}/Default", // e.g "Future/Default"
                            digits = GetDigits(master.TickSize),
                            tick_size = master.TickSize,
                            point_value = master.PointValue,
                            currency = master.Currency.ToString(),
                            exchange = "Default"
                        });
                        count++;
                    }
                    else
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: MasterInstrument '{name}' not found locally.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                }
                catch { }
            }

            NinjaTrader.Code.Output.Process($"AwesomeCockpit: Sending {count} Instruments (Broadcasting to Datafeed Accounts)...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            // LOG for User Verification
            string symbolListStr = string.Join(", ", commonMasters);

            // BROADCAST STRATEGY: Send on behalf of ALL Datafeed Accounts
            // This ensures every registered Datafeed account gets the symbols assigned.

            var uniqueProviders = new System.Collections.Generic.HashSet<string>();
            NinjaTrader.Core.Globals.RandomDispatcher.Invoke(new Action(() =>
            {
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: Iterating {Account.All.Count} accounts for symbol broadcast...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                foreach (Account acc in Account.All)
                {
                    if (acc == null) continue;
                    string n = acc.Name.ToUpper();
                    if (n.Contains("BACKTEST") || n.Contains("PLAYBACK") || n.StartsWith("SIM")) continue;

                    string providerName = (acc.Connection != null && acc.Connection.Options != null) ? acc.Connection.Options.Name : "Unknown";
                    if (providerName == "Unknown" || providerName == "") continue;

                    uniqueProviders.Add(providerName);
                }
            }));

            foreach (var provider in uniqueProviders)
            {
                string datafeedBotId = provider + "_DATAFEED";
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: Broadcasting Symbols for {datafeedBotId}...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                // We need to wrap this manually because BridgeWebSocket.Send uses internal socket identity
                _socket.SendProtocolMessage("CMD_GET_SYMBOLS_RESPONSE", payload, datafeedBotId, "DATAFEED", "ALL", requestId);
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
        public void SendAccounts(string requestId = "")
        {
            try
            {
                NinjaTrader.Code.Output.Process("AwesomeCockpit: DiscoveryService - Reporting Accounts...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

                var accountList = new System.Collections.Generic.List<object>();
                var uniqueProviders = new System.Collections.Generic.HashSet<string>();

                NinjaTrader.Core.Globals.RandomDispatcher.Invoke(new Action(() =>
                {
                    int count = 0;
                    foreach (Account acc in Account.All)
                    {
                        if (acc == null) continue;

                        string n = acc.Name.ToUpper();
                        if (n.Contains("BACKTEST") || n.Contains("PLAYBACK")) continue;

                        count++;
                        try
                        {
                            string providerName = "Unknown";
                            if (acc.Connection != null && acc.Connection.Options != null && !string.IsNullOrEmpty(acc.Connection.Options.Name))
                            {
                                providerName = acc.Connection.Options.Name;
                            }

                            // Filter out disconnected/phantom accounts, but explicitly allow Sim101
                            if (providerName == "Unknown" && !acc.Name.Equals("Sim101", StringComparison.OrdinalIgnoreCase)) continue;
                            if (providerName == "Unknown") providerName = "NinjaTrader";

                            bool isTest = n.StartsWith("SIM");
                            string safeName = acc.Name.Replace(" ", "_");

                            double balance = acc.Get(AccountItem.CashValue, Currency.UsDollar);
                            if (balance <= 0) balance = acc.Get(AccountItem.RealizedProfitLoss, Currency.UsDollar) + acc.Get(AccountItem.InitialMargin, Currency.UsDollar);
                            if (balance <= 0) balance = 50000;

                            double equity = balance + acc.Get(AccountItem.UnrealizedProfitLoss, Currency.UsDollar);
                            double profit = acc.Get(AccountItem.UnrealizedProfitLoss, Currency.UsDollar);

                            accountList.Add(new
                            {
                                name = safeName,
                                provider = providerName,
                                isTest = isTest,
                                isDatafeed = false,
                                timezone = "UTC",
                                balance = balance,
                                equity = equity,
                                profit = profit
                            });
                            uniqueProviders.Add(providerName);
                        }
                        catch (Exception ex)
                        {
                            NinjaTrader.Code.Output.Process($"AwesomeCockpit: Error reading account: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        }
                    }
                }));

                // The backend now creates DATAFEED accounts internally using the actual account balance and provider.
                // Removed the legacy loop that forcefully appended faux 'PROVIDER_DATAFEED' accounts,
                // which caused the bug where 3 real accounts resulted in 6 reported accounts.

                _socket.SendProtocolMessage("CMD_INIT_RESPONSE", accountList, "NT8", "DISCOVERY", "ALL", requestId);
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: Sent {accountList.Count} accounts (RPC Response).", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: SendAccounts CRITICAL Error: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        public void RegisterAccountBots()
        {
            NinjaTrader.Code.Output.Process("AwesomeCockpit: DiscoveryService - Registering Account Bots...", NinjaTrader.NinjaScript.PrintTo.OutputTab1);

            var uniqueProviders = new System.Collections.Generic.HashSet<string>();
            var accountsToRegister = new System.Collections.Generic.List<Tuple<string, string, bool>>();

            NinjaTrader.Core.Globals.RandomDispatcher.Invoke(new Action(() =>
            {
                foreach (Account acc in Account.All)
                {
                    if (acc == null) continue;

                    string n = acc.Name.ToUpper();
                    if (n.Contains("BACKTEST") || n.Contains("PLAYBACK")) continue;

                    try
                    {
                        string safeName = acc.Name.Replace(" ", "_");

                        string providerName = "Unknown";
                        if (acc.Connection != null && acc.Connection.Options != null && !string.IsNullOrEmpty(acc.Connection.Options.Name))
                        {
                            providerName = acc.Connection.Options.Name;
                        }

                        if (providerName == "Unknown" && !acc.Name.Equals("Sim101", StringComparison.OrdinalIgnoreCase)) continue;
                        if (providerName == "Unknown") providerName = "NinjaTrader";

                        bool isTest = n.StartsWith("SIM");
                        accountsToRegister.Add(new Tuple<string, string, bool>(safeName, providerName, isTest));
                        uniqueProviders.Add(providerName);
                    }
                    catch (Exception ex)
                    {
                        NinjaTrader.Code.Output.Process($"AwesomeCockpit: Error registering account {acc.Name}: {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                }
            }));

            // Perform network sending OUTSIDE the Dispatcher
            foreach (var item in accountsToRegister)
            {
                string safeName = item.Item1;
                string providerName = item.Item2;
                bool isTest = item.Item3;

                var tradingPayload = new
                {
                    id = safeName,
                    func = "TRADING",
                    symbol = "ALL",
                    provider = providerName,
                    isTest = isTest,
                    timezone = "UTC"
                };
                _socket.SendProtocolMessage("REGISTER", tradingPayload, safeName, "TRADING", "ALL");
                _socket.RegisterBot(safeName, "TRADING", "ALL"); // Track for Heartbeat

                NinjaTrader.Code.Output.Process($"AwesomeCockpit: Registered Bots for {safeName}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }

            foreach (var provider in uniqueProviders)
            {
                string dfId = provider + "_DATAFEED";
                var datafeedPayload = new
                {
                    id = dfId,
                    func = "DATAFEED",
                    symbol = "ALL",
                    provider = provider,
                    isTest = false,
                    timezone = "UTC"
                };
                _socket.SendProtocolMessage("REGISTER", datafeedPayload, dfId, "DATAFEED", "ALL");
                _socket.RegisterBot(dfId, "DATAFEED", "ALL");
                NinjaTrader.Code.Output.Process($"AwesomeCockpit: Registered DATAFEED Bot for {provider}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }

            // Flag that initialization and bot creation is complete, unlocking Live Account Status Updates
            ExecutionManager.IsDiscoveryComplete = true;
        }

        public void AcknowledgeConfig(string requestId, string botId)
        {
            var payload = new { status = "OK", message = "Configuration accepted" };
            _socket.SendProtocolMessage("CMD_CONFIG_SYMBOLS_RESPONSE", payload, botId, "DATAFEED", "ALL", requestId);
        }

        public void RegisterVirtualBots(string botId, string symbol)
        {
            if (string.IsNullOrEmpty(symbol) || string.IsNullOrEmpty(botId)) return;

            // 1. Register TICK_SPY
            var tsPayload = new { id = botId, func = "TICK_SPY", symbol = symbol, provider = "Datafeed", isTest = false, timezone = "UTC" };
            _socket.SendProtocolMessage("REGISTER", tsPayload, botId, "TICK_SPY", symbol);
            _socket.RegisterBot(botId, "TICK_SPY", symbol);

            // 2. Register HISTORY
            var histPayload = new { id = botId, func = "HISTORY", symbol = symbol, provider = "Datafeed", isTest = false, timezone = "UTC" };
            _socket.SendProtocolMessage("REGISTER", histPayload, botId, "HISTORY", symbol);
            _socket.RegisterBot(botId, "HISTORY", symbol);

            NinjaTrader.Code.Output.Process($"AwesomeCockpit: Registered Virtual TICK_SPY and HISTORY for '{botId}' on '{symbol}'.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
        }
    }
}
