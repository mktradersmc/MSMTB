//+------------------------------------------------------------------+
//|                                                  ZoneManager.mqh |
//|                        Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef ZONE_MANAGER_MQH
#define ZONE_MANAGER_MQH

#include <Expert\TradingZone.mqh>
#include <Expert\EntryManager.mqh>
#include <Expert\TradeManager.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\LogManager.mqh>
#include <Arrays\ArrayObj.mqh>

// Zone creation mode for UI
enum ENUM_ZONE_CREATION_MODE
{
    ZONE_CREATE_NONE = 0,     // No zone creation mode
    ZONE_CREATE_LONG = 1,     // Creating long zone
    ZONE_CREATE_SHORT = 2     // Creating short zone
};

// Forward declaration
class CAwesomeExpert;

class CZoneManager
{
private:
    CArrayObj*            m_zones;              // Array of CTradingZone objects
    CEntryManager*        m_entryManager;       // Reference to entry manager
    CAwesomeExpert*       m_expert;             // Reference to expert advisor
    ENUM_ZONE_CREATION_MODE m_creationMode;    // Current zone creation mode
    int                   m_nextZoneId;         // Counter for zone IDs
    
    // Zone creation temporary data
    double                m_tempUpperPrice;     // Temporary upper price during creation
    double                m_tempLowerPrice;     // Temporary lower price during creation
    bool                  m_isCreatingZone;     // Flag for zone creation process
    datetime              m_lastClickTime;      // Last chart click time
    string                m_tempRectangleName;  // Temporary rectangle name
    
    // UI interaction
    bool                  m_uiEnabled;          // Whether UI is enabled
    ENUM_TIMEFRAMES       m_selectedTimeframe;  // Currently selected timeframe
    ENUM_TIMEFRAMES       m_zoneTradingTimeframe; // Trading timeframe for zone deactivation
    
    // Private helper methods
    string                GenerateZoneName();
    bool                  ValidateZoneParameters(double upper, double lower);
    void                  DrawTemporaryZone(double upper, double lower, ENUM_ZONE_TYPE type);
    void                  RemoveTemporaryZone();
    CTradingZone*         FindZoneByName(const string name);
    
public:
                          CZoneManager();
                         ~CZoneManager();
    
    // Initialization
    bool                  Initialize(CEntryManager* entryManager);
    bool                  Initialize(CEntryManager* entryManager, CAwesomeExpert* expert);
    void                  Deinitialize();
    
    // Zone management
    bool                  CreateZone(double upperPrice, double lowerPrice, ENUM_TIMEFRAMES timeframe);
    bool                  CreateZoneFromUI(double upperPrice, double lowerPrice);
    bool                  CreateZoneWithStartTime(double upperPrice, double lowerPrice, ENUM_TIMEFRAMES timeframe, datetime startTime);
    bool                  RemoveZone(const string name);
    bool                  RemoveZoneByIndex(int index);
    void                  RemoveAllZones();
    
    // Zone access
    int                   GetZoneCount() const { return m_zones.Total(); }
    CTradingZone*         GetZone(int index);
    CTradingZone*         GetZoneByName(const string name);
    CArrayObj*            GetAllZones() const { return m_zones; }
    
    // Zone processing
    void                  ProcessNewCandle(CCandle* candle);
    void                  CheckZoneActivation(CCandle* candle);
    void                  CheckZoneDeactivation(CCandle* candle);
    void                  ProcessZoneTriggers(CCandle* candle);
    void                  ExtendAllZonesToCurrentTime();
    
    // Trade management
    bool                  ExecuteZoneTrade(CTradingZone* zone, CCandle* candle);
    void                  UpdateZoneTrades();
    void                  OnTradeClose(ulong ticket, double profit, string strategyName = "");
    
    // UI interaction methods
    void                  SetCreationMode(ENUM_ZONE_CREATION_MODE mode);
    ENUM_ZONE_CREATION_MODE GetCreationMode() const { return m_creationMode; }
    void                  SetSelectedTimeframe(ENUM_TIMEFRAMES timeframe) { m_selectedTimeframe = timeframe; }
    ENUM_TIMEFRAMES       GetSelectedTimeframe() const { return m_selectedTimeframe; }
    
    // Zone trading timeframe management
    void                  SetZoneTradingTimeframe(ENUM_TIMEFRAMES timeframe) { m_zoneTradingTimeframe = timeframe; }
    ENUM_TIMEFRAMES       GetZoneTradingTimeframe() const { return m_zoneTradingTimeframe; }
    
    // Chart interaction
    bool                  HandleChartClick(int x, int y);
    void                  HandleChartObjectDelete(const string objectName);
    
    // Internal state for preventing auto-deletion during redraw
    bool                  m_isRedrawing;
    
    // Zone visualization
    void                  UpdateAllZoneVisualizations();
    void                  RefreshZoneDisplay();
    
    // Utility methods
    string                GetZoneList() const;
    void                  PrintZoneStatus();
    bool                  IsZoneNameUnique(const string name) const;
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CZoneManager::CZoneManager()
{
    m_zones = new CArrayObj();
    m_entryManager = NULL;
    m_expert = NULL;
    m_creationMode = ZONE_CREATE_NONE;
    m_nextZoneId = 1;
    m_tempUpperPrice = 0.0;
    m_tempLowerPrice = 0.0;
    m_isCreatingZone = false;
    m_lastClickTime = 0;
    m_tempRectangleName = "TempZoneRect";
    m_uiEnabled = true;
    m_selectedTimeframe = PERIOD_CURRENT;
    m_zoneTradingTimeframe = PERIOD_M1; // Default to M1 for trading timeframe
    m_isRedrawing = false;
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CZoneManager::~CZoneManager()
{
    Deinitialize();
    if (m_zones != NULL)
    {
        delete m_zones;
        m_zones = NULL;
    }
    m_expert = NULL;
}

//+------------------------------------------------------------------+
//| Initialize zone manager                                          |
//+------------------------------------------------------------------+
bool CZoneManager::Initialize(CEntryManager* entryManager)
{
    return Initialize(entryManager, NULL);
}

bool CZoneManager::Initialize(CEntryManager* entryManager, CAwesomeExpert* expertRef)
{
    if (entryManager == NULL)
    {
        Print("Error: EntryManager is NULL");
        return false;
    }
    
    m_entryManager = entryManager;
    m_expert = expertRef;
    RemoveTemporaryZone();
    
    Print("ZoneManager initialized successfully");
    return true;
}

//+------------------------------------------------------------------+
//| Deinitialize zone manager                                        |
//+------------------------------------------------------------------+
void CZoneManager::Deinitialize()
{
    RemoveAllZones();
    RemoveTemporaryZone();
    m_entryManager = NULL;
    m_expert = NULL;
}

//+------------------------------------------------------------------+
//| Generate unique zone name                                        |
//+------------------------------------------------------------------+
string CZoneManager::GenerateZoneName()
{
    string name;
    do
    {
        name = "Zone_" + IntegerToString(m_nextZoneId);
        m_nextZoneId++;
    }
    while (!IsZoneNameUnique(name));
    
    return name;
}

//+------------------------------------------------------------------+
//| Check if zone name is unique                                     |
//+------------------------------------------------------------------+
bool CZoneManager::IsZoneNameUnique(const string name) const
{
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL && zone.GetName() == name)
            return false;
    }
    return true;
}

//+------------------------------------------------------------------+
//| Validate zone parameters                                         |
//+------------------------------------------------------------------+
bool CZoneManager::ValidateZoneParameters(double upper, double lower)
{
    if (upper <= lower)
    {
        Print("Error: Upper price must be greater than lower price");
        return false;
    }
    
    if (upper <= 0 || lower <= 0)
    {
        Print("Error: Zone prices must be positive");
        return false;
    }
    
    // Minimum zone size: 1 pip (more reasonable for trading)
    double minZoneSize = 1 * _Point;
    if (upper - lower < minZoneSize)
    {
        Print("Error: Zone size too small. Minimum size: ", minZoneSize, ", Current size: ", (upper - lower));
        return false;
    }
    
    Print("Zone size validation passed: ", (upper - lower), " >= ", minZoneSize);
    
    return true;
}

//+------------------------------------------------------------------+
//| Create zone programmatically                                     |
//+------------------------------------------------------------------+
bool CZoneManager::CreateZone(double upperPrice, double lowerPrice, ENUM_TIMEFRAMES timeframe)
{
    if (!ValidateZoneParameters(upperPrice, lowerPrice))
        return false;
        
    string zoneName = GenerateZoneName();
    CTradingZone* zone = new CTradingZone(zoneName, upperPrice, lowerPrice, timeframe);
    
    if (!zone.IsValid())
    {
        delete zone;
        Print("Error: Created zone is invalid");
        return false;
    }
    
    m_zones.Add(zone);
    Print("Zone created: ", zone.ToString());
    return true;
}

//+------------------------------------------------------------------+
//| Create zone from UI interaction                                  |
//+------------------------------------------------------------------+
bool CZoneManager::CreateZoneFromUI(double upperPrice, double lowerPrice)
{
    return CreateZone(upperPrice, lowerPrice, m_selectedTimeframe);
}

//+------------------------------------------------------------------+
//| Create zone with specific start time                            |
//+------------------------------------------------------------------+
bool CZoneManager::CreateZoneWithStartTime(double upperPrice, double lowerPrice, ENUM_TIMEFRAMES timeframe, datetime startTime)
{
    if (!ValidateZoneParameters(upperPrice, lowerPrice))
        return false;
        
    string zoneName = GenerateZoneName();
    CTradingZone* zone = new CTradingZone(zoneName, upperPrice, lowerPrice, timeframe, false); // Don't auto-draw
    
    if (!zone.IsValid())
    {
        delete zone;
        Print("Error: Created zone is invalid");
        return false;
    }
    
    // Set the start time before drawing
    zone.SetStartTime(startTime);
    Print("Setting zone start time to: ", TimeToString(startTime));
    zone.DrawZone(); // Draw with correct start time
    
    m_zones.Add(zone);
    Print("Zone created with start time: ", zone.ToString(), " Start: ", TimeToString(startTime));
    return true;
}

//+------------------------------------------------------------------+
//| Remove zone by name                                              |
//+------------------------------------------------------------------+
bool CZoneManager::RemoveZone(const string name)
{
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL && zone.GetName() == name)
        {
            Print("Removing zone: ", zone.GetName());
            m_zones.Delete(i);
            return true;
        }
    }
    
    Print("Zone not found: ", name);
    return false;
}

//+------------------------------------------------------------------+
//| Remove zone by index                                             |
//+------------------------------------------------------------------+
bool CZoneManager::RemoveZoneByIndex(int index)
{
    if (index < 0 || index >= m_zones.Total())
        return false;
        
    CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(index));
    if (zone != NULL)
    {
        Print("Removing zone: ", zone.GetName());
        m_zones.Delete(index);
        return true;
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Remove all zones                                                 |
//+------------------------------------------------------------------+
void CZoneManager::RemoveAllZones()
{
    Print("Removing all zones (", m_zones.Total(), " zones)");
    m_zones.Clear();
}

//+------------------------------------------------------------------+
//| Get zone by index                                                |
//+------------------------------------------------------------------+
CTradingZone* CZoneManager::GetZone(int index)
{
    if (index < 0 || index >= m_zones.Total())
        return NULL;
        
    return dynamic_cast<CTradingZone*>(m_zones.At(index));
}

//+------------------------------------------------------------------+
//| Get zone by name                                                 |
//+------------------------------------------------------------------+
CTradingZone* CZoneManager::GetZoneByName(const string name)
{
    return FindZoneByName(name);
}

//+------------------------------------------------------------------+
//| Find zone by name (private helper)                              |
//+------------------------------------------------------------------+
CTradingZone* CZoneManager::FindZoneByName(const string name)
{
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL && zone.GetName() == name)
            return zone;
    }
    return NULL;
}


//+------------------------------------------------------------------+
//| Process new candle for all zones                                 |
//+------------------------------------------------------------------+
void CZoneManager::ProcessNewCandle(CCandle* candle)
{
    if (candle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ProcessNewCandle: Candle is NULL");
        return;
    }

    CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ProcessNewCandle: Called with candle time: " + TimeToString(candle.openTime) + ", close: " + DoubleToString(candle.close, _Digits) + ", Zone count: " + IntegerToString(m_zones.Total()));

    if (m_zones.Total() == 0)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ProcessNewCandle: No zones to process");
        return;
    }

    // Debug: Show all zones and their status
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL)
        {
            CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ProcessNewCandle: Zone " + IntegerToString(i) + ": " + zone.GetName() + ", Status: " + EnumToString(zone.GetStatus()) + ", Range: " + DoubleToString(zone.GetLowerPrice(), _Digits) + "-" + DoubleToString(zone.GetUpperPrice(), _Digits));
        }
    }
        
    CheckZoneActivation(candle);
    CheckZoneDeactivation(candle);
    ProcessZoneTriggers(candle);
    UpdateZoneTrades();
    ExtendAllZonesToCurrentTime(); // Extend zones with each new candle
}

//+------------------------------------------------------------------+
//| Check zone activation                                            |
//+------------------------------------------------------------------+
void CZoneManager::CheckZoneActivation(CCandle* candle)
{
    if (candle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "CheckZoneActivation: Candle is NULL");
        return;
    }
    
    CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "CheckZoneActivation: Called with candle High/Low: " + DoubleToString(candle.high, _Digits) + "/" + DoubleToString(candle.low, _Digits) + ", Zone count: " + IntegerToString(m_zones.Total()));
    
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL)
        {
            CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "CheckZoneActivation: Processing zone " + IntegerToString(i) + ": " + zone.GetName());
            zone.ShouldActivate(candle);
        }
        else
        {
            CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "CheckZoneActivation: Zone " + IntegerToString(i) + " is NULL!");
        }
    }
}

//+------------------------------------------------------------------+
//| Check zone deactivation                                          |
//+------------------------------------------------------------------+
void CZoneManager::CheckZoneDeactivation(CCandle* candle)
{
    if (candle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "CheckZoneDeactivation: Candle is NULL");
        return;
    }
    
    // Get trading timeframe candle for zone deactivation using ChartManager
    CCandle* tradingCandle = CChartManager::GetInstance().GetChart(_Symbol, m_zoneTradingTimeframe).getCandleAt(0);
    if (tradingCandle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_ERROR, "Error getting trading timeframe candle for zone deactivation");
        return;
    }
    
    CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "CheckZoneDeactivation: Using trading timeframe " + EnumToString(m_zoneTradingTimeframe) + ", close: " + DoubleToString(tradingCandle.close, _Digits));
    
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL)
        {
            // Use trading timeframe candle close price for deactivation
            zone.ShouldDeactivate(tradingCandle.close);
        }
    }
}

//+------------------------------------------------------------------+
//| Process zone triggers                                            |
//+------------------------------------------------------------------+
void CZoneManager::ProcessZoneTriggers(CCandle* candle)
{
    if (candle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ProcessZoneTriggers: Candle is NULL");
        return;
    }
    
    CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ProcessZoneTriggers: Processing " + IntegerToString(m_zones.Total()) + " zones");
    
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL && zone.ShouldTriggerTrade(candle))
        {
            CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ProcessZoneTriggers: Zone " + zone.GetName() + " triggered, executing trade");
            ExecuteZoneTrade(zone, candle);
        }
    }
}

//+------------------------------------------------------------------+
//| Execute trade for triggered zone                                 |
//+------------------------------------------------------------------+
bool CZoneManager::ExecuteZoneTrade(CTradingZone* zone, CCandle* candle)
{
    if (zone == NULL || candle == NULL)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ExecuteZoneTrade: Zone or candle is NULL");
        return false;
    }
    
    // Check if zone already has active trade
    if (zone.HasActiveTrade())
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ExecuteZoneTrade: Zone " + zone.GetName() + " already has active trade, skipping");
        return false;
    }
        
    bool isLong = (zone.GetZoneType() == ZONE_LONG);
    
    // Use the expert's EnterZoneTrade method if available, otherwise fallback to direct entry manager
    if (m_expert != NULL)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ExecuteZoneTrade: Using expert EnterZoneTrade method");
        
        // Mark zone as triggered to prevent duplicate trades
        zone.SetStatus(ZONE_TRIGGERED);
        
        bool tradeSuccess = m_expert.EnterZoneTrade(zone, isLong, candle);
        
        if (tradeSuccess)
        {
            // Keep zone in TRIGGERED state until trade is closed
            Print("Zone ", zone.GetName(), " - Trade executed successfully, zone blocked until trade closes");
        }
        else
        {
            // Reset zone to inactive if trade failed
            zone.SetStatus(ZONE_INACTIVE);
            Print("Zone ", zone.GetName(), " - Trade failed, zone reset to INACTIVE");
        }
        
        return tradeSuccess;
    }
    else if (m_entryManager != NULL)
    {
        CLogManager::GetInstance().LogMessage("CZoneManager", LL_DEBUG, "ExecuteZoneTrade: Using fallback EntryManager method");
        // Fallback to direct EntryManager usage (simplified version)
        double stopLoss = zone.CalculateStopLoss(candle, m_zoneTradingTimeframe);
        double entryPrice = 0.0;  // Market order
        double takeProfit = 0.0;  // Let framework calculate TP automatically
        
        string strategyName = "Zone_" + zone.GetName();
        
        Print("Executing zone trade (fallback): ", zone.GetName(), 
              " Entry: Market Order (0.0)", 
              " SL: ", stopLoss, 
              " TP: Auto-calculated",
              " Strategy: ", strategyName);
        
        // Note: This is a simplified fallback - the expert's method is preferred
        // EntryManager methods return void, not bool
        if (isLong)
        {
            m_entryManager.EnterLong(candle, entryPrice, stopLoss, takeProfit, EV_EMPTY, strategyName);
        }
        else
        {
            m_entryManager.EnterShort(candle, entryPrice, stopLoss, takeProfit, EV_EMPTY, strategyName);
        }
        
        // Mark zone as having active trade (will be managed by trade close events)
        zone.OnTradeExecuted(1);  // Dummy ticket, will be updated by trade system
        Print("Zone trade executed successfully for ", zone.GetName(), " - Zone now blocked until trade closes");
        
        return true;
    }
    
    Print("Error: No valid entry method available for zone trade");
    return false;
}

//+------------------------------------------------------------------+
//| Update zone trades status                                        |
//+------------------------------------------------------------------+
void CZoneManager::UpdateZoneTrades()
{
    // This method would check for closed trades and update zone status
    // Implementation depends on how trade tracking is handled in the main system
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL && zone.HasActiveTrade())
        {
            // Check if trade is still open
            // If closed, call OnTradeClose
        }
    }
}

//+------------------------------------------------------------------+
//| Handle trade close event                                         |
//+------------------------------------------------------------------+
void CZoneManager::OnTradeClose(ulong ticket, double profit, string strategyName = "")
{
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL && zone.HasActiveTrade())
        {
            // Check if this zone matches the strategy name
            if (strategyName != "" && strategyName != ("Zone_" + zone.GetName()))
                continue; // Skip zones that don't match the strategy
                
            // Reset the zone that matches the strategy name
            zone.OnTradeClosed(ticket);
            Print("Zone trade closed: ", zone.GetName(), " Profit: ", profit);
            break; // Only one zone should match the strategy name
        }
    }
}

//+------------------------------------------------------------------+
//| Set zone creation mode                                           |
//+------------------------------------------------------------------+
void CZoneManager::SetCreationMode(ENUM_ZONE_CREATION_MODE mode)
{
    m_creationMode = mode;
    m_isCreatingZone = false;
    RemoveTemporaryZone();
    
    string modeText = "None";
    if (mode == ZONE_CREATE_LONG) modeText = "Long";
    else if (mode == ZONE_CREATE_SHORT) modeText = "Short";
    
    Print("Zone creation mode set to: ", modeText);
}

//+------------------------------------------------------------------+
//| Handle chart click for zone creation                            |
//+------------------------------------------------------------------+
bool CZoneManager::HandleChartClick(int x, int y)
{
    if (m_creationMode == ZONE_CREATE_NONE)
        return false;
        
    datetime time;
    double price;
    int window;
    
    if (!ChartXYToTimePrice(0, x, y, window, time, price))
        return false;
        
    if (window != 0) // Only main chart window
        return false;
        
    if (!m_isCreatingZone)
    {
        // First click - set first boundary
        m_tempUpperPrice = price;
        m_tempLowerPrice = price;
        m_isCreatingZone = true;
        m_lastClickTime = time;
        Print("Zone creation started at price: ", price);
    }
    else
    {
        // Second click - complete zone creation
        double upper = MathMax(price, m_tempUpperPrice);
        double lower = MathMin(price, m_tempLowerPrice);
        
        if (CreateZoneFromUI(upper, lower))
        {
            Print("Zone created successfully");
        }
        
        RemoveTemporaryZone();
        m_isCreatingZone = false;
        SetCreationMode(ZONE_CREATE_NONE);
    }
    
    return true;
}

//+------------------------------------------------------------------+
//| Draw temporary zone during creation                              |
//+------------------------------------------------------------------+
void CZoneManager::DrawTemporaryZone(double upper, double lower, ENUM_ZONE_TYPE type)
{
    RemoveTemporaryZone();
    
    datetime currentTime = TimeCurrent();
    datetime endTime = currentTime + PeriodSeconds(PERIOD_H1) * 24;
    
    if (ObjectCreate(0, m_tempRectangleName, OBJ_RECTANGLE, 0, 
                     currentTime, lower, endTime, upper))
    {
        color tempColor = (type == ZONE_LONG) ? clrLightBlue : clrLightPink;
        ObjectSetInteger(0, m_tempRectangleName, OBJPROP_COLOR, tempColor);
        ObjectSetInteger(0, m_tempRectangleName, OBJPROP_FILL, true);
        ObjectSetInteger(0, m_tempRectangleName, OBJPROP_BACK, true);
        ObjectSetInteger(0, m_tempRectangleName, OBJPROP_SELECTABLE, false);
        ChartRedraw(0);
    }
}

//+------------------------------------------------------------------+
//| Remove temporary zone                                            |
//+------------------------------------------------------------------+
void CZoneManager::RemoveTemporaryZone()
{
    if (ObjectFind(0, m_tempRectangleName) >= 0)
    {
        ObjectDelete(0, m_tempRectangleName);
        ChartRedraw(0);
    }
}

//+------------------------------------------------------------------+
//| Handle chart object deletion                                     |
//+------------------------------------------------------------------+
void CZoneManager::HandleChartObjectDelete(const string objectName)
{
    // Temporarily disable automatic zone deletion when chart objects are removed
    // This prevents zones from being deleted during redrawing/updating
    
    // Only allow manual deletion via UI buttons

    /*
    // Check if a zone rectangle was deleted
    if (StringFind(objectName, "Zone_Rect_") == 0)
    {
        string zoneName = StringSubstr(objectName, 10); // Remove "Zone_Rect_" prefix
        Print("Chart object deleted - removing zone: ", zoneName);
        RemoveZone(zoneName);
    }
    */
}

//+------------------------------------------------------------------+
//| Update all zone visualizations                                   |
//+------------------------------------------------------------------+
void CZoneManager::UpdateAllZoneVisualizations()
{
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL)
        {
            zone.UpdateZoneVisualization();
        }
    }
}

//+------------------------------------------------------------------+
//| Refresh zone display                                             |
//+------------------------------------------------------------------+
void CZoneManager::RefreshZoneDisplay()
{
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL)
        {
            zone.DrawZone();
        }
    }
}

//+------------------------------------------------------------------+
//| Get list of all zones                                            |
//+------------------------------------------------------------------+
string CZoneManager::GetZoneList() const
{
    string list = "Zones (" + IntegerToString(m_zones.Total()) + "):\n";
    
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL)
        {
            list += IntegerToString(i + 1) + ". " + zone.ToString() + "\n";
        }
    }
    
    return list;
}

//+------------------------------------------------------------------+
//| Print zone status to log                                         |
//+------------------------------------------------------------------+
void CZoneManager::PrintZoneStatus()
{
    Print("=== Zone Manager Status ===");
    Print("Total zones: ", m_zones.Total());
    Print("Creation mode: ", EnumToString(m_creationMode));
    Print("Selected timeframe: ", EnumToString(m_selectedTimeframe));
    
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL)
        {
            Print(zone.ToString());
        }
    }
    Print("========================");
}

//+------------------------------------------------------------------+
//| Extend all zones to current time                                |
//+------------------------------------------------------------------+
void CZoneManager::ExtendAllZonesToCurrentTime()
{
    for (int i = 0; i < m_zones.Total(); i++)
    {
        CTradingZone* zone = dynamic_cast<CTradingZone*>(m_zones.At(i));
        if (zone != NULL)
        {
            zone.ExtendZoneToCurrentTime();
        }
    }
}

#endif // ZONE_MANAGER_MQH

