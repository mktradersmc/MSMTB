
using System;
using NinjaTrader.Core;
using NinjaTrader.Data;

public class TestSessionBuilder3
{
    public void Test(BarsPeriod period, SessionIterator sessionIterator)
    {
        DateTime time = NinjaTrader.Core.Globals.Now;
        sessionIterator.GetNextSession(time, true);
        DateTime sessionBegin = sessionIterator.ActualSessionBegin;
        
        TimeSpan elapsed = time - sessionBegin;
        int maxBars = (int)(elapsed.TotalMinutes / period.Value);
        DateTime start = sessionBegin.AddMinutes(maxBars * period.Value);
    }
}
