//+------------------------------------------------------------------+
//|                                                 RiskManager.mqh |
//|                                   Copyright 2026, Michael M?ller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael M?ller"
#property strict

class CRiskManager
{
private:
   double m_maxDailyLoss;
   double m_initialEquity;
   double m_currentEquity;
   
public:
   CRiskManager() : m_maxDailyLoss(0), m_initialEquity(0) {}
   ~CRiskManager() {}

   void Init(double maxDailyLossInfo)
   {
      m_maxDailyLoss = maxDailyLossInfo;
      m_initialEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   }
   
   void OnTick()
   {
      m_currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   }
   
   bool CheckEquityGuard()
   {
      if (m_maxDailyLoss <= 0) return true; // Disabled
      
      double drawdown = m_initialEquity - m_currentEquity;
      if (drawdown > m_maxDailyLoss)
      {
         Print("[RiskManager] Daily Loss Limit Breached! Drawdown: ", drawdown, " Limit: ", m_maxDailyLoss);
         return false; // Stop Trading
      }
      return true;
   }
   
   // Centralized Lot Calculation (Placeholder for advanced logic)
   double CalculateLotSize(string symbol, double slData)
   {
       // MVP: return fixed or basic percent
       return 0.01; 
   }
};
