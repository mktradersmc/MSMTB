//+------------------------------------------------------------------+
//|                                                   TradePanel.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef TRADE_PANEL_MQH
#define TRADE_PANEL_MQH

#include <Controls\Dialog.mqh>
#include <Controls\Edit.mqh>
#include <Controls\Label.mqh>
#include <Controls\Button.mqh>
#include <Expert\Entry.mqh>
#include <Expert\EntryManager.mqh>
#include <Expert\TradePanelCalculations.mqh>

// Konstanten für das Layout
#define PANEL_WIDTH     700            // Erhöht für mehr Platz (von 620 auf 700)
#define MARGIN          10
#define LABEL_WIDTH     180           // Original Breite beibehalten
#define EDIT_WIDTH      150           // Original Breite beibehalten
#define ITEM_HEIGHT     30
#define BUTTON_WIDTH    240
#define BUTTON_HEIGHT   30
#define FIX_BUTTON_WIDTH 40           // Breite des "Fix"-Buttons
#define X_BUTTON_WIDTH  30            // Breite des X-Buttons
#define SELECT_BUTTON_WIDTH 140        
#define PANEL_HEIGHT    650
#define HALF_BUTTON_WIDTH 240
#define VISUAL_MODE_BUTTON_WIDTH 490  // Breite des "Visual Mode"-Buttons (angepasst)

// Control-IDs
#define ENTRY_PRICE_EDIT   1
#define STOP_LOSS_EDIT     2
#define RISK_REWARD_EDIT   3
#define RISK_PERCENTAGE_EDIT 4
#define TAKE_PROFIT_EDIT  5
#define LIMIT_ORDER_BUTTON 6
#define MARKET_ORDER_BUTTON 7
#define SL_MODE_BUTTON     8
#define TP_MODE_BUTTON     9
#define ENTRY_MODE_BUTTON  10         // Button für Entry-Auswahl
#define STATUS_LABEL       11
#define ENTRY_CLEAR_BUTTON 12
#define SL_CLEAR_BUTTON    13
#define TP_CLEAR_BUTTON    14
#define ENTRY_FIX_BUTTON   15         // Fix-Button für Entry
#define SL_FIX_BUTTON      16         // Fix-Button für SL
#define TP_FIX_BUTTON      17         // Fix-Button für TP
#define RR_FIX_BUTTON      18         // Fix-Button für RR
#define VISUAL_MODE_BUTTON 19         // Visual Mode Toggle Button

// Modus-Konstanten
#define MODE_NONE 0
#define MODE_SL   1
#define MODE_TP   2
#define MODE_ENTRY 3                  // Modus für Entry-Auswahl

// Fix-Status-Konstanten
#define FIX_NONE  0                    // Nichts fixiert
#define FIX_ENTRY 1                    // Entry fixiert
#define FIX_SL    2                    // Stop Loss fixiert
#define FIX_TP    4                    // Take Profit fixiert
#define FIX_RR    8                    // Risk Reward fixiert

// Level-Visualisierungs-Konstanten
#define LEVEL_LINE_WIDTH 2             // Breite der Level-Linien
#define LEVEL_LINE_STYLE STYLE_SOLID   // Stil der Level-Linien

// Farben für Level-Linien
#define ENTRY_LEVEL_COLOR clrRoyalBlue    // Farbe für Entry-Level
#define SL_LONG_COLOR     clrCrimson      // Farbe für SL bei Long-Position
#define SL_SHORT_COLOR    clrOrangeRed    // Farbe für SL bei Short-Position
#define TP_LONG_COLOR     clrForestGreen  // Farbe für TP bei Long-Position
#define TP_SHORT_COLOR    clrGreen        // Farbe für TP bei Short-Position

// Konstanten für die Linien-Namen
#define ENTRY_LINE_NAME "TP_EntryLine"
#define SL_LINE_NAME    "TP_StopLossLine"
#define TP_LINE_NAME    "TP_TakeProfitLine"

// Konstante für die Farbe der ausgewählten Linie
#define SELECTED_LINE_COLOR clrWhite

class CTradePanel : public CAppDialog
{
private:
    // Controls
    CEdit             m_entryPriceEdit;
    CEdit             m_stopLossEdit;
    CEdit             m_riskRewardEdit;
    CEdit             m_riskPercentageEdit;
    CEdit             m_takeProfitEdit;
    CEdit             m_lotSizeEdit;         // Lot Size Anzeige
    CButton           m_limitOrderButton;
    CButton           m_marketOrderButton;
    CButton           m_slModeButton;
    CButton           m_tpModeButton;
    CButton           m_entryModeButton;     // Button für Entry-Auswahl
    CButton           m_entryClearButton;    // X-Button für Entry
    CButton           m_slClearButton;       // X-Button für SL
    CButton           m_tpClearButton;       // X-Button für TP
    CButton           m_entryFixButton;      // Fix-Button für Entry
    CButton           m_slFixButton;         // Fix-Button für SL
    CButton           m_tpFixButton;         // Fix-Button für TP
    CButton           m_rrFixButton;         // Fix-Button für RR
    CButton           m_visualModeButton;    // Visual Mode Toggle Button
    CLabel            m_statusLabel;
    bool              m_initialized;
    
    // Fix-Status
    int               m_fixStatus;          // Kombinierter Fix-Status
    
    // Entry Manager und original Settings
    CEntryManager*    m_entryManager;
    CEntrySettings*   m_originalSettings;
    
    // Level-Selektions-Status
    int               m_selectionMode;
    string            m_lastClickedTime;
    int               m_clickCount;
    string            m_levelLineName;       // Name der aktuellen Level-Linie
    bool              m_linesAlwaysVisible;   // Steuert, ob Linien immer sichtbar sind
    bool              m_visualMode;           // Steuert den visuellen Modus (an/aus)
    string            m_selectedLineName;     // Name der aktuell ausgewählten Linie
    // Logische Kerzenpunkte für Replikation
    datetime          m_entryTime;
    int               m_entryLevel;
    datetime          m_slTime;
    int               m_slLevel;
    datetime          m_tpTime;
    int               m_tpLevel;
    bool              m_replicateTrades;      // Steuert, ob Trades repliziert werden sollen
    bool              m_isLongSequence;       // Eingefrorene Richtung während Kerzen-Klicks
    int               m_mouseX;               // Letzte bekannte X-Koordinate
    int               m_mouseY;               // Letzte bekannte Y-Koordinate


   
    // UI-Creation-Methoden
    bool              CreateLabels(void);
    bool              CreateEdits(void);
    bool              CreateButtons(void);
    
    // UI-Interaction-Methoden
    void              UpdateStatusLabel(const string& message);
    void              UpdateFixButtonsAppearance();
    void              ClearField(int fieldType);
    
    // Level-Management-Methoden
    datetime          GetExactBarTime(datetime clickTime);
    double            GetCandlePriceLevel(datetime time, int clickCount, bool isLong);
    void              ProcessCandleClick(datetime time);
    void              HandleChartClick(int x, int y);
    void              UpdateLevelLine(datetime time, double price);
    void              RemoveLevelLine(const string& lineName);
    void              RemoveAllLevelLines();
    void              UpdateModeButtonsAppearance();
    void              UpdateLevelVisualizations();
    bool              IsLevelLineVisible(const string& lineName) const;
    string            GetModeStatusText();
    void              SetLinesAlwaysVisible(bool visible);
public:
    void              BringToTop(void);

    // Methoden zur Linienverwaltung
    void              DrawAllPriceLines();
    void              UpdatePriceLine(const string& lineName, double price, color lineColor);
    void              HighlightSelectedLine();
    void              UpdateVisualModeButton();

    // Preis-Kalkulations-Methoden (delegated to CTradePanelCalculations)
    // Removed - now using static methods from CTradePanelCalculations
    
    // Trade-Funktionen
    void              ShowErrorMessage(const string& message);
    CEntry*           CreateTradeEntry();
    void              SaveCurrentSettings(void);
    void              RestoreSettings(void);
    void              PlaceOrder(bool isMarket);

public:
                      CTradePanel();
                     ~CTradePanel(void);
    
    // Initialisierung und Event-Handling
    bool              OnInit(const string name, CEntryManager* entryManager);
    void              OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam);
    bool              OnClickButton(const long id, const string& sparam);
    void              OnTick(void);  // Diese Methode wird vom EA OnTick aufgerufen
    
    // Getter/Setter für UI-Werte
    double            GetEntryPrice() const { return StringToDouble(m_entryPriceEdit.Text()); }
    double            GetStopLoss() const { return StringToDouble(m_stopLossEdit.Text()); }
    double            GetTakeProfit() const { return StringToDouble(m_takeProfitEdit.Text()); }
    double            GetRiskReward() const { return StringToDouble(m_riskRewardEdit.Text()); }
    double            GetRiskPercentage() const { return StringToDouble(m_riskPercentageEdit.Text()); }
    double            GetLotSize() const { return StringToDouble(m_lotSizeEdit.Text()); }
    
    void              SetEntryPrice(double price);
    void              SetStopLoss(double price);
    void              SetTakeProfit(double price);
    void              SetRiskReward(double rr) { m_riskRewardEdit.Text(DoubleToString(rr, 2)); }
    void              SetRiskPercentage(double percentage) { m_riskPercentageEdit.Text(DoubleToString(percentage, 2)); }
    void              SetLotSize(double lotSize) { m_lotSizeEdit.Text(DoubleToString(lotSize, 2)); }
    
    // Fix-Status-Methoden
    bool              IsEntryFixed() const { return (m_fixStatus & FIX_ENTRY) != 0; }
    bool              IsStopLossFixed() const { return (m_fixStatus & FIX_SL) != 0; }
    bool              IsTakeProfitFixed() const { return (m_fixStatus & FIX_TP) != 0; }
    bool              IsRiskRewardFixed() const { return (m_fixStatus & FIX_RR) != 0; }
    bool              IsVisualMode() const { return m_visualMode; }
    
    void              SetEntryFixed(bool fixed);
    void              SetStopLossFixed(bool fixed);
    void              SetTakeProfitFixed(bool fixed);
    void              SetRiskRewardFixed(bool fixed);
    void              SetVisualMode(bool enabled);
    void              SetLinesToBackground();
    
    // Fachlogik-Methoden
    bool              IsLongPosition();
    bool              IsLongPosition(double entryPrice, double stopLoss, double takeProfit);
    // ValidateTradeParameters method moved to CTradePanelCalculations
    void              UpdateRiskReward();
    void              CalculateMissingValues(bool isMarket = false);
    void              UpdateDynamicPrices();
    void              UpdateLotSizeDisplay();
    void              SetSelectionMode(int mode);
    int               GetSelectionMode() const { return m_selectionMode; }
    
    // Sonstige Methoden
    void              UpdateValues(void);
    bool              IsInitialized() { return m_initialized; };
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CTradePanel::CTradePanel()
{
    m_originalSettings = new CEntrySettings();
    m_initialized = false;
    m_selectionMode = MODE_NONE;
    m_lastClickedTime = "";
    m_clickCount = 0;
    m_levelLineName = "";
    m_fixStatus = FIX_NONE;
    m_linesAlwaysVisible = true;  // Standardmäßig immer sichtbar
    m_visualMode = true;         // Visueller Modus standardmäßig aktiviert
    m_selectedLineName = "";
    
    SaveCurrentSettings();
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CTradePanel::~CTradePanel(void)
{
    RemoveAllLevelLines();
    
    if(m_originalSettings != NULL)
    {
        delete m_originalSettings;
        m_originalSettings = NULL;
    }
}

//+------------------------------------------------------------------+
//| OnInit                                                           |
//+------------------------------------------------------------------+
bool CTradePanel::OnInit(const string name, CEntryManager* entryManager)
{
    m_entryManager = entryManager;
    
    // Dialog erstellen
    if(!Create(0, name, 0, 50, 50, 50 + PANEL_WIDTH, 50 + PANEL_HEIGHT))
        return false;
       
    // UI-Elemente erstellen
    if(!CreateLabels())
        return false;
    if(!CreateEdits())
        return false;
    if(!CreateButtons())
        return false;
    
    // Dialog in den Vordergrund bringen
    BringToTop();
        
    m_initialized = true;
    
    // Maus-Events aktivieren für Klick-Tracking auf Linien
    ChartSetInteger(0, CHART_EVENT_MOUSE_MOVE, true);
    
    return true;
}
//+------------------------------------------------------------------+
//| BringToTop - Bringt den Dialog in den Vordergrund                |
//+------------------------------------------------------------------+
void CTradePanel::BringToTop(void)
{
    // Dialog in den Vordergrund setzen durch Neu-Anzeige
    Hide();
    Show();
    
    // Alle bekannten Linien im Z-Order nach unten setzen
    SetLinesToBackground();
    
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| SetLinesToBackground - Setzt alle Linien in den Hintergrund      |
//+------------------------------------------------------------------+
void CTradePanel::SetLinesToBackground()
{
    // Setze die maximale Z-Order für den Dialog (höhere Zahlen = oben)
    int dialogZOrder = 1000;
    
    // Hole alle Chart-Objekte
    int total = ObjectsTotal(0, 0, -1);
    
    // Setze alle bekannten Linien und andere Chart-Objekte in den Hintergrund
    for(int i = 0; i < total; i++)
    {
        string objName = ObjectName(0, i);
        
        // Überprüfe, ob es sich um eine unserer Linien handelt
        bool isOurLine = false;
        
        if(objName == ENTRY_LINE_NAME || objName == SL_LINE_NAME || objName == TP_LINE_NAME)
            isOurLine = true;
        else if(StringFind(objName, "LevelLine_") == 0)
            isOurLine = true;
            
        // Wenn es sich um eine unserer Linien handelt, setze sie in den Hintergrund
        if(isOurLine)
        {
            // Setze die Z-Order der Linie auf einen niedrigeren Wert (0 = Hintergrund)
            ObjectSetInteger(0, objName, OBJPROP_ZORDER, 0);
            
            // Alternativ: Setze BACK-Eigenschaft auf true
            ObjectSetInteger(0, objName, OBJPROP_BACK, true);
        }
        // Wenn es ein DialogObject ist, bringe es in den Vordergrund
        else if(StringFind(objName, Name()) >= 0)
        {
            // Setze die Z-Order des Dialog-Objekts auf einen hohen Wert
            ObjectSetInteger(0, objName, OBJPROP_ZORDER, dialogZOrder);
            
            // Stelle sicher, dass es nicht im Hintergrund ist
            ObjectSetInteger(0, objName, OBJPROP_BACK, false);
        }
    }
}

//+------------------------------------------------------------------+
//| HandleChartClick                                                 |
//+------------------------------------------------------------------+
void CTradePanel::HandleChartClick(int x, int y)
{
    if(m_selectionMode == MODE_NONE)
        return;
    
    // Prüfen ob der Klick innerhalb des Dialog-Bereichs liegt
    int dialogLeft = Left();
    int dialogTop = Top();
    int dialogRight = dialogLeft + Width();
    int dialogBottom = dialogTop + Height();
    
    // Wenn der Klick innerhalb des Dialog-Bereichs liegt, ignoriere ihn
    if(x >= dialogLeft && x <= dialogRight && y >= dialogTop && y <= dialogBottom)
    {
        // CLogManager::GetInstance().LogMessage("CTradePanel", LL_DEBUG, "Klick innerhalb des Panels - wird für Level-Auswahl ignoriert");
        return;
    }
        
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
                CLogManager::GetInstance().LogMessage("CTradePanel", LL_ERROR, "Konnte keine gültige Kerze für die Zeit finden: " + TimeToString(time));
            }
        }
    }
}

//+------------------------------------------------------------------+
//| OnChartEvent                                                     |
//+------------------------------------------------------------------+
void CTradePanel::OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam)
{
    // Alle Events an den CAppDialog weiterleiten
    CAppDialog::ChartEvent(id, lparam, dparam, sparam);

    // Standard für Chart-Klicks in MQL ist ein eigenes Event
    if(id == CHARTEVENT_CLICK)
    {
        // Enforce Z-Order on click
        SetLinesToBackground();
        
        if(m_selectionMode != MODE_NONE)
        {
            // Koordinaten werden in lparam und dparam übergeben
            HandleChartClick((int)lparam, (int)dparam);
        }
    }
     
    // Maus-Koordinaten bei jeder Bewegung aktualisieren
    if(id == CHARTEVENT_MOUSE_MOVE)
    {
        m_mouseX = (int)lparam;
        m_mouseY = (int)dparam;
    }

    // Button click event eigene Behandlung
    if(id == CHARTEVENT_OBJECT_CLICK)
    {
        OnClickButton(lparam, sparam);
        
        // Wenn auf eine Preislinie geklickt wurde, dies als Chart-Klick behandeln
        if(m_selectionMode != MODE_NONE && (sparam == ENTRY_LINE_NAME || sparam == SL_LINE_NAME || sparam == TP_LINE_NAME))
        {
            HandleChartClick(m_mouseX, m_mouseY);
        }
    }
    
    // Behandlung von manuellen Eingaben in Edit-Feldern
    if(id == CHARTEVENT_OBJECT_ENDEDIT)
    {
        // Wenn ein Edit-Feld geändert wurde, aktualisieren wir die Berechnungen
        string name = sparam;
        if(StringFind(name, "EntryPriceEdit") >= 0 || 
           StringFind(name, "StopLossEdit") >= 0 || 
           StringFind(name, "TakeProfitEdit") >= 0 || 
           StringFind(name, "RiskRewardEdit") >= 0 ||
           StringFind(name, "RiskPercentageEdit") >= 0)
        {
            UpdateRiskReward();
            UpdateLotSizeDisplay();
            ChartRedraw(0);
        }
    }
}

//+------------------------------------------------------------------+
//| OnTick handler - called from EA                                  |
//+------------------------------------------------------------------+
void CTradePanel::OnTick(void)
{
    if(!m_initialized)
        return;
        
    // Aktualisiere Level basierend auf "Fix"-Status und aktuellen Marktpreisen
    UpdateDynamicPrices();
    
    // Aktualisiere Lot Size Anzeige
    UpdateLotSizeDisplay();
    
    // Aktualisiere Chart-Level-Visualisierung (permanente Linien)
    if(m_visualMode) {
        DrawAllPriceLines();
        // Stelle sicher, dass der Dialog immer im Vordergrund bleibt
        SetLinesToBackground();
    }
}

//+------------------------------------------------------------------+
//| CreateLabels                                                     |
//+------------------------------------------------------------------+
bool CTradePanel::CreateLabels(void)
{
    // Entry Price Label
    CLabel *entryPriceLabel = new CLabel();
    if(!entryPriceLabel.Create(0, Name() + "EntryPriceLabel", 0, 
                              MARGIN, MARGIN, MARGIN + LABEL_WIDTH, MARGIN + ITEM_HEIGHT))
        return false;
    if(!entryPriceLabel.Text("Entry Price:"))
        return false;
    if(!Add(entryPriceLabel))
        return false;
    
    // Stop Loss Label
    CLabel *stopLossLabel = new CLabel();
    if(!stopLossLabel.Create(0, Name() + "StopLossLabel", 0, 
                            MARGIN, MARGIN + ITEM_HEIGHT + MARGIN, MARGIN + LABEL_WIDTH, MARGIN + 2 * ITEM_HEIGHT + MARGIN))
        return false;
    if(!stopLossLabel.Text("Stop Loss:"))
        return false;
    if(!Add(stopLossLabel))
        return false;
    
    // Take Profit Label
    CLabel *takeProfitLabel = new CLabel();
    if(!takeProfitLabel.Create(0, Name() + "TakeProfitLabel", 0, 
                             MARGIN, MARGIN + 2 * (ITEM_HEIGHT + MARGIN), MARGIN + LABEL_WIDTH, MARGIN + 3 * ITEM_HEIGHT + 2 * MARGIN))
        return false;
    if(!takeProfitLabel.Text("Take Profit:"))
        return false;
    if(!Add(takeProfitLabel))
        return false;
    
    // Risk Reward Label
    CLabel *riskRewardLabel = new CLabel();
    if(!riskRewardLabel.Create(0, Name() + "RiskRewardLabel", 0, 
                             MARGIN, MARGIN + 3 * (ITEM_HEIGHT + MARGIN), MARGIN + LABEL_WIDTH, MARGIN + 4 * ITEM_HEIGHT + 3 * MARGIN))
        return false;
    if(!riskRewardLabel.Text("Risk Reward:"))
        return false;
    if(!Add(riskRewardLabel))
        return false;
    
    // Risk Percentage Label
    CLabel *riskPercentageLabel = new CLabel();
    if(!riskPercentageLabel.Create(0, Name() + "RiskPercentageLabel", 0, 
                                  MARGIN, MARGIN + 4 * (ITEM_HEIGHT + MARGIN), MARGIN + LABEL_WIDTH, MARGIN + 5 * ITEM_HEIGHT + 4 * MARGIN))
        return false;
    if(!riskPercentageLabel.Text("Risk in %:"))
        return false;
    if(!Add(riskPercentageLabel))
        return false;
    
    // Lot Size Label
    CLabel *lotSizeLabel = new CLabel();
    if(!lotSizeLabel.Create(0, Name() + "LotSizeLabel", 0, 
                           MARGIN, MARGIN + 5 * (ITEM_HEIGHT + MARGIN), MARGIN + LABEL_WIDTH, MARGIN + 6 * ITEM_HEIGHT + 5 * MARGIN))
        return false;
    if(!lotSizeLabel.Text("Lot Size:"))
        return false;
    if(!Add(lotSizeLabel))
        return false;
    
    // Status Label
    if(!m_statusLabel.Create(0, Name() + "StatusLabel", 0, 
                          MARGIN, PANEL_HEIGHT - ITEM_HEIGHT - MARGIN, PANEL_WIDTH - MARGIN, PANEL_HEIGHT - MARGIN))
        return false;
    if(!m_statusLabel.Text("Ready"))
        return false;
    if(!Add(&m_statusLabel))
        return false;
    
    return true;
}

//+------------------------------------------------------------------+
//| CreateEdits                                                      |
//+------------------------------------------------------------------+
bool CTradePanel::CreateEdits(void)
{
    // Position nach dem Label
    int x = MARGIN + LABEL_WIDTH + MARGIN;
    
    // Entry Price Edit
    if(!m_entryPriceEdit.Create(0, Name() + "EntryPriceEdit", 0, 
                               x, MARGIN, x + EDIT_WIDTH, MARGIN + ITEM_HEIGHT))
        return false;
    if(!m_entryPriceEdit.TextAlign(ALIGN_RIGHT))
        return false;
    if(!Add(&m_entryPriceEdit))
        return false;
    m_entryPriceEdit.Color(clrBlack);
    m_entryPriceEdit.ColorBackground(clrWhite);
    m_entryPriceEdit.ColorBorder(clrGray);
    
    // Stop Loss Edit
    if(!m_stopLossEdit.Create(0, Name() + "StopLossEdit", 0, 
                             x, MARGIN + ITEM_HEIGHT + MARGIN, x + EDIT_WIDTH, MARGIN + ITEM_HEIGHT + MARGIN + ITEM_HEIGHT))
        return false;
    if(!m_stopLossEdit.TextAlign(ALIGN_RIGHT))
        return false;
    if(!Add(&m_stopLossEdit))
        return false;
    m_stopLossEdit.Color(clrBlack);
    m_stopLossEdit.ColorBackground(clrWhite);
    m_stopLossEdit.ColorBorder(clrGray);
    
    // Take Profit Edit
    if(!m_takeProfitEdit.Create(0, Name() + "TakeProfitEdit", 0, 
                               x, MARGIN + 2 * (ITEM_HEIGHT + MARGIN), x + EDIT_WIDTH, MARGIN + 2 * (ITEM_HEIGHT + MARGIN) + ITEM_HEIGHT))
        return false;
    if(!m_takeProfitEdit.TextAlign(ALIGN_RIGHT))
        return false;
    if(!Add(&m_takeProfitEdit))
        return false;
    m_takeProfitEdit.Color(clrBlack);
    m_takeProfitEdit.ColorBackground(clrWhite);
    m_takeProfitEdit.ColorBorder(clrGray);
    
    // Risk Reward Edit
    if(!m_riskRewardEdit.Create(0, Name() + "RiskRewardEdit", 0, 
                               x, MARGIN + 3 * (ITEM_HEIGHT + MARGIN), x + EDIT_WIDTH, MARGIN + 3 * (ITEM_HEIGHT + MARGIN) + ITEM_HEIGHT))
        return false;
    if(!m_riskRewardEdit.TextAlign(ALIGN_RIGHT))
        return false;
    if(!m_riskRewardEdit.Text("3.0"))
        return false;
    if(!Add(&m_riskRewardEdit))
        return false;
    m_riskRewardEdit.Color(clrBlack);
    m_riskRewardEdit.ColorBackground(clrWhite);
    m_riskRewardEdit.ColorBorder(clrGray);
    
    // Risk Percentage Edit
    if(!m_riskPercentageEdit.Create(0, Name() + "RiskPercentageEdit", 0, 
                                   x, MARGIN + 4 * (ITEM_HEIGHT + MARGIN), x + EDIT_WIDTH, MARGIN + 4 * (ITEM_HEIGHT + MARGIN) + ITEM_HEIGHT))
        return false;
    if(!m_riskPercentageEdit.TextAlign(ALIGN_RIGHT))
        return false;
    if(!m_riskPercentageEdit.Text("0.35"))  // Default-Wert
        return false;
    if(!Add(&m_riskPercentageEdit))
        return false;
    m_riskPercentageEdit.Color(clrBlack);
    m_riskPercentageEdit.ColorBackground(clrWhite);
    m_riskPercentageEdit.ColorBorder(clrGray);
    
    // Lot Size Edit (Read-Only)
    if(!m_lotSizeEdit.Create(0, Name() + "LotSizeEdit", 0, 
                            x, MARGIN + 5 * (ITEM_HEIGHT + MARGIN), x + EDIT_WIDTH, MARGIN + 5 * (ITEM_HEIGHT + MARGIN) + ITEM_HEIGHT))
        return false;
    if(!m_lotSizeEdit.TextAlign(ALIGN_RIGHT))
        return false;
    if(!m_lotSizeEdit.Text("--"))
        return false;
    if(!Add(&m_lotSizeEdit))
        return false;
    m_lotSizeEdit.Color(clrBlack);
    m_lotSizeEdit.ColorBackground(clrLightGray);  // Grau für Read-Only
    m_lotSizeEdit.ColorBorder(clrGray);
    m_lotSizeEdit.ReadOnly(true);  // Read-Only setzen
    
    return true;
}

//+------------------------------------------------------------------+
//| CreateButtons                                                    |
//+------------------------------------------------------------------+
bool CTradePanel::CreateButtons(void)
{
    // Position nach dem Edit-Feld
    int fixButtonX = MARGIN + LABEL_WIDTH + MARGIN + EDIT_WIDTH + 2*MARGIN; // Mehr Abstand
    int xButtonX = fixButtonX + FIX_BUTTON_WIDTH + MARGIN;
    int selectButtonX = xButtonX + X_BUTTON_WIDTH + MARGIN;
    
    // Entry Buttons
    // Fix Button für Entry
    if(!m_entryFixButton.Create(0, Name() + "EntryFixBtn", 0, 
                              fixButtonX, MARGIN, fixButtonX + FIX_BUTTON_WIDTH, MARGIN + ITEM_HEIGHT))
        return false;
    if(!m_entryFixButton.Text("Fix"))
        return false;
    if(!Add(&m_entryFixButton))
        return false;
    m_entryFixButton.Color(clrBlack);
    m_entryFixButton.ColorBackground(clrLightGray);
    m_entryFixButton.ColorBorder(clrGray);
    
    // X-Button für Entry Price
    if(!m_entryClearButton.Create(0, Name() + "EntryClearBtn", 0, 
                                xButtonX, MARGIN, xButtonX + X_BUTTON_WIDTH, MARGIN + ITEM_HEIGHT))
        return false;
    if(!m_entryClearButton.Text("X"))
        return false;
    if(!Add(&m_entryClearButton))
        return false;
    m_entryClearButton.Color(clrBlack);
    m_entryClearButton.ColorBackground(clrLightGray);
    m_entryClearButton.ColorBorder(clrGray);
    
    // Auswahl-Button für Entry
    if(!m_entryModeButton.Create(0, Name() + "EntryModeBtn", 0, 
                              selectButtonX, MARGIN, selectButtonX + SELECT_BUTTON_WIDTH, MARGIN + ITEM_HEIGHT))
        return false;
    if(!m_entryModeButton.Text("Auswählen"))
        return false;
    if(!Add(&m_entryModeButton))
        return false;
    m_entryModeButton.Color(clrBlack);
    m_entryModeButton.ColorBackground(clrLightGray); // Grau statt hellblau
    m_entryModeButton.ColorBorder(clrGray);
    
    // Stop Loss Buttons
    // Fix Button für SL
    if(!m_slFixButton.Create(0, Name() + "SLFixBtn", 0, 
                           fixButtonX, MARGIN + ITEM_HEIGHT + MARGIN, fixButtonX + FIX_BUTTON_WIDTH, MARGIN + ITEM_HEIGHT + MARGIN + ITEM_HEIGHT))
        return false;
    if(!m_slFixButton.Text("Fix"))
        return false;
    if(!Add(&m_slFixButton))
        return false;
    m_slFixButton.Color(clrBlack);
    m_slFixButton.ColorBackground(clrLightGray);
    m_slFixButton.ColorBorder(clrGray);
    
    // X-Button für Stop Loss
    if(!m_slClearButton.Create(0, Name() + "SLClearBtn", 0, 
                             xButtonX, MARGIN + ITEM_HEIGHT + MARGIN, xButtonX + X_BUTTON_WIDTH, MARGIN + ITEM_HEIGHT + MARGIN + ITEM_HEIGHT))
        return false;
    if(!m_slClearButton.Text("X"))
        return false;
    if(!Add(&m_slClearButton))
        return false;
    m_slClearButton.Color(clrBlack);
    m_slClearButton.ColorBackground(clrLightGray);
    m_slClearButton.ColorBorder(clrGray);
    
    // Auswahl-Button für SL
    if(!m_slModeButton.Create(0, Name() + "SLModeBtn", 0, 
                            selectButtonX, MARGIN + ITEM_HEIGHT + MARGIN, selectButtonX + SELECT_BUTTON_WIDTH, MARGIN + ITEM_HEIGHT + MARGIN + ITEM_HEIGHT))
        return false;
    if(!m_slModeButton.Text("Auswählen"))
        return false;
    if(!Add(&m_slModeButton))
        return false;
    m_slModeButton.Color(clrBlack);
    m_slModeButton.ColorBackground(clrLightGray);
    m_slModeButton.ColorBorder(clrGray);
    
    // Take Profit Buttons
    // Fix Button für TP
    if(!m_tpFixButton.Create(0, Name() + "TPFixBtn", 0, 
                           fixButtonX, MARGIN + 2 * (ITEM_HEIGHT + MARGIN), fixButtonX + FIX_BUTTON_WIDTH, MARGIN + 2 * (ITEM_HEIGHT + MARGIN) + ITEM_HEIGHT))
        return false;
    if(!m_tpFixButton.Text("Fix"))
        return false;
    if(!Add(&m_tpFixButton))
        return false;
    m_tpFixButton.Color(clrBlack);
    m_tpFixButton.ColorBackground(clrLightGray);
    m_tpFixButton.ColorBorder(clrGray);
    
    // X-Button für Take Profit
    if(!m_tpClearButton.Create(0, Name() + "TPClearBtn", 0, 
                             xButtonX, MARGIN + 2 * (ITEM_HEIGHT + MARGIN), xButtonX + X_BUTTON_WIDTH, MARGIN + 2 * (ITEM_HEIGHT + MARGIN) + ITEM_HEIGHT))
        return false;
    if(!m_tpClearButton.Text("X"))
        return false;
    if(!Add(&m_tpClearButton))
        return false;
    m_tpClearButton.Color(clrBlack);
    m_tpClearButton.ColorBackground(clrLightGray);
    m_tpClearButton.ColorBorder(clrGray);
    
    // Auswahl-Button für TP
    if(!m_tpModeButton.Create(0, Name() + "TPModeBtn", 0, 
                            selectButtonX, MARGIN + 2 * (ITEM_HEIGHT + MARGIN), selectButtonX + SELECT_BUTTON_WIDTH, MARGIN + 2 * (ITEM_HEIGHT + MARGIN) + ITEM_HEIGHT))
        return false;
    if(!m_tpModeButton.Text("Auswählen"))
        return false;
    if(!Add(&m_tpModeButton))
        return false;
    m_tpModeButton.Color(clrBlack);
    m_tpModeButton.ColorBackground(clrLightGray);
    m_tpModeButton.ColorBorder(clrGray);
    
    // Fix Button für RR
    if(!m_rrFixButton.Create(0, Name() + "RRFixBtn", 0, 
                           fixButtonX, MARGIN + 3 * (ITEM_HEIGHT + MARGIN), fixButtonX + FIX_BUTTON_WIDTH, MARGIN + 3 * (ITEM_HEIGHT + MARGIN) + ITEM_HEIGHT))
        return false;
    if(!m_rrFixButton.Text("Fix"))
        return false;
    if(!Add(&m_rrFixButton))
        return false;
    m_rrFixButton.Color(clrBlack);
    m_rrFixButton.ColorBackground(clrLightGray);
    m_rrFixButton.ColorBorder(clrGray);
    
    // Limit Order Button (eine Zeile tiefer wegen Lot Size)
    int orderButtonY = MARGIN + 6 * (ITEM_HEIGHT + MARGIN) + MARGIN;
    if(!m_limitOrderButton.Create(0, Name() + "LimitOrderBtn", 0, 
                                MARGIN, orderButtonY, MARGIN + BUTTON_WIDTH, orderButtonY + BUTTON_HEIGHT))
        return false;
    if(!m_limitOrderButton.Text("Limit Order"))
        return false;
    if(!Add(&m_limitOrderButton))
        return false;
    m_limitOrderButton.Color(clrBlack);
    m_limitOrderButton.ColorBackground(clrLightGray);
    m_limitOrderButton.ColorBorder(clrGray);
    
    // Market Order Button
    if(!m_marketOrderButton.Create(0, Name() + "MarketOrderBtn", 0, 
                                 MARGIN + BUTTON_WIDTH + MARGIN, orderButtonY, MARGIN + 2*BUTTON_WIDTH + MARGIN, orderButtonY + BUTTON_HEIGHT))
        return false;
    if(!m_marketOrderButton.Text("Market Order"))
        return false;
    if(!Add(&m_marketOrderButton))
        return false;
    m_marketOrderButton.Color(clrBlack);
    m_marketOrderButton.ColorBackground(clrLightGray);
    m_marketOrderButton.ColorBorder(clrGray);
    
    // Visual Mode Button - unter den Order Buttons, volle Breite von Limit Order bis Market Order
    int visualButtonY = orderButtonY + BUTTON_HEIGHT + MARGIN;
    if(!m_visualModeButton.Create(0, Name() + "VisualModeBtn", 0, 
                                MARGIN, visualButtonY, MARGIN + VISUAL_MODE_BUTTON_WIDTH, visualButtonY + BUTTON_HEIGHT))
        return false;
    if(!m_visualModeButton.Text("Visual: ON"))
        return false;
    if(!Add(&m_visualModeButton))
        return false;
    m_visualModeButton.Color(clrBlack);
    m_visualModeButton.ColorBackground(clrPaleGreen);
    m_visualModeButton.ColorBorder(clrGray);
    
    return true;
}

//+------------------------------------------------------------------+
//| OnClickButton                                                    |
//+------------------------------------------------------------------+
bool CTradePanel::OnClickButton(const long id, const string& sparam)
{
    // Buttonnamen
    string entryModeButtonName = Name() + "EntryModeBtn";
    string slModeButtonName = Name() + "SLModeBtn";
    string tpModeButtonName = Name() + "TPModeBtn";
    string entryClearButtonName = Name() + "EntryClearBtn";
    string slClearButtonName = Name() + "SLClearBtn";
    string tpClearButtonName = Name() + "TPClearBtn";
    string entryFixButtonName = Name() + "EntryFixBtn";
    string slFixButtonName = Name() + "SLFixBtn";
    string tpFixButtonName = Name() + "TPFixBtn";
    string rrFixButtonName = Name() + "RRFixBtn";
    string limitOrderButtonName = Name() + "LimitOrderBtn";
    string marketOrderButtonName = Name() + "MarketOrderBtn";
    string visualModeButtonName = Name() + "VisualModeBtn";
    
    // Mode-Buttons
    if(sparam == entryModeButtonName)
    {
        if(m_selectionMode == MODE_ENTRY)
            SetSelectionMode(MODE_NONE);
        else
            SetSelectionMode(MODE_ENTRY);
        return true;
    }
    else if(sparam == slModeButtonName)
    {
        if(m_selectionMode == MODE_SL)
            SetSelectionMode(MODE_NONE);
        else
            SetSelectionMode(MODE_SL);
        return true;
    }
    else if(sparam == tpModeButtonName)
    {
        if(m_selectionMode == MODE_TP)
            SetSelectionMode(MODE_NONE);
        else
            SetSelectionMode(MODE_TP);
        return true;
    }
    // Clear-Buttons
    else if(sparam == entryClearButtonName)
    {
        ClearField(ENTRY_PRICE_EDIT);
        return true;
    }
    else if(sparam == slClearButtonName)
    {
        ClearField(STOP_LOSS_EDIT);
        return true;
    }
    else if(sparam == tpClearButtonName)
    {
        ClearField(TAKE_PROFIT_EDIT);
        return true;
    }
    // Fix-Buttons
    else if(sparam == entryFixButtonName)
    {
        SetEntryFixed(!IsEntryFixed());
        return true;
    }
    else if(sparam == slFixButtonName)
    {
        SetStopLossFixed(!IsStopLossFixed());
        return true;
    }
    else if(sparam == tpFixButtonName)
    {
        SetTakeProfitFixed(!IsTakeProfitFixed());
        return true;
    }
    else if(sparam == rrFixButtonName)
    {
        SetRiskRewardFixed(!IsRiskRewardFixed());
        return true;
    }
    // Visual Mode Button
    else if(sparam == visualModeButtonName)
    {
        SetVisualMode(!IsVisualMode());
        return true;
    }
    // Order-Buttons
    else if(sparam == limitOrderButtonName)
    {
        Print("Trade Panel: Limit Order Button clicked");
        PlaceOrder(false); // Limit Order
        return true;
    }
    else if(sparam == marketOrderButtonName)
    {
        Print("Trade Panel: Market Order Button clicked");
        PlaceOrder(true); // Market Order
        return true;
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Set Visual Mode                                                  |
//+------------------------------------------------------------------+
void CTradePanel::SetVisualMode(bool enabled)
{
    m_visualMode = enabled;
    
    // Aktualisiere Button-Text und -Farbe
    if(enabled)
    {
        m_visualModeButton.Text("Visual: ON");
        m_visualModeButton.ColorBackground(clrPaleGreen);
        
        // Zeige alle Linien an
        DrawAllPriceLines();
    }
    else
    {
        m_visualModeButton.Text("Visual: OFF");
        m_visualModeButton.ColorBackground(clrLightGray);
        
        // Entferne alle Linien
        RemoveLevelLine(ENTRY_LINE_NAME);
        RemoveLevelLine(SL_LINE_NAME);
        RemoveLevelLine(TP_LINE_NAME);
        RemoveAllLevelLines();
    }
    
    // Stelle sicher, dass der Dialog im Vordergrund bleibt
    BringToTop();
    
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Update Visual Mode Button                                        |
//+------------------------------------------------------------------+
void CTradePanel::UpdateVisualModeButton()
{
    if(m_visualMode)
    {
        m_visualModeButton.Text("Visual: ON");
        m_visualModeButton.ColorBackground(clrPaleGreen);
    }
    else
    {
        m_visualModeButton.Text("Visual: OFF");
        m_visualModeButton.ColorBackground(clrLightGray);
    }
}

//+------------------------------------------------------------------+
//| Get the exact bar time for a clicked time position               |
//+------------------------------------------------------------------+
datetime CTradePanel::GetExactBarTime(datetime clickTime)
{
    // Ermittle den Index der Bar an der geklickten Zeitposition
    int barIndex = iBarShift(_Symbol, PERIOD_CURRENT, clickTime, false);
    
    // Ermittle die exakte Startzeit dieser Bar
    datetime barTime = iTime(_Symbol, PERIOD_CURRENT, barIndex);
    
    // Fallback falls Fehler
    if(barTime == 0) return clickTime;
    
    return barTime;
}

//+------------------------------------------------------------------+
//| Process Candle Click                                             |
//+------------------------------------------------------------------+
void CTradePanel::ProcessCandleClick(datetime time)
{
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
        
        // Richtung beim ersten Klick auf neue Kerze festlegen/einfrieren
        m_isLongSequence = IsLongPosition();
    }
    
    bool isLong = m_isLongSequence;
    
    // Preislevel berechnen
    double priceLevel = GetCandlePriceLevel(time, m_clickCount, isLong);
    
    // Überprüfe, ob der Preis-Level gültig ist
    if(priceLevel <= 0)
    {
        Print("Fehler: Ungültiger Preis-Level ermittelt für Zeit ", time);
        return;
    }

    // Logische Daten speichern
    if(m_selectionMode == MODE_ENTRY)
    {
        m_entryTime = time;
        m_entryLevel = m_clickCount;
    }
    else if(m_selectionMode == MODE_SL)
    {
        m_slTime = time;
        m_slLevel = m_clickCount;
    }
    else if(m_selectionMode == MODE_TP)
    {
        m_tpTime = time;
        m_tpLevel = m_clickCount;
    }
    
    // Update der visuellen Linien
    string lineName = "";
    color lineColor = clrNONE;
    if(m_selectionMode == MODE_ENTRY) { lineName = ENTRY_LINE_NAME; lineColor = ENTRY_LEVEL_COLOR; }
    else if(m_selectionMode == MODE_SL) { lineName = SL_LINE_NAME; lineColor = IsLongPosition() ? SL_LONG_COLOR : SL_SHORT_COLOR; }
    else if(m_selectionMode == MODE_TP) { lineName = TP_LINE_NAME; lineColor = IsLongPosition() ? TP_LONG_COLOR : TP_SHORT_COLOR; }
    
    if(lineName != "")
        UpdatePriceLine(lineName, priceLevel, lineColor);
    
    // Aktualisiere die Anzeige (auch wenn Visual Mode aus ist)
    UpdateLevelLine(time, priceLevel);
    
    // Aktualisiere das entsprechende Textfeld basierend auf dem aktuellen Modus
    if(m_selectionMode == MODE_SL)
    {
        SetStopLoss(priceLevel);
        CLogManager::GetInstance().LogMessage("CTradePanel", LL_INFO, "Stop Loss gesetzt auf: " + DoubleToString(priceLevel, _Digits));
    }
    else if(m_selectionMode == MODE_TP)
    {
        SetTakeProfit(priceLevel);
        CLogManager::GetInstance().LogMessage("CTradePanel", LL_INFO, "Take Profit gesetzt auf: " + DoubleToString(priceLevel, _Digits));
    }
    else if(m_selectionMode == MODE_ENTRY)
    {
        SetEntryPrice(priceLevel);
        CLogManager::GetInstance().LogMessage("CTradePanel", LL_INFO, "Entry Price gesetzt auf: " + DoubleToString(priceLevel, _Digits));
    }
    
    // Prüfen, ob automatisch ein RR berechnet werden soll
    UpdateRiskReward();
    UpdateLotSizeDisplay();
}

//+------------------------------------------------------------------+
//| Get Candle Price Level                                           |
//+------------------------------------------------------------------+
double CTradePanel::GetCandlePriceLevel(datetime time, int clickCount, bool isLong)
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
    
    CLogManager::GetInstance().LogMessage("CTradePanel", LL_DEBUG, "GetCandlePriceLevel: Mode=" + (string)m_selectionMode + ", clickCount=" + (string)clickCount + ", isLong=" + (string)isLong + ", level=" + DoubleToString(priceLevel, _Digits));
    return priceLevel;
}

//+------------------------------------------------------------------+
//| Draw All Price Lines                                             |
//+------------------------------------------------------------------+
void CTradePanel::DrawAllPriceLines()
{
    if(!m_linesAlwaysVisible || !m_visualMode)
        return;
        
    double entryPrice = GetEntryPrice();
    double stopLoss = GetStopLoss();
    double takeProfit = GetTakeProfit();
    bool isLong = IsLongPosition();
    
    // Entry Line zeichnen (wenn Wert vorhanden)
    if(entryPrice > 0)
    {
        UpdatePriceLine(ENTRY_LINE_NAME, entryPrice, ENTRY_LEVEL_COLOR);
    }
    else
    {
        // Entfernen, wenn kein Wert vorhanden
        RemoveLevelLine(ENTRY_LINE_NAME);
    }
    
    // Stop Loss Line zeichnen (wenn Wert vorhanden)
    if(stopLoss > 0)
    {
        color slColor = isLong ? SL_LONG_COLOR : SL_SHORT_COLOR;
        UpdatePriceLine(SL_LINE_NAME, stopLoss, slColor);
    }
    else
    {
        RemoveLevelLine(SL_LINE_NAME);
    }
    
    // Take Profit Line zeichnen (wenn Wert vorhanden)
    if(takeProfit > 0)
    {
        color tpColor = isLong ? TP_LONG_COLOR : TP_SHORT_COLOR;
        UpdatePriceLine(TP_LINE_NAME, takeProfit, tpColor);
    }
    else
    {
        RemoveLevelLine(TP_LINE_NAME);
    }
    
    // Hervorheben der ausgewählten Linie
    HighlightSelectedLine();
    
    ChartRedraw(0);
}

void CTradePanel::SetLinesAlwaysVisible(bool visible)
{
    m_linesAlwaysVisible = visible;
    
    if(!visible)
    {
        // Alle permanenten Linien entfernen
        RemoveLevelLine(ENTRY_LINE_NAME);
        RemoveLevelLine(SL_LINE_NAME);
        RemoveLevelLine(TP_LINE_NAME);
    }
    else
    {
        // Alle Linien neu zeichnen
        DrawAllPriceLines();
    }
}

void CTradePanel::SetEntryPrice(double price) 
{ 
    m_entryPriceEdit.Text(DoubleToString(price, _Digits)); 
    
    // Aktualisiere Entry-Linie
    if(m_visualMode && m_linesAlwaysVisible && price > 0)
    {
        UpdatePriceLine(ENTRY_LINE_NAME, price, ENTRY_LEVEL_COLOR);
        HighlightSelectedLine();
        ChartRedraw(0);
    }
    else if(price <= 0)
    {
        RemoveLevelLine(ENTRY_LINE_NAME);
    }
}

void CTradePanel::SetStopLoss(double price) 
{ 
    m_stopLossEdit.Text(DoubleToString(price, _Digits)); 
    
    // Aktualisiere SL-Linie
    if(m_visualMode && m_linesAlwaysVisible && price > 0)
    {
        bool isLong = IsLongPosition();
        color slColor = isLong ? SL_LONG_COLOR : SL_SHORT_COLOR;
        UpdatePriceLine(SL_LINE_NAME, price, slColor);
        HighlightSelectedLine();
        ChartRedraw(0);
    }
    else if(price <= 0)
    {
        RemoveLevelLine(SL_LINE_NAME);
    }
}

void CTradePanel::SetTakeProfit(double price) 
{ 
    m_takeProfitEdit.Text(DoubleToString(price, _Digits)); 
    
    // Aktualisiere TP-Linie
    if(m_visualMode && m_linesAlwaysVisible && price > 0)
    {
        bool isLong = IsLongPosition();
        color tpColor = isLong ? TP_LONG_COLOR : TP_SHORT_COLOR;
        UpdatePriceLine(TP_LINE_NAME, price, tpColor);
        HighlightSelectedLine();
        ChartRedraw(0);
    }
    else if(price <= 0)
    {
        RemoveLevelLine(TP_LINE_NAME);
    }
}

//+------------------------------------------------------------------+
//| UpdatePriceLine                                                  |
//+------------------------------------------------------------------+
void CTradePanel::UpdatePriceLine(const string& lineName, double price, color lineColor)
{
    if(ObjectFind(0, lineName) < 0)
    {
        // Linie existiert nicht, erstellen
        if(!ObjectCreate(0, lineName, OBJ_HLINE, 0, 0, price))
        {
            Print("Fehler beim Erstellen der Linie ", lineName, ": ", GetLastError());
            return;
        }
    }
    else
    {
        // Linie existiert, aktualisieren
        ObjectMove(0, lineName, 0, 0, price);
    }
    
    // Eigenschaften setzen
    ObjectSetInteger(0, lineName, OBJPROP_COLOR, lineColor);
    ObjectSetInteger(0, lineName, OBJPROP_WIDTH, LEVEL_LINE_WIDTH);
    ObjectSetInteger(0, lineName, OBJPROP_STYLE, LEVEL_LINE_STYLE);
    
    // Sende Linie in den Hintergrund
    ObjectSetInteger(0, lineName, OBJPROP_BACK, true);
    ObjectSetInteger(0, lineName, OBJPROP_ZORDER, 0);  // Niedrigste Z-Order
    
    ObjectSetInteger(0, lineName, OBJPROP_SELECTABLE, false);
    
    // Beschriftung der Linie hinzufügen
    string labelText = "";
    if(lineName == ENTRY_LINE_NAME) labelText = "Entry";
    else if(lineName == SL_LINE_NAME) labelText = "SL";
    else if(lineName == TP_LINE_NAME) labelText = "TP";
    
    ObjectSetString(0, lineName, OBJPROP_TEXT, labelText);
}

//+------------------------------------------------------------------+
//| Highlight Selected Line                                          |
//+------------------------------------------------------------------+
void CTradePanel::HighlightSelectedLine()
{
    if(!m_visualMode)
        return;
        
    // Bestimmen Sie, welche Linie basierend auf dem Selektionsmodus ausgewählt ist
    string selectedLine = "";
    
    if(m_selectionMode == MODE_ENTRY)
    {
        selectedLine = ENTRY_LINE_NAME;
    }
    else if(m_selectionMode == MODE_SL)
    {
        selectedLine = SL_LINE_NAME;
    }
    else if(m_selectionMode == MODE_TP)
    {
        selectedLine = TP_LINE_NAME;
    }
    
    // Wenn eine Linie ausgewählt ist und sie existiert, heben Sie sie hervor
    if(selectedLine != "" && ObjectFind(0, selectedLine) >= 0)
    {
        ObjectSetInteger(0, selectedLine, OBJPROP_COLOR, SELECTED_LINE_COLOR);
        ObjectSetInteger(0, selectedLine, OBJPROP_WIDTH, LEVEL_LINE_WIDTH + 1);  // Etwas dicker machen
        m_selectedLineName = selectedLine;
    }
}

//+------------------------------------------------------------------+
//| Set Selection Mode                                               |
//+------------------------------------------------------------------+
void CTradePanel::SetSelectionMode(int mode)
{
    // Alte temporäre Level-Linien entfernen
    if(m_levelLineName != "")
    {
        RemoveLevelLine(m_levelLineName);
        m_levelLineName = "";
    }
    
    // Entferne Hervorhebung der vorherigen ausgewählten Linie
    if(m_visualMode && m_selectedLineName != "" && ObjectFind(0, m_selectedLineName) >= 0)
    {
        // Setze Farbe zurück
        bool isLong = IsLongPosition();
        color lineColor;
        
        if(m_selectedLineName == ENTRY_LINE_NAME)
        {
            lineColor = ENTRY_LEVEL_COLOR;
        }
        else if(m_selectedLineName == SL_LINE_NAME)
        {
            lineColor = isLong ? SL_LONG_COLOR : SL_SHORT_COLOR;
        }
        else if(m_selectedLineName == TP_LINE_NAME)
        {
            lineColor = isLong ? TP_LONG_COLOR : TP_SHORT_COLOR;
        }
        
        ObjectSetInteger(0, m_selectedLineName, OBJPROP_COLOR, lineColor);
        ObjectSetInteger(0, m_selectedLineName, OBJPROP_WIDTH, LEVEL_LINE_WIDTH);
    }
    
    // Modus wechseln
    m_selectionMode = mode;
    m_lastClickedTime = "";
    m_clickCount = 0;
    
    // UI aktualisieren
    UpdateModeButtonsAppearance();
    
    // Wenn bereits Werte vorhanden sind und visueller Modus aktiv, hervorhebe die entsprechende Linie
    if(m_visualMode) {
        DrawAllPriceLines();
    }
    // Im nicht-visuellen Modus zeige nur die ausgewählte Linie an
    else if(mode != MODE_NONE) {
        double price = 0;
        
        if(mode == MODE_ENTRY)
            price = GetEntryPrice();
        else if(mode == MODE_SL)
            price = GetStopLoss();
        else if(mode == MODE_TP)
            price = GetTakeProfit();
            
        if(price > 0) {
            UpdateLevelLine(0, price);
        }
    }
    
    // Status-Label aktualisieren
    string status = GetModeStatusText();
    UpdateStatusLabel(status);
}

//+------------------------------------------------------------------+
//| Get Mode Status Text                                             |
//+------------------------------------------------------------------+
string CTradePanel::GetModeStatusText()
{
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
    
    return status;
}

//+------------------------------------------------------------------+
//| Update Mode Buttons Appearance                                   |
//+------------------------------------------------------------------+
void CTradePanel::UpdateModeButtonsAppearance()
{
    // Zurücksetzen aller Auswahl-Buttons
    m_slModeButton.ColorBackground(clrLightGray);
    m_tpModeButton.ColorBackground(clrLightGray);
    m_entryModeButton.ColorBackground(clrLightGray);
   
    if(m_selectionMode == MODE_SL)
    {
        m_slModeButton.ColorBackground(clrLightSalmon);  // Rot für SL
    }
    else if(m_selectionMode == MODE_TP)
    {
        m_tpModeButton.ColorBackground(clrLightGreen);  // Grün für TP
    }
    else if(m_selectionMode == MODE_ENTRY)
    {
        m_entryModeButton.ColorBackground(clrLightSkyBlue);  // Blau für Entry
    }
}

//+------------------------------------------------------------------+
//| Update Status Label                                              |
//+------------------------------------------------------------------+
void CTradePanel::UpdateStatusLabel(const string& message)
{
    m_statusLabel.Text(message);
}

//+------------------------------------------------------------------+
//| Clear Field                                                      |
//+------------------------------------------------------------------+
void CTradePanel::ClearField(int fieldType)
{
    switch(fieldType)
    {
        case ENTRY_PRICE_EDIT:
            SetEntryPrice(0);
            SetEntryFixed(false); // Entfernen des Fix-Status
            Print("Entry Price cleared");
            
            // Entferne Entry-Linie
            RemoveLevelLine(ENTRY_LINE_NAME);
            break;
            
        case STOP_LOSS_EDIT:
            SetStopLoss(0);
            SetStopLossFixed(false); // Entfernen des Fix-Status
            Print("Stop Loss cleared");
            
            // Entferne SL-Linie
            RemoveLevelLine(SL_LINE_NAME);
            break;
            
        case TAKE_PROFIT_EDIT:
            SetTakeProfit(0);
            SetTakeProfitFixed(false); // Entfernen des Fix-Status
            Print("Take Profit cleared");
            
            // Entferne TP-Linie
            RemoveLevelLine(TP_LINE_NAME);
            break;
    }
    
    // RR aktualisieren, wenn eines der Preis-Felder gelöscht wurde
    UpdateRiskReward();
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Update Level Line                                                |
//+------------------------------------------------------------------+
void CTradePanel::UpdateLevelLine(datetime time, double price)
{
    // Entferne alte Linie
    RemoveAllLevelLines();
    
    // Erzeuge neue Linie
    string lineName = "LevelLine_" + IntegerToString(GetTickCount());
    m_levelLineName = lineName;
    
    // Setze die Farbe basierend auf dem Selektionsmodus
    color lineColor;
    bool isLong = IsLongPosition();
    
    if(m_selectionMode == MODE_SL)
    {
        lineColor = isLong ? SL_LONG_COLOR : SL_SHORT_COLOR;
    }
    else if(m_selectionMode == MODE_TP)
    {
        lineColor = isLong ? TP_LONG_COLOR : TP_SHORT_COLOR;
    }
    else if(m_selectionMode == MODE_ENTRY)
    {
        lineColor = ENTRY_LEVEL_COLOR;
    }
    else
    {
        return; // Kein gültiger Modus
    }
    
    if(!ObjectCreate(0, lineName, OBJ_HLINE, 0, 0, price))
    {
        Print("Fehler beim Erstellen der Level-Linie: ", GetLastError());
        return;
    }
    
    ObjectSetInteger(0, lineName, OBJPROP_COLOR, lineColor);
    ObjectSetInteger(0, lineName, OBJPROP_WIDTH, LEVEL_LINE_WIDTH);
    ObjectSetInteger(0, lineName, OBJPROP_STYLE, LEVEL_LINE_STYLE);
    
    // Sende Linie in den Hintergrund
    ObjectSetInteger(0, lineName, OBJPROP_BACK, true);
    ObjectSetInteger(0, lineName, OBJPROP_ZORDER, 0);  // Niedrigste Z-Order
    
    ObjectSetInteger(0, lineName, OBJPROP_SELECTABLE, false);
    
    // Aktualisiere Chart
    ChartRedraw(0);
    
    // Dialog wieder in Vordergrund bringen
    BringToTop();
}

//+------------------------------------------------------------------+
//| Remove Level Line                                                |
//+------------------------------------------------------------------+
void CTradePanel::RemoveLevelLine(const string& lineName)
{
    // Wenn es sich um eine der permanenten Linien handelt, nur entfernen, wenn die Werte gelöscht wurden
    if(lineName == ENTRY_LINE_NAME || lineName == SL_LINE_NAME || lineName == TP_LINE_NAME)
    {
        // Nur löschen, wenn der entsprechende Wert 0 ist oder der visuelle Modus ausgeschaltet ist
        bool shouldRemove = false;
        
        if(!m_visualMode) shouldRemove = true;
        else if(lineName == ENTRY_LINE_NAME && GetEntryPrice() <= 0) shouldRemove = true;
        else if(lineName == SL_LINE_NAME && GetStopLoss() <= 0) shouldRemove = true;
        else if(lineName == TP_LINE_NAME && GetTakeProfit() <= 0) shouldRemove = true;
        
        if(shouldRemove && ObjectFind(0, lineName) >= 0)
        {
            ObjectDelete(0, lineName);
        }
    }
    else if(ObjectFind(0, lineName) >= 0)
    {
        // Temporäre Linien immer entfernen
        ObjectDelete(0, lineName);
    }
}

//+------------------------------------------------------------------+
//| Remove All Level Lines                                           |
//+------------------------------------------------------------------+
void CTradePanel::RemoveAllLevelLines()
{
    // Entferne temporäre Level-Linie
    if(m_levelLineName != "")
    {
        RemoveLevelLine(m_levelLineName);
        m_levelLineName = "";
    }
    
    // Entferne alle anderen temporären Level-Linien
    for(int i = ObjectsTotal(0, 0, OBJ_HLINE) - 1; i >= 0; i--)
    {
        string name = ObjectName(0, i, 0, OBJ_HLINE);
        if(StringFind(name, "LevelLine_") == 0)
        {
            ObjectDelete(0, name);
        }
        // Permanente Linien nicht entfernen
        // (ENTRY_LINE_NAME, SL_LINE_NAME, TP_LINE_NAME werden ausgelassen)
    }
    
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Is Level Line Visible                                            |
//+------------------------------------------------------------------+
bool CTradePanel::IsLevelLineVisible(const string& lineName) const
{
    return ObjectFind(0, lineName) >= 0;
}

//+------------------------------------------------------------------+
//| Update Level Visualizations                                      |
//+------------------------------------------------------------------+
void CTradePanel::UpdateLevelVisualizations()
{
    double entryPrice = GetEntryPrice();
    double stopLoss = GetStopLoss();
    double takeProfit = GetTakeProfit();
    
    // Aktualisiere Level basierend auf dem aktuellen Selektionsmodus
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

//+------------------------------------------------------------------+
//| Is Long Position                                                 |
//+------------------------------------------------------------------+
bool CTradePanel::IsLongPosition()
{
    return IsLongPosition(GetEntryPrice(), GetStopLoss(), GetTakeProfit());
}

//+------------------------------------------------------------------+
//| Is Long Position with parameters                                 |
//+------------------------------------------------------------------+
bool CTradePanel::IsLongPosition(double entryPrice, double stopLoss, double takeProfit)
{
    return CTradePanelCalculations::IsLongPosition(entryPrice, stopLoss, takeProfit);
}

//+------------------------------------------------------------------+
//| Set Entry Fixed                                                  |
//+------------------------------------------------------------------+
void CTradePanel::SetEntryFixed(bool fixed)
{
    if(fixed)
        m_fixStatus |= FIX_ENTRY;
    else
        m_fixStatus &= ~FIX_ENTRY;
        
    UpdateFixButtonsAppearance();
}

//+------------------------------------------------------------------+
//| Set Stop Loss Fixed                                              |
//+------------------------------------------------------------------+
void CTradePanel::SetStopLossFixed(bool fixed)
{
    if(fixed)
        m_fixStatus |= FIX_SL;
    else
        m_fixStatus &= ~FIX_SL;
        
    UpdateFixButtonsAppearance();
}

//+------------------------------------------------------------------+
//| Set Take Profit Fixed                                            |
//+------------------------------------------------------------------+
void CTradePanel::SetTakeProfitFixed(bool fixed)
{
    if(fixed)
        m_fixStatus |= FIX_TP;
    else
        m_fixStatus &= ~FIX_TP;
        
    UpdateFixButtonsAppearance();
}

//+------------------------------------------------------------------+
//| Set Risk Reward Fixed                                            |
//+------------------------------------------------------------------+
void CTradePanel::SetRiskRewardFixed(bool fixed)
{
    if(fixed)
        m_fixStatus |= FIX_RR;
    else
        m_fixStatus &= ~FIX_RR;
        
    UpdateFixButtonsAppearance();
}

//+------------------------------------------------------------------+
//| Update Fix Buttons Appearance                                    |
//+------------------------------------------------------------------+
void CTradePanel::UpdateFixButtonsAppearance()
{
    // Ändere die Farbe der Fix-Buttons basierend auf dem Fix-Status
    if(IsEntryFixed())
        m_entryFixButton.ColorBackground(clrLightSkyBlue);
    else
        m_entryFixButton.ColorBackground(clrLightGray);
        
    if(IsStopLossFixed())
        m_slFixButton.ColorBackground(clrLightSalmon);
    else
        m_slFixButton.ColorBackground(clrLightGray);
        
    if(IsTakeProfitFixed())
        m_tpFixButton.ColorBackground(clrLightGreen);
    else
        m_tpFixButton.ColorBackground(clrLightGray);
        
    if(IsRiskRewardFixed())
        m_rrFixButton.ColorBackground(clrLightYellow);
    else
        m_rrFixButton.ColorBackground(clrLightGray);
}

//+------------------------------------------------------------------+
//| Update Risk Reward                                               |
//+------------------------------------------------------------------+
void CTradePanel::UpdateRiskReward()
{
    // Wenn RR fixiert ist, passe andere Werte an
    if(IsRiskRewardFixed())
    {
        CalculateMissingValues();
        return;
    }
    
    double entryPrice = GetEntryPrice();
    double stopLoss = GetStopLoss();
    double takeProfit = GetTakeProfit();
    
    // Stelle sicher, dass Entry, SL und TP gesetzt sind
    if(entryPrice > 0 && stopLoss > 0 && takeProfit > 0)
    {
        double risk = MathAbs(entryPrice - stopLoss);
        double reward = MathAbs(takeProfit - entryPrice);
        
        // Smartere Richtungsbestimmung für RR-Anzeige:
        // Wenn TP oben -> muss Long sein. Wenn TP unten -> muss Short sein.
        bool isActuallyLong = (takeProfit > entryPrice);
        
        // Validierung der Logik
        bool logicValid = false;
        if(isActuallyLong) logicValid = (stopLoss < entryPrice); // Long: SL muss unten sein
        else               logicValid = (stopLoss > entryPrice); // Short: SL muss oben sein
        
        if(risk > 1e-8 && reward > 1e-8 && logicValid)
        {
            double rr = reward / risk;
            SetRiskReward(rr);
        }
        else
        {
            if(!logicValid)
                CLogManager::GetInstance().LogMessage("CTradePanel", LL_DEBUG, "RR=0: Invalid SL/TP combination for direction. E=" + (string)entryPrice + " SL=" + (string)stopLoss + " TP=" + (string)takeProfit);
            SetRiskReward(0);
        }
    }
    else if(!IsRiskRewardFixed())
    {
        SetRiskReward(0);
    }
}

//+------------------------------------------------------------------+
//| Calculate Missing Values based on fixed parameters                |
//+------------------------------------------------------------------+
void CTradePanel::CalculateMissingValues(bool isMarket)
{
    // Aktueller Marktpreis
    MqlTick lastTick;
    SymbolInfoTick(_Symbol, lastTick);
    double marketPrice = lastTick.bid;
    
    // Aktuell eingestellte Werte
    double entryPrice = isMarket ? 0 : GetEntryPrice();
    double stopLoss = GetStopLoss();
    double takeProfit = GetTakeProfit();
    double riskReward = GetRiskReward();
    
    // Bestimme ob Long oder Short (bei Market Order basierend auf TP/SL und Markt)
    bool isLong = IsLongPosition(entryPrice, stopLoss, takeProfit);
    
    if(isLong && isMarket)
        marketPrice = lastTick.ask; // Bei Long Market Order verwenden wir den Ask-Preis
    
    // Berechne fehlende Werte basierend auf dem Fix-Status
    if(IsEntryFixed() && IsStopLossFixed() && IsRiskRewardFixed() && takeProfit <= 0)
    {
        // Entry, SL und RR sind fix - berechne TP
        takeProfit = CTradePanelCalculations::CalculateTakeProfitFromRR(entryPrice, stopLoss, riskReward, isLong);
        if(takeProfit > 0)
        {
            SetTakeProfit(takeProfit);
            // Print("Take Profit automatisch berechnet: ", takeProfit);
        }
    }
    else if(IsEntryFixed() && IsTakeProfitFixed() && IsRiskRewardFixed() && stopLoss <= 0)
    {
        // Entry, TP und RR sind fix - berechne SL
        stopLoss = CTradePanelCalculations::CalculateStopLossFromRR(entryPrice, takeProfit, riskReward, isLong);
        if(stopLoss > 0)
        {
            SetStopLoss(stopLoss);
            // Print("Stop Loss automatisch berechnet: ", stopLoss);
        }
    }
    else if(isMarket && takeProfit > 0 && stopLoss <= 0 && riskReward > 0)
    {
        // Market Order mit TP und RR - berechne SL
        stopLoss = CTradePanelCalculations::CalculateStopLossFromRR(marketPrice, takeProfit, riskReward, isLong);
        if(stopLoss > 0)
        {
            SetStopLoss(stopLoss);
            // Print("Stop Loss für Market Order automatisch berechnet: ", stopLoss);
        }
    }
    else if(isMarket && takeProfit <= 0 && stopLoss > 0 && riskReward > 0)
    {
        // Market Order mit SL und RR - berechne TP
        takeProfit = CTradePanelCalculations::CalculateTakeProfitFromRR(marketPrice, stopLoss, riskReward, isLong);
        if(takeProfit > 0)
        {
            SetTakeProfit(takeProfit);
            // Print("Take Profit für Market Order automatisch berechnet: ", takeProfit);
        }
    }
}

//+------------------------------------------------------------------+
//| Update Dynamic Prices based on fixed parameters                  |
//+------------------------------------------------------------------+
void CTradePanel::UpdateDynamicPrices()
{
    // Aktuelle Werte
    double entryPrice = GetEntryPrice();
    double stopLoss = GetStopLoss();
    double takeProfit = GetTakeProfit();
    double riskReward = GetRiskReward();
    
    // Aktueller Marktpreis (für nicht-fixierte Werte)
    MqlTick lastTick;
    SymbolInfoTick(_Symbol, lastTick);
    
    bool isLong = IsLongPosition(entryPrice, stopLoss, takeProfit);
    double marketPrice = isLong ? lastTick.ask : lastTick.bid;
    
    // 1. Entry ist nicht fixiert -> Aktualisiere mit Marktpreis (außer wenn alle drei SL, TP, RR fixiert sind)
    if(!IsEntryFixed() && entryPrice != marketPrice)
    {
        // Spezialfall: Wenn alle drei (SL, TP, RR) fixiert sind, berechne Entry statt zu aktualisieren
        if(IsStopLossFixed() && IsTakeProfitFixed() && IsRiskRewardFixed() && 
           stopLoss > 0 && takeProfit > 0 && riskReward > 0)
        {
            // Entry aus SL, TP und RR berechnen
            double calculatedEntry = CTradePanelCalculations::CalculateEntryFromSLAndTP(stopLoss, takeProfit, riskReward, isLong);
            if(calculatedEntry > 0)
            {
                SetEntryPrice(calculatedEntry);
                // Print("Entry Price automatisch berechnet aus SL, TP, RR: ", calculatedEntry);
            }
        }
        else
        {
            // Normaler Fall: Entry mit Marktpreis aktualisieren
            SetEntryPrice(marketPrice);
            // Print("Entry Price automatisch auf Marktpreis aktualisiert: ", marketPrice);
            
            // Wenn Entry geändert wird, müssen ggf. die folgenden Werte aktualisiert werden:
            
            // 1a. RR und SL sind fix -> Aktualisiere TP
            if(IsRiskRewardFixed() && IsStopLossFixed() && stopLoss > 0)
            {
                takeProfit = CTradePanelCalculations::CalculateTakeProfitFromRR(marketPrice, stopLoss, riskReward, isLong);
                if(takeProfit > 0 && !IsTakeProfitFixed())
                {
                    SetTakeProfit(takeProfit);
                    // Print("Take Profit automatisch aktualisiert: ", takeProfit);
                }
            }
            // 1b. RR und TP sind fix -> Aktualisiere SL
            else if(IsRiskRewardFixed() && IsTakeProfitFixed() && takeProfit > 0)
            {
                stopLoss = CTradePanelCalculations::CalculateStopLossFromRR(marketPrice, takeProfit, riskReward, isLong);
                if(stopLoss > 0 && !IsStopLossFixed())
                {
                    SetStopLoss(stopLoss);
                    // Print("Stop Loss automatisch aktualisiert: ", stopLoss);
                }
            }
        }
    }
    // 2. Entry ist fix und mindestens einer von (SL, TP, RR) ist fix
    else if(IsEntryFixed())
    {
        // 2a. SL und RR sind fix -> Aktualisiere TP
        if(IsStopLossFixed() && IsRiskRewardFixed() && stopLoss > 0 && !IsTakeProfitFixed())
        {
            takeProfit = CTradePanelCalculations::CalculateTakeProfitFromRR(entryPrice, stopLoss, riskReward, isLong);
            if(takeProfit > 0)
            {
                SetTakeProfit(takeProfit);
            }
        }
        // 2b. TP und RR sind fix -> Aktualisiere SL
        else if(IsTakeProfitFixed() && IsRiskRewardFixed() && takeProfit > 0 && !IsStopLossFixed())
        {
            stopLoss = CTradePanelCalculations::CalculateStopLossFromRR(entryPrice, takeProfit, riskReward, isLong);
            if(stopLoss > 0)
            {
                SetStopLoss(stopLoss);
            }
        }
    }
    
    // Immer RR und Lot-Anzeige aktualisieren, wenn sich Preise geändert haben könnten
    UpdateRiskReward();
    UpdateLotSizeDisplay();
}

// Calculation methods moved to CTradePanelCalculations

//+------------------------------------------------------------------+
//| Update Lot Size Display                                          |
//+------------------------------------------------------------------+
void CTradePanel::UpdateLotSizeDisplay()
{
    double entryPrice = GetEntryPrice();
    double stopLoss = GetStopLoss();
    double riskPercentage = GetRiskPercentage();
    
    if(entryPrice <= 0 || stopLoss <= 0 || riskPercentage <= 0)
    {
        SetLotSize(0);
        m_lotSizeEdit.Text("--");
        return;
    }
    
    // Bei Market Order: aktuellen Preis MIT Spread verwenden
    if(entryPrice <= 0)
    {
        MqlTick tick;
        SymbolInfoTick(_Symbol, tick);
        bool isLong = IsLongPosition();
        
        // Für Lot-Berechnung den tatsächlichen Ausführungspreis verwenden
        entryPrice = isLong ? tick.ask : tick.bid;
    }
    
    // TradeManager für Lot-Berechnung nutzen
    double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    double riskAmount = accountBalance * riskPercentage / 100.0;
    int stopLossPoints = (int)MathAbs((entryPrice - stopLoss) / _Point);
    
    // Verwende die statische Methode aus CTradePanelCalculations
    double lotSize = CTradePanelCalculations::CalculateLotSizeSimple(_Symbol, riskAmount, stopLossPoints);
    
    if(lotSize > 0)
    {
        SetLotSize(lotSize);
    }
    else
    {
        m_lotSizeEdit.Text("--");
    }
}

// CalculateLotSizeSimple moved to CTradePanelCalculations

// Validation methods moved to CTradePanelCalculations

//+------------------------------------------------------------------+
//| Validate Trade Parameters                                        |
//+------------------------------------------------------------------+
// ValidateTradeParameters method moved to CTradePanelCalculations - using static method directly where needed

//+------------------------------------------------------------------+
//| Show Error Message                                               |
//+------------------------------------------------------------------+
void CTradePanel::ShowErrorMessage(const string& message)
{
    // Verwende die MessageBox-Funktion von MQL, um eine Fehlermeldung anzuzeigen
    MessageBox(message, "Error", MB_OK|MB_ICONERROR);
}

//+------------------------------------------------------------------+
//| Create Trade Entry                                               |
//+------------------------------------------------------------------+
CEntry* CTradePanel::CreateTradeEntry()
{
    CLogManager::GetInstance().LogMessage("CTradePanel", LL_INFO, "Trade Panel: Creating Trade Entry");
    
    double entryPrice = GetEntryPrice();
    double stopLoss = GetStopLoss();
    double takeProfit = GetTakeProfit();
    double riskReward = GetRiskReward();
    double riskPercentage = GetRiskPercentage();
    
    CLogManager::GetInstance().LogMessage("CTradePanel", LL_INFO, "Trade Panel: Values retrieved - Entry: " + DoubleToString(entryPrice, _Digits) + " SL: " + DoubleToString(stopLoss, _Digits) + " TP: " + DoubleToString(takeProfit, _Digits));
    
    bool isLong = IsLongPosition(entryPrice, stopLoss, takeProfit);
    
    // Validiere die Parameter
    if(!CTradePanelCalculations::ValidateTradeParameters(entryPrice, stopLoss, takeProfit, isLong, riskReward))
    {
        return NULL;
    }
    
    CEntry* entry = new CEntry();
    if(entry != NULL)
    {
        entry.direction = isLong ? 1 : -1;
        entry.entryPrice = entryPrice;
        entry.stopLossPrice = stopLoss;
        entry.takeProfitPrice = takeProfit;
        
        // RR setzen wenn RR fixiert ist oder wenn kein expliziter TP vorhanden
        if((takeProfit <= 0 && riskReward > 0) || IsRiskRewardFixed())
        {
            entry.riskRewardTarget = riskReward;
        }
        else
        {
            entry.riskRewardTarget = 0; // Mit explizitem TP ist RR nicht erforderlich
        }
        
        entry.type = entryPrice > 0 ? ET_Explicit_Limit : ET_Limit_Market;
        entry.strategyName = "Manual";
        
        // Benutzerdefiniertes Risk Percentage setzen
        entry.customRiskPercentage = riskPercentage;
        
        Print("Trade Panel: Entry object configured - Direction: ", entry.direction, 
              ", Risk %: ", entry.customRiskPercentage);
    }
    
    return entry;
}

//+------------------------------------------------------------------+
//| Place Order (Limit or Market)                                    |
//+------------------------------------------------------------------+
void CTradePanel::PlaceOrder(bool isMarket)
{
    // Bei Market Order den Entry-Preis auf 0 setzen
    if(isMarket)
    {
        // Temporär aktuellen Preis speichern für Validierungen
        double currentEntryPrice = GetEntryPrice();
        
        // Für Market Order nehmen wir Entry Price = 0
        SetEntryPrice(0);
    }
    
    // Berechne fehlende Werte basierend auf Fix-Status
    CalculateMissingValues(isMarket);
    
    CEntry* entry = CreateTradeEntry();
    if(entry == NULL)
    {
        return;
    }
    
    CLogManager::GetInstance().LogMessage("CTradePanel", LL_INFO, "Trade Panel: Entry object created");
    CEntrySettings* currentSettings = m_entryManager.GetSettings();
    if(currentSettings == NULL)
    {
        Print("Trade Panel: ERROR - Could not retrieve settings");
        delete entry;
        return;
    }
    
    Print("Trade Panel: Settings retrieved");
    SaveCurrentSettings();
    
    // Setze den entsprechenden Entry-Typ basierend auf Order-Typ
    currentSettings.entryType = isMarket ? ET_Limit_Market : ET_Explicit_Limit;
    
    // Verwende RR nur wenn RR fixiert ist ODER wenn kein expliziter TP gesetzt ist
    if(entry.takeProfitPrice <= 0 || (isMarket && IsRiskRewardFixed()))
    {
        currentSettings.takeProfitType = TP_Risk_Reward;
        currentSettings.takeProfitRR = GetRiskReward();
        Print("Trade Panel: Settings configured with RR: ", currentSettings.takeProfitRR);
        
        // Bei Market Order mit RR-Fix: TP auf 0 setzen für dynamische Berechnung
        if(isMarket && IsRiskRewardFixed())
        {
            entry.takeProfitPrice = 0;
            Print("Trade Panel: Market Order with RR fixed - using dynamic TP calculation");
        }
    }
    else
    {
        Print("Trade Panel: Using explicit Take Profit price: ", entry.takeProfitPrice);
    }
    
    double actualEntryPrice = entry.entryPrice;
    bool isLong = entry.direction == 1;
    
    CLogManager::GetInstance().LogMessage("CTradePanel", LL_INFO, "Trade Panel: Order direction determined - isLong: " + (string)isLong + " Entry: " + DoubleToString(entry.entryPrice, _Digits));
    
    if(isLong)
    {
        Print("Trade Panel: Entering Long Position with risk percentage: ", entry.customRiskPercentage);
        m_entryManager.EnterLong(NULL, 
                               entry.entryPrice,
                               entry.stopLossPrice,
                               entry.takeProfitPrice,
                               EV_EMPTY,
                               "Manual",
                               entry.customRiskPercentage);
    }
    else
    {
        Print("Trade Panel: Entering Short Position with risk percentage: ", entry.customRiskPercentage);
        m_entryManager.EnterShort(NULL, 
                                entry.entryPrice,
                                entry.stopLossPrice,
                                entry.takeProfitPrice,
                                EV_EMPTY,
                                "Manual",
                                entry.customRiskPercentage);
    }
    
    // Trade Replikation
    if(m_replicateTrades)
    {
        CJAVal tradeData;
        string normalizedSymbol = CEnvironmentManager::GetInstance().GetNormalizedSymbol(_Symbol);
        
        tradeData["symbol"] = normalizedSymbol;
        tradeData["direction"] = isLong ? "BUY" : "SELL";
        tradeData["orderType"] = isMarket ? "MARKET" : "LIMIT";
        tradeData["risk_percent"] = entry.customRiskPercentage;
        tradeData["strategy"] = "Manual";
        tradeData["magic"] = MAGICMA;
        
        CJAVal levels = tradeData["levels"];
        
        // Entry
        CJAVal tentry = levels["entry"];
        if(isMarket) {
            tentry["type"] = "MARKET";
        } else {
            tentry["type"] = "LOGICAL";
            tentry["time"] = (long)m_entryTime;
            tentry["tf"] = (int)PERIOD_CURRENT;
            tentry["idx"] = m_entryLevel;
        }
        
        // Stop Loss
        CJAVal tsl = levels["sl"];
        if(IsRiskRewardFixed() && !IsStopLossFixed() && !isMarket) {
            tsl["type"] = "DYNAMIC_RR";
            tsl["value"] = GetRiskReward();
        } else {
            tsl["type"] = "LOGICAL";
            tsl["time"] = (long)m_slTime;
            tsl["tf"] = (int)PERIOD_CURRENT;
            tsl["idx"] = m_slLevel;
        }
        
        // Take Profit
        CJAVal ttp = levels["tp"];
        if(IsRiskRewardFixed() && !IsTakeProfitFixed()) {
            ttp["type"] = "DYNAMIC_RR";
            ttp["value"] = GetRiskReward();
        } else {
            ttp["type"] = "LOGICAL";
            ttp["time"] = (long)m_tpTime;
            ttp["tf"] = (int)PERIOD_CURRENT;
            ttp["idx"] = m_tpLevel;
        }
        
        Print("Trade Panel: Sending replication data for ", normalizedSymbol);
        if(!CAppClient::GetInstance().SendReplicationTrade(tradeData))
        {
            Print("Trade Panel: ERROR - Replication failed");
        }
    }
    
    RestoreSettings();
    delete entry;
}

//+------------------------------------------------------------------+
//| Save Current Settings                                            |
//+------------------------------------------------------------------+
void CTradePanel::SaveCurrentSettings(void)
{
    if(m_entryManager != NULL && m_originalSettings != NULL)
    {
        CEntrySettings* current = m_entryManager.GetSettings();
        if(current != NULL)
        {
            m_originalSettings.entryType = current.entryType;
            m_originalSettings.entryLevel = current.entryLevel;
            m_originalSettings.entryImmediateWhenStopLossIsLess = current.entryImmediateWhenStopLossIsLess;
            m_originalSettings.stopLossLevel = current.stopLossLevel;
            m_originalSettings.maxStopLossInPoints = current.maxStopLossInPoints;
            m_originalSettings.takeProfitType = current.takeProfitType;
            m_originalSettings.invalidateAfterSeconds = current.invalidateAfterSeconds;
            m_originalSettings.takeProfitRR = current.takeProfitRR;
            m_originalSettings.takeProfitTime = current.takeProfitTime;
            m_originalSettings.takeProfitTimeframe = current.takeProfitTimeframe;
            m_originalSettings.timeframe = current.timeframe;
            m_originalSettings.breakEvenMode = current.breakEvenMode;
            m_originalSettings.breakEvenAfterSeconds = current.breakEvenAfterSeconds;
            m_originalSettings.breakEvenAfterRR = current.breakEvenAfterRR;
        }
    }
}

//+------------------------------------------------------------------+
//| Restore Settings                                                 |
//+------------------------------------------------------------------+
void CTradePanel::RestoreSettings(void)
{
    if(m_entryManager != NULL && m_originalSettings != NULL)
    {
        CEntrySettings* current = m_entryManager.GetSettings();
        if(current != NULL)
        {
            current.entryType = m_originalSettings.entryType;
            current.entryLevel = m_originalSettings.entryLevel;
            current.entryImmediateWhenStopLossIsLess = m_originalSettings.entryImmediateWhenStopLossIsLess;
            current.stopLossLevel = m_originalSettings.stopLossLevel;
            current.maxStopLossInPoints = m_originalSettings.maxStopLossInPoints;
            current.takeProfitType = m_originalSettings.takeProfitType;
            current.invalidateAfterSeconds = m_originalSettings.invalidateAfterSeconds;
            current.takeProfitRR = m_originalSettings.takeProfitRR;
            current.takeProfitTime = m_originalSettings.takeProfitTime;
            current.takeProfitTimeframe = m_originalSettings.takeProfitTimeframe;
            current.timeframe = m_originalSettings.timeframe;
            current.breakEvenMode = m_originalSettings.breakEvenMode;
            current.breakEvenAfterSeconds = m_originalSettings.breakEvenAfterSeconds;
            current.breakEvenAfterRR = m_originalSettings.breakEvenAfterRR;
        }
    }
}

//+------------------------------------------------------------------+
//| Update Values                                                    |
//+------------------------------------------------------------------+
void CTradePanel::UpdateValues(void)
{
    // Aktuelle Preise abrufen
    MqlTick lastTick;
    SymbolInfoTick(_Symbol, lastTick);
    
    // Entry Price mit aktuellem Preis vorbelegen, wenn nicht fixiert
    if(!IsEntryFixed())
    {
        SetEntryPrice(lastTick.bid);
    }
    
    // Hole die globale risk_percentage (falls definiert)
    double globalRiskPercentage = 0.35; // Default-Wert
    
    // Wenn als EA-Input definiert:
    if(risk_percentage > 0 && GetRiskPercentage() <= 0)
    {
        globalRiskPercentage = risk_percentage;
    }
    
    // Risk Percentage setzen, wenn nicht bereits gesetzt
    if(GetRiskPercentage() <= 0)
    {
        SetRiskPercentage(globalRiskPercentage);
    }
    
    // Zeige alle Preislinien an
    DrawAllPriceLines();
    
    // Initiale Lot Size Berechnung
    UpdateLotSizeDisplay();
}

#endif  // End of TRADE_PANEL_MQH

