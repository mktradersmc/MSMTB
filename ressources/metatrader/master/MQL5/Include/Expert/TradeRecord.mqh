//+------------------------------------------------------------------+
//|                                                  TradeRecord.mqh |
//|                        Copyright 2024, Michael Müller           |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADE_RECORD_MQH
#define TRADE_RECORD_MQH

#include <Object.mqh>

enum ENUM_TRADE_DIRECTION
{
   TRADE_LONG = 0,   // Long
   TRADE_SHORT = 1   // Short
};

enum ENUM_TRADE_EXIT_REASON
{
   EXIT_TAKE_PROFIT = 0,  // Take Profit erreicht
   EXIT_STOP_LOSS = 1,    // Stop Loss getriggert
   EXIT_MANUAL = 2,       // Manuell geschlossen
   EXIT_TRAILING = 3,     // Trailing Stop
   EXIT_TIME = 4,         // Zeit-basiert
   EXIT_BREAKEVEN = 5     // Breakeven
};

class CTradeRecord : public CObject
{
private:
   string            m_symbol;
   ENUM_TRADE_DIRECTION m_direction;
   double            m_entryPrice;
   double            m_stopLoss;
   double            m_takeProfit;
   double            m_profitLoss;
   datetime          m_entryTime;
   datetime          m_exitTime;
   double            m_volume;
   ulong             m_ticket;
   ENUM_TRADE_EXIT_REASON m_exitReason;
   string            m_comment;
   double            m_commission;
   double            m_swap;

public:
   CTradeRecord(void);
   CTradeRecord(string symbol, ENUM_TRADE_DIRECTION direction, double entryPrice, 
                double stopLoss, double takeProfit, double volume, ulong ticket);
   ~CTradeRecord(void);
   
   // Getter methods
   string            GetSymbol(void) const { return m_symbol; }
   ENUM_TRADE_DIRECTION GetDirection(void) const { return m_direction; }
   double            GetEntryPrice(void) const { return m_entryPrice; }
   double            GetStopLoss(void) const { return m_stopLoss; }
   double            GetTakeProfit(void) const { return m_takeProfit; }
   double            GetProfitLoss(void) const { return m_profitLoss; }
   datetime          GetEntryTime(void) const { return m_entryTime; }
   datetime          GetExitTime(void) const { return m_exitTime; }
   double            GetVolume(void) const { return m_volume; }
   ulong             GetTicket(void) const { return m_ticket; }
   ENUM_TRADE_EXIT_REASON GetExitReason(void) const { return m_exitReason; }
   string            GetComment(void) const { return m_comment; }
   double            GetCommission(void) const { return m_commission; }
   double            GetSwap(void) const { return m_swap; }
   
   // Setter methods
   void              SetSymbol(const string symbol) { m_symbol = symbol; }
   void              SetDirection(const ENUM_TRADE_DIRECTION direction) { m_direction = direction; }
   void              SetEntryPrice(const double price) { m_entryPrice = price; }
   void              SetStopLoss(const double price) { m_stopLoss = price; }
   void              SetTakeProfit(const double price) { m_takeProfit = price; }
   void              SetProfitLoss(const double profit) { m_profitLoss = profit; }
   void              SetEntryTime(const datetime time) { m_entryTime = time; }
   void              SetExitTime(const datetime time) { m_exitTime = time; }
   void              SetVolume(const double volume) { m_volume = volume; }
   void              SetTicket(const ulong ticket) { m_ticket = ticket; }
   void              SetExitReason(const ENUM_TRADE_EXIT_REASON reason) { m_exitReason = reason; }
   void              SetComment(const string comment) { m_comment = comment; }
   void              SetCommission(const double commission) { m_commission = commission; }
   void              SetSwap(const double swap) { m_swap = swap; }
   
   // Utility methods
   string            GetDirectionString(void) const;
   string            GetExitReasonString(void) const;
   bool              IsCompleted(void) const { return m_exitTime > 0; }
};

CTradeRecord::CTradeRecord(void)
{
   m_symbol = "";
   m_direction = TRADE_LONG;
   m_entryPrice = 0.0;
   m_stopLoss = 0.0;
   m_takeProfit = 0.0;
   m_profitLoss = 0.0;
   m_entryTime = 0;
   m_exitTime = 0;
   m_volume = 0.0;
   m_ticket = 0;
   m_exitReason = EXIT_MANUAL;
   m_comment = "";
   m_commission = 0.0;
   m_swap = 0.0;
}

CTradeRecord::CTradeRecord(string symbol, ENUM_TRADE_DIRECTION direction, double entryPrice, 
                          double stopLoss, double takeProfit, double volume, ulong ticket)
{
   m_symbol = symbol;
   m_direction = direction;
   m_entryPrice = entryPrice;
   m_stopLoss = stopLoss;
   m_takeProfit = takeProfit;
   m_volume = volume;
   m_ticket = ticket;
   m_entryTime = TimeCurrent();
   m_exitTime = 0;
   m_profitLoss = 0.0;
   m_exitReason = EXIT_MANUAL;
   m_comment = "";
   m_commission = 0.0;
   m_swap = 0.0;
}

CTradeRecord::~CTradeRecord(void)
{
}

string CTradeRecord::GetDirectionString(void) const
{
   return (m_direction == TRADE_LONG) ? "Long" : "Short";
}

string CTradeRecord::GetExitReasonString(void) const
{
   switch(m_exitReason)
   {
      case EXIT_TAKE_PROFIT: return "Take Profit";
      case EXIT_STOP_LOSS:   return "Stop Loss";
      case EXIT_MANUAL:      return "Manual";
      case EXIT_TRAILING:    return "Trailing Stop";
      case EXIT_TIME:        return "Time Exit";
      case EXIT_BREAKEVEN:   return "Breakeven";
      default:               return "Unknown";
   }
}

#endif // TRADE_RECORD_MQH