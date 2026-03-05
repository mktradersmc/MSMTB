//+------------------------------------------------------------------+
//|                                                   BaseExpert.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef BASE_EXPERT_MQH
#define BASE_EXPERT_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\SessionManager.mqh>
#include <Expert\AccountManager.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\TradeManager.mqh>
#include <Expert\TechnicalAnalysisManager.mqh>
#include <Expert\DivergenceDetector.mqh>
#include <Expert\Profiler.mqh>
#include <Expert\MarketConditionManager.mqh>
#include <Expert\MarketCipherManager.mqh>
#include <Expert\MarketReversalDetector.mqh>
#include <Expert\HighLowDetector.mqh>
#include <Expert\ImbalanceDetector.mqh>
#include <Expert\EnvironmentManager.mqh>
#include <Expert\MarketStructureDetector.mqh>
#include <Expert\PriceActionDetector.mqh>
#include <Expert\SupportResistanceDetector.mqh>

class CDivergenceDetector;
class CMarketConditionManager;

class CBaseExpert
{
private:
   bool initialized;
   bool inputChanged;
   bool chartChanged;
   long eventCount;
   long eventCountCorrelated;
   string correlatedSymbol;
   bool hasCorrelatedSymbol;
   
public:
   CBaseExpert();
   ~CBaseExpert();
   
   void OnInit();
   void OnTick();
   virtual void OnTimer();
   void OnDeInit(int reason);
   
   virtual void OnTickProcessed(MqlTick &tick) = 0;
   virtual void OnSetupEA() = 0;
   virtual void OnDeinit() = 0;
   virtual void OnInitEA() = 0;
   virtual void OnBar(CCandle* candle) = 0;
   virtual void OnNewDay() = 0;
   virtual void OnInputChanged() = 0;
   virtual void OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam) = 0;
   
protected:
   void Initialize();
};

CBaseExpert::CBaseExpert()
{
   inputChanged = false;
   initialized = false;
   correlatedSymbol = "";
   hasCorrelatedSymbol = false;
   eventCount = 0;
}

CBaseExpert::~CBaseExpert()
{   
}

void CBaseExpert::OnInit()
{
   Print("CBaseExpert OnInit()");
   CProfiler::init();
   OnInitEA();  
}

void CBaseExpert::OnTick()
{
   MqlTick tick;
   
   if(SymbolInfoTick(_Symbol, tick))
   {
      if (!initialized)
      {
         Initialize();
         eventCount = CEventStore::GetInstance(_Symbol).GetLastEventId();
         if (hasCorrelatedSymbol)
            eventCountCorrelated = CEventStore::GetInstance(correlatedSymbol).GetLastEventId();         
      }
      
      CAccountManager::GetInstance().Update(tick);   
      CChartManager::GetInstance().Update(tick);       
      CTradeManager::GetInstance().Update(tick);
      CSessionManager::GetInstance().Update(tick);
      
      if(CAccountManager::GetInstance().IsNewTradingDay())
      {
         CTradeManager::GetInstance().OnNewDay(tick.time);
         CTechnicalAnalysisManager::GetInstance(_Symbol).OnNewDay();
         OnNewDay();
      }
     
      if (initialized)
      {
         if (CEventStore::GetInstance(_Symbol).GetLastEventId() > eventCount)
         {
            CTechnicalAnalysisManager::GetInstance(_Symbol).ProcessEvents();
            eventCount = CEventStore::GetInstance(_Symbol).GetLastEventId();
         }
         if (CEventStore::GetInstance(correlatedSymbol).GetLastEventId() > eventCountCorrelated)
         {
            CTechnicalAnalysisManager::GetInstance(correlatedSymbol).ProcessEvents();
            eventCountCorrelated = CEventStore::GetInstance(correlatedSymbol).GetLastEventId();
         }
      }
      
      OnTickProcessed(tick);
   }
   
   if(inputChanged)
   {      
      OnInputChanged();
      inputChanged = false;
   }
}

void CBaseExpert::OnTimer()
{
   CTradeManager::GetInstance().OnTimer();
}

void CBaseExpert::OnDeInit(int reason)
{
   Print("CBaseExpert OnDeinit()");
   if(reason == REASON_PARAMETERS)
   {   
      inputChanged = true;
   } 
   else if(reason == REASON_CHARTCHANGE)
   {
      chartChanged = true;
   } 
   else {
      CProfiler::deinit();   
   }
   OnDeinit();
}

void CBaseExpert::Initialize()
{
    CProfiler::start("CBaseExpert::Initialize");
    Print("CBaseExpert Initialize()");
    
    // Feature-Typen in Registry registrieren
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CHighLowDetector());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CImbalanceDetector());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CMarketReversalDetector());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CMarketCipherManager());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CPriceLevelManager());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CDivergenceDetector());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CTrendDetector());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CMarketStructureDetector());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CPriceActionDetector());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CSupportResistanceDetector());
    CFeatureRegistry::GetInstance().RegisterFeatureType(new CHTFReversalDetector());

    // Environment laden und konfigurieren
    CEnvironmentManager::GetInstance().LoadEnvironment("environment.txt");
    // Haupt-Symbol registrieren
    CChartManager::GetInstance().AddSymbol(_Symbol);
           
    // Konfiguration anwenden (aktiviert Features und initialisiert Timeframes)
    CEnvironmentManager::GetInstance().ApplyConfiguration();

    hasCorrelatedSymbol = CEnvironmentManager::GetInstance().HasActiveCorrelatedSymbol(_Symbol);
    correlatedSymbol = CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol);
    if (hasCorrelatedSymbol)
    {
        CChartManager::GetInstance().AddSymbol(correlatedSymbol);
    }

    Print("Init Trade Manager");
    CTradeManager::GetInstance().OnInit(); 
    Print("Init Technical Analysis Manager");
    CTechnicalAnalysisManager::GetInstance(_Symbol).OnInit();
   
    if (CEventStore::GetInstance(_Symbol).GetLastEventId() > eventCount)
    {
        CTechnicalAnalysisManager::GetInstance(_Symbol).ProcessEvents();
        eventCount = CEventStore::GetInstance(_Symbol).GetLastEventId();
    }
         
    Print("Setup EA");
    CMarketConditionManager::GetInstance().Init();
    OnSetupEA();
    
    initialized = true;
    CProfiler::end("CBaseExpert::Initialize");
}


#endif


