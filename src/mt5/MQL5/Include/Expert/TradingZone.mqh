//+------------------------------------------------------------------+
//|                                                 TradingZone.mqh |
//|                        Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef TRADING_ZONE_MQH
#define TRADING_ZONE_MQH

#include <Expert\TradeManager.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\LogManager.mqh>
#include <Object.mqh>

enum ENUM_ZONE_TYPE
{
    ZONE_LONG = 0,     // Long zone (below current price)
    ZONE_SHORT = 1     // Short zone (above current price)
};

enum ENUM_ZONE_STATUS
{
    ZONE_INACTIVE = 0,     // Zone is inactive
    ZONE_ACTIVE = 1,       // Zone is active and waiting for trigger
    ZONE_TRIGGERED = 2,    // Zone has been triggered
    ZONE_DISABLED = 3      // Zone is disabled
};

class CTradingZone : public CObject
{
private:
    string            m_name;              // Unique zone name
    double            m_upperPrice;        // Upper boundary of zone
    double            m_lowerPrice;        // Lower boundary of zone
    ENUM_ZONE_TYPE    m_zoneType;          // Zone type (long/short)
    ENUM_ZONE_STATUS  m_status;            // Current zone status
    ENUM_TIMEFRAMES   m_timeframe;         // Timeframe for zone trading
    datetime          m_creationTime;      // When zone was created
    datetime          m_startTime;         // Start time for zone drawing (when first level was set)
    bool              m_hasActiveTrade;    // Whether zone has active trade
    ulong             m_activeTicket;      // Ticket of active trade
    double            m_lastStopLoss;      // Last calculated stop loss
    double            m_lastTakeProfit;    // Last calculated take profit
    
    // Zone visualization
    string            m_rectangleName;     // Name of rectangle object
    string            m_labelName;         // Name of label object
    
public:
                      CTradingZone();
                      CTradingZone(const string name, double upperPrice, double lowerPrice, 
                                   ENUM_TIMEFRAMES timeframe, bool autoDraw = true);
                     ~CTradingZone();
    
    // Getters
    string            GetName() const { return m_name; }
    double            GetUpperPrice() const { return m_upperPrice; }
    double            GetLowerPrice() const { return m_lowerPrice; }
    ENUM_ZONE_TYPE    GetZoneType() const { return m_zoneType; }
    ENUM_ZONE_STATUS  GetStatus() const { return m_status; }
    ENUM_TIMEFRAMES   GetTimeframe() const { return m_timeframe; }
    datetime          GetCreationTime() const { return m_creationTime; }
    datetime          GetStartTime() const { return m_startTime; }
    void              SetStartTime(datetime startTime) { 
        Print("SetStartTime called: Previous=", TimeToString(m_startTime), ", New=", TimeToString(startTime));
        m_startTime = startTime; 
    }
    bool              HasActiveTrade() const { return m_hasActiveTrade; }
    ulong             GetActiveTicket() const { return m_activeTicket; }
    
    // Setters
    void              SetUpperPrice(double price) { m_upperPrice = price; }
    void              SetLowerPrice(double price) { m_lowerPrice = price; }
    void              SetStatus(ENUM_ZONE_STATUS status) { m_status = status; }
    void              SetActiveTrade(ulong ticket) { m_activeTicket = ticket; m_hasActiveTrade = (ticket > 0); }
    
    // Zone logic methods
    bool              IsInZone(double price) const;
    bool              ShouldActivate(CCandle* candle);
    bool              ShouldDeactivate(double closePrice);
    bool              ShouldTriggerTrade(CCandle* candle);
    void              OnTradeExecuted(ulong ticket);
    void              OnTradeClosed(ulong ticket);
    void              OnStrategyTradeClosed(const string& strategyName);
    
    // Stop loss calculation
    double            CalculateStopLoss(CCandle* candle, ENUM_TIMEFRAMES tradingTimeframe = PERIOD_M1);
    double            FindSwingHigh(ENUM_TIMEFRAMES timeframe);
    double            FindSwingLow(ENUM_TIMEFRAMES timeframe);
    
    // Zone visualization
    void              DrawZone();
    void              UpdateZoneVisualization();
    void              ExtendZoneToCurrentTime();
    void              RemoveZoneVisualization();
    
    // Validation
    bool              IsValid() const;
    string            ToString() const;
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CTradingZone::CTradingZone()
{
    m_name = "";
    m_upperPrice = 0.0;
    m_lowerPrice = 0.0;
    m_zoneType = ZONE_LONG;
    m_status = ZONE_INACTIVE;
    m_timeframe = PERIOD_CURRENT;
    m_creationTime = TimeCurrent();
    m_startTime = TimeCurrent();
    m_hasActiveTrade = false;
    m_activeTicket = 0;
    m_lastStopLoss = 0.0;
    m_lastTakeProfit = 0.0;
    m_rectangleName = "";
    m_labelName = "";
}

//+------------------------------------------------------------------+
//| Parameterized Constructor                                        |
//+------------------------------------------------------------------+
CTradingZone::CTradingZone(const string name, double upperPrice, double lowerPrice, 
                           ENUM_TIMEFRAMES timeframe, bool autoDraw)
{
    m_name = name;
    m_upperPrice = upperPrice;
    m_lowerPrice = lowerPrice;
    m_timeframe = timeframe;
    m_creationTime = TimeCurrent();
    m_startTime = TimeCurrent();
    m_hasActiveTrade = false;
    m_activeTicket = 0;
    m_lastStopLoss = 0.0;
    m_lastTakeProfit = 0.0;
    m_status = ZONE_INACTIVE;
    
    // Determine zone type based on current price
    double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    m_zoneType = (upperPrice < currentPrice) ? ZONE_LONG : ZONE_SHORT;
    
    // Create visualization object names
    m_rectangleName = "Zone_Rect_" + name;
    m_labelName = "Zone_Label_" + name;
    
    if (autoDraw)
        DrawZone();
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CTradingZone::~CTradingZone()
{
    RemoveZoneVisualization();
}

//+------------------------------------------------------------------+
//| Check if price is within zone                                    |
//+------------------------------------------------------------------+
bool CTradingZone::IsInZone(double price) const
{
    bool result = (price >= m_lowerPrice && price <= m_upperPrice);
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "IsInZone: Zone " + m_name + " - Price " + DoubleToString(price, _Digits) + " >= " + DoubleToString(m_lowerPrice, _Digits) + " && <= " + DoubleToString(m_upperPrice, _Digits) + " = " + (result ? "true" : "false"));
    return result;
}

//+------------------------------------------------------------------+
//| Check if zone should be activated                                |
//+------------------------------------------------------------------+
bool CTradingZone::ShouldActivate(CCandle* candle)
{
    if (candle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldActivate: Candle is NULL");
        return false;
    }
    
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldActivate: Zone " + m_name + " - Current status: " + EnumToString(m_status) + ", Candle High/Low: " + DoubleToString(candle.high, _Digits) + "/" + DoubleToString(candle.low, _Digits) + ", Zone: " + DoubleToString(m_lowerPrice, _Digits) + "-" + DoubleToString(m_upperPrice, _Digits));
    
    if (m_status != ZONE_INACTIVE)
    {
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldActivate: Zone " + m_name + " - Not inactive, current status: " + EnumToString(m_status));
        return false;
    }
    
    // Check if candle touches the zone (high/low within zone boundaries)
    bool candleTouchesZone = (candle.high >= m_lowerPrice && candle.low <= m_upperPrice);
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldActivate: Zone " + m_name + " - Candle touches zone: " + (candleTouchesZone ? "true" : "false"));
    
    if (candleTouchesZone)
    {
        m_status = ZONE_ACTIVE;
        UpdateZoneVisualization();
        Print("Zone ", m_name, " activated by candle touching zone (High: ", candle.high, ", Low: ", candle.low, ")");
        return true;
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Check if zone should be deactivated                             |
//+------------------------------------------------------------------+
bool CTradingZone::ShouldDeactivate(double closePrice)
{
    if (m_status != ZONE_ACTIVE)
        return false;
        
    bool shouldDeactivate = false;
    
    if (m_zoneType == ZONE_SHORT && closePrice > m_upperPrice)
    {
        shouldDeactivate = true;
    }
    else if (m_zoneType == ZONE_LONG && closePrice < m_lowerPrice)
    {
        shouldDeactivate = true;
    }
    
    if (shouldDeactivate)
    {
        m_status = ZONE_DISABLED;
        UpdateZoneVisualization();
        Print("Zone ", m_name, " DISABLED due to close price crossing zone boundary at ", closePrice);
        return true;
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Check if zone should trigger a trade                            |
//+------------------------------------------------------------------+
bool CTradingZone::ShouldTriggerTrade(CCandle* candle)
{
    if (candle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldTriggerTrade: Candle is NULL");
        return false;
    }
    
    if (m_status != ZONE_ACTIVE)
    {
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldTriggerTrade: Zone " + m_name + " - Not active. Status: " + EnumToString(m_status));
        return false;
    }
    
    if (m_hasActiveTrade)
    {
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldTriggerTrade: Zone " + m_name + " - Already has active trade with ticket: " + IntegerToString(m_activeTicket));
        return false;
    }
        
    // Check if candle touches the zone
    bool touchesZone = false;
    if (candle.high >= m_lowerPrice && candle.low <= m_upperPrice)
        touchesZone = true;
        
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldTriggerTrade: Zone " + m_name + " - Candle " + DoubleToString(candle.high, _Digits) + "/" + DoubleToString(candle.low, _Digits) + " touches zone " + DoubleToString(m_lowerPrice, _Digits) + "-" + DoubleToString(m_upperPrice, _Digits) + ": " + (touchesZone ? "true" : "false"));
        
    if (!touchesZone)
    {
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldTriggerTrade: Zone " + m_name + " - Candle doesn't touch zone, no trade");
        return false;
    }
        
    bool currentCandleIsUp = candle.isUpCandle();
    bool currentCandleIsDown = candle.isDownCandle();
    
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "ShouldTriggerTrade: Zone " + m_name + " - Candle direction: Up=" + (currentCandleIsUp ? "true" : "false") + ", Down=" + (currentCandleIsDown ? "true" : "false"));
    
    // Check for trade trigger based on zone type
    bool shouldTriggerTrade = false;
    
    // For long zones: trigger on bullish (UP) candle
    if (m_zoneType == ZONE_LONG && currentCandleIsUp)
    {
        shouldTriggerTrade = true;
        Print("Long zone ", m_name, " - Bullish candle detected: UP candle touching zone, triggering LONG trade");
    }
    else if (m_zoneType == ZONE_LONG && currentCandleIsDown)
    {
        Print("Long zone ", m_name, " - DOWN candle touching zone (waiting for UP candle for LONG trade)");
    }
    
    // For short zones: trigger on bearish (DOWN) candle
    if (m_zoneType == ZONE_SHORT && currentCandleIsDown)
    {
        shouldTriggerTrade = true;
        Print("Short zone ", m_name, " - Bearish candle detected: DOWN candle touching zone, triggering SHORT trade");
    }
    else if (m_zoneType == ZONE_SHORT && currentCandleIsUp)
    {
        Print("Short zone ", m_name, " - UP candle touching zone (waiting for DOWN candle for SHORT trade)");
    }
    
    if (shouldTriggerTrade)
    {
        Print("Zone ", m_name, " triggered by appropriate candle direction!");
        return true;
    }
    
    Print("Zone ", m_name, " - No appropriate candle direction detected, no trade triggered");
    return false;
}

//+------------------------------------------------------------------+
//| Handle trade execution for this zone                            |
//+------------------------------------------------------------------+
void CTradingZone::OnTradeExecuted(ulong ticket)
{
    m_hasActiveTrade = true;
    m_activeTicket = ticket;
    m_status = ZONE_TRIGGERED;
    Print("Zone ", m_name, " now has active trade with ticket: ", ticket, " (0 = pending assignment)");
}

//+------------------------------------------------------------------+
//| Handle trade closure for this zone                              |
//+------------------------------------------------------------------+
void CTradingZone::OnTradeClosed(ulong ticket)
{
    if (ticket == m_activeTicket || m_hasActiveTrade)
    {
        m_hasActiveTrade = false;
        m_activeTicket = 0;
        m_status = ZONE_INACTIVE;  // Reset to inactive so it can be reactivated
        UpdateZoneVisualization();  // Update color to reflect inactive status
        Print("Zone ", m_name, " trade closed (ticket: ", ticket, ") - zone reset to inactive");
    }
}

//+------------------------------------------------------------------+
//| Handle trade closure by strategy name                           |
//+------------------------------------------------------------------+
void CTradingZone::OnStrategyTradeClosed(const string& strategyName)
{
    // Check if strategy name matches our zone (Zone_ZoneName pattern)
    string expectedStrategyName = "Zone_" + m_name;
    if (strategyName == expectedStrategyName && m_hasActiveTrade)
    {
        m_hasActiveTrade = false;
        m_activeTicket = 0;
        m_status = ZONE_INACTIVE;  // Reset to inactive so it can be reactivated
        UpdateZoneVisualization();  // Update color to reflect inactive status
        Print("Zone ", m_name, " strategy trade closed (", strategyName, ") - zone reset to inactive");
    }
}

//+------------------------------------------------------------------+
//| Calculate stop loss for zone trade                              |
//+------------------------------------------------------------------+
double CTradingZone::CalculateStopLoss(CCandle* candle, ENUM_TIMEFRAMES tradingTimeframe = PERIOD_M1)
{
    if (candle == NULL)
        return 0.0;
        
    double stopLoss = 0.0;
    
    if (m_zoneType == ZONE_LONG)
    {
        // For long trades, SL should be BELOW entry (use swing low only)
        double swingLow = FindSwingLow(tradingTimeframe);
        
        if (swingLow > 0.0)
            stopLoss = swingLow;
        else
            stopLoss = m_lowerPrice;  // Fallback to zone bottom only if no swing low found
            
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "CalculateStopLoss LONG: SwingLow=" + DoubleToString(swingLow, _Digits) + ", Final SL=" + DoubleToString(stopLoss, _Digits) + ", Entry price=" + DoubleToString(candle.close, _Digits) + ", Trading TF=" + EnumToString(tradingTimeframe));
    }
    else // ZONE_SHORT
    {
        // For short trades, SL should be ABOVE entry (use swing high only)
        double swingHigh = FindSwingHigh(tradingTimeframe);
        
        if (swingHigh > 0.0)
            stopLoss = swingHigh;
        else
            stopLoss = m_upperPrice;  // Fallback to zone top only if no swing high found
            
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "CalculateStopLoss SHORT: SwingHigh=" + DoubleToString(swingHigh, _Digits) + ", Final SL=" + DoubleToString(stopLoss, _Digits) + ", Entry price=" + DoubleToString(candle.close, _Digits) + ", Trading TF=" + EnumToString(tradingTimeframe));
    }
    
    m_lastStopLoss = stopLoss;
    return stopLoss;
}

//+------------------------------------------------------------------+
//| Find swing high from current candle backwards                   |
//+------------------------------------------------------------------+
double CTradingZone::FindSwingHigh(ENUM_TIMEFRAMES timeframe)
{
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingHigh: Symbol=" + _Symbol + ", Timeframe=" + EnumToString(timeframe));
    
    // Start with current candle (index 0)
    CCandle* currentCandle = CChartManager::GetInstance().GetChart(_Symbol, timeframe).getCandleAt(0);
    if (currentCandle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingHigh: Current candle is NULL");
        return 0.0;
    }
    
    double swingHigh = currentCandle.high;
    int swingIndex = 0;
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingHigh: Starting with current candle[0] high=" + DoubleToString(swingHigh, 5));
    
    // Go backwards through candles, looking for higher or equal highs
    for (int i = 1; ; i++)
    {
        CCandle* candle = CChartManager::GetInstance().GetChart(_Symbol, timeframe).getCandleAt(i);
        if (candle == NULL) 
        {
            CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingHigh: Candle at index " + IntegerToString(i) + " is NULL - end of data");
            break;
        }
        
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingHigh: Candle[" + IntegerToString(i) + "] high=" + DoubleToString(candle.high, 5));
        
        // If we find a higher or equal high, update our swing high
        if (candle.high >= swingHigh)
        {
            swingHigh = candle.high;
            swingIndex = i;
            CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingHigh: New swing high found at index " + IntegerToString(i) + " with value " + DoubleToString(candle.high, 5));
        }
        else
        {
            // Found a lower high - we have our swing high, stop searching
            CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingHigh: Found lower high at index " + IntegerToString(i) + " (" + DoubleToString(candle.high, 5) + ") - stopping search");
            break;
        }
    }
    
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingHigh: Final swing high = " + DoubleToString(swingHigh, 5) + " at index " + IntegerToString(swingIndex));
    return swingHigh;
}

//+------------------------------------------------------------------+
//| Find swing low from current candle backwards                    |
//+------------------------------------------------------------------+
double CTradingZone::FindSwingLow(ENUM_TIMEFRAMES timeframe)
{
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingLow: Symbol=" + _Symbol + ", Timeframe=" + EnumToString(timeframe));
    
    // Start with current candle (index 0)
    CCandle* currentCandle = CChartManager::GetInstance().GetChart(_Symbol, timeframe).getCandleAt(0);
    if (currentCandle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingLow: Current candle is NULL");
        return 0.0;
    }
    
    double swingLow = currentCandle.low;
    int swingIndex = 0;
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingLow: Starting with current candle[0] low=" + DoubleToString(swingLow, 5));
    
    // Go backwards through candles, looking for lower or equal lows
    for (int i = 1; ; i++)
    {
        CCandle* candle = CChartManager::GetInstance().GetChart(_Symbol, timeframe).getCandleAt(i);
        if (candle == NULL) 
        {
            CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingLow: Candle at index " + IntegerToString(i) + " is NULL - end of data");
            break;
        }
        
        CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingLow: Candle[" + IntegerToString(i) + "] low=" + DoubleToString(candle.low, 5));
        
        // If we find a lower or equal low, update our swing low
        if (candle.low <= swingLow)
        {
            swingLow = candle.low;
            swingIndex = i;
            CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingLow: New swing low found at index " + IntegerToString(i) + " with value " + DoubleToString(candle.low, 5));
        }
        else
        {
            // Found a higher low - we have our swing low, stop searching
            CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingLow: Found higher low at index " + IntegerToString(i) + " (" + DoubleToString(candle.low, 5) + ") - stopping search");
            break;
        }
    }
    
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "FindSwingLow: Final swing low = " + DoubleToString(swingLow, 5) + " at index " + IntegerToString(swingIndex));
    return swingLow;
}

//+------------------------------------------------------------------+
//| Draw zone on chart                                               |
//+------------------------------------------------------------------+
void CTradingZone::DrawZone()
{
    // Remove existing objects
    RemoveZoneVisualization();
    
    // Create rectangle for zone - from startTime to future
    datetime currentTime = TimeCurrent();
    datetime endTime = currentTime + PeriodSeconds(PERIOD_D1) * 30; // Show for 30 days into future
    
    // Use the actual start time when zone was created
    datetime zoneStartTime;
    if (m_startTime > 0)
    {
        // Use the actual start time when zone was created
        zoneStartTime = m_startTime;
    }
    else
    {
        // Fallback: use creation time
        zoneStartTime = m_creationTime;
    }
    
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "DrawZone - m_startTime: " + TimeToString(m_startTime) + ", m_creationTime: " + TimeToString(m_creationTime));
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "DrawZone - Using zoneStartTime: " + TimeToString(zoneStartTime) + ", endTime: " + TimeToString(endTime));
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "DrawZone - Zone name: " + m_name + ", Rectangle name: " + m_rectangleName);
    CLogManager::GetInstance().LogMessage("CTradingZone", LL_DEBUG, "DrawZone - Zone prices: " + DoubleToString(m_lowerPrice, _Digits) + " - " + DoubleToString(m_upperPrice, _Digits));
    
    // Create rectangle on the main chart (chart 0)
    if (!ObjectCreate(0, m_rectangleName, OBJ_RECTANGLE, 0, 
                      zoneStartTime, m_lowerPrice, endTime, m_upperPrice))
    {
        Print("Error creating zone rectangle: ", GetLastError());
        return;
    }
    
    // Set rectangle properties
    color zoneColor = (m_zoneType == ZONE_LONG) ? clrLightBlue : clrLightPink;
    ObjectSetInteger(0, m_rectangleName, OBJPROP_COLOR, zoneColor);
    ObjectSetInteger(0, m_rectangleName, OBJPROP_FILL, true);
    ObjectSetInteger(0, m_rectangleName, OBJPROP_BACK, true);
    ObjectSetInteger(0, m_rectangleName, OBJPROP_SELECTABLE, true);
    ObjectSetInteger(0, m_rectangleName, OBJPROP_HIDDEN, false);
    
    // Make zone visible on all timeframes - this is crucial
    ObjectSetInteger(0, m_rectangleName, OBJPROP_TIMEFRAMES, OBJ_ALL_PERIODS);
    
    // Also set the chart to show it on the main chart
    ObjectSetInteger(0, m_rectangleName, OBJPROP_CHART_ID, 0);
    
    // Create label at the zone start time
    if (ObjectCreate(0, m_labelName, OBJ_TEXT, 0, zoneStartTime, m_upperPrice))
    {
        string labelText = m_name + " (" + EnumToString(m_zoneType) + ")";
        ObjectSetString(0, m_labelName, OBJPROP_TEXT, labelText);
        ObjectSetInteger(0, m_labelName, OBJPROP_COLOR, clrBlack);
        ObjectSetInteger(0, m_labelName, OBJPROP_FONTSIZE, 10);
        
        // Make label visible on all timeframes
        ObjectSetInteger(0, m_labelName, OBJPROP_TIMEFRAMES, OBJ_ALL_PERIODS);
    }
    
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Extend zone rectangle to current time + future                  |
//+------------------------------------------------------------------+
void CTradingZone::ExtendZoneToCurrentTime()
{
    if (ObjectFind(0, m_rectangleName) < 0)
        return;
        
    datetime currentTime = TimeCurrent();
    datetime endTime = currentTime + PeriodSeconds(PERIOD_D1) * 30; // 30 days into future
    
    // Use the actual start time when zone was created
    datetime zoneStartTime;
    if (m_startTime > 0)
    {
        // Use the actual start time when zone was created
        zoneStartTime = m_startTime;
    }
    else
    {
        // Fallback: use creation time
        zoneStartTime = m_creationTime;
    }
    
    // Update rectangle time coordinates
    ObjectSetInteger(0, m_rectangleName, OBJPROP_TIME, 0, zoneStartTime);
    ObjectSetInteger(0, m_rectangleName, OBJPROP_TIME, 1, endTime);
    
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Update zone visualization based on status                       |
//+------------------------------------------------------------------+
void CTradingZone::UpdateZoneVisualization()
{
    if (ObjectFind(0, m_rectangleName) < 0)
        return;
        
    color zoneColor;
    
    switch(m_status)
    {
        case ZONE_INACTIVE:
            zoneColor = (m_zoneType == ZONE_LONG) ? clrLightBlue : clrLightPink;
            break;
        case ZONE_ACTIVE:
            zoneColor = (m_zoneType == ZONE_LONG) ? clrBlue : clrRed;
            break;
        case ZONE_TRIGGERED:
            zoneColor = clrYellow;
            break;
        case ZONE_DISABLED:
            zoneColor = clrGray;
            break;
    }
    
    ObjectSetInteger(0, m_rectangleName, OBJPROP_COLOR, zoneColor);
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Remove zone visualization                                        |
//+------------------------------------------------------------------+
void CTradingZone::RemoveZoneVisualization()
{
    if (ObjectFind(0, m_rectangleName) >= 0)
        ObjectDelete(0, m_rectangleName);
        
    if (ObjectFind(0, m_labelName) >= 0)
        ObjectDelete(0, m_labelName);
        
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Check if zone is valid                                           |
//+------------------------------------------------------------------+
bool CTradingZone::IsValid() const
{
    return (m_upperPrice > m_lowerPrice && 
            m_upperPrice > 0 && 
            m_lowerPrice > 0 && 
            m_name != "");
}

//+------------------------------------------------------------------+
//| Convert zone to string representation                           |
//+------------------------------------------------------------------+
string CTradingZone::ToString() const
{
    return StringFormat("Zone[%s]: %.5f-%.5f (%s, %s)", 
                        m_name, m_lowerPrice, m_upperPrice,
                        EnumToString(m_zoneType), EnumToString(m_status));
}

#endif // TRADING_ZONE_MQH

