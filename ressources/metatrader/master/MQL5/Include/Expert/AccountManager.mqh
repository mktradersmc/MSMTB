//+------------------------------------------------------------------+
//|                                               AccountManager.mqh |
//|                                   Copyright 2023, Michael M?ller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael M?ller"
#property link      "https://www.mql5.com"
#property version   "1.01"
#property strict

#ifndef ACCOUNT_MANAGER_MQH
#define ACCOUNT_MANAGER_MQH

#include <Object.mqh>
#include <Expert\Helper.mqh>
#include <Expert\TradingConfig.mqh>

enum ENUM_PROFIT_TARGET
{
   None = 0,           // Kein Gewinnziel
   Daily_Percentage = 1, // Taegliches Prozentziel
   Absolute = 2        // Absoluter Betrag
};

class CAccountManager : public CObject
{
private:
   CHelper helper;
   double dailyOpenBalance;
   double equityStopLoss;
   double equityProfitTarget;
   int currentDaysTradeCount;
   int maxTradesPerDay;
   bool newTradingDay;
   int currentDay;
   static CAccountManager* m_instance;
   
   CAccountManager();
public:
   ~CAccountManager();
   
   static CAccountManager* GetInstance();
   void Update(MqlTick& tick);
   void ConfigureDailyTargets();
   bool IsDailyStopLossReached();
   bool IsDailyProfitTargetReached();
   bool IsNewTradingDay();
   void OnInputChanged();
   double GetEquityStopLoss();
   double GetEquityProfitTarget();
   bool IsMaxDailyTradeCountReached();
   void SetMaxDailyTradesCount(int tradeCount);
   void NewTradeEntered();
};

// CAccountManager Class Implementation
CAccountManager* CAccountManager::m_instance = NULL;

CAccountManager* CAccountManager::GetInstance()
{
    if(m_instance == NULL)
    {
        m_instance = new CAccountManager();
    }
    return m_instance;
}

CAccountManager::CAccountManager()
{
   currentDay = 0;
   newTradingDay = false;
}

CAccountManager::~CAccountManager()
{
}

double CAccountManager::GetEquityStopLoss()
{
   return equityStopLoss;
}

double CAccountManager::GetEquityProfitTarget()
{
   return equityProfitTarget;
}

void CAccountManager::OnInputChanged()
{
   Print("OnInputChanged()");
   ConfigureDailyTargets();
}

void CAccountManager::NewTradeEntered()
{
   currentDaysTradeCount++;
}

void CAccountManager::Update(MqlTick& tick)
{
   MqlDateTime time;
   TimeToStruct(tick.time, time);

   if (currentDay == 0 || currentDay != time.day)
   {
      newTradingDay = true;
      dailyOpenBalance = AccountInfoDouble(ACCOUNT_BALANCE);
      ConfigureDailyTargets();
      currentDay = time.day;
      currentDaysTradeCount = 0;
   }
   else
   {
      newTradingDay = false;
   }
}

void CAccountManager::SetMaxDailyTradesCount(int tradeCount)
{
   maxTradesPerDay = tradeCount;
}

bool CAccountManager::IsMaxDailyTradeCountReached()
{
   return currentDaysTradeCount >= maxTradesPerDay;
}

void CAccountManager::ConfigureDailyTargets()
{
   CTradingConfig* config = CTradingConfig::GetInstance();

   if (config.Account_TakeProfitOption == 0)
      equityProfitTarget = 0;
   if (config.Account_TakeProfitOption == 1)
      equityProfitTarget = AccountInfoDouble(ACCOUNT_BALANCE) * (1 + (config.Account_TakeProfitPercent / 100));
   if (config.Account_TakeProfitOption == 2)
      equityProfitTarget = config.Account_TakeProfitValue;

   Print("Profitziel gesetzt auf ", DoubleToString(equityProfitTarget, 2));

   if (config.Account_LossProtection)
   {
      equityStopLoss = dailyOpenBalance - config.Account_BasicSize * (config.Account_LossProtectionPercent / 100);
      Print("Taegliche Verlustgrenze gesetzt auf ", DoubleToString(equityStopLoss, 2));
   }
}

bool CAccountManager::IsDailyStopLossReached()
{
   if (CTradingConfig::GetInstance().Account_LossProtection)
   {
      return AccountInfoDouble(ACCOUNT_EQUITY) <= equityStopLoss;
   }
   return false;
}

bool CAccountManager::IsDailyProfitTargetReached()
{
   if (CTradingConfig::GetInstance().Account_TakeProfitOption == 0)
      return false;
   return AccountInfoDouble(ACCOUNT_EQUITY) >= equityProfitTarget;
}

bool CAccountManager::IsNewTradingDay()
{
   return newTradingDay;
}

#endif // ACCOUNT_MANAGER_MQH
