//+------------------------------------------------------------------+
//|                                              AnchorResolver.mqh |
//|                                   Copyright 2026, Michael M?ller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael M?ller"
#property link      "https://www.mql5.com"
#property strict

#include <JAson.mqh>

class CAnchorResolver
{
public:
   //+------------------------------------------------------------------+
   //| Resolve Anchor to Price                                         |
   //+------------------------------------------------------------------+
   static double ResolveAnchor(CJAVal &anchor, string symbol)
   {
      // 1. Check for raw price fallback
      double fallback = 0.0;
      if (anchor.HasKey("value")) fallback = anchor["value"].ToDbl();
      else if (anchor.HasKey("price")) fallback = anchor["price"].ToDbl();
      
      // If no timeframe/time, return fallback (Raw Price Payload)
      if (!anchor.HasKey("timeframe") || !anchor.HasKey("time"))
      {
         return fallback;
      }
      
      long checkTime = anchor["time"].ToInt();
      if(checkTime <= 0) return fallback;

      string tfStr = anchor["timeframe"].ToStr();
      ENUM_TIMEFRAMES tf = StringToTimeframe(tfStr);
      datetime time = (datetime)checkTime;
      
      string type = anchor["type"].ToStr();
      string ohlc = type; 
      StringToLower(ohlc); 

      // Find bar (approximate)
      int shift = iBarShift(symbol, tf, time, false);
      
      string status = "MATCH_FAILED";
      datetime foundTime = 0;
      double price = fallback;

      if(shift >= 0)
      {
         foundTime = iTime(symbol, tf, shift);
         // Check if found time is reasonably close (e.g. within reason) - for now accept nearest as "containing"
         
         if(ohlc == "high") price = iHigh(symbol, tf, shift);
         else if(ohlc == "low") price = iLow(symbol, tf, shift);
         else if(ohlc == "open") price = iOpen(symbol, tf, shift);
         else if(ohlc == "close") price = iClose(symbol, tf, shift);
         else price = fallback; 
         
         status = "RESOLVED";
      }
      else
      {
          Print("CAnchorResolver: Time match failed completely for ", TimeToString(time));
      }
      
      // LOGGING (Complete Output)
      string output = "--- Anchor Resolution ---\n";
      output += "Symbol: " + symbol + "\n";
      output += "Requested Time: " + TimeToString(time) + " [" + IntegerToString(time) + "]\n";
      output += "Requested Timeframe: " + tfStr + "\n";
      output += "Anchor Type: " + type + "\n";
      output += "Found Shift: " + IntegerToString(shift) + "\n";
      output += "Found Bar Time: " + TimeToString(foundTime) + "\n";
      output += "Resolved Price: " + DoubleToString(price, _Digits) + "\n";
      output += "Status: " + status + "\n";
      output += "-------------------------";
      Print(output);
      
      return price;
   }
   
   //+------------------------------------------------------------------+
   //| Helper: String to Timeframe                                     |
   //+------------------------------------------------------------------+
   static ENUM_TIMEFRAMES StringToTimeframe(string tfStr)
   {
      // Minutes
      if(tfStr == "M1") return PERIOD_M1;
      if(tfStr == "M2") return PERIOD_M2;
      if(tfStr == "M3") return PERIOD_M3;
      if(tfStr == "M4") return PERIOD_M4;
      if(tfStr == "M5") return PERIOD_M5;
      if(tfStr == "M6") return PERIOD_M6;
      if(tfStr == "M10") return PERIOD_M10;
      if(tfStr == "M12") return PERIOD_M12;
      if(tfStr == "M15") return PERIOD_M15;
      if(tfStr == "M20") return PERIOD_M20;
      if(tfStr == "M30") return PERIOD_M30;
      
      // Hours
      if(tfStr == "H1") return PERIOD_H1;
      if(tfStr == "H2") return PERIOD_H2;
      if(tfStr == "H3") return PERIOD_H3;
      if(tfStr == "H4") return PERIOD_H4;
      if(tfStr == "H6") return PERIOD_H6;
      if(tfStr == "H8") return PERIOD_H8;
      if(tfStr == "H12") return PERIOD_H12;
      
      // Higher
      if(tfStr == "D1") return PERIOD_D1;
      if(tfStr == "W1") return PERIOD_W1;
      if(tfStr == "MN1") return PERIOD_MN1;
      
      return PERIOD_CURRENT;
   }
};
