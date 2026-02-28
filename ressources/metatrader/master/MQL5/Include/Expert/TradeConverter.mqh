//+------------------------------------------------------------------+
//|                                              TradeConverter.mqh |
//|                                   Copyright 2023, Michael Müller |
//+------------------------------------------------------------------+
#ifndef TRADE_CONVERTER_MQH
#define TRADE_CONVERTER_MQH

#include <Expert\Candle.mqh>

class CTradeConverter
{
public:
    static double LogicalToPrice(string symbol, ENUM_TIMEFRAMES tf, datetime time, int levelIdx, string direction, string pointType)
    {
        MqlRates rates[];
        // Wir kopieren etwas mehr Daten um sicherzugehen, dass wir die Kerze finden
        if(CopyRates(symbol, tf, time, 1, rates) <= 0)
        {
            Print("Error copying rates for ", symbol, " at ", time, " (", EnumToString(tf), ")");
            return 0;
        }

        double open = rates[0].open;
        double high = rates[0].high;
        double low = rates[0].low;
        double close = rates[0].close;

        bool isLong = (direction == "BUY");
        double price = 0;

        if(pointType == "ENTRY")
        {
            switch(levelIdx)
            {
                case 0: price = low; break;              // Low
                case 1: price = MathMin(open, close); break; // Lower Body
                case 2: price = MathMax(open, close); break; // Upper Body
                case 3: price = high; break;             // High
            }
        }
        else if(pointType == "SL")
        {
            if(isLong)
            {
                // Long SL logic: Low is 0, Lower Body is 1...
                switch(levelIdx) {
                    case 0: price = low; break;
                    case 1: price = MathMin(open, close); break;
                    case 2: price = MathMax(open, close); break;
                    case 3: price = high; break;
                }
            }
            else
            {
                // Short SL logic (inverted): High is 0, Upper Body is 1...
                switch(levelIdx) {
                    case 0: price = high; break;
                    case 1: price = MathMax(open, close); break;
                    case 2: price = MathMin(open, close); break;
                    case 3: price = low; break;
                }
            }
        }
        else if(pointType == "TP")
        {
            if(isLong)
            {
                // Long TP logic (inverted to SL): High is 0, Upper Body is 1...
                switch(levelIdx) {
                    case 0: price = high; break;
                    case 1: price = MathMax(open, close); break;
                    case 2: price = MathMin(open, close); break;
                    case 3: price = low; break;
                }
            }
            else
            {
                // Short TP logic: Low is 0, Lower Body is 1...
                switch(levelIdx) {
                    case 0: price = low; break;
                    case 1: price = MathMin(open, close); break;
                    case 2: price = MathMax(open, close); break;
                    case 3: price = high; break;
                }
            }
        }

        return price;
    }
};

#endif


