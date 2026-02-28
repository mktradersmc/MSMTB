//+------------------------------------------------------------------+
//|                                        TradePanelCalculations.mqh |
//|                                   Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADE_PANEL_CALCULATIONS_MQH
#define TRADE_PANEL_CALCULATIONS_MQH

// Forward Declaration
class CTradePanel;

//+------------------------------------------------------------------+
//| Trade Panel Calculations - Static Helper Class                  |
//+------------------------------------------------------------------+
class CTradePanelCalculations
{
public:
    // Preis-Berechnungen
    static double CalculateTakeProfitFromRR(double entryPrice, double stopLoss, double riskReward, bool isLong);
    static double CalculateStopLossFromRR(double entryPrice, double takeProfit, double riskReward, bool isLong);
    static double CalculateEntryFromSLAndTP(double stopLoss, double takeProfit, double riskReward, bool isLong);
    
    // Lot Size Berechnungen
    static double CalculateLotSizeSimple(string symbol, double riskAmount, int stopLossPoints);
    
    // Validierungen
    static bool ValidateStopLoss(double entryPrice, double stopLoss, bool isLong);
    static bool ValidateTakeProfit(double entryPrice, double takeProfit, bool isLong);
    static bool ValidateTradeParameters(double entryPrice, double stopLoss, double takeProfit, bool isLong, double riskReward);
    
    // Position Logic
    static bool IsLongPosition(double entryPrice, double stopLoss, double takeProfit);
};

//+------------------------------------------------------------------+
//| Calculate Take Profit from Risk Reward                          |
//+------------------------------------------------------------------+
double CTradePanelCalculations::CalculateTakeProfitFromRR(double entryPrice, double stopLoss, double riskReward, bool isLong)
{
    if(entryPrice <= 0 || stopLoss <= 0 || riskReward <= 0)
        return 0;
        
    double risk = MathAbs(entryPrice - stopLoss);
    double reward = risk * riskReward;
    
    double takeProfit;
    if(isLong)
    {
        takeProfit = entryPrice + reward;
    }
    else
    {
        takeProfit = entryPrice - reward;
    }
    
    return takeProfit;
}

//+------------------------------------------------------------------+
//| Calculate Stop Loss from Risk Reward                            |
//+------------------------------------------------------------------+
double CTradePanelCalculations::CalculateStopLossFromRR(double entryPrice, double takeProfit, double riskReward, bool isLong)
{
    if(entryPrice <= 0 || takeProfit <= 0 || riskReward <= 0)
        return 0;
        
    double reward = MathAbs(entryPrice - takeProfit);
    double risk = reward / riskReward;
    
    double stopLoss;
    if(isLong)
    {
        stopLoss = entryPrice - risk;
    }
    else
    {
        stopLoss = entryPrice + risk;
    }
    
    return stopLoss;
}

//+------------------------------------------------------------------+
//| Calculate Entry from Stop Loss, Take Profit and Risk Reward     |
//+------------------------------------------------------------------+
double CTradePanelCalculations::CalculateEntryFromSLAndTP(double stopLoss, double takeProfit, double riskReward, bool isLong)
{
    if(stopLoss <= 0 || takeProfit <= 0 || riskReward <= 0)
        return 0;
    
    double entryPrice;
    
    if(isLong)
    {
        // Long Position: Entry = SL + (TP - SL) / (1 + RR)
        entryPrice = stopLoss + (takeProfit - stopLoss) / (1.0 + riskReward);
    }
    else
    {
        // Short Position: Entry = SL - (SL - TP) / (1 + RR)  
        entryPrice = stopLoss - (stopLoss - takeProfit) / (1.0 + riskReward);
    }
    
    return entryPrice;
}

#include <Expert\TradeManager.mqh>

//+------------------------------------------------------------------+
//| Calculate Lot Size (Using TradeManager for consistency)          |
//+------------------------------------------------------------------+
double CTradePanelCalculations::CalculateLotSizeSimple(string symbol, double riskAmount, int stopLossPoints)
{
    // Wir delegieren die Berechnung an den TradeManager, damit GUI und 
    // Trade-Ausführung exakt die gleiche robuste Logik nutzen.
    CTradeManager* tm = CTradeManager::GetInstance();
    if(tm == NULL) return 0;
    
    return tm.CalculatePositionSize(symbol, riskAmount, stopLossPoints);
}

//+------------------------------------------------------------------+
//| Validate Stop Loss                                              |
//+------------------------------------------------------------------+
bool CTradePanelCalculations::ValidateStopLoss(double entryPrice, double stopLoss, bool isLong)
{
    if(isLong)
    {
        return stopLoss < entryPrice;
    }
    else
    {
        return stopLoss > entryPrice;
    }
}

//+------------------------------------------------------------------+
//| Validate Take Profit                                            |
//+------------------------------------------------------------------+
bool CTradePanelCalculations::ValidateTakeProfit(double entryPrice, double takeProfit, bool isLong)
{
    if(isLong)
    {
        return takeProfit > entryPrice;
    }
    else
    {
        return takeProfit < entryPrice;
    }
}

//+------------------------------------------------------------------+
//| Is Long Position with parameters                                |
//+------------------------------------------------------------------+
bool CTradePanelCalculations::IsLongPosition(double entryPrice, double stopLoss, double takeProfit)
{
    // 1. Wenn Entry und TP gesetzt sind, bestimmt TP die Richtung
    if(entryPrice > 0 && takeProfit > 0)
    {
        return takeProfit > entryPrice;
    }
    
    // 2. Wenn Entry und SL gesetzt sind, bestimmt SL die Richtung
    if(entryPrice > 0 && stopLoss > 0)
    {
        return stopLoss < entryPrice;
    }
    
    // 3. Fallback: Wenn nur Marktpreis bekannt ist (z.B. Market Order Vorbereitung)
    MqlTick lastTick;
    if(SymbolInfoTick(_Symbol, lastTick))
    {
        if(takeProfit > 0) return takeProfit > lastTick.bid;
        if(stopLoss > 0)   return stopLoss < lastTick.bid;
        if(entryPrice > 0) return entryPrice < lastTick.bid;
    }
    
    return true; // Default
}

//+------------------------------------------------------------------+
//| Validate Trade Parameters                                       |
//+------------------------------------------------------------------+
bool CTradePanelCalculations::ValidateTradeParameters(double entryPrice, double stopLoss, double takeProfit, bool isLong, double riskReward)
{
    // Bei Market Orders nur die relative Position von SL und TP prüfen
    if(entryPrice <= 0)
    {
        MqlTick lastTick;
        SymbolInfoTick(_Symbol, lastTick);
        double currentPrice = isLong ? lastTick.ask : lastTick.bid;
        
        // Validieren mit aktuellem Marktpreis
        if(stopLoss > 0 && !ValidateStopLoss(currentPrice, stopLoss, isLong))
        {
            return false;
        }
        
        if(takeProfit > 0 && !ValidateTakeProfit(currentPrice, takeProfit, isLong))
        {
            return false;
        }
    }
    else
    {
        // Validiere SL Position wenn gesetzt
        if(stopLoss > 0 && !ValidateStopLoss(entryPrice, stopLoss, isLong))
        {
            return false;
        }
        
        // Validiere TP Position wenn gesetzt
        if(takeProfit > 0 && !ValidateTakeProfit(entryPrice, takeProfit, isLong))
        {
            return false;
        }
    }
    
    // Bei Market Orders und fehlenden Werten keine weitere Validierung
    if(entryPrice <= 0 && stopLoss <= 0 && takeProfit <= 0)
    {
        return false;
    }
    
    // Stellen Sie sicher, dass RR oder TP spezifiziert ist
    if(riskReward <= 0 && takeProfit <= 0)
    {
        return false;
    }
    
    return true;
}

#endif // TRADE_PANEL_CALCULATIONS_MQH

