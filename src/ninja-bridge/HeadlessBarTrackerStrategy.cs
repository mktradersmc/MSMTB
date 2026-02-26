using System;
using System.Collections.Generic;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript.Strategies;

namespace AwesomeCockpit.NT8.Bridge
{
    public class HeadlessBarTrackerStrategy : Strategy
    {
        private Action<string, string, object, bool> _onBarUpdateCallback;
        private string _symbolName;

        // Use arrays for deterministic ordering to prevent Dictionary iteration mismatch in .NET
        private string[] _tfs = { "M1", "M2", "M3", "M4", "M5", "M10", "M12", "M15", "M20", "M30", "H1", "H2", "H3", "H4", "H6", "H8", "H12", "D1", "W1", "MN1" };
        private BarsPeriod[] _periods;

        // Caches the last processed Bar index per BarsInProgress to detect formal Bar Closures
        private int[] _lastBarIndexMap;

        public void Initialize(Instrument instrument, Action<string, string, object, bool> onBarUpdateCallback)
        {
            _symbolName = instrument.FullName;
            _onBarUpdateCallback = onBarUpdateCallback;

            // Setup
            Calculate = NinjaTrader.NinjaScript.Calculate.OnPriceChange;
            IsUnmanaged = true; // No position logic
            DaysToLoad = 2; // Minimal history to construct Bar[0] efficiently

            _periods = new BarsPeriod[_tfs.Length];
            _lastBarIndexMap = new int[_tfs.Length];

            for (int i = 0; i < _tfs.Length; i++)
            {
                _periods[i] = ParseTimeframe(_tfs[i]);
                _lastBarIndexMap[i] = -1;
            }

            // The primary DataSeries MUST be configured in OnStateChange internally by NT8 
            // via AddDataSeries when using headless.
        }

        protected override void OnStateChange()
        {
            if (State == NinjaTrader.NinjaScript.State.Configure)
            {
                // We MUST call AddDataSeries here. 
                // NT8 strictly maps the first call to BarsInProgress = 0, second to 1, etc.
                for (int i = 0; i < _tfs.Length; i++)
                {
                    if (_periods[i] != null)
                    {
                        AddDataSeries(_symbolName, new BarsPeriod { BarsPeriodType = _periods[i].BarsPeriodType, Value = _periods[i].Value });
                    }
                }
            }
            else if (State == NinjaTrader.NinjaScript.State.DataLoaded)
            {
                NinjaTrader.Code.Output.Process($"[HeadlessStrategy] Native DataLoaded for {_symbolName}. Multi-Series tracking fully armed.", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        protected override void OnBarUpdate()
        {
            // CRITICAL: Block all historical data processing from spamming the frontend.
            // We ONLY care about the live, forming candles from NinjaTrader.
            if (State != NinjaTrader.NinjaScript.State.Realtime) return;

            int bIdx = BarsInProgress;

            // Strict bounds checking against NT8 engine surprises
            if (bIdx >= _tfs.Length || _periods[bIdx] == null) return;
            if (bIdx >= CurrentBars.Length || CurrentBars[bIdx] < 0) return;
            if (bIdx >= BarsArray.Length || BarsArray[bIdx] == null) return;
            if (bIdx >= Opens.Length || bIdx >= Highs.Length || bIdx >= Lows.Length || bIdx >= Closes.Length || bIdx >= Volumes.Length) return;

            string tf = _tfs[bIdx];
            BarsPeriod period = _periods[bIdx];
            int currentNativeBarIdx = CurrentBars[bIdx];

            // Detect if NinjaTrader natively closed a bar boundary
            if (currentNativeBarIdx > _lastBarIndexMap[bIdx])
            {
                if (_lastBarIndexMap[bIdx] != -1)
                {
                    try
                    {
                        // The PREVIOUS bar (Bar[1]) is now officially closed!
                        DateTime openTimeClosed = GetOpenTimeFromExt(BarsArray[bIdx].GetTime(1), period, BarsArray[bIdx].Instrument);
                        DateTimeOffset offsetTimeClosed = new DateTimeOffset(openTimeClosed, TimeZoneInfo.Local.GetUtcOffset(openTimeClosed));

                        var closedPayload = new
                        {
                            time = offsetTimeClosed.ToUnixTimeMilliseconds(),
                            open = Opens[bIdx][1],
                            high = Highs[bIdx][1],
                            low = Lows[bIdx][1],
                            close = Closes[bIdx][1],
                            volume = Volumes[bIdx][1]
                        };

                        // NinjaTrader.Code.Output.Process($"[HeadlessStrategy] EV_BAR_CLOSED -> {tf} | NT8 CloseTime: {BarsArray[bIdx].GetTime(1):yyyy-MM-dd HH:mm:ss} | Mapped OpenTime Local: {openTimeClosed:yyyy-MM-dd HH:mm:ss}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                        _onBarUpdateCallback?.Invoke(_symbolName, tf, closedPayload, true);
                    }
                    catch (Exception ex)
                    {
                        NinjaTrader.Code.Output.Process($"[HeadlessStrategy] EV_BAR_CLOSED Error ({tf}): {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                }
                _lastBarIndexMap[bIdx] = currentNativeBarIdx;
            }

            // Always fire EV_BAR_UPDATE for the actively forming Bar[0]
            try
            {
                DateTime openTimeAct = GetOpenTimeFromExt(BarsArray[bIdx].GetTime(0), period, BarsArray[bIdx].Instrument);
                DateTimeOffset offsetTimeAct = new DateTimeOffset(openTimeAct, TimeZoneInfo.Local.GetUtcOffset(openTimeAct));

                var updatePayload = new
                {
                    time = offsetTimeAct.ToUnixTimeMilliseconds(),
                    open = Opens[bIdx][0],
                    high = Highs[bIdx][0],
                    low = Lows[bIdx][0],
                    close = Closes[bIdx][0],
                    volume = Volumes[bIdx][0]
                };

                _onBarUpdateCallback?.Invoke(_symbolName, tf, updatePayload, false);
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[HeadlessStrategy] EV_BAR_UPDATE Error ({tf}): {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }

        public object GetCurrentBarPayload(string timeframe)
        {
            try
            {
                int bIdx = Array.IndexOf(_tfs, timeframe);
                if (bIdx == -1) return null;

                // Strict array bounds validation to prevent UI crashes if NT is busy
                if (BarsArray == null || bIdx >= BarsArray.Length || BarsArray[bIdx] == null) return null;
                if (CurrentBars == null || bIdx >= CurrentBars.Length || CurrentBars[bIdx] < 0) return null;
                if (Opens == null || bIdx >= Opens.Length || Highs == null || bIdx >= Highs.Length) return null;

                DateTime openTimeAct = GetOpenTimeFromExt(BarsArray[bIdx].GetTime(0), _periods[bIdx], BarsArray[bIdx].Instrument);
                DateTimeOffset offsetTimeAct = new DateTimeOffset(openTimeAct, TimeZoneInfo.Local.GetUtcOffset(openTimeAct));

                return new
                {
                    time = offsetTimeAct.ToUnixTimeMilliseconds(),
                    open = Opens[bIdx][0],
                    high = Highs[bIdx][0],
                    low = Lows[bIdx][0],
                    close = Closes[bIdx][0],
                    volume = Volumes[bIdx][0]
                };
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process($"[HeadlessStrategy] Payload Error ({timeframe}): {ex.Message}", NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                return null;
            }
        }

        public DateTime GetOpenTimeFromExt(DateTime closeTime, BarsPeriod period, Instrument inst)
        {
            if (period.BarsPeriodType == BarsPeriodType.Minute)
            {
                return closeTime.AddMinutes(-period.Value);
            }
            if (period.BarsPeriodType == BarsPeriodType.Day)
            {
                return closeTime.AddDays(-period.Value).AddHours(12);
            }
            if (period.BarsPeriodType == BarsPeriodType.Week)
            {
                return closeTime.AddDays(-7).AddHours(12);
            }
            if (period.BarsPeriodType == BarsPeriodType.Month)
            {
                return closeTime.AddMonths(-period.Value).AddHours(12);
            }
            return closeTime;
        }

        private BarsPeriod ParseTimeframe(string timeframe)
        {
            if (timeframe.StartsWith("M") && !timeframe.StartsWith("MN"))
            {
                if (int.TryParse(timeframe.Substring(1), out int mins))
                {
                    return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = mins };
                }
            }
            else if (timeframe.StartsWith("H"))
            {
                if (int.TryParse(timeframe.Substring(1), out int hours))
                {
                    return new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = hours * 60 };
                }
            }
            else if (timeframe.StartsWith("D"))
            {
                if (int.TryParse(timeframe.Substring(1), out int days))
                {
                    return new BarsPeriod { BarsPeriodType = BarsPeriodType.Day, Value = days };
                }
            }
            else if (timeframe.StartsWith("W"))
            {
                if (int.TryParse(timeframe.Substring(1), out int weeks))
                {
                    return new BarsPeriod { BarsPeriodType = BarsPeriodType.Week, Value = weeks };
                }
            }
            else if (timeframe.StartsWith("MN"))
            {
                if (int.TryParse(timeframe.Substring(2), out int months))
                {
                    return new BarsPeriod { BarsPeriodType = BarsPeriodType.Month, Value = months };
                }
            }
            return null;
        }
    }
}
