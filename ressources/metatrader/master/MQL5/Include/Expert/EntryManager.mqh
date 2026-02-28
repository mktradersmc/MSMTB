//+------------------------------------------------------------------+
//|                                                   EntryManager.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef ENTRY_MANAGER_MQH
#define ENTRY_MANAGER_MQH

#include <Expert\Candle.mqh>
#include <Expert\Entry.mqh>
#include <Expert\TradeManager.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\TechnicalAnalysisManager.mqh>
#include <Expert\Imbalance.mqh>
#include <Expert\HighLow.mqh>
#include <Expert\Helper.mqh>
#include <Object.mqh>
#include <Expert\ChartHelper.mqh>

enum ENUM_ENTRY_LEVEL
{
   EL_Current_Market_Price = 0, // Aktueller Marktpreis
   EL_FVG = 1, // Beginn der Imbalance
   EL_FVG_50_Percent = 2, // Mitte der Imbalance
   EL_FVG_Candle_Close = 3 // Body der Imbalance Kerze
};

enum ENUM_STOP_LOSS_LEVEL
{
   SLL_Swing_Point = 0, // Swingpunkt
   SLL_First_Balanced = 1, // Erste balancierte Kerze
   SLL_First_Balanced_Compact = 2, // Body Open der balancierten Kerze
   SLL_Candle = 3, // Gebildete Kerze 
   SLL_Candle_Compact = 4 // Body open der gebildeten Kerze
};

enum ENUM_TAKE_PROFIT_TYPE
{
   TP_Risk_Reward = 0, // Risk Reward
   TP_Time = 1, // Zeit
   TP_Opposing_Liquidity = 2 // Gegenüberliegende Liquidität
};

enum ENUM_BREAKEVEN_MODE
{
   SL_to_BE_Never = 0,
   SL_to_BE_After_Seconds = 1,
   SL_to_BE_After_Risk_Reward = 2,
   SL_to_BE_After_Previous_HTF_Candle_Swing = 3
};

class CTechnicalAnalysisManager;

class CEntrySettings : public CObject
{
public:
   ENUM_ENTRY_TYPE entryType;
   ENUM_ENTRY_LEVEL entryLevel;
   int entryImmediateWhenStopLossIsLess;
   ENUM_STOP_LOSS_LEVEL stopLossLevel;
   int maxStopLossInPoints;
   ENUM_TAKE_PROFIT_TYPE takeProfitType;
   int invalidateAfterSeconds;
   double takeProfitRR;
   string takeProfitTime;
   int takeProfitTimeframe;
   int timeframe;
   ENUM_BREAKEVEN_MODE breakEvenMode;
   int breakEvenAfterSeconds;
   double breakEvenAfterRR;
   int invalidateAfterTimeSeconds;
};

class CEntryManager : public CObject
{
private:
    CEntrySettings* settings;
    CTradeManager* tradeManager;
    CTechnicalAnalysisManager* technicalAnalysisManager;
    CChartManager* chartManager;
    CHelper helper;

    CEntry* CreateEntry(CCandle* candle, bool isLong, double entryPrice, double stopLoss, double takeProfit, ENUM_EVENT_TYPE closeEventType, const string strategyName);
    double CalculateEntryPrice(CCandle* candle, bool isLong);
    double CalculateStopLoss(CCandle* candle, bool isLong);
    double CalculateOpposingLiquidityTakeProfit(CCandle* candle, bool isLong);
    CCandle* FindSwingPoint(CCandle* startCandle, bool isHigh, int timeframe);
    bool IsSwingHigh(CCandle* current, CCandle* previous);
    bool IsSwingLow(CCandle* current, CCandle* previous);

public:
    CEntryManager(CEntrySettings* _settings);
    void EnterLong(CCandle* candle, double entryPrice = 0, double stopLoss = 0, double takeProfit = 0, ENUM_EVENT_TYPE closeEventType = EV_EMPTY, const string strategyName = "", double riskPercentage = 0);
    void EnterShort(CCandle* candle, double entryPrice = 0, double stopLoss = 0, double takeProfit = 0, ENUM_EVENT_TYPE closeEventType = EV_EMPTY, const string strategyName = "", double riskPercentage = 0);
    void LogSettingsAndEntry(CEntry* entry);
    CEntrySettings* GetSettings();
};

CEntryManager::CEntryManager(CEntrySettings* _settings)
    : settings(_settings)
{
    tradeManager = CTradeManager::GetInstance();
    technicalAnalysisManager = CTechnicalAnalysisManager::GetInstance(_Symbol);
    chartManager = CChartManager::GetInstance();
}

CEntrySettings* CEntryManager::GetSettings() 
{ 
    return settings; 
}

void CEntryManager::LogSettingsAndEntry(CEntry* entry)
{
    string output = "";
    output += "Entry Type: " + EnumToString(settings.entryType) + "\n";
    output += ", Entry Level: " + EnumToString(settings.entryLevel) + "\n";
    output += ", Stop Loss Level: " + EnumToString(settings.stopLossLevel) + "\n";
    output += ", Current Bid = "+SymbolInfoDouble(_Symbol,SYMBOL_BID)+"\n";
    output += ", Current Ask = "+SymbolInfoDouble(_Symbol,SYMBOL_ASK)+"\n";
    output += ", Invalidate After Seconds: " + IntegerToString(settings.invalidateAfterSeconds) + "\n";
    output += ", Take Profit Type: " + EnumToString(settings.takeProfitType) + "\n";
    output += ", Entry Price: " + entry.entryPrice + "\n";
    output += ", Stop Loss Price: " + entry.stopLossPrice + "\n";
    output += ", Strategy Name: " + entry.strategyName + "\n";

    switch(settings.takeProfitType)
    {
        case TP_Risk_Reward:
            output += ", Take Profit RR: " + DoubleToString(settings.takeProfitRR, 2) + "\n";
            break;
        case TP_Time:
            output += ", Take Profit Time: " + settings.takeProfitTime + "\n";
            break;
        case TP_Opposing_Liquidity:
            output += ", Take Profit Timeframe: " + EnumToString((ENUM_TIMEFRAMES)settings.takeProfitTimeframe) + "\n";
            break;
    }

    output += ", Timeframe: " + EnumToString((ENUM_TIMEFRAMES)settings.timeframe) + "\n";
    output += ", BreakEven Mode: " + EnumToString(settings.breakEvenMode) + "\n";

    switch(settings.breakEvenMode)
    {
        case SL_to_BE_After_Seconds:
            output += ", BreakEven After Seconds: " + IntegerToString(settings.breakEvenAfterSeconds) + "\n";
            break;
        case SL_to_BE_After_Risk_Reward:
            output += ", BreakEven After RR: " + DoubleToString(settings.breakEvenAfterRR, 2) + "\n";
            break;
    }

    output += "-------------------------------";

    Print(output);
}

CEntry* CEntryManager::CreateEntry(CCandle* candle, bool isLong, double entryPrice, double stopLoss, double takeProfit, ENUM_EVENT_TYPE closeEventType, const string strategyName)
{
    CEntry* entry = new CEntry();
    
    entry.strategyName = strategyName;
    entry.direction = isLong ? 1 : -1;
    entry.stopLossPrice = (stopLoss != 0) ? stopLoss : CalculateStopLoss(candle, isLong);
    entry.entryPrice = (entryPrice != 0) ? entryPrice : CalculateEntryPrice(candle, isLong);
    
    // Order Typ basierend auf Entry Type setzen
    if(settings.entryType == ET_Explicit_Limit || settings.entryType == ET_Explicit_Stop)
    {
        entry.type = settings.entryType;
        entry.riskRewardTarget = settings.takeProfitRR;  // RR für Limit Orders
    }
    else
    {
        entry.type = settings.entryType == ET_Stop ? ET_Stop : ET_Limit_Market;
    }
    
    entry.invalidateAfterTimeSeconds = settings.invalidateAfterTimeSeconds;
    entry.SetCloseEventType(closeEventType);

    if (settings.maxStopLossInPoints > 0)
    {
         int stopLossDifferenceInPoints = MathAbs(entryPrice-stopLoss)/_Point;
         if (stopLossDifferenceInPoints > settings.maxStopLossInPoints)
         {
             entry.entryPrice = isLong? (entry.stopLossPrice + settings.maxStopLossInPoints*_Point):(entry.stopLossPrice - settings.maxStopLossInPoints*_Point);
             Print("Stop Loss zu groß. Kürze entryPrice auf "+entry.entryPrice);
         }
    }
    if (settings.entryImmediateWhenStopLossIsLess > 0)
    {
         int stopLossDifferenceInPoints = MathAbs(candle.close-stopLoss)/_Point;
         if (stopLossDifferenceInPoints < settings.entryImmediateWhenStopLossIsLess)
         {
              entry.entryPrice = candle.close;
         }
    }
    
    if (closeEventType != EV_EMPTY)
    {
        entry.takeProfitPrice = 0;
        Print("Close event defined. Setting Take Profit to 0.");
    }
    else
    {
        if (takeProfit != 0)
        {
            entry.takeProfitPrice = takeProfit;
        }
        else
        {
            switch(settings.takeProfitType)
            {
                case TP_Risk_Reward:
                    entry.riskRewardTarget = settings.takeProfitRR;
                    break;
                case TP_Time:
                    entry.takeProfitTime = helper.GetDateForToday(settings.takeProfitTime);
                    break;
                case TP_Opposing_Liquidity:
                    entry.takeProfitPrice = CalculateOpposingLiquidityTakeProfit(candle, isLong);
                    break;
            }
        }
    }

    switch(settings.breakEvenMode)
    {
        case SL_to_BE_After_Seconds:
            entry.beSLAfterTimeSeconds = settings.breakEvenAfterSeconds;
            break;
        case SL_to_BE_After_Risk_Reward:
            entry.beSLAfterRiskReward = settings.breakEvenAfterRR;
            break;
        case SL_to_BE_After_Previous_HTF_Candle_Swing:
        {
            CBaseChart* chart = CChartManager::GetInstance().GetChart(candle.symbol,stop_loss_to_be_last_candle_timeframe);
            CCandle* previousCandle = chart.getCandleAt(0);
            double swingPrice = isLong?previousCandle.high:previousCandle.low;
            entry.beSLAtPrice = swingPrice;     
        }
    }

    return entry;
}

void CEntryManager::EnterLong(CCandle* candle, double entryPrice = 0, double stopLoss = 0, double takeProfit = 0, ENUM_EVENT_TYPE closeEventType = EV_EMPTY, const string strategyName = "", double riskPercentage = 0)
{
    CEntry* entry = NULL;
    
    if(candle != NULL)
    {
        entry = CreateEntry(candle, true, entryPrice, stopLoss, takeProfit, closeEventType, strategyName);
    }
    else
    {
        entry = new CEntry();
        entry.strategyName = strategyName;
        entry.direction = 1;  // Long
        entry.stopLossPrice = stopLoss;
        entry.entryPrice = entryPrice;
        entry.type = settings.entryType;  // Verwende den konfigurierten Type
        entry.invalidateAfterTimeSeconds = settings.invalidateAfterTimeSeconds;
        entry.customRiskPercentage = riskPercentage;
        entry.SetCloseEventType(closeEventType);
        
        if(closeEventType != EV_EMPTY)
        {
            entry.takeProfitPrice = 0;
            Print("Close event defined. Setting Take Profit to 0.");
        }
        else
        {
            if(takeProfit != 0)
            {
                entry.takeProfitPrice = takeProfit;
            }
            else
            {
                switch(settings.takeProfitType)
                {
                    case TP_Risk_Reward:
                        entry.riskRewardTarget = settings.takeProfitRR;
                        break;
                    case TP_Time:
                        entry.takeProfitTime = helper.GetDateForToday(settings.takeProfitTime);
                        break;
                }
            }
        }
        
        switch(settings.breakEvenMode)
        {
            case SL_to_BE_After_Seconds:
                entry.beSLAfterTimeSeconds = settings.breakEvenAfterSeconds;
                break;
            case SL_to_BE_After_Risk_Reward:
                entry.beSLAfterRiskReward = settings.breakEvenAfterRR;
                break;
        }
    }
    
    Print("--- Settings for new Long ---");
    LogSettingsAndEntry(entry);
    if (entry != NULL)
    {
        tradeManager.ManageTrade(entry);
    }
}

void CEntryManager::EnterShort(CCandle* candle, double entryPrice = 0, double stopLoss = 0, double takeProfit = 0, ENUM_EVENT_TYPE closeEventType = EV_EMPTY, const string strategyName = "", double riskPercentage = 0)
{
    CEntry* entry = NULL;
    
    if(candle != NULL)
    {
        entry = CreateEntry(candle, false, entryPrice, stopLoss, takeProfit, closeEventType, strategyName);
    }
    else
    {
        entry = new CEntry();
        entry.strategyName = strategyName;
        entry.direction = -1;  // Short
        entry.stopLossPrice = stopLoss;
        entry.entryPrice = entryPrice;
        entry.type = settings.entryType;  // Verwende den konfigurierten Type
        entry.invalidateAfterTimeSeconds = settings.invalidateAfterTimeSeconds;
        entry.customRiskPercentage = riskPercentage;
        entry.SetCloseEventType(closeEventType);
        
        if(closeEventType != EV_EMPTY)
        {
            entry.takeProfitPrice = 0;
            Print("Close event defined. Setting Take Profit to 0.");
        }
        else
        {
            if(takeProfit != 0)
            {
                entry.takeProfitPrice = takeProfit;
            }
            else
            {
                switch(settings.takeProfitType)
                {
                    case TP_Risk_Reward:
                        entry.riskRewardTarget = settings.takeProfitRR;
                        break;
                    case TP_Time:
                        entry.takeProfitTime = helper.GetDateForToday(settings.takeProfitTime);
                        break;
                }
            }
        }
        
        switch(settings.breakEvenMode)
        {
            case SL_to_BE_After_Seconds:
                entry.beSLAfterTimeSeconds = settings.breakEvenAfterSeconds;
                break;
            case SL_to_BE_After_Risk_Reward:
                entry.beSLAfterRiskReward = settings.breakEvenAfterRR;
                break;
        }
    }
    
    Print("--- Settings for new Short ---");
    LogSettingsAndEntry(entry);
    if (entry != NULL)
    {
        tradeManager.ManageTrade(entry);
    }
}

double CEntryManager::CalculateEntryPrice(CCandle* candle, bool isLong)
{
    if (settings.entryType == ET_Stop)
    {
        return isLong ? candle.high : candle.low;
    }
    
    if (settings.entryType == ET_Limit_Market)
    {
        if (settings.entryLevel == EL_Current_Market_Price)
           return 0;
    
        CImbalance* relevantImbalance = isLong
            ? technicalAnalysisManager.GetNextLowerImbalance(candle, settings.timeframe)
            : technicalAnalysisManager.GetNextHigherImbalance(candle, settings.timeframe);
   
        if (relevantImbalance == NULL)
        {
            return isLong ? candle.high : candle.low;
        }
   
        switch(settings.entryLevel)
        {
           case EL_FVG:
               return isLong ? relevantImbalance.originalGapHigh : relevantImbalance.originalGapLow;
           case EL_FVG_50_Percent:
               return (relevantImbalance.originalGapHigh + relevantImbalance.originalGapLow) / 2;
           case EL_FVG_Candle_Close:
               return relevantImbalance.associatedCandle.close;
           default:
               return 0;
        }
    }
    
    return isLong ? candle.high : candle.low;
}

CCandle* CEntryManager::FindSwingPoint(CCandle* startCandle, bool isHigh, int timeframe) {
    CBaseChart* chart = chartManager.GetChart(startCandle.symbol, timeframe);
    if (chart == NULL) return NULL;
    
    // Get the index of the starting candle
    int startIndex = -1;
    for (int i = 0; i < chart.getCandlesCount(); i++) {
        if (chart.getCandleAt(i).openTime == startCandle.openTime) {
            startIndex = i;
            break;
        }
    }
    
    if (startIndex == -1) return NULL;
    
    // Look back through candles to find swing point
    for (int i = startIndex + 1; i < chart.getCandlesCount() - 1; i++) {
        CCandle* current = chart.getCandleAt(i);
        CCandle* previous = chart.getCandleAt(i + 1);
        
        if (isHigh) {
            if (IsSwingHigh(current, previous)) return current;
        } else {
            if (IsSwingLow(current, previous)) return current;
        }
    }
    
    return NULL;
}

bool CEntryManager::IsSwingHigh(CCandle* current, CCandle* previous) {
    return (current.high > previous.high);
}

bool CEntryManager::IsSwingLow(CCandle* current, CCandle* previous) {
    return (current.low < previous.low);
}

double CEntryManager::CalculateStopLoss(CCandle* candle, bool isLong)
{
    int currentTimeframe = settings.timeframe;
    
    Print("Determine stop loss");
    if (settings.entryType == ET_Stop)
    {
         return isLong ? MathMin(candle.open, candle.close) : MathMax(candle.open,candle.close);
    }
    
    if (settings.stopLossLevel == SLL_Swing_Point)
    {
        CCandle* swingCandle = NULL;
        
        while (currentTimeframe != -1)
        {
            Print("Look now for Swingpoint on " + CChartHelper::GetTimeframeName(currentTimeframe));
            
            swingCandle = FindSwingPoint(candle, !isLong, currentTimeframe);
            
            if (swingCandle != NULL)
            {
                Print("Swingpoint found at " + TimeToString(swingCandle.openTime));
                break;
            }
    
            currentTimeframe = chartManager.GetNextLowerTimeframe(currentTimeframe);
            Print("No Swingpoint found, checking lower timeframe");
        }
   
        if (swingCandle == NULL)
        {
            Print("No Swingpoint found. Use Candle as fallback level.");
            return isLong ? candle.low : candle.high;
        }
   
        double stopLoss = isLong ? swingCandle.low : swingCandle.high;
        Print("Stop Loss from swingpoint at " + DoubleToString(stopLoss, _Digits));
        return stopLoss;
    }
    else if (settings.stopLossLevel == SLL_Candle)
    {
        return isLong ? candle.low : candle.high;
    }
    else if (settings.stopLossLevel == SLL_Candle_Compact)
    {
        return candle.open;
    }   
    else
    {  
        CImbalanceDetector* imbalanceDetector = (CImbalanceDetector*)CEnvironmentManager::GetInstance().GetFeatureForSymbol(candle.symbol,"ImbalanceDetector");
        CCandle* balancedCandle = imbalanceDetector.FindFirstBalancedCandle(candle);
        
        if (balancedCandle != NULL)
        {
            switch(settings.stopLossLevel)
            {
                case SLL_First_Balanced: 
                    return isLong ? (balancedCandle.low-Point()) : (balancedCandle.high+Point());
                case SLL_First_Balanced_Compact:
                    return isLong ? (MathMin(balancedCandle.open, balancedCandle.close)-Point()) : (MathMax(balancedCandle.open, balancedCandle.close)+Point());
            }
        }    
    }

    return isLong ? candle.low : candle.high;
}

double CEntryManager::CalculateOpposingLiquidityTakeProfit(CCandle* candle, bool isLong)
{
    Print("Determining take profit.");
    CHighLow* opposingLevel = isLong
        ? technicalAnalysisManager.GetNextHigherHigh(candle, settings.takeProfitTimeframe)
        : technicalAnalysisManager.GetNextLowerLow(candle, settings.takeProfitTimeframe);

    if (opposingLevel == NULL)
    {
        // Fallback if no relevant High/Low was found
        return isLong ? candle.high : candle.low;
    }
    else
    {
        Print("Found opposing liquidity at " + opposingLevel.toString());
    }

    return isLong ? opposingLevel.getSwingCandle().high : opposingLevel.getSwingCandle().low;
}

#endif // ENTRY_MANAGER_MQH


