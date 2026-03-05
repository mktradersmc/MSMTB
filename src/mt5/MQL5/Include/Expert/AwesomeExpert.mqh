//+------------------------------------------------------------------+
//|                                               CAwesomeExpert.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef AWESOME_EXPERT_MQH
#define AWESOME_EXPERT_MQH

#include <Expert\ConfigurationManager.mqh>
#include <Expert\SessionManager.mqh>
#include <Expert\BaseExpert.mqh>
#include <Expert\BaseChart.mqh>
#include <Expert\Strategy.mqh>
#include <Expert\StrategyExecutor.mqh>
#include <Expert\EntryManager.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\TradeManager.mqh>
#include <Expert\LogManager.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Expert\AppClient.mqh>
#include <Expert\StrategyExecutionInfo.mqh>
#include <Expert\TradeLimitManager.mqh>
#include <Expert\TradePanel.mqh>
#include <Expert\TradeLogger.mqh>
#include <Expert\NewCandleEvent.mqh>
#include <Controls\Dialog.mqh>
#include <Expert\ZoneManager.mqh>
#include <Expert\ZoneTradePanel.mqh>
#include <Expert\ZoneTradePanel.mqh>
#include <Expert\TradeConverter.mqh>
#include "TimezoneUtils.mqh"

#define MAGICMA 20240721

// Input variables
input group "Entry Model"
input int max_strategy_entries = 1; // Maximale Anzahl automatischer Entries pro Strategie
input ENUM_TRADING_TIMEFRAME_TYPE trading_timeframe_type = TT_CURRENT; // Timeframe für Bot-Trading
input ENUM_TIMEFRAMES trading_timeframe = PERIOD_M5; // Trading Timeframe
input ENUM_ENTRY_TYPE entry_type = ET_Limit_Market; // Entry-Typ
input int invalidate_after_seconds = 300; /* Platzierten Trade nach x Sekunden deaktivieren */
input ENUM_BREAKEVEN_MODE be_mode = SL_to_BE_Never; /* Breakeven Modus */
input int beSL_after_seconds = 300; /* Setze SL auf Breakeven nach x Sekunden */
input double beSL_after_rr = 1; /* Setze SL auf BE bei Erreichen von RR */
input ENUM_ENTRY_LEVEL entry_level = EL_Current_Market_Price; /* Entry */
input int entry_immediate_when_stop_loss_is_less = 0; // Bei Stop Loss Größe Trade sofort ausführen 0 = inaktiv
input ENUM_STOP_LOSS_LEVEL stop_loss_level = SLL_Swing_Point; // Stop Loss
input int max_stop_loss_in_points = 0; // Maximaler Stop Loss für Entry- Kürzung, 0 = inaktiv
input ENUM_TAKE_PROFIT_TYPE take_profit_type = TP_Risk_Reward; // Take Profits
input double take_profit_rr = 5.0; /* Risk Reward für Takeprofit, bei 0 wird TP am Ende der Trading Session genommen */
input string take_profit_time = "11:00"; /* Uhrzeit für Takeprofit */
input ENUM_TIMEFRAMES take_profit_ol_timeframe = PERIOD_H1; // Take Profit Timeframe bei Opposing Liquidity
input ENUM_TIMEFRAMES stop_loss_to_be_last_candle_timeframe = PERIOD_H1; // Stop Loss to BE Timeframe Vorgängerkerze
input group "Strategy Settings"
input bool strategy_allow_parallel_steps = true; // Gleichzeitiges Auftreten von Events erlauben
input group "Zone Trading Settings"
input bool zone_trading_enabled = true; // Zone Trading aktivieren
input double zone_risk_reward_multiplier = 5.0; // Risk-Reward-Verhältnis für Zone-Trades
input group "Log Settings"
input bool ae_event_logging = false; // Event Log aktivieren
input bool ae_event_logging_correlated_pair = false; // Events Log von korreliertem Paar aktivieren
input group "Replication Settings"
input bool replication_enabled = false; // Replikation aktivieren

class CStrategyExecutor;
class CStrategyExecutor;
class CBaseExpert;
class CAwesomeCmdHandler; // Forward Declaration

class CAwesomeExpert : public CBaseExpert
{
private:
   CAppDialog AppWindow;
   CStrategyExecutor* m_executor;
   bool m_tradingActive;
   CEntrySettings* globalSettings;
   CEntryManager* entryManager;
   CConfigurationManager* m_configManager;
   CSessionManager* m_sessionManager;
   int lastProcessedEventId;
   int lastProcessedEventIdCorrelated;
   bool m_lastTradingStatus;
   CArrayObj* m_pendingEvents;
   CAppClient* m_appClient;
   CArrayObj* m_strategyExecutionInfos;
   CTradeLimitManager* m_tradeLimitManager;
   uint lastDayTickCount;
   CZoneTradePanel m_tradePanel;
   CZoneManager* m_zoneManager;
   CAwesomeCmdHandler* m_cmdHandler;
   
public:
   CAwesomeExpert();
   ~CAwesomeExpert();
   CStrategyExecutionInfo* GetExecutionInfo(const string strategyName, bool isLong);
   bool CanTakeNewEntry(const string& strategyName, bool isLong);
   void ProcessTradeEvent(CEvent* event);
   void OnSetupEA();
   void OnInitEA();
   void OnDeinit();
   void OnInputChanged();
   
   // ICommandHandler Implementation (Delegated)
   void HandleCommand(string type, CJAVal &msg);

private:
   void HandleGetSymbolsCommand(CJAVal &msg);

public:
   void UpdateSettings();
   void OnNewDay();
   void OnBar(CCandle* candle);
   void OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam);
   void UpdateStrategy();
   void OnTradingTimeframeChanged();
   void InitializeStrategies();
   void OnTickProcessed(MqlTick &tick);
   void OnTimer();
   void HandleReplication();
   void CheckAuthStatus();
   
   // Zone trading methods
   CZoneManager* GetZoneManager() const { return m_zoneManager; }
   bool IsZoneSystemEnabled() const { 
      bool enabled = zone_trading_enabled;
      bool hasManager = (m_zoneManager != NULL);
      bool result = enabled && hasManager;
      
      if(!result) {
         CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "IsZoneSystemEnabled: enabled=" + (enabled ? "true" : "false") + ", hasManager=" + (hasManager ? "true" : "false") + ", result=" + (result ? "true" : "false"));
      }
      
      return result;
   }
   void ProcessZoneCandle(const MqlRates& candle);
   void ProcessZoneCandle(CCandle* candle);
   void OnZoneTradeClose(ulong ticket, double profit, string strategyName = "");
   
   // Zone trading public methods (needed by ZoneManager)
   bool EnterZoneTrade(CTradingZone* zone, bool isLong, CCandle* candle);
   
private:
   void EnterLongTrade(CTradeSignal* signal, CStrategy* strategy);
   void EnterShortTrade(CTradeSignal* signal, CStrategy* strategy);
   void HandleMacroStrategyCompletion(CStrategy* strategy, bool isLong);
   void SafeDelete(CObject *obj);
   
   // Zone trading private methods
   bool InitializeZoneSystem();
   void DeinitializeZoneSystem();
   void ProcessZoneActivationAndTrading(CCandle* candle);
   
   // Trade Execution Helpers
   double ResolveAnchor(CJAVal &anchor);
   void HandleExecuteTradeCommand(CJAVal &msg);
};

//+------------------------------------------------------------------+
//| Proxy Command Handler Class                                      |
//+------------------------------------------------------------------+
class CAwesomeCmdHandler : public ICommandHandler
{
   CAwesomeExpert* m_parent;
public:
   CAwesomeCmdHandler(CAwesomeExpert* parent) : m_parent(parent) {}
   void HandleCommand(string type, CJAVal &msg);
};

// Implementierung der Methoden
CAwesomeExpert::CAwesomeExpert()
   : m_executor(NULL), m_tradingActive(false), lastProcessedEventId(0), 
     lastProcessedEventIdCorrelated(0), m_lastTradingStatus(false)
{
   m_executor = new CStrategyExecutor();
   globalSettings = new CEntrySettings();
   UpdateSettings();
   entryManager = new CEntryManager(globalSettings);
   m_configManager = CConfigurationManager::GetInstance();
   m_sessionManager = CSessionManager::GetInstance();
   m_tradingActive = false;   
   m_pendingEvents = new CArrayObj;   
   m_appClient = CAppClient::GetInstance();
   m_strategyExecutionInfos = new CArrayObj();
   m_tradeLimitManager = new CTradeLimitManager();
   m_tradeLimitManager = new CTradeLimitManager();
   lastDayTickCount = GetTickCount();
   m_zoneManager = NULL;
   m_cmdHandler = new CAwesomeCmdHandler(GetPointer(this));
}

CAwesomeExpert::~CAwesomeExpert()
{
   DeinitializeZoneSystem();
   SafeDelete(m_executor);
   SafeDelete(globalSettings);
   SafeDelete(entryManager);
   SafeDelete(m_strategyExecutionInfos);
   SafeDelete(m_strategyExecutionInfos);
   SafeDelete(m_tradeLimitManager);
   
   if(m_cmdHandler != NULL)
   {
      delete m_cmdHandler;
      m_cmdHandler = NULL;
   }
}

void CAwesomeExpert::OnInitEA() 
{
   if (m_tradePanel.IsInitialized() == false)
   {
      // --- APP CLIENT INIT ---
      Print("[Bot] Initializing AppClient...");
      if(m_appClient.LoadConfig("bot_properties.txt")) 
      {
         Print("[Bot] AppClient Config Loaded. Mode: ", m_appClient.GetCommunicationMode());
         
         m_appClient.SetCommandHandler(m_cmdHandler);
         
         // --- TIMEZONE DETECTION ---
         string tzSig = DetectBrokerTimezoneSignature();
         Print("[Bot] Detected Timezone Signature: ", tzSig);
         m_appClient.SetTimezoneSignature(tzSig);
         // --------------------------
         
         // FALLBACK: Force send symbols just in case LoadConfig didn't
         m_appClient.SendAvailableSymbols();
      }
      else
      {
         Print("[Bot] Failed to load AppClient config!");
      }
      // -----------------------
      
      if(!m_tradePanel.OnInit("Trade Panel", entryManager))
      {
          Print("Failed to create modular trade panel!");
      } 
      else
      {
          // Update initial values for entry price
          m_tradePanel.UpdateValues();
          m_tradePanel.Run();
          // Aktiviere Chartklicks für MQL
          ChartSetInteger(0, CHART_EVENT_MOUSE_MOVE, true); // Für Mausbewegung
      }
   }
   
   // Initialize zone system if enabled
   if(zone_trading_enabled)
   {
      InitializeZoneSystem();
      
      // Setup zone manager with trade panel
      if(m_zoneManager != NULL)
      {
         m_tradePanel.SetZoneManager(m_zoneManager);
         Print("Zone trading system initialized successfully");
      }
   }
   
   // Restore dialog visibility after symbol change
   if(m_tradePanel.IsInitialized())
   {
      m_tradePanel.RestoreDialogVisibility();
      Print("Dialog visibility restored after initialization");
   }
   
   // INPUT: Polling Interval (Default 30ms)
   // Note: define inputs at top of file usually, but for patch we use hardcoded or global if exists.
   // Let's assume input exists or we hardcode 20ms for high performance.
   EventSetMillisecondTimer(20); 
   Print("Timer execution frequency set to 20ms");
}





void CAwesomeExpert::OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam)
{
   // Handle chart change event (symbol/timeframe change)
   if(id == CHARTEVENT_CHART_CHANGE && m_tradePanel.IsInitialized())
   {
      Print("Chart change detected - maximizing dialog window");
      m_tradePanel.maximizeWindow();
   }
   
   // General visibility check for other chart events
   if(m_tradePanel.IsInitialized() && !m_tradePanel.IsVisible())
   {
      Print("Dialog not visible during chart event (", id, "), restoring visibility");
      m_tradePanel.RestoreDialogVisibility();
   }
   
   // Handle zone-specific chart events first
   if(IsZoneSystemEnabled())
   {
      // Handle zone creation clicks
      if(id == CHARTEVENT_CLICK)
      {
         if(m_zoneManager.HandleChartClick((int)lparam, (int)dparam))
         {
            return; // Zone manager handled the event
         }
      }
      
      // Handle object deletion (zone rectangles)
      if(id == CHARTEVENT_OBJECT_DELETE)
      {
         m_zoneManager.HandleChartObjectDelete(sparam);
      }
   }
   
   // Chart-Events ans Trade Panel weiterleiten
   if(m_tradePanel.IsInitialized())
   {
       m_tradePanel.OnChartEvent(id, lparam, dparam, sparam);
   }
}

CStrategyExecutionInfo* CAwesomeExpert::GetExecutionInfo(const string strategyName, bool isLong)
{
    for(int i = 0; i < m_strategyExecutionInfos.Total(); i++)
    {
        CStrategyExecutionInfo* info = m_strategyExecutionInfos.At(i);
        if(info.Matches(strategyName, isLong))
            return info;
    }
    
    CLogManager::GetInstance().LogMessage("CAwesomeExpert::GetExecutionInfo", LL_DEBUG, 
        StringFormat("Erstelle neue Strategy Execution Info für %s (%s)", 
        strategyName, isLong ? "Long" : "Short"));
        
    CStrategyExecutionInfo* newInfo = new CStrategyExecutionInfo(
        strategyName, 
        isLong,
        trade_limit_mode == TL_UNLIMITED ? INT_MAX : max_trades_per_strategy
    );
    m_strategyExecutionInfos.Add(newInfo);
    
    return newInfo;
}

bool CAwesomeExpert::CanTakeNewEntry(const string& strategyName, bool isLong)
{
    string direction = "";
    if(trade_limit_mode == TL_PER_DIRECTION)
       direction = (isLong?" Long":" Short");
    Print("CanTakeNewEntry? "+strategyName+direction);
    
    if(!m_tradeLimitManager.CanTakeNewTrade())
    {
        Print("No from TradeLimitManager");
        return false;
    }
    
    CStrategyExecutionInfo* info = GetExecutionInfo(strategyName, isLong);
    if (info.CanTakeNewEntry() == false)
    {
        Print("No from StrategyInfo");
        return false;
    }
    return true;
}

void CAwesomeExpert::ProcessTradeEvent(CEvent* event)
{
    CTradeEvent* tradeEvent = dynamic_cast<CTradeEvent*>(event);
    if(tradeEvent == NULL) return;
        
    CTradeInfo* trade = tradeEvent.GetTrade();
    if(trade == NULL) return;
    
    string strategyName = trade.strategyName;
    CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG, 
        "Check Event " + tradeEvent.toString() + " for Strategy " + strategyName);

    // Check if this is a zone trade first - handle it separately since zones don't have strategy objects
    if(StringFind(strategyName, "Zone_") == 0)
    {
        switch(event.getEventType())
        {
            case EV_TRADE_TAKEPROFIT_HIT:
                OnZoneTradeClose(trade.ticket, trade.profit, strategyName);
                Print("Zone trade closed with profit: ", strategyName, " Profit: ", trade.profit);
                break;
                
            case EV_TRADE_STOPLOSS_HIT:
                OnZoneTradeClose(trade.ticket, trade.profit, strategyName);
                Print("Zone trade closed with loss: ", strategyName, " Profit: ", trade.profit);
                break;
                
            case EV_TRADE_PARTIAL_CLOSE:
                OnZoneTradeClose(trade.ticket, trade.profit, strategyName);
                Print("Zone trade closed manually/by expert: ", strategyName, " Profit: ", trade.profit);
                break;
        }
        return; // Zone trades don't need further strategy processing
    }

    CStrategy* strategy = NULL;
    for(int i = 0; i < m_executor.GetStrategiesCount(); i++)
    {
        CStrategy* currentStrategy = m_executor.GetStrategyByIndex(i);
        if(currentStrategy.Name == strategyName)
        {
            strategy = currentStrategy;
            break;
        }
    }
    
    if(strategy == NULL)
    {
        CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG,
            "Strategy not found: " + strategyName);
        return;
    }

    CStrategyExecutionInfo* info = GetExecutionInfo(strategyName, trade.IsLong());

    switch(event.getEventType())
    {
        case EV_TRADE_TAKEPROFIT_HIT:
            m_tradeLimitManager.OnTradeClose(trade.profit);
            info.SetWinningTrade();
            CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_INFO,
                 "Winning trade for strategy " + strategyName + ". No more trades for today.");
            
            if(info.CanReenter())
            {            
                if(trade.IsLong())
                {
                    CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG,
                        "Reset Long Execution for " + strategyName);
                    strategy.ResetLongExecution();
                }
                else
                {
                    CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG,
                        "Reset Short Execution for " + strategyName);
                    strategy.ResetShortExecution();
                }
                info.IncrementReentries();
            }
            break;
            
        case EV_TRADE_STOPLOSS_HIT:
            CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG,
                "Check Reentry for " + strategyName);

            if(info.CanReenter())
            {            
                if(trade.IsLong())
                {
                    CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG,
                        "Reset long entry for " + strategyName);
                    strategy.ResetLongEntry();
                }
                else
                {
                    CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG,
                        "Reset short entry for " + strategyName);
                    strategy.ResetShortEntry();
                }
                info.IncrementReentries();
            }
            else 
            {
                CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG,
                    "No Reentry possible for " + strategyName);
                    
                if(trade.IsLong())
                    strategy.ResetLongExecution();
                else
                    strategy.ResetShortExecution();
            }

            m_tradeLimitManager.OnTradeClose(trade.profit);
            break;
            
        default:
            CLogManager::GetInstance().LogMessage("CAwesomeExpert::ProcessTradeEvent", LL_DEBUG, 
                "Unknown event type ignored");
            break;
    }
}

void CAwesomeExpert::OnSetupEA()
{
   Print("CAwesomeExpert::OnSetupEA");
   
   lastProcessedEventId = CEventStore::GetInstance(_Symbol).GetLastEventId();
   lastProcessedEventIdCorrelated = CEventStore::GetInstance(CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol)).GetLastEventId();

   Print("Trading History initialized");
   CLogManager::GetInstance().LoadConfiguration("log_levels.txt");
   UpdateStrategy();
   
   Print("CAwesomeExpert setup completed. Zone trading: ", 
         zone_trading_enabled ? "Enabled" : "Disabled");
}   

void CAwesomeExpert::OnDeinit()
{
/*
   if(m_tradePanel.IsInitialized())
   {
       m_tradePanel.Destroy(0);
   }
*/
}

void CAwesomeExpert::OnInputChanged()
{
   Print("CHapticBot::OnInputChanged()");
   UpdateStrategy();
   UpdateSettings();
}

void CAwesomeExpert::UpdateSettings()
{
   globalSettings.entryType = entry_type;
   globalSettings.entryLevel = entry_level;
   globalSettings.entryImmediateWhenStopLossIsLess = entry_immediate_when_stop_loss_is_less;
   globalSettings.stopLossLevel = stop_loss_level;
   globalSettings.maxStopLossInPoints = max_stop_loss_in_points;
   globalSettings.invalidateAfterSeconds = invalidate_after_seconds;
   globalSettings.takeProfitType = take_profit_type;
   globalSettings.takeProfitRR = take_profit_rr;
   globalSettings.takeProfitTime = take_profit_time;
   globalSettings.takeProfitTimeframe = int(take_profit_ol_timeframe);
   globalSettings.timeframe = trading_timeframe;
   globalSettings.breakEvenMode = be_mode;
   globalSettings.breakEvenAfterRR = beSL_after_rr;
   
   // Update zone trading settings
   if(m_zoneManager != NULL)
   {
      // Zone manager settings could be updated here if needed
   } 
}

void CAwesomeExpert::OnNewDay()
{
   uint tickCount = GetTickCount();
   Print("New Trading Day "+CHelper::TimeToDayString(TimeCurrent())+". Time passed since last day "+(tickCount-lastDayTickCount)+" ms");
   lastDayTickCount = tickCount;
   
   if(m_tradeLimitManager != NULL)
      m_tradeLimitManager.Reset();
      
   for(int i = 0; i < m_strategyExecutionInfos.Total(); i++)
   {
      CStrategyExecutionInfo* info = m_strategyExecutionInfos.At(i);
      if(info != NULL)
         info.Reset();
   }
   
   m_executor.ResetExecution();
}

void CAwesomeExpert::OnBar(CCandle* candle)
{
   // Process zone candle if system is enabled
   if(IsZoneSystemEnabled() && candle != NULL)
   {
      ProcessZoneCandle(candle);
   }
}

void CAwesomeExpert::UpdateStrategy()
{
   Print("Initialize Strategies");
   InitializeStrategies();
   Print("Set Session Definition");
   m_sessionManager.SetSessionDefinitions(m_configManager.GetSessionDefinitions());
}

void CAwesomeExpert::OnTradingTimeframeChanged()
{
   UpdateStrategy();
}

void CAwesomeExpert::InitializeStrategies()
{
    CArrayObj* strategies = CConfigurationManager::GetInstance().GetStrategies();
    
    for(int i = 0; i < strategies.Total(); i++)
    {
       CStrategy* strategy = strategies.At(i);
          
       m_executor.AddStrategy(strategy);
       Print("Strategy added to executor: ", strategy.Name);
    }
}

void CAwesomeExpert::EnterLongTrade(CTradeSignal* signal, CStrategy* strategy)
{
    CCandle* candle = CChartManager::GetInstance().GetChart(_Symbol, trading_timeframe).getCandleAt(0);
    if(signal != NULL && signal.IsValid())
    {
        entryManager.EnterLong(candle, 
            signal.GetEntryPrice(), 
            signal.GetStopLoss(), 
            signal.GetTakeProfit(), 
            signal.GetCloseEventType(),
            strategy.Name);
    }
    else
    {
        entryManager.EnterLong(candle, 0, 0, 0, EV_EMPTY, strategy.Name);
    }
}

void CAwesomeExpert::EnterShortTrade(CTradeSignal* signal, CStrategy* strategy)
{
    CCandle* candle = CChartManager::GetInstance().GetChart(_Symbol, trading_timeframe).getCandleAt(0);
    if(signal != NULL && signal.IsValid())
    {
        entryManager.EnterShort(candle, 
            signal.GetEntryPrice(), 
            signal.GetStopLoss(), 
            signal.GetTakeProfit(), 
            signal.GetCloseEventType(),
            strategy.Name);
    }
    else
    {
        entryManager.EnterShort(candle, 0, 0, 0, EV_EMPTY, strategy.Name);
    }
}

void CAwesomeExpert::OnTickProcessed(MqlTick &tick)
{
   // --- APP CLIENT TICK HANDLING ---
   // 1. Poll for commands (e.g. Subscribe Ticks)
   m_appClient.ProcessMessages();
   
   // 2. Stream Data if subscribed
   // MOVED TO DatafeedExpert: m_appClient.CheckTicks();
   // --------------------------------

   // Wenn das Trade Panel im SL oder TP Selektionsmodus ist, 
   // stellen wir sicher, dass Chart-Events aktiviert sind
   static int lastSelectionMode = -1;
   
   if(m_tradePanel.IsInitialized())
   {
       int currentMode = m_tradePanel.GetSelectionMode();
       if(currentMode != lastSelectionMode)
       {
           lastSelectionMode = currentMode;
       }
       m_tradePanel.OnTick();
       
       // Periodically check and restore dialog visibility (every 100 ticks)
       static int tickCounter = 0;
       tickCounter++;
       if(tickCounter >= 100)
       {
           tickCounter = 0;
           if(!m_tradePanel.IsVisible())
           {
               Print("Dialog was minimized/hidden, restoring visibility");
               m_tradePanel.RestoreDialogVisibility();
           }
       }
   }
   
   if(replication_enabled)
      HandleReplication();

   m_tradingActive = CSessionManager::GetInstance().IsTradingActive();
   
   CEvent* newEvents[];
   int count = CEventStore::GetInstance(CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol)).GetNewEvents(lastProcessedEventIdCorrelated, newEvents);
   for(int i = 0; i < count; i++)
   {
      CEvent* event = newEvents[i];                         
      if (ae_event_logging_correlated_pair)
         CLogManager::GetInstance().LogEvent(event);
   }
   lastProcessedEventIdCorrelated = CEventStore::GetInstance(CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol)).GetLastEventId();
   
   count = CEventStore::GetInstance(_Symbol).GetNewEvents(lastProcessedEventId, newEvents);
         
   for(int i = 0; i < count; i++)
   {
      CEvent* event = newEvents[i];                         
      
      if (ae_event_logging)
         CLogManager::GetInstance().LogEvent(event);
      
      // Process zone events for new candles
      // Debug: Show all events
      if(event.getEventType() == EV_NEW_CANDLE)
      {         
         if(IsZoneSystemEnabled())
         {
            CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Zone system enabled, processing candle event");
            CNewCandleEvent* candleEvent = dynamic_cast<CNewCandleEvent*>(event);
            if(candleEvent != NULL)
            {
               CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Valid candle event, calling ProcessZoneCandle");
               ProcessZoneCandle(candleEvent.getCandle());
            }
            else
            {
               CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Invalid candle event - casting failed");
            }
         }
         else
         {
            CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Zone system disabled - enabled: " + (zone_trading_enabled ? "true" : "false") + ", manager: " + (m_zoneManager != NULL ? "OK" : "NULL"));
         }
      }

      ProcessTradeEvent(event);
         
      if(m_tradingActive)
      {
         m_pendingEvents.Add(event); 
      }         
   }
   
   lastProcessedEventId = CEventStore::GetInstance(_Symbol).GetLastEventId();

   if(m_tradingActive && m_pendingEvents.Total() > 0)
   {
      if(m_executor.ProcessEvents(m_pendingEvents))
      {
         for(int strategyIndex = 0; strategyIndex < m_executor.GetStrategiesCount(); strategyIndex++)
         {
            CStrategy* strategy = m_executor.GetStrategyByIndex(strategyIndex);

            if(strategy.IsLongCompleted())
            {
               CTradeSignal* signal = m_executor.GenerateTradeSignal(strategy);
               if(!strategy.IsSignal && !CanTakeNewEntry(strategy.Name, true))
                  continue;

               if(strategy.IsMacroStrategy())
               {
                  HandleMacroStrategyCompletion(strategy, true);
                  EnterLongTrade(NULL, strategy);
                  strategy.ResetLongExecution();  // Macro-Strategien immer zurücksetzen
               }
               else
               {
                  if (strategy.IsSignal)
                  {                    
                     string desc;
                     
                     CArrayObj* events = strategy.GetLongEvents();
                     CEvent* last;
                     for (int i=0; i<events.Total();i++) {
                        last = (CEvent*)events.At(i);
                        desc += "Schritt "+(i+1)+"\n";
                        desc += last.GetDetails();
                     }

                     if (last == NULL)
                     {
                        Print("Ungültiges Signal. Letztes Event nicht ermittelbar");
                        strategy.ResetLongExecution();
                        return;
                     }

                     datetime time = CChartManager::GetInstance().GetChart(_Symbol,last.GetOriginTimeframe()).getCandleAt(0).openTime;
                     m_appClient.SendNewTradeSignal(strategy.Name,"Long",desc, time);
                     strategy.ResetLongExecution();  // Signale immer zurücksetzen
                  } 
                  else
                  {                                      
                     EnterLongTrade(signal, strategy);
                     CStrategyExecutionInfo* info = GetExecutionInfo(strategy.Name, true);
                     if(info != NULL) 
                     {
                         info.IncrementEntries();
                         // Nur zurücksetzen wenn keine Reentries mehr möglich sind
                         if(!info.CanReenter())
                         {
                             strategy.ResetLongExecution();
                         }
                     }                                       
                  }
               }
            }
            
            if(strategy.IsShortCompleted())
            {
               CTradeSignal* signal = m_executor.GenerateTradeSignal(strategy);
               if(!strategy.IsSignal && !CanTakeNewEntry(strategy.Name, false))
                  continue;

               if(strategy.IsMacroStrategy())
               {
                  HandleMacroStrategyCompletion(strategy, false);
                  EnterShortTrade(NULL, strategy);
                  strategy.ResetShortExecution();  // Macro-Strategien immer zurücksetzen
               }
               else
               {
                  if (strategy.IsSignal)
                  {
                     string desc;
                     
                     CArrayObj* events = strategy.GetShortEvents();
                     CEvent* last;
                     for (int i=0; i<events.Total();i++) {
                        last = (CEvent*)events.At(i);
                        desc += "Schritt "+(i+1)+"\n";
                        desc += last.GetDetails();
                     }

                     if (last == NULL)
                     {
                        Print("Ungültiges Signal. Letztes Event nicht ermittelbar");
                        strategy.ResetShortExecution();
                        return;
                     }

                     datetime time = CChartManager::GetInstance().GetChart(_Symbol,last.GetOriginTimeframe()).getCandleAt(0).openTime;
                     m_appClient.SendNewTradeSignal(strategy.Name,"Short",desc,time);
                     strategy.ResetShortExecution();  // Signale immer zurücksetzen
                  } 
                  else
                  {                     
                     EnterShortTrade(signal, strategy);
                     CStrategyExecutionInfo* info = GetExecutionInfo(strategy.Name, false);
                     if(info != NULL) 
                     {
                         info.IncrementEntries();
                         // Nur zurücksetzen wenn keine Reentries mehr möglich sind
                         if(!info.CanReenter())
                         {
                             strategy.ResetShortExecution();
                         }
                     }                                                           
                  }
               }
            }
         }
      }
      
      // Leere die Liste der ausstehenden Events
      while (m_pendingEvents.Total()>0)
         m_pendingEvents.Detach(0);
   }         
}

void CAwesomeExpert::HandleMacroStrategyCompletion(CStrategy* strategy, bool isLong)
{
    Print("Macro strategy completed: ", strategy.Name, " Direction: ", isLong ? "Long" : "Short");
}

void CAwesomeExpert::SafeDelete(CObject *obj)
{
    if(CheckPointer(obj) == POINTER_DYNAMIC)
    {
        delete obj;
        obj = NULL;
    }
}

//+------------------------------------------------------------------+
//| Initialize zone trading system                                  |
//+------------------------------------------------------------------+
bool CAwesomeExpert::InitializeZoneSystem()
{
    if(m_zoneManager != NULL)
    {
        Print("Zone system already initialized");
        return true;
    }
    
    // Create zone manager
    m_zoneManager = new CZoneManager();
    if(m_zoneManager == NULL)
    {
        Print("Error: Failed to create ZoneManager");
        return false;
    }
    
    // Initialize zone manager with entry manager and expert reference
    if(!m_zoneManager.Initialize(entryManager, GetPointer(this)))
    {
        Print("Error: Failed to initialize ZoneManager");
        delete m_zoneManager;
        m_zoneManager = NULL;
        return false;
    }
    
    Print("Zone trading system initialized successfully");
    return true;
}

//+------------------------------------------------------------------+
//| Deinitialize zone trading system                                |
//+------------------------------------------------------------------+
void CAwesomeExpert::DeinitializeZoneSystem()
{
    if(m_zoneManager != NULL)
    {
        m_zoneManager.Deinitialize();
        delete m_zoneManager;
        m_zoneManager = NULL;
    }
}



//+------------------------------------------------------------------+
//| Process zone candle from CCandle object                         |
//+------------------------------------------------------------------+
void CAwesomeExpert::ProcessZoneCandle(CCandle* candle)
{
    if(candle != NULL)
    {
        CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "ProcessZoneCandle(CCandle*) called - Event candle Time: " + TimeToString(candle.openTime, TIME_DATE|TIME_SECONDS) + 
              " TF: " + EnumToString((ENUM_TIMEFRAMES)candle.timeframe) +
              " OHLC: " + DoubleToString(candle.open, _Digits) + "/" + DoubleToString(candle.high, _Digits) + "/" + DoubleToString(candle.low, _Digits) + "/" + DoubleToString(candle.close, _Digits));
    }
    else
    {
        CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "ProcessZoneCandle(CCandle*) called with NULL candle");
    }
    
    if(m_zoneManager != NULL)
    {
        // Ensure ChartManager has our symbol
        CChartManager::GetInstance().AddSymbol(_Symbol);
        
        ENUM_TIMEFRAMES zoneTradingTimeframe = m_zoneManager.GetZoneTradingTimeframe();
        CCandle* zoneTradingCandle = NULL;
        
        // Check if the event candle is already from the zone trading timeframe
        if(candle != NULL && candle.timeframe == zoneTradingTimeframe)
        {
            CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Event candle is already from zone trading timeframe (" + EnumToString(zoneTradingTimeframe) + "), using it directly");
            zoneTradingCandle = candle;
        }
        else
        {
            if (candle != NULL)
            {
               CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Event candle timeframe (" + EnumToString((ENUM_TIMEFRAMES)candle.timeframe) + 
                     ") != zone trading timeframe (" + EnumToString(zoneTradingTimeframe) + "), fetching correct candle");
            }
            CBaseChart* chart = CChartManager::GetInstance().GetChart(_Symbol, zoneTradingTimeframe);
            if (chart != NULL)
            {
               zoneTradingCandle = chart.getCandleAt(0);
            }
            else
            {
               CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Chart for " + _Symbol + " / " + EnumToString(zoneTradingTimeframe) + " not found in CChartManager");
            }
        }
        
        if(zoneTradingCandle != NULL)
        {
            CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Using zone trading candle - Time: " + 
                  TimeToString(zoneTradingCandle.openTime, TIME_DATE|TIME_SECONDS) + 
                  " TF: " + EnumToString((ENUM_TIMEFRAMES)zoneTradingCandle.timeframe) +
                  " OHLC: " + DoubleToString(zoneTradingCandle.open, _Digits) + "/" + DoubleToString(zoneTradingCandle.high, _Digits) + "/" + DoubleToString(zoneTradingCandle.low, _Digits) + "/" + DoubleToString(zoneTradingCandle.close, _Digits));
            m_zoneManager.ProcessNewCandle(zoneTradingCandle);
        }
        else
        {
            CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "Zone trading timeframe candle is NULL, cannot process zones");
        }
    }
    else
    {
        CLogManager::GetInstance().LogMessage("CAwesomeExpert", LL_DEBUG, "ZoneManager is NULL, cannot process candle");
    }
}

//+------------------------------------------------------------------+
//| Process zone activation and trade triggering                    |
//+------------------------------------------------------------------+
void CAwesomeExpert::ProcessZoneActivationAndTrading(CCandle* candle)
{
    if(m_zoneManager == NULL) return;
    
    // Get all zones from zone manager
    CArrayObj* zones = m_zoneManager.GetAllZones();
    if(zones == NULL) return;
    
    for(int i = 0; i < zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(zones.At(i));
        if(zone == NULL) continue;
        
        // Check if zone is active and price is in zone range
        if(zone.GetStatus() == ZONE_ACTIVE)
        {
            // Simple zone check: is current candle's close price within zone bounds?
            double zoneUpper = zone.GetUpperPrice();
            double zoneLower = zone.GetLowerPrice();
            
            bool candleInZone = (candle.close >= zoneLower && candle.close <= zoneUpper) ||
                               (candle.high >= zoneLower && candle.low <= zoneUpper);
            
            if(candleInZone)
            {
                // Check if zone already has an active trade
                if(zone.HasActiveTrade())
                {
                    if(ae_event_logging)
                        Print("Zone ", zone.GetName(), " already has active trade, skipping");
                    continue;
                }
                
                // Determine trade direction based on zone type
                bool isLong = (zone.GetZoneType() == ZONE_LONG);
                bool isShort = (zone.GetZoneType() == ZONE_SHORT);
                
                if(isLong || isShort)
                {
                    // Create zone trade using existing entry manager
                    string strategyName = "Zone_" + zone.GetName();
                    
                    // Simple SL calculation: opposite end of zone
                    double stopLoss = isLong ? zoneLower : zoneUpper;
                    double entryPrice = candle.close;
                    double riskDistance = MathAbs(entryPrice - stopLoss);
                    double takeProfit = isLong ? 
                        entryPrice + (riskDistance * zone_risk_reward_multiplier) :
                        entryPrice - (riskDistance * zone_risk_reward_multiplier);
                    
                    if(ae_event_logging)
                        Print("Zone trade triggered: ", zone.GetName(), 
                              " Type: ", isLong ? "Long" : "Short",
                              " Entry: ", entryPrice, 
                              " SL: ", stopLoss, 
                              " TP: ", takeProfit);
                    
                    // Use existing EntryManager
                    if(isLong)
                    {
                        entryManager.EnterLong(candle, entryPrice, stopLoss, takeProfit, EV_EMPTY, strategyName);
                    }
                    else
                    {
                        entryManager.EnterShort(candle, entryPrice, stopLoss, takeProfit, EV_EMPTY, strategyName);
                    }
                    
                    // Mark zone as triggered
                    zone.SetStatus(ZONE_TRIGGERED);
                    if(ae_event_logging)
                        Print("Zone trade executed successfully for ", zone.GetName());
                }
            }
            else if(ae_event_logging)
            {
                Print("Processing zone: ", zone.GetName(), " - Price not in zone range");
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Handle zone trade closure                                        |
//+------------------------------------------------------------------+
void CAwesomeExpert::OnZoneTradeClose(ulong ticket, double profit, string strategyName = "")
{
    if(m_zoneManager != NULL)
    {
        m_zoneManager.OnTradeClose(ticket, profit, strategyName);
    }
}

//+------------------------------------------------------------------+
//| Enter zone trade using existing framework                       |
//+------------------------------------------------------------------+
bool CAwesomeExpert::EnterZoneTrade(CTradingZone* zone, bool isLong, CCandle* candle)
{
    if(zone == NULL || entryManager == NULL || candle == NULL)
        return false;
        
    // Calculate stop loss using zone's method with trading timeframe from zone manager
    ENUM_TIMEFRAMES tradingTimeframe = (m_zoneManager != NULL) ? m_zoneManager.GetZoneTradingTimeframe() : PERIOD_M1;
    double stopLoss = zone.CalculateStopLoss(candle, tradingTimeframe);
    double entryPrice = 0.0;  // Market order
    double takeProfit = 0.0;  // Let framework calculate TP automatically based on zone_risk_reward_multiplier
    
    string strategyName = "Zone_" + zone.GetName();  // Use "Zone_" prefix for trade limit integration
    
    Print("Executing zone trade: ", zone.GetName(), 
          " Type: ", isLong ? "Long" : "Short",
          " Entry: Market Order (0.0)", 
          " SL: ", stopLoss, 
          " TP: Auto-calculated using RR=", zone_risk_reward_multiplier,
          " Strategy: ", strategyName);
    
    // Check if we can take new entry for this zone strategy
    if(!CanTakeNewEntry(strategyName, isLong))
    {
        Print("Trade blocked by trade limits for strategy: ", strategyName, " Direction: ", isLong ? "Long" : "Short");
        
        // Deactivate zone when trade is blocked due to existing active trade
        zone.SetStatus(ZONE_INACTIVE);
        Print("Zone ", zone.GetName(), " deactivated due to existing trade conflict - will require new zone touch to reactivate");
        return false;
    }
    
    // Use the existing EntryManager to place the trade with auto-calculated TP
    if(isLong)
    {
        entryManager.EnterLong(candle, entryPrice, stopLoss, takeProfit, EV_EMPTY, strategyName);
    }
    else
    {
        entryManager.EnterShort(candle, entryPrice, stopLoss, takeProfit, EV_EMPTY, strategyName);
    }
    
    // Mark zone as having active trade - we'll get the real ticket from the trade system
    // For now, just mark it as having a trade (ticket will be matched by strategy name)
    zone.OnTradeExecuted(0);  // Use 0 to indicate "active but ticket unknown"
    Print("Zone trade executed successfully for ", zone.GetName(), " - Zone now blocked until trade closes");
    
    return true;
}

void CAwesomeExpert::OnTimer()
{
    CBaseExpert::OnTimer();
    CheckAuthStatus();
    if(replication_enabled)
        HandleReplication();
    
    // Process incoming commands
    CAppClient::GetInstance().ProcessMessages();
    
    // Stream ticks for live charts
    // REMOVED: Datafeed separation
}

void CAwesomeExpert::HandleReplication()
{
    if(!replication_enabled) return;
    
    CJAVal messages;
    int count = CAppClient::GetInstance().GetMessages(messages);
    
    if(count > 0)
    {
        for(int i = 0; i < count; i++)
        {
            CJAVal *msgPtr = messages[i];
            if(msgPtr == NULL) continue;
            CJAVal msg = *msgPtr;
            
            string type = msg["type"].ToStr();
            if(type == "ReplicateTrade")
            {
                CJAVal *contentPtr = msg.HasKey("content");
                if(contentPtr != NULL)
                {
                    CJAVal content = *contentPtr;
                    string normalizedSymbol = msg["symbol"].ToStr();
                    string brokerSymbol = CEnvironmentManager::GetInstance().GetBrokerSymbol(normalizedSymbol);
                    
                    if(brokerSymbol == "" || brokerSymbol == NULL)
                    {
                        Print("Error: Could not map symbol ", normalizedSymbol, " to broker symbol.");
                        continue;
                    }
                    
                    string direction = content["direction"].ToStr();
                    string orderTypeString = content["orderType"].ToStr();
                    double riskPercent = content["risk_percent"].ToDbl();
                    string strategy = content["strategy"].ToStr();
                    
                    CJAVal *levelsPtr = content.HasKey("levels");
                    if(levelsPtr == NULL) continue;
                    CJAVal levels = *levelsPtr;
                    
                    CJAVal *entryLvlPtr = levels.HasKey("entry");
                    CJAVal *slLvlPtr = levels.HasKey("sl");
                    CJAVal *tpLvlPtr = levels.HasKey("tp");
                    
                    if(entryLvlPtr == NULL || slLvlPtr == NULL || tpLvlPtr == NULL) continue;
                    
                    CJAVal entryLvl = *entryLvlPtr;
                    CJAVal slLvl = *slLvlPtr;
                    CJAVal tpLvl = *tpLvlPtr;
                    
                    double entryPrice = 0;
                    double slPrice = 0;
                    double tpPrice = 0;
                    double rrValue = 0;
                    
                    // Entry
                    if(entryLvl["type"].ToStr() == "MARKET") entryPrice = 0;
                    else entryPrice = CTradeConverter::LogicalToPrice(brokerSymbol, (ENUM_TIMEFRAMES)entryLvl["tf"].ToInt(), (datetime)entryLvl["time"].ToInt(), (int)entryLvl["idx"].ToInt(), direction, "ENTRY");
                    
                    // SL
                    if(slLvl["type"].ToStr() == "DYNAMIC_RR") { rrValue = slLvl["value"].ToDbl(); slPrice = 0; }
                    else slPrice = CTradeConverter::LogicalToPrice(brokerSymbol, (ENUM_TIMEFRAMES)slLvl["tf"].ToInt(), (datetime)slLvl["time"].ToInt(), (int)slLvl["idx"].ToInt(), direction, "SL");
                    
                    // TP
                    if(tpLvl["type"].ToStr() == "DYNAMIC_RR") { rrValue = tpLvl["value"].ToDbl(); tpPrice = 0; }
                    else tpPrice = CTradeConverter::LogicalToPrice(brokerSymbol, (ENUM_TIMEFRAMES)tpLvl["tf"].ToInt(), (datetime)tpLvl["time"].ToInt(), (int)tpLvl["idx"].ToInt(), direction, "TP");
                    
                    if((entryPrice <= 0 && orderTypeString != "MARKET") || (slPrice <= 0 && rrValue <= 0))
                    {
                        Print("Error: Could not calculate prices for replicated trade on ", brokerSymbol);
                        continue;
                    }

                    CEntry* entry = new CEntry();
                    entry.m_symbol = brokerSymbol;
                    entry.direction = (direction == "BUY") ? 1 : -1;
                    entry.entryPrice = entryPrice;
                    entry.stopLossPrice = slPrice;
                    entry.takeProfitPrice = tpPrice;
                    entry.riskRewardTarget = rrValue;
                    entry.customRiskPercentage = riskPercent;
                    entry.strategyName = strategy;
                    entry.type = (orderTypeString == "MARKET") ? ET_Limit_Market : ET_Explicit_Limit;

                    Print("Executing replicated trade in AwesomeBot: ", brokerSymbol, " Strategy: ", strategy);
                    CTradeManager::GetInstance().ManageTrade(entry);
                }
            }
        }
    }
}


//+------------------------------------------------------------------+
//| Check Authentication Status                                     |
//+------------------------------------------------------------------+
void CAwesomeExpert::CheckAuthStatus()
{
   static bool authFailedSent = false;
   
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   
   if(login == 0)
   {
      if(!authFailedSent) 
      {
         CJAVal content;
         content["status"] = "AUTH_FAILED";
         content["reason"] = "Account Login is 0 (Invalid or Not Connected)";
         if(CAppClient::GetInstance().SendMessage("STATUS_AUTH_FAILED", content))
         {
            authFailedSent = true;
            Print("Auth Check: STATUS_AUTH_FAILED sent to Hub");
         }
      }
   }
   else
   {
      authFailedSent = false; // Reset flag if login recovers
   }
}

#endif // AWESOME_EXPERT_MQH



//+------------------------------------------------------------------+
//| ICommandHandler Implementation                                  |
//+------------------------------------------------------------------+
void CAwesomeExpert::HandleCommand(string type, CJAVal &msg)
{
    if(type == "CMD_GET_SYMBOLS")
    {
        HandleGetSymbolsCommand(msg);
    }
    else if(type == "EXECUTE_TRADE")
    {
        HandleExecuteTradeCommand(msg);
    }
}

void CAwesomeExpert::HandleGetSymbolsCommand(CJAVal &msg)
{
   CJAVal symbolsVal;
   int total = SymbolsTotal(false);
   
   Print("Fetching all broker symbols... Total: ", total);
   
   for(int i=0; i<total; i++)
   {
       string name = SymbolName(i, false); 
       
       CJAVal symObj;
       symObj["name"] = name;
       symObj["path"] = SymbolInfoString(name, SYMBOL_PATH);
       symObj["desc"] = SymbolInfoString(name, SYMBOL_DESCRIPTION);
       
       symbolsVal.Add(symObj);
   }
   
   if (m_appClient.SendMessage("BROKER_SYMBOLS_LIST", symbolsVal))
       Print("Sent BROKER_SYMBOLS_LIST with ", total, " symbols.");
}

//+------------------------------------------------------------------+
//| Resolve Anchor to Price                                         |
//+------------------------------------------------------------------+
double CAwesomeExpert::ResolveAnchor(CJAVal &anchor)
{
   string tfStr = anchor["timeframe"].ToStr();
   ENUM_TIMEFRAMES tf = PERIOD_CURRENT;
   
   // Parse TF string manually or helper
   if(tfStr == "M1") tf = PERIOD_M1;
   else if(tfStr == "M5") tf = PERIOD_M5;
   else if(tfStr == "M15") tf = PERIOD_M15;
   else if(tfStr == "M30") tf = PERIOD_M30;
   else if(tfStr == "H1") tf = PERIOD_H1;
   else if(tfStr == "H4") tf = PERIOD_H4;
   else if(tfStr == "D1") tf = PERIOD_D1;
   // Add others as needed
   
   datetime time = (datetime)anchor["time"].ToInt();
   
   // FIX: Frontend sends 'type' (HIGH, LOW...), logic previously expected 'ohlc'
   string type = anchor["type"].ToStr();
   string ohlc = type; // Compatibility mapping
   StringToLower(ohlc); // Convert to lowercase for comparison logic below if needed, or just normalize
   
   double fallback = anchor["value"].ToDbl(); // Frontend might send 'price' or 'value'? Check JSON.
   if (fallback == 0.0) fallback = anchor["price"].ToDbl();
   
   // Find bar
   int shift = iBarShift(_Symbol, tf, time, true);
   
   if(shift < 0)
   {
       Print("ResolveAnchor: Time match failed for ", TimeToString(time), ". Using fallback: ", fallback);
       return fallback;
   }
   
   double price = 0.0;
   if(ohlc == "high") price = iHigh(_Symbol, tf, shift);
   else if(ohlc == "low") price = iLow(_Symbol, tf, shift);
   else if(ohlc == "open") price = iOpen(_Symbol, tf, shift);
   else if(ohlc == "close") price = iClose(_Symbol, tf, shift);
   else price = fallback; 
   
   Print("ResolveAnchor: ", tfStr, " ", TimeToString(time), " [", type, "] -> Shift: ", shift, " Price: ", price);
   return price;
}

//+------------------------------------------------------------------+
//| Handle Execute Trade Command                                    |
//+------------------------------------------------------------------+
void CAwesomeExpert::HandleExecuteTradeCommand(CJAVal &msg)
{
    CJAVal* contentPtr = msg["content"];
    if(contentPtr == NULL) return;
    CJAVal content = *contentPtr;
    
    // 0. Test Mode Check
    bool testMode = false;
    if (content["testMode"] != NULL) {
        testMode = content["testMode"].ToBool();
    }

    string prefix = testMode ? "[TEST] " : "";
    Print(prefix + "Processing EXECUTE_TRADE command (Advanced Config)...");
    
    // 1. Basic Info
    string direction = content["direction"].ToStr(); 
    bool isLong = (direction == "LONG");
    string symbol = content["symbol"].ToStr();
    
    // Default Risk (can be added to JSON later)
    double riskPercent = 1.0; 
    
    // 2. Parse Entry
    CJAVal* entryObj = content["entry"];
    double entryPrice = 0.0;
    bool isMarket = true;
    
    if(entryObj != NULL)
    {
        string type = (*entryObj)["type"].ToStr();
        if(type == "LIMIT") 
        {
            isMarket = false;
            CJAVal* entryAnchor = (*entryObj)["anchor"];
            // FIX: Ensure anchor has valid time, otherwise treat as null/fallback
            if(entryAnchor != NULL && (*entryAnchor)["time"].ToInt() > 0)
            {
                entryPrice = ResolveAnchor(*entryAnchor);
                Print(prefix + "Resolved Entry Anchor -> Price: " + DoubleToString(entryPrice, _Digits));
            }
            else
            {
                 // Fallback to raw price if available
                 entryPrice = (*entryObj)["price"].ToDbl();
            }
        }
    }
    
    // For now, force Market if requested or if entry is 0/empty
    if(isMarket) entryPrice = 0.0;
    
    // 3. Parse SL (Expect Anchor)
    CJAVal* slObj = content["sl"];
    double slPrice = 0.0;
    
    if(slObj != NULL)
    {
        CJAVal* slAnchor = (*slObj)["anchor"];
        if(slAnchor != NULL && (*slAnchor)["time"].ToInt() > 0)
        {
            slPrice = ResolveAnchor(*slAnchor);
            Print(prefix + "Resolved SL Anchor -> Price: " + DoubleToString(slPrice, _Digits));
        }
        else
        {
            slPrice = (*slObj)["price"].ToDbl();
            if(slPrice <= 0) {
                Print(prefix + "Error: SL Anchor missing and Price is invalid.");
                return;
            }
        }
    }
    
    // 4. Parse TP (Anchor OR Dynamic RR)
    CJAVal* tpObj = content["tp"];
    double tpPrice = 0.0;
    double rrValue = 0.0;
    bool rrFixed = false;
    
    CJAVal* rrObj = content["riskReward"];
    if(rrObj != NULL) {
        rrValue = (*rrObj)["value"].ToDbl();
        if ((*rrObj)["fixed"] != NULL) rrFixed = (*rrObj)["fixed"].ToBool();
    }
    
    if(tpObj != NULL)
    {
        CJAVal* tpAnchor = (*tpObj)["anchor"];
        if(tpAnchor != NULL && (*tpAnchor)["time"].ToInt() > 0)
        {
            tpPrice = ResolveAnchor(*tpAnchor);
            Print(prefix + "Resolved TP Anchor -> Price: " + DoubleToString(tpPrice, _Digits));
        }
        else
        {
            // Dynamic TP based on RR
            Print(prefix + "TP Anchor missing/invalid. Calculating Dynamic TP with RR: ", rrValue);
            
            double currentPrice = (isLong) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
            // If Limit entry, we should use Limit Price. But for Market, use current.
            double calcEntry = (entryPrice > 0) ? entryPrice : currentPrice;
            
            if(slPrice > 0 && rrValue > 0)
            {
                double riskDist = MathAbs(calcEntry - slPrice);
                if(isLong) tpPrice = calcEntry + (riskDist * rrValue);
                else       tpPrice = calcEntry - (riskDist * rrValue);
                
                Print(prefix + "Calculated Dynamic TP: ", tpPrice, " (Entry: ", calcEntry, ", SL: ", slPrice, ", Dist: ", riskDist, ")");
            }
        }
    }
    
    Print(prefix + "Trade Params Resolved -> Dir: ", direction, " Entry: ", entryPrice, " SL: ", slPrice, " TP: ", tpPrice, " RR: ", rrValue, " (Fixed: ", rrFixed, ")");
    
    // Create Entry Object
    CEntry* entry = new CEntry();
    entry.m_symbol = _Symbol;
    entry.direction = isLong ? 1 : -1;
    entry.entryPrice = entryPrice; // 0.0 for Market
    entry.stopLossPrice = slPrice;
    entry.takeProfitPrice = tpPrice;
    
    // Logic: Use RR value ONLY if fixed, or fallback if TP is 0 (though TP should be calc'd above)
    // User requirement: "rr wert wird nur benutzt, wenn rr fixiert ist"
    entry.riskRewardTarget = (rrFixed) ? rrValue : 0.0; 
    
    entry.customRiskPercentage = riskPercent;
    
    entry.strategyName = "Manual_Exec";
    entry.type = isMarket ? ET_Limit_Market : ET_Explicit_Limit;
    
    // --- TEST MODE GATE ---
    if (testMode)
    {
        Print("--- [TEST MODE] SIMULATION REPORT ---");
        Print("Would execute trade for strategy: ", entry.strategyName);
        Print("Direction: ", (isLong ? "LONG" : "SHORT"));
        Print("Type: ", (isMarket ? "MARKET" : "LIMIT"));
        Print("Entry Price: ", DoubleToString(entry.entryPrice, _Digits));
        Print("Stop Loss: ", DoubleToString(entry.stopLossPrice, _Digits));
        Print("Take Profit: ", DoubleToString(entry.takeProfitPrice, _Digits));
        Print("Risk Reward: ", DoubleToString(entry.riskRewardTarget, 2), (rrFixed ? " [FIXED]" : "")); 
        Print("Risk: ", entry.customRiskPercentage, "%");
        Print("Symbol: ", entry.m_symbol);
        Print("-------------------------------------");
        
        // CRITICAL: Deleting entry object instead of passing to Manager
        delete entry;
        return;
    }
    
    Print("Executing Manual Trade...");
    CTradeManager::GetInstance().ManageTrade(entry);
}

//+------------------------------------------------------------------+
//| Proxy Handler Implementation                                     |
//+------------------------------------------------------------------+
void CAwesomeCmdHandler::HandleCommand(string type, CJAVal &msg)
{
   if(CheckPointer(m_parent) != POINTER_INVALID)
      m_parent.HandleCommand(type, msg);
}

