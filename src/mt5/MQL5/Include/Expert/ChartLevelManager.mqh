//+------------------------------------------------------------------+
//|                                            ChartLevelManager.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef CHART_LEVEL_MANAGER_MQH
#define CHART_LEVEL_MANAGER_MQH

#include <Expert\TradePanelConfig.mqh>

// Forward-Deklaration
class CTradePanel;
class CPriceCalculator;
class CUIManager;

class CChartLevelManager
{
private:
    CTradePanel*        m_panel;          // Referenz zum Hauptpanel
    
    // Selektions-Modi
    int                 m_selectionMode;   // Aktueller Selektionsmodus
    string              m_lastClickedTime; // Zeit des letzten Kerzenklicks
    int                 m_clickCount;      // Zählt die Klicks auf derselben Kerze
    
    // Hilfsfunktionen
    datetime            GetExactBarTime(datetime clickTime);
    double              GetCandlePriceLevel(datetime time, int clickCount, bool isLong);
    void                ProcessCandleClick(datetime time);
    
    // Level-Management
    void                UpdateLevelLine(datetime time, double price);
    void                RemoveLevelLine(const string& lineName);
    void                RemoveAllLevelLines();
    void                UpdateModeButtonsAppearance();
    void                UpdateStatusLabel();
    
    // Referenzen zu anderen Managern
    CUIManager*         m_uiManager;
    CPriceCalculator*   m_priceCalculator;

public:
                        CChartLevelManager();
                       ~CChartLevelManager();
    
    // Panel-Referenz setzen
    void                SetPanel(CTradePanel* panel) { m_panel = panel; }
    
    // Initialisierung
    bool                Initialize();
    
    // Event-Handling
    void                HandleChartClick(int x, int y);
    
    // Modus-Wechsel
    void                SetSelectionMode(int mode);
    int                 GetSelectionMode() const { return m_selectionMode; }
    
    // Level-Visualisierung
    void                UpdateLevelVisualizations();
    bool                IsLevelLineVisible(const string& lineName) const;
    
    // Setter für die Manager-Referenzen
    void                SetUIManager(CUIManager* uiManager) { m_uiManager = uiManager; }
    void                SetPriceCalculator(CPriceCalculator* priceCalculator) { m_priceCalculator = priceCalculator; }
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CChartLevelManager::CChartLevelManager()
{
    m_panel = NULL;
    m_selectionMode = MODE_NONE;
    m_lastClickedTime = "";
    m_clickCount = 0;
    m_uiManager = NULL;
    m_priceCalculator = NULL;
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CChartLevelManager::~CChartLevelManager()
{
    RemoveAllLevelLines();
}

//+------------------------------------------------------------------+
//| Initialize                                                       |
//+------------------------------------------------------------------+
bool CChartLevelManager::Initialize()
{
    // Entferne alle existierenden Level-Linien
    RemoveAllLevelLines();
    
    return true;
}

//+------------------------------------------------------------------+
//| Set Selection Mode                                               |
//+------------------------------------------------------------------+
void CChartLevelManager::SetSelectionMode(int mode)
{
    // Alte Level-Linien entfernen
    RemoveAllLevelLines();
    
    // Modus wechseln
    m_selectionMode = mode;
    m_lastClickedTime = "";
    m_clickCount = 0;
    
    // UI aktualisieren
    UpdateModeButtonsAppearance();
    
    // Wenn bereits Werte vorhanden sind, zeichne die entsprechenden Linien
    if(m_uiManager != NULL)
    {
        double entryPrice = m_uiManager.GetEntryPrice();
        double stopLoss = m_uiManager.GetStopLoss();
        double takeProfit = m_uiManager.GetTakeProfit();
        
        if(m_selectionMode == MODE_ENTRY && entryPrice > 0)
        {
            UpdateLevelLine(0, entryPrice);
        }
        else if(m_selectionMode == MODE_SL && stopLoss > 0)
        {
            UpdateLevelLine(0, stopLoss);
        }
        else if(m_selectionMode == MODE_TP && takeProfit > 0)
        {
            UpdateLevelLine(0, takeProfit);
        }
    }
    
    // In SetSelectionMode aufrufen:
    UpdateStatusLabel();
}

//+------------------------------------------------------------------+
//| Update Status Label                                              |
//+------------------------------------------------------------------+
void CChartLevelManager::UpdateStatusLabel(void)
{
    if(m_uiManager == NULL) return;
    
    string status = "";
    
    switch(m_selectionMode)
    {
        case MODE_SL:
            status = "Stop Loss selection mode active. Click on a candle to set level.";
            break;
        case MODE_TP:
            status = "Take Profit selection mode active. Click on a candle to set level.";
            break;
        case MODE_ENTRY:
            status = "Entry Price selection mode active. Click on a candle to set level.";
            break;
        default:
            status = "Ready";
            break;
    }
    
    m_uiManager.UpdateStatusLabel(status);
}

//+------------------------------------------------------------------+
//| Update Status Label                                              |
//+------------------------------------------------------------------+
void CChartLevelManager::UpdateStatusLabel()
{
    if(m_uiManager == NULL) return;
    
    string status = "";
    
    switch(m_selectionMode)
    {
        case MODE_SL:
            status = "Stop Loss selection mode active. Click on a candle to set level.";
            break;
        case MODE_TP:
            status = "Take Profit selection mode active. Click on a candle to set level.";
            break;
        case MODE_ENTRY:
            status = "Entry Price selection mode active. Click on a candle to set level.";
            break;
        default:
            status = "Ready";
            break;
    }
    
    m_uiManager.UpdateStatusLabel(status);
}

//+------------------------------------------------------------------+
//| Update Status Message                                            |
//+------------------------------------------------------------------+
void CChartLevelManager::UpdateStatusMessage()
{
    if(m_uiManager == NULL) return;
    
    string status = "";
    
    switch(m_selectionMode)
    {
        case MODE_SL:
            status = "Stop Loss selection mode active. Click on a candle to set level.";
            break;
        case MODE_TP:
            status = "Take Profit selection mode active. Click on a candle to set level.";
            break;
        case MODE_ENTRY:
            status = "Entry Price selection mode active. Click on a candle to set level.";
            break;
        default:
            status = "Ready";
            break;
    }
    
    m_uiManager.UpdateStatusLabel(status);
}

//+------------------------------------------------------------------+
//| Update Mode Buttons Appearance                                   |
//+------------------------------------------------------------------+
void CChartLevelManager::UpdateModeButtonsAppearance()
{
    if(m_uiManager == NULL) return;
    
    // Zurücksetzen aller Auswahl-Buttons
    m_uiManager.GetSLModeButton().ColorBackground(clrLightGray);
    m_uiManager.GetTPModeButton().ColorBackground(clrLightGray);
    m_uiManager.GetEntryModeButton().ColorBackground(clrLightGray);
   
    if(m_selectionMode == MODE_SL)
    {
        m_uiManager.GetSLModeButton().ColorBackground(clrLightSalmon);  // Rot für SL
    }
    else if(m_selectionMode == MODE_TP)
    {
        m_uiManager.GetTPModeButton().ColorBackground(clrLightGreen);  // Grün für TP
    }
    else if(m_selectionMode == MODE_ENTRY)
    {
        m_uiManager.GetEntryModeButton().ColorBackground(clrLightSkyBlue);  // Blau für Entry
    }
}

//+------------------------------------------------------------------+
//| Handle Chart Click                                               |
//+------------------------------------------------------------------+
void CChartLevelManager::HandleChartClick(int x, int y)
{
    if(m_selectionMode == MODE_NONE)
        return;
        
    datetime time;
    double price;
    int window;
    
    // Konvertiere Mausposition zu Chart-Koordinaten
    if(ChartXYToTimePrice(0, x, y, window, time, price))
    {
        if(window == 0)  // Main chart window
        {
            // Finde die tatsächliche Kerze an der geklickten Position
            datetime barTime = GetExactBarTime(time);
            
            if(barTime != 0)
            {
                ProcessCandleClick(barTime);
            }
            else
            {
                Print("Konnte keine gültige Kerze für die Zeit finden: ", TimeToString(time));
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Get the exact bar time for a clicked time position               |
//+------------------------------------------------------------------+
datetime CChartLevelManager::GetExactBarTime(datetime clickTime)
{
    // Aktuelle Zeitrahmen des Charts
    ENUM_TIMEFRAMES period = ChartPeriod(0);
    
    // Holen Sie sich die Bars um die geklickte Zeit herum
    MqlRates rates[];
    if(CopyRates(_Symbol, period, clickTime, 3, rates) < 3)
    {
        Print("Fehler beim Holen der Bars: ", GetLastError());
        return 0;
    }
    
    // Ermittle den Index der aktuellen Bar basierend auf der Klickposition
    // Prüfe, welche Bar die geklickte Zeit enthält
    for(int i = 0; i < ArraySize(rates); i++)
    {
        datetime startTime = rates[i].time;
        datetime endTime = (i < ArraySize(rates) - 1) ? rates[i+1].time : startTime + PeriodSeconds(period);
        
        // Wenn die geklickte Zeit innerhalb der Zeitspanne dieser Bar liegt
        if(clickTime >= startTime && clickTime < endTime)
        {
            Print("Gefundene Bar: ", TimeToString(startTime), ", Klick-Zeit: ", TimeToString(clickTime));
            return startTime;
        }
    }
    
    // Fallback: Wenn keine exakte Übereinstimmung gefunden wurde, 
    // verwende die nächstgelegene Bar
    return rates[1].time; // Mittlere Bar aus dem Array
}

//+------------------------------------------------------------------+
//| Process Candle Click                                             |
//+------------------------------------------------------------------+
void CChartLevelManager::ProcessCandleClick(datetime time)
{
    if(m_uiManager == NULL || m_priceCalculator == NULL) return;
    
    string timeStr = TimeToString(time, TIME_DATE | TIME_MINUTES);
    
    // Überprüfe, ob die selbe Kerze nochmals angeklickt wurde
    if(timeStr == m_lastClickedTime)
    {
        m_clickCount = (m_clickCount + 1) % 4;  // Zyklisch durch 0-3
    }
    else
    {
        m_lastClickedTime = timeStr;
        m_clickCount = 0;  // Zurücksetzen bei einer neuen Kerze
    }
    
    bool isLong = m_priceCalculator.IsLongPosition();
    
    // Hole den entsprechenden Preis-Level basierend auf Click-Count und Position
    double priceLevel = GetCandlePriceLevel(time, m_clickCount, isLong);
    
    // Überprüfe, ob der Preis-Level gültig ist
    if(priceLevel <= 0)
    {
        Print("Fehler: Ungültiger Preis-Level ermittelt: ", priceLevel);
        return;
    }
    
    // Aktualisiere die Anzeige
    UpdateLevelLine(time, priceLevel);
    
    // Aktualisiere das entsprechende Textfeld basierend auf dem aktuellen Modus
    if(m_selectionMode == MODE_SL)
    {
        m_uiManager.SetStopLoss(priceLevel);
        Print("Stop Loss gesetzt auf: ", priceLevel);
    }
    else if(m_selectionMode == MODE_TP)
    {
        m_uiManager.SetTakeProfit(priceLevel);
        Print("Take Profit gesetzt auf: ", priceLevel);
    }
    else if(m_selectionMode == MODE_ENTRY)
    {
        m_uiManager.SetEntryPrice(priceLevel);
        Print("Entry Price gesetzt auf: ", priceLevel);
    }
    
    // Prüfen, ob automatisch ein RR berechnet werden soll
    m_priceCalculator.UpdateRiskReward();
}

//+------------------------------------------------------------------+
//| Get Candle Price Level                                           |
//+------------------------------------------------------------------+
double CChartLevelManager::GetCandlePriceLevel(datetime time, int clickCount, bool isLong)
{
    MqlRates rates[];
    if(CopyRates(_Symbol, PERIOD_CURRENT, time, 1, rates) <= 0)
        return 0;
        
    double open = rates[0].open;
    double high = rates[0].high;
    double low = rates[0].low;
    double close = rates[0].close;
    
    double priceLevel = 0;
    
    // Preislevel basierend auf dem Selektionsmodus und Click-Count
    if(m_selectionMode == MODE_SL)
    {
        // SL Logic
        if(isLong)
        {
            // Long Position SL: Preise müssen unter dem Entry sein
            switch(clickCount)
            {
                case 0: priceLevel = low; break;              // Low
                case 1: priceLevel = MathMin(open, close); break; // Lower Body
                case 2: priceLevel = MathMax(open, close); break; // Upper Body
                case 3: priceLevel = high; break;             // High
            }
        }
        else
        {
            // Short Position SL: Preise müssen über dem Entry sein
            switch(clickCount)
            {
                case 0: priceLevel = high; break;             // High
                case 1: priceLevel = MathMax(open, close); break; // Upper Body
                case 2: priceLevel = MathMin(open, close); break; // Lower Body
                case 3: priceLevel = low; break;              // Low
            }
        }
    }
    else if(m_selectionMode == MODE_TP)
    {
        // TP Logic (umgekehrt zu SL)
        if(isLong)
        {
            // Long Position TP: Preise müssen über dem Entry sein
            switch(clickCount)
            {
                case 0: priceLevel = high; break;             // High
                case 1: priceLevel = MathMax(open, close); break; // Upper Body
                case 2: priceLevel = MathMin(open, close); break; // Lower Body
                case 3: priceLevel = low; break;              // Low
            }
        }
        else
        {
            // Short Position TP: Preise müssen unter dem Entry sein
            switch(clickCount)
            {
                case 0: priceLevel = low; break;              // Low
                case 1: priceLevel = MathMin(open, close); break; // Lower Body
                case 2: priceLevel = MathMax(open, close); break; // Upper Body
                case 3: priceLevel = high; break;             // High
            }
        }
    }
    else if(m_selectionMode == MODE_ENTRY)
    {
        // Entry Logic - Immer alle 4 Preislevels durchlaufen
        switch(clickCount)
        {
            case 0: priceLevel = low; break;              // Low
            case 1: priceLevel = MathMin(open, close); break; // Lower Body
            case 2: priceLevel = MathMax(open, close); break; // Upper Body
            case 3: priceLevel = high; break;             // High
        }
    }
    
    Print("GetCandlePriceLevel: Mode=", m_selectionMode, ", clickCount=", clickCount, ", isLong=", isLong, ", level=", priceLevel);
    return priceLevel;
}

//+------------------------------------------------------------------+
//| Update Level Line                                                |
//+------------------------------------------------------------------+
void CChartLevelManager::UpdateLevelLine(datetime time, double price)
{
    // Bestimme den Liniennamen basierend auf dem aktuellen Selektionsmodus
    string lineName;
    color lineColor;
    
    bool isLong = m_priceCalculator.IsLongPosition();
    
    switch(m_selectionMode)
    {
        case MODE_ENTRY:
            lineName = ENTRY_LEVEL_LINE_NAME;
            lineColor = ENTRY_LEVEL_COLOR;
            break;
        case MODE_SL:
            lineName = SL_LEVEL_LINE_NAME;
            lineColor = isLong ? SL_LONG_COLOR : SL_SHORT_COLOR;
            break;
        case MODE_TP:
            lineName = TP_LEVEL_LINE_NAME;
            lineColor = isLong ? TP_LONG_COLOR : TP_SHORT_COLOR;
            break;
        default:
            return; // Kein gültiger Modus
    }
    
    // Entferne ggf. vorhandene Linie
    RemoveLevelLine(lineName);
    
    // Erzeuge neue Linie
    if(!ObjectCreate(0, lineName, OBJ_HLINE, 0, 0, price))
    {
        Print("Fehler beim Erstellen der Level-Linie: ", GetLastError());
        return;
    }
    
    ObjectSetInteger(0, lineName, OBJPROP_COLOR, lineColor);
    ObjectSetInteger(0, lineName, OBJPROP_WIDTH, LEVEL_LINE_WIDTH);
    ObjectSetInteger(0, lineName, OBJPROP_STYLE, LEVEL_LINE_STYLE);
    ObjectSetInteger(0, lineName, OBJPROP_BACK, false);
    ObjectSetInteger(0, lineName, OBJPROP_SELECTABLE, false);
    
    // Aktualisiere Chart
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Remove Level Line                                                |
//+------------------------------------------------------------------+
void CChartLevelManager::RemoveLevelLine(const string& lineName)
{
    if(ObjectFind(0, lineName) >= 0)
    {
        ObjectDelete(0, lineName);
    }
}

//+------------------------------------------------------------------+
//| Remove All Level Lines                                           |
//+------------------------------------------------------------------+
void CChartLevelManager::RemoveAllLevelLines()
{
    RemoveLevelLine(ENTRY_LEVEL_LINE_NAME);
    RemoveLevelLine(SL_LEVEL_LINE_NAME);
    RemoveLevelLine(TP_LEVEL_LINE_NAME);
    
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Update Level Visualizations                                      |
//+------------------------------------------------------------------+
void CChartLevelManager::UpdateLevelVisualizations()
{
    if(m_uiManager == NULL || m_priceCalculator == NULL) return;
    
    double entryPrice = m_uiManager.GetEntryPrice();
    double stopLoss = m_uiManager.GetStopLoss();
    double takeProfit = m_uiManager.GetTakeProfit();
    
    // Aktualisiere Entry-Level-Linie
    if(entryPrice > 0 && (m_selectionMode == MODE_ENTRY || IsLevelLineVisible(ENTRY_LEVEL_LINE_NAME)))
    {
        UpdateLevelLine(0, entryPrice);
    }
    
    // Aktualisiere SL-Level-Linie
    if(stopLoss > 0 && (m_selectionMode == MODE_SL || IsLevelLineVisible(SL_LEVEL_LINE_NAME)))
    {
        UpdateLevelLine(0, stopLoss);
    }
    
    // Aktualisiere TP-Level-Linie
    if(takeProfit > 0 && (m_selectionMode == MODE_TP || IsLevelLineVisible(TP_LEVEL_LINE_NAME)))
    {
        UpdateLevelLine(0, takeProfit);
    }
}

//+------------------------------------------------------------------+
//| Is Level Line Visible                                            |
//+------------------------------------------------------------------+
bool CChartLevelManager::IsLevelLineVisible(const string& lineName) const
{
    return ObjectFind(0, lineName) >= 0;
}

#endif

