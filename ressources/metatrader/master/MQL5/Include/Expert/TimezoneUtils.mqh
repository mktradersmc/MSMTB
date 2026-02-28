//+------------------------------------------------------------------+
//|                                                TimezoneUtils.mqh |
//|                                  Copyright 2026, Antigravity     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Antigravity"
#property strict

//+------------------------------------------------------------------+
//| DetectBrokerTimezoneSignature                                    |
//| Analyzes EURUSD H1 Friday Close to determine TZ Signature        |
//+------------------------------------------------------------------+
string DetectBrokerTimezoneSignature()
{
   string symbol = "EURUSD";
   if(!SymbolInfoInteger(symbol, SYMBOL_SELECT)) SymbolSelect(symbol, true);
   
   // Look back enough bars to find a Friday
   int barsToCheck = 500; 
   datetime times[];
   // Using H1 bars as requested to check hour
   if(CopyTime(symbol, PERIOD_H1, 0, barsToCheck, times) < 0) 
   {
       Print("[TimezoneUtils] Error copying time for detection, defaulting to EET.");
       return "EET";
   }
   
   bool skipCurrentFriday = false;
   MqlDateTime currentDt; TimeToStruct(TimeCurrent(), currentDt);
   if (currentDt.day_of_week == 5) skipCurrentFriday = true;
   
   int size = ArraySize(times);
   for(int i = size - 1; i >= 0; i--)
   {
      datetime t = times[i];
      MqlDateTime dt;
      TimeToStruct(t, dt);
      
      if(dt.day_of_week == 5) // Found a Friday
      {
          if (skipCurrentFriday) continue; // We are currently ON Friday, so this data is incomplete
          
          // Found the Close of a Friday (since we iterate backwards, looking at timestamps)
          // Wait, CopyTime returns Open Time.
          // For H1, the Open Time of the LAST bar of Friday is what we want?
          // No, we want the Close Time of the market.
          // The last H1 bar of Friday OPENS at e.g. 23:00.
          
          int hour = dt.hour;
          
          // Analyze Open Hour of the last Friday bar found
          // If Market Closes at 24:00 (00:00 next day), the last bar might be 23:00.
          
          // Heuristic based on typically observed server times:
          // EET (UTC+2/3): Winter closes at 23:59? Last H1 bar 23:00.
          // EST (UTC-5): NY 17:00 Close. Last H1 bar 16:00.
          // UTC (London): 22:00 Close?
          
          if (hour >= 22 || hour == 0) return "EET";       // Eastern European Time
          if (hour == 16 || hour == 17) return "EST";      // NY Close
          if (hour == 20 || hour == 21) return "UTC";      // London/UTC
          
          // Keep searching if this wasn't arguably "Last" (though loop goes backwards, so first Friday we hit is the latest)
          return "EET"; // Default if matched Friday but weird hour
      }
      else
      {
          // We moved past the current Friday block (if we were in it)
          if (skipCurrentFriday) skipCurrentFriday = false;
      }
   }
   
   return "EET";
}
