//+------------------------------------------------------------------+
//|                                             ZoneTradePanel.mqh |
//|                        Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef ZONE_TRADE_PANEL_MQH
#define ZONE_TRADE_PANEL_MQH

#include <Expert\TradePanel.mqh>
#include <Expert\ZoneManager.mqh>
#include <Expert\TradePanelConfig.mqh>
#include <Controls\Button.mqh>
#include <Controls\ComboBox.mqh>
#include <Controls\Edit.mqh>
#include <Expert\EnvironmentManager.mqh>
#include <Expert\ImbalanceDetector.mqh>
#include <Expert\LogManager.mqh>

class CZoneTradePanel : public CTradePanel
{
private:
    // Zone management
    CZoneManager*        m_zoneManager;
    
    // Zone level controls (similar to Entry/SL/TP)
    CEdit                m_zoneTopEdit;
    CEdit                m_zoneBottomEdit;
    CButton              m_zoneTopClearButton;
    CButton              m_zoneBottomClearButton;
    CButton              m_zoneTopModeButton;
    CButton              m_zoneBottomModeButton;
    
    // Zone management buttons
    CButton              m_createZoneButton;
    CButton              m_zoneAutomaticButton;
    
    // Zone timeframe selection
    CComboBox            m_zoneTimeframeCombo;
    CLabel               m_zoneTimeframeLabel;
    CButton              m_zoneTimeframeButton;
    bool                 m_showTimeframeDropdown;
    
    // Zone table components (dynamic layout)
    CLabel               m_zoneTableHeader;
    CLabel               m_zoneLabels[20];        // Zone info labels
    CButton              m_zoneDeleteButtons[20]; // Individual delete buttons per zone
    CButton              m_zoneRefreshButton;
    
    // Dynamic sizing
    int                  m_maxVisibleZones;
    int                  m_currentDialogHeight;
    
    // Zone selection
    CEdit                m_zoneIndexEdit;
    CLabel               m_zoneIndexLabel;
    
    // Zone table state
    int                  m_zoneTableY;
    int                  m_selectedZoneIndex;
    int                  m_lastZoneCount;
    datetime             m_lastUpdateTime;
    int                  m_scrollOffset;
    
    // Zone trading timeframe
    ENUM_TIMEFRAMES      m_zoneTradingTimeframe;
    
    // Zone level selection tracking
    int                  m_zoneTopClickCount;
    int                  m_zoneBottomClickCount;
    string               m_lastZoneTopClickTime;
    string               m_lastZoneBottomClickTime;
    datetime             m_zoneStartTime;           // Time when first zone level was set
    
    // Zone table management
    void                 InitializeZoneTable();
    void                 UpdateZoneTable();
    void                 DeleteSelectedZone();
    int                  GetSelectedZoneIndex();
    void                 CheckForZoneUpdatesNoResize();
    void                 ResizeDialogForZones(int zoneCount);
    void                 HandleZoneDeleteClick(int zoneIndex);
    
    // UI positioning
    int                  m_zoneButtonsStartY;
    
    // Event handling for zones
    void                 UpdateZoneButtonsAppearance();
    void                 InitializeZoneControls();
    void                 ShowZoneList();
    void                 HandleZoneLevelClick(int x, int y, int mode);
    void                 ClearZoneField(int fieldId);
    void                 CreateZoneFromLevels();
    void                 PreventMinimizeAndRestore();
    double               GetZoneTop() const;
    double               GetZoneBottom() const;
    void                 SetZoneTop(double price);
    void                 SetZoneBottom(double price);
    void                 UpdateZoneLevelLine(const string& lineName, double price, color lineColor);
    void                 RemoveZoneLevelLine(const string& lineName);
    void                 InitializeZoneTimeframeCombo();
    void                 CalculateAutomaticZone(int x, int y);
    void                 ShowAutomaticZoneVisualization(double zoneTop, double zoneBottom, datetime startTime);
    
    void                 UpdateZoneTradingTimeframe();
    void                 CycleZoneTimeframe();
    ENUM_TIMEFRAMES      GetZoneTradingTimeframe() const { return m_zoneTradingTimeframe; }
    
public:
                         CZoneTradePanel();
                        ~CZoneTradePanel();
    
    // Initialization
    virtual bool         OnInit(const string caption, CEntryManager* entryManager);
    virtual void         OnDeinit();
    
    // Zone manager access
    void                 SetZoneManager(CZoneManager* zoneManager) 
    { 
        Print("SetZoneManager called with: ", (zoneManager != NULL ? "Valid pointer" : "NULL pointer"));
        m_zoneManager = zoneManager; 
        
        if (m_zoneManager != NULL)
        {
            Print("Zone manager set successfully - current zone count: ", m_zoneManager.GetZoneCount());
            
            // Synchronize trading timeframe with zone manager
            m_zoneManager.SetZoneTradingTimeframe(m_zoneTradingTimeframe);
            Print("Zone manager synchronized with trading timeframe: ", EnumToString(m_zoneTradingTimeframe));
            
            // Force immediate update after setting zone manager
            ForceZoneTableUpdate();
        }
    }
    CZoneManager*        GetZoneManager() const { return m_zoneManager; }
    
    // Event handling
    virtual void         OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam);
    
    // UI updates
    void                 UpdateZoneStatus();
    void                 RefreshZoneDisplay();
    void                 ForceZoneTableUpdate();
    void                 TestZoneTableDisplay();
    
    // Chart interaction
    virtual void         HandleChartClick(int x, int y);
    
    // Dialog management
    void                 RestoreDialogVisibility();
    void                 maximizeWindow(void);
    
    // Override methods to prevent minimization
    virtual bool         Minimized() const { return false; }  // Always return false
    virtual void         Minimized(const bool flag) { }       // Ignore minimize attempts
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CZoneTradePanel::CZoneTradePanel() : CTradePanel()
{
    m_zoneManager = NULL;
    m_zoneButtonsStartY = 0;
    m_zoneTopClickCount = 0;
    m_zoneBottomClickCount = 0;
    m_lastZoneTopClickTime = "";
    m_lastZoneBottomClickTime = "";
    m_zoneTableY = 0;
    m_selectedZoneIndex = 0;
    m_lastZoneCount = 0;
    m_lastUpdateTime = 0;
    m_scrollOffset = 0;
    m_maxVisibleZones = 10;
    m_currentDialogHeight = 650;
    m_zoneStartTime = 0;
    m_zoneTradingTimeframe = PERIOD_M1;  // Default to M1
    m_showTimeframeDropdown = false;
    
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CZoneTradePanel::~CZoneTradePanel()
{
    // ZoneManager is managed externally, don't delete here
}

//+------------------------------------------------------------------+
//| Initialize panel with zone functionality                        |
//+------------------------------------------------------------------+
bool CZoneTradePanel::OnInit(const string caption, CEntryManager* entryManager)
{
    // Call parent initialization first
    if (!CTradePanel::OnInit(caption, entryManager))
        return false;
        
    // Initialize zone-specific controls
    InitializeZoneControls();
    
    // Initialize zone timeframe combo
    InitializeZoneTimeframeCombo();
    
    // Force initial update of zone table
    m_lastUpdateTime = 0;  // Force immediate update
    CheckForZoneUpdatesNoResize();
    
    Print("ZoneTradePanel initialization complete - zone manager: ", (m_zoneManager != NULL ? "Available" : "NULL"));
    
    // Debug: Initial zone count
    if (m_zoneManager != NULL)
    {
        int initialZones = m_zoneManager.GetZoneCount();
        Print("Initial zone count: ", initialZones);
        
        // Force first update
        UpdateZoneTable();
    }
    
    Print("ZoneTradePanel initialized successfully");
    return true;
}

//+------------------------------------------------------------------+
//| Deinitialize panel                                               |
//+------------------------------------------------------------------+
void CZoneTradePanel::OnDeinit()
{
    // CTradePanel::OnDeinit(); // Disabled - method may not exist
}

//+------------------------------------------------------------------+
//| Initialize zone controls                                         |
//+------------------------------------------------------------------+
void CZoneTradePanel::InitializeZoneControls()
{
    // Calculate position for zone controls (below Visual Mode button using TradePanel pattern)
    // Visual Mode button is at: visualButtonY = orderButtonY + BUTTON_HEIGHT + MARGIN
    // Zone section starts after Visual Mode button with proper margin  
    int orderButtonY = MARGIN + 6 * (ITEM_HEIGHT + MARGIN) + MARGIN; // Updated from 5 to 6 to account for Lot Size field
    int visualButtonY = orderButtonY + BUTTON_HEIGHT + MARGIN;
    int zoneSectionY = visualButtonY + BUTTON_HEIGHT + MARGIN + MARGIN; // Extra margin for separation
    
    // Zone section header - could add a label here if needed
    
    // Zone Top Edit and Buttons (first row, same pattern as Entry/SL/TP)
    int zoneTopY = zoneSectionY;
    
    // Zone Top Label
    CLabel *zoneTopLabel = new CLabel();
    if (zoneTopLabel.Create(0, Name() + "ZoneTopLabel", 0,
                           MARGIN, zoneTopY, MARGIN + LABEL_WIDTH, zoneTopY + ITEM_HEIGHT))
    {
        zoneTopLabel.Text("Zone Top:");
        Add(zoneTopLabel);
    }
    
    // Zone Top Edit
    if (m_zoneTopEdit.Create(0, Name() + "ZoneTopEdit", 0,
                            MARGIN + LABEL_WIDTH + MARGIN, zoneTopY,
                            MARGIN + LABEL_WIDTH + MARGIN + EDIT_WIDTH, zoneTopY + ITEM_HEIGHT))
    {
        m_zoneTopEdit.TextAlign(ALIGN_RIGHT);
        m_zoneTopEdit.Color(clrBlack);
        m_zoneTopEdit.ColorBackground(clrWhite);
        m_zoneTopEdit.ColorBorder(clrGray);
        m_zoneTopEdit.Id(ZONE_TOP_EDIT);
        Add(m_zoneTopEdit);
    }
    
    // Zone Top Clear Button (X)
    int xButtonX = MARGIN + LABEL_WIDTH + MARGIN + EDIT_WIDTH + 2*MARGIN + FIX_BUTTON_WIDTH + MARGIN;
    if (m_zoneTopClearButton.Create(0, Name() + "ZoneTopClearBtn", 0,
                                   xButtonX, zoneTopY,
                                   xButtonX + X_BUTTON_WIDTH, zoneTopY + ITEM_HEIGHT))
    {
        m_zoneTopClearButton.Text("X");
        m_zoneTopClearButton.Color(clrBlack);
        m_zoneTopClearButton.ColorBackground(clrLightGray);
        m_zoneTopClearButton.ColorBorder(clrGray);
        m_zoneTopClearButton.Id(ZONE_TOP_CLEAR_BUTTON);
        Add(m_zoneTopClearButton);
    }
    
    // Zone Top Mode Button (Auswählen)
    int selectButtonX = xButtonX + X_BUTTON_WIDTH + MARGIN;
    if (m_zoneTopModeButton.Create(0, Name() + "ZoneTopModeBtn", 0,
                                  selectButtonX, zoneTopY,
                                  selectButtonX + SELECT_BUTTON_WIDTH, zoneTopY + ITEM_HEIGHT))
    {
        m_zoneTopModeButton.Text("Auswählen");
        m_zoneTopModeButton.Color(clrBlack);
        m_zoneTopModeButton.ColorBackground(clrLightGray);
        m_zoneTopModeButton.ColorBorder(clrGray);
        m_zoneTopModeButton.Id(ZONE_TOP_MODE_BUTTON);
        Add(m_zoneTopModeButton);
    }
    
    // Zone Bottom Edit and Buttons (second row)
    int zoneBottomY = zoneTopY + ITEM_HEIGHT + MARGIN;
    
    // Zone Bottom Label
    CLabel *zoneBottomLabel = new CLabel();
    if (zoneBottomLabel.Create(0, Name() + "ZoneBottomLabel", 0,
                              MARGIN, zoneBottomY, MARGIN + LABEL_WIDTH, zoneBottomY + ITEM_HEIGHT))
    {
        zoneBottomLabel.Text("Zone Bottom:");
        Add(zoneBottomLabel);
    }
    
    // Zone Bottom Edit
    if (m_zoneBottomEdit.Create(0, Name() + "ZoneBottomEdit", 0,
                               MARGIN + LABEL_WIDTH + MARGIN, zoneBottomY,
                               MARGIN + LABEL_WIDTH + MARGIN + EDIT_WIDTH, zoneBottomY + ITEM_HEIGHT))
    {
        m_zoneBottomEdit.TextAlign(ALIGN_RIGHT);
        m_zoneBottomEdit.Color(clrBlack);
        m_zoneBottomEdit.ColorBackground(clrWhite);
        m_zoneBottomEdit.ColorBorder(clrGray);
        m_zoneBottomEdit.Id(ZONE_BOTTOM_EDIT);
        Add(m_zoneBottomEdit);
    }
    
    // Zone Bottom Clear Button (X)
    if (m_zoneBottomClearButton.Create(0, Name() + "ZoneBottomClearBtn", 0,
                                      xButtonX, zoneBottomY,
                                      xButtonX + X_BUTTON_WIDTH, zoneBottomY + ITEM_HEIGHT))
    {
        m_zoneBottomClearButton.Text("X");
        m_zoneBottomClearButton.Color(clrBlack);
        m_zoneBottomClearButton.ColorBackground(clrLightGray);
        m_zoneBottomClearButton.ColorBorder(clrGray);
        m_zoneBottomClearButton.Id(ZONE_BOTTOM_CLEAR_BUTTON);
        Add(m_zoneBottomClearButton);
    }
    
    // Zone Bottom Mode Button (Auswählen)
    if (m_zoneBottomModeButton.Create(0, Name() + "ZoneBottomModeBtn", 0,
                                     selectButtonX, zoneBottomY,
                                     selectButtonX + SELECT_BUTTON_WIDTH, zoneBottomY + ITEM_HEIGHT))
    {
        m_zoneBottomModeButton.Text("Auswählen");
        m_zoneBottomModeButton.Color(clrBlack);
        m_zoneBottomModeButton.ColorBackground(clrLightGray);
        m_zoneBottomModeButton.ColorBorder(clrGray);
        m_zoneBottomModeButton.Id(ZONE_BOTTOM_MODE_BUTTON);
        Add(m_zoneBottomModeButton);
    }
    
    // Zone Management Buttons (third row) - Adjusted widths for perfect text visibility
    int zoneButtonsY = zoneBottomY + ITEM_HEIGHT + MARGIN + MARGIN; // Extra margin for separation
    int createButtonWidth = 190; // Even wider for "Zone Erstellen"
    int refreshButtonWidth = 170; // Even wider for "Aktualisieren" 
    int automaticButtonWidth = 130; // A bit wider for "Automatic"
    
    // Create Zone Button (left)
    if (m_createZoneButton.Create(0, Name() + "CreateZone", 0,
                                 MARGIN, zoneButtonsY,
                                 MARGIN + createButtonWidth, zoneButtonsY + BUTTON_HEIGHT))
    {
        m_createZoneButton.Text("Zone Erstellen");
        m_createZoneButton.ColorBackground(clrLightGreen);
        m_createZoneButton.Id(ZONE_CREATE_BUTTON);
        Add(m_createZoneButton);
    }
    
    // Refresh Button (center)
    if (m_zoneRefreshButton.Create(0, Name() + "ZoneRefreshBtn", 0,
                                  MARGIN + createButtonWidth + MARGIN, zoneButtonsY,
                                  MARGIN + createButtonWidth + MARGIN + refreshButtonWidth, zoneButtonsY + BUTTON_HEIGHT))
    {
        m_zoneRefreshButton.Text("Aktualisieren");
        m_zoneRefreshButton.Color(clrBlack);
        m_zoneRefreshButton.ColorBackground(clrLightBlue);
        m_zoneRefreshButton.ColorBorder(clrGray);
        Add(m_zoneRefreshButton);
    }
    
    // Automatic Zone Detection Button (right)
    if (m_zoneAutomaticButton.Create(0, Name() + "ZoneAutomatic", 0,
                                    MARGIN + createButtonWidth + MARGIN + refreshButtonWidth + MARGIN, zoneButtonsY,
                                    MARGIN + createButtonWidth + MARGIN + refreshButtonWidth + MARGIN + automaticButtonWidth, zoneButtonsY + BUTTON_HEIGHT))
    {
        m_zoneAutomaticButton.Text("Automatic");
        m_zoneAutomaticButton.Color(clrBlack);
        m_zoneAutomaticButton.ColorBackground(clrLightGray);
        m_zoneAutomaticButton.ColorBorder(clrGray);
        m_zoneAutomaticButton.Id(ZONE_AUTOMATIC_BUTTON);
        Add(m_zoneAutomaticButton);
    }
    
    // Zone Timeframe Selection (separate row)
    int zoneTimeframeY = zoneButtonsY + BUTTON_HEIGHT + MARGIN;
    
    // Zone Timeframe Label
    if (m_zoneTimeframeLabel.Create(0, Name() + "ZoneTimeframeLabel", 0,
                                   MARGIN, zoneTimeframeY,
                                   MARGIN + LABEL_WIDTH, zoneTimeframeY + ITEM_HEIGHT))
    {
        m_zoneTimeframeLabel.Text("Trading TF:");
        Add(m_zoneTimeframeLabel);
    }
    
    // Zone Timeframe Button (alternative to ComboBox)
    if (m_zoneTimeframeButton.Create(0, Name() + "ZoneTimeframeBtn", 0,
                                    MARGIN + LABEL_WIDTH + MARGIN, zoneTimeframeY,
                                    MARGIN + LABEL_WIDTH + MARGIN + EDIT_WIDTH, zoneTimeframeY + ITEM_HEIGHT))
    {
        m_zoneTimeframeButton.Text("M1"); // Default display
        m_zoneTimeframeButton.Id(ZONE_TIMEFRAME_COMBO);
        m_zoneTimeframeButton.ColorBackground(clrWhite);
        m_zoneTimeframeButton.ColorBorder(clrGray);
        Add(m_zoneTimeframeButton);
    }
    
    // Initialize zone table below the timeframe selection
    m_zoneTableY = zoneTimeframeY + ITEM_HEIGHT + MARGIN + MARGIN;
    InitializeZoneTable();
}

//+------------------------------------------------------------------+
//| Handle chart events including zone creation and button clicks   |
//+------------------------------------------------------------------+
void CZoneTradePanel::OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam)
{
    // Check for zone updates regularly (without resize)
    CheckForZoneUpdatesNoResize();
    
    // Handle chart clicks for zone level selection and creation
    if (id == CHARTEVENT_CLICK)
    {
        CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "CHARTEVENT_CLICK received - x=" + IntegerToString((int)lparam) + " y=" + IntegerToString((int)dparam));
        
        // Check if we're in zone level selection mode
        int selectionMode = GetSelectionMode();
        CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Current selection mode=" + IntegerToString(selectionMode));
        
        if (selectionMode == MODE_ZONE_TOP || selectionMode == MODE_ZONE_BOTTOM)
        {
            CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Handling zone level click");
            HandleZoneLevelClick((int)lparam, (int)dparam, selectionMode);
            return; // Don't forward to parent if we handled the zone level selection
        }
        else if (selectionMode == MODE_ZONE_AUTOMATIC)
        {
            // Handle automatic zone detection with proper coordinate filtering
            CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Chart click detected in AUTOMATIC mode at x=" + IntegerToString((int)lparam) + " y=" + IntegerToString((int)dparam));
            
            // Use the same coordinate filtering logic as TradePanel to distinguish button clicks from chart clicks
            int dialogLeft = Left();
            int dialogTop = Top();
            int dialogRight = dialogLeft + Width();
            int dialogBottom = dialogTop + Height();
            
            // If the click is within the dialog boundaries, ignore it (it's a button/panel click)
            if ((int)lparam >= dialogLeft && (int)lparam <= dialogRight && (int)dparam >= dialogTop && (int)dparam <= dialogBottom)
            {
                CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Click inside panel boundaries - ignoring for automatic zone detection");
                return;
            }
            
            CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Click outside panel boundaries - processing for automatic zone detection");
            CalculateAutomaticZone((int)lparam, (int)dparam);
            return; // Don't forward to parent
        }
        else
        {
            CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Selection mode is " + IntegerToString(selectionMode) + " - not handling chart click");
        }
        
        // Check if we're in legacy zone creation mode (fallback)
        if (m_zoneManager != NULL && m_zoneManager.GetCreationMode() != ZONE_CREATE_NONE)
        {
            HandleChartClick((int)lparam, (int)dparam);
            return; // Don't forward to parent if we handled the zone creation
        }
        // If not in zone mode, let parent handle it (for normal level selection)
    }
    
    
    // Handle zone button clicks before forwarding to parent
    if(id == CHARTEVENT_OBJECT_CLICK)
    {
        string zoneTopModeButtonName = Name() + "ZoneTopModeBtn";
        string zoneBottomModeButtonName = Name() + "ZoneBottomModeBtn";
        string zoneTopClearButtonName = Name() + "ZoneTopClearBtn";
        string zoneBottomClearButtonName = Name() + "ZoneBottomClearBtn";
        string createZoneButtonName = Name() + "CreateZone";
        
        if(sparam == zoneTopModeButtonName)
        {
            Print("Zone Top mode button clicked");
            // Simple toggle like Entry/SL/TP buttons
            if(GetSelectionMode() == MODE_ZONE_TOP)
                SetSelectionMode(MODE_NONE);
            else
                SetSelectionMode(MODE_ZONE_TOP);
            UpdateZoneButtonsAppearance();
            return; // Don't forward to parent
        }
        else if(sparam == zoneBottomModeButtonName)
        {
            Print("Zone Bottom mode button clicked");
            // Simple toggle like Entry/SL/TP buttons
            if(GetSelectionMode() == MODE_ZONE_BOTTOM)
                SetSelectionMode(MODE_NONE);
            else
                SetSelectionMode(MODE_ZONE_BOTTOM);
            UpdateZoneButtonsAppearance();
            return; // Don't forward to parent
        }
        else if(sparam == zoneTopClearButtonName)
        {
            Print("Zone Top clear button clicked");
            ClearZoneField(ZONE_TOP_EDIT);
            return; // Don't forward to parent
        }
        else if(sparam == zoneBottomClearButtonName)
        {
            Print("Zone Bottom clear button clicked");
            ClearZoneField(ZONE_BOTTOM_EDIT);
            return; // Don't forward to parent
        }
        else if(sparam == createZoneButtonName)
        {
            Print("Create Zone button clicked");
            CreateZoneFromLevels();
            return; // Don't forward to parent
        }
        
        // Handle refresh button
        string zoneRefreshButtonName = Name() + "ZoneRefreshBtn";
        
        if(sparam == zoneRefreshButtonName)
        {
            Print("Refresh button clicked");
            ForceZoneTableUpdate();
            return;
        }
        
        // Handle zone timeframe button click
        string zoneTimeframeButtonName = Name() + "ZoneTimeframeBtn";
        if(sparam == zoneTimeframeButtonName)
        {
            Print("Zone timeframe button clicked");
            CycleZoneTimeframe();
            return;
        }
        
        // Handle Automatic zone detection button
        string zoneAutomaticButtonName = Name() + "ZoneAutomatic";
        if(sparam == zoneAutomaticButtonName)
        {
            CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Automatic zone detection button clicked");
            // Toggle mode like other level selection buttons
            if(GetSelectionMode() == MODE_ZONE_AUTOMATIC)
                SetSelectionMode(MODE_NONE);
            else
                SetSelectionMode(MODE_ZONE_AUTOMATIC);
            UpdateZoneButtonsAppearance();
            return; // Don't forward to parent
        }
        
        
        // Handle individual zone delete buttons
        if(StringFind(sparam, Name() + "DelZone") == 0)
        {
            // Extract zone index from button name
            string indexStr = StringSubstr(sparam, StringLen(Name() + "DelZone"));
            int zoneIndex = (int)StringToInteger(indexStr);
            HandleZoneDeleteClick(zoneIndex);
            return;
        }
    }
    
    // ComboBox event handling removed - using button instead
    
    // Forward ALL other events to parent (including unhandled button clicks)
    CTradePanel::OnChartEvent(id, lparam, dparam, sparam);
}


//+------------------------------------------------------------------+
//| Update zone buttons appearance                                   |
//+------------------------------------------------------------------+
void CZoneTradePanel::UpdateZoneButtonsAppearance()
{
    // Reset button colors
    m_zoneTopModeButton.ColorBackground(clrLightGray);
    m_zoneBottomModeButton.ColorBackground(clrLightGray);
    m_zoneAutomaticButton.ColorBackground(clrLightGray);
    
    // Highlight active selection mode and manage lines
    int selectionMode = GetSelectionMode();
    switch(selectionMode)
    {
        case MODE_ZONE_TOP:
        {
            m_zoneTopModeButton.ColorBackground(clrLightBlue);
            m_zoneTopModeButton.Text("Stop");
            // Show current value as line if exists
            double currentTopPrice = GetZoneTop();
            if(currentTopPrice > 0)
            {
                UpdateZoneLevelLine(ZONE_TOP_LINE_NAME, currentTopPrice, clrBlue);
            }
            // Remove bottom line when not in bottom mode
            RemoveZoneLevelLine(ZONE_BOTTOM_LINE_NAME);
            break;
        }
        case MODE_ZONE_BOTTOM:
        {
            m_zoneBottomModeButton.ColorBackground(clrLightBlue);
            m_zoneBottomModeButton.Text("Stop");
            // Show current value as line if exists
            double currentBottomPrice = GetZoneBottom();
            if(currentBottomPrice > 0)
            {
                UpdateZoneLevelLine(ZONE_BOTTOM_LINE_NAME, currentBottomPrice, clrRed);
            }
            // Remove top line when not in top mode
            RemoveZoneLevelLine(ZONE_TOP_LINE_NAME);
            break;
        }
        case MODE_ZONE_AUTOMATIC:
        {
            m_zoneAutomaticButton.ColorBackground(clrOrange);
            // Don't change button text - keep it as "Automatic"
            // Remove all manual selection lines when in automatic mode
            RemoveZoneLevelLine(ZONE_TOP_LINE_NAME);
            RemoveZoneLevelLine(ZONE_BOTTOM_LINE_NAME);
            break;
        }
        default:
        {
            m_zoneTopModeButton.Text("Auswählen");
            m_zoneBottomModeButton.Text("Auswählen");
            // Don't change Automatic button text in default case
            
            // Only remove lines if the fields are empty, otherwise keep them visible
            double topPrice = GetZoneTop();
            double bottomPrice = GetZoneBottom();
            
            if (topPrice <= 0)
            {
                RemoveZoneLevelLine(ZONE_TOP_LINE_NAME);
            }
            else
            {
                // Keep or show the top line if value exists
                UpdateZoneLevelLine(ZONE_TOP_LINE_NAME, topPrice, clrBlue);
            }
            
            if (bottomPrice <= 0)
            {
                RemoveZoneLevelLine(ZONE_BOTTOM_LINE_NAME);
            }
            else
            {
                // Keep or show the bottom line if value exists  
                UpdateZoneLevelLine(ZONE_BOTTOM_LINE_NAME, bottomPrice, clrRed);
            }
            break;
        }
    }
}

//+------------------------------------------------------------------+
//| Show zone list                                                   |
//+------------------------------------------------------------------+
void CZoneTradePanel::ShowZoneList()
{
    if (m_zoneManager == NULL)
        return;
        
    string zoneList = m_zoneManager.GetZoneList();
    
    if (m_zoneManager.GetZoneCount() == 0)
    {
        MessageBox("No zones created yet.", "Zone List", MB_OK | MB_ICONINFORMATION);
    }
    else
    {
        MessageBox(zoneList, "Zone List", MB_OK | MB_ICONINFORMATION);
    }
}

//+------------------------------------------------------------------+
//| Handle chart clicks for zone creation                           |
//+------------------------------------------------------------------+
void CZoneTradePanel::HandleChartClick(int x, int y)
{
    // Check if we're in automatic zone detection mode
    if (GetSelectionMode() == MODE_ZONE_AUTOMATIC)
    {
        Print("Automatic zone detection: Chart click at x=", x, " y=", y);
        CalculateAutomaticZone(x, y);
        return;
    }
    
    // If we're in zone creation mode, handle with zone manager
    if (m_zoneManager != NULL && m_zoneManager.GetCreationMode() != ZONE_CREATE_NONE)
    {
        if (m_zoneManager.HandleChartClick(x, y))
        {
            UpdateZoneButtonsAppearance();
            return;
        }
    }
    
    // If not in zone creation mode, the chart click will be handled by parent's OnChartEvent
    // which we don't intercept in this case, so the normal level selection should work
}

//+------------------------------------------------------------------+
//| Update zone status display                                       |
//+------------------------------------------------------------------+
void CZoneTradePanel::UpdateZoneStatus()
{
    if (m_zoneManager == NULL)
        return;
        
    // Update any status displays
    UpdateZoneButtonsAppearance();
    UpdateZoneTable();
}

//+------------------------------------------------------------------+
//| Refresh zone display                                             |
//+------------------------------------------------------------------+
void CZoneTradePanel::RefreshZoneDisplay()
{
    if (m_zoneManager != NULL)
    {
        m_zoneManager.RefreshZoneDisplay();
        ForceZoneTableUpdate();
    }
}

//+------------------------------------------------------------------+
//| Handle zone level selection clicks                              |
//+------------------------------------------------------------------+
void CZoneTradePanel::HandleZoneLevelClick(int x, int y, int mode)
{
    Print("HandleZoneLevelClick called - x:", x, " y:", y, " mode:", mode);
    
    // Check if click is within dialog bounds (same logic as base TradePanel)
    int dialogLeft = Left();
    int dialogTop = Top();
    int dialogRight = dialogLeft + Width();
    int dialogBottom = dialogTop + Height();
    
    // If click is within dialog area, ignore it for level selection
    if(x >= dialogLeft && x <= dialogRight && y >= dialogTop && y <= dialogBottom)
    {
        Print("Klick innerhalb des Panels - wird für Zone-Level-Auswahl ignoriert");
        return;
    }
    
    // Convert chart coordinates to price
    datetime time;
    double price;
    int window;
    
    if(!ChartXYToTimePrice(0, x, y, window, time, price))
    {
        Print("Error: Could not convert chart coordinates to price");
        return;
    }
    
    Print("Chart click converted - time:", TimeToString(time), " price:", price);
    
    // Get candle data for the clicked time
    MqlRates rates[];
    if(CopyRates(_Symbol, PERIOD_CURRENT, time, 1, rates) <= 0)
    {
        Print("Error: Could not get candle data for time ", time);
        return;
    }
    
    double open = rates[0].open;
    double high = rates[0].high;
    double low = rates[0].low;
    double close = rates[0].close;
    
    // Determine click count and cycling logic (similar to parent TradePanel)
    string timeString = TimeToString(time);
    int clickCount = 0;
    
    if(mode == MODE_ZONE_TOP)
    {
        // Check if same candle clicked multiple times
        if(m_lastZoneTopClickTime == timeString)
        {
            m_zoneTopClickCount = (m_zoneTopClickCount + 1) % 4; // Cycle through 0-3
        }
        else
        {
            m_zoneTopClickCount = 0; // Reset for new candle
            m_lastZoneTopClickTime = timeString;
        }
        clickCount = m_zoneTopClickCount;
    }
    else if(mode == MODE_ZONE_BOTTOM)
    {
        // Check if same candle clicked multiple times
        if(m_lastZoneBottomClickTime == timeString)
        {
            m_zoneBottomClickCount = (m_zoneBottomClickCount + 1) % 4; // Cycle through 0-3
        }
        else
        {
            m_zoneBottomClickCount = 0; // Reset for new candle
            m_lastZoneBottomClickTime = timeString;
        }
        clickCount = m_zoneBottomClickCount;
    }
    
    // Select price level based on click count (same logic as TradePanel)
    double selectedPrice = 0;
    switch(clickCount)
    {
        case 0: selectedPrice = low; break;                          // Low
        case 1: selectedPrice = MathMin(open, close); break;         // Lower Body
        case 2: selectedPrice = MathMax(open, close); break;         // Upper Body  
        case 3: selectedPrice = high; break;                         // High
    }
    
    // Capture the clicked candle time as zone start time (first level setting)
    if(m_zoneStartTime == 0)
    {
        m_zoneStartTime = time; // Use the actual clicked candle time
        Print("Zone start time captured from click: ", TimeToString(m_zoneStartTime));
    }
    
    // Set the appropriate zone level and update visualization
    if(mode == MODE_ZONE_TOP)
    {
        SetZoneTop(selectedPrice);
        UpdateZoneLevelLine(ZONE_TOP_LINE_NAME, selectedPrice, clrBlue);
        Print("Zone Top set to: ", selectedPrice, " (click ", clickCount, ") at time: ", TimeToString(time));
    }
    else if(mode == MODE_ZONE_BOTTOM)
    {
        SetZoneBottom(selectedPrice);
        UpdateZoneLevelLine(ZONE_BOTTOM_LINE_NAME, selectedPrice, clrRed);
        Print("Zone Bottom set to: ", selectedPrice, " (click ", clickCount, ") at time: ", TimeToString(time));
    }
    
    // Update button appearance
    UpdateZoneButtonsAppearance();
}

//+------------------------------------------------------------------+
//| Clear zone field                                                |
//+------------------------------------------------------------------+
void CZoneTradePanel::ClearZoneField(int fieldId)
{
    switch(fieldId)
    {
        case ZONE_TOP_EDIT:
            m_zoneTopEdit.Text("");
            RemoveZoneLevelLine(ZONE_TOP_LINE_NAME);
            m_zoneTopClickCount = 0;
            m_lastZoneTopClickTime = "";
            Print("Zone Top cleared");
            break;
        case ZONE_BOTTOM_EDIT:
            m_zoneBottomEdit.Text("");
            RemoveZoneLevelLine(ZONE_BOTTOM_LINE_NAME);
            m_zoneBottomClickCount = 0;
            m_lastZoneBottomClickTime = "";
            Print("Zone Bottom cleared");
            break;
    }
}

//+------------------------------------------------------------------+
//| Create zone from current top/bottom levels                      |
//+------------------------------------------------------------------+
void CZoneTradePanel::CreateZoneFromLevels()
{
    Print("CreateZoneFromLevels called");
    
    double topPrice = GetZoneTop();
    double bottomPrice = GetZoneBottom();
    
    Print("Zone prices - Top: ", topPrice, ", Bottom: ", bottomPrice);
    
    if(topPrice <= 0 || bottomPrice <= 0)
    {
        Print("Invalid zone prices - Top: ", topPrice, ", Bottom: ", bottomPrice);
        MessageBox("Please set both Zone Top and Zone Bottom before creating a zone.", "Zone Creation Error", MB_OK | MB_ICONWARNING);
        return;
    }
    
    if(topPrice == bottomPrice)
    {
        MessageBox("Zone Top and Bottom cannot be the same price.", "Zone Creation Error", MB_OK | MB_ICONWARNING);
        return;
    }
    
    // Ensure upper/lower are correctly assigned
    double upperPrice = MathMax(topPrice, bottomPrice);
    double lowerPrice = MathMin(topPrice, bottomPrice);
    
    Print("Zone manager available: ", (m_zoneManager != NULL ? "Yes" : "No"));
    
    if(m_zoneManager != NULL)
    {
        Print("Attempting to create zone with upper=", upperPrice, ", lower=", lowerPrice);
        
        // Use start time if available, otherwise current time
        datetime zoneStartTime = (m_zoneStartTime > 0) ? m_zoneStartTime : TimeCurrent();
        
        if(m_zoneManager.CreateZoneWithStartTime(upperPrice, lowerPrice, PERIOD_CURRENT, zoneStartTime))
        {
            Print("Zone created successfully: Upper=", upperPrice, ", Lower=", lowerPrice, ", StartTime=", TimeToString(zoneStartTime));
            
            // Clear the fields and lines after successful creation
            ClearZoneField(ZONE_TOP_EDIT);
            ClearZoneField(ZONE_BOTTOM_EDIT);
            
            // Remove automatic zone visualization (replaced by real zone)
            if (ObjectFind(0, "AutoZone_Rect") >= 0)
                ObjectDelete(0, "AutoZone_Rect");
            if (ObjectFind(0, "AutoZone_Label") >= 0)
                ObjectDelete(0, "AutoZone_Label");
            
            // Reset selection modes and start time
            SetSelectionMode(MODE_NONE);
            UpdateZoneButtonsAppearance();
            m_zoneStartTime = 0; // Reset for next zone
            
            // Update zone table to show the new zone
            Print("Zone created successfully - forcing table update");
            ForceZoneTableUpdate();
            
            // Debug: Check if zone was actually created
            if (m_zoneManager != NULL)
            {
                int newZoneCount = m_zoneManager.GetZoneCount();
                Print("Zone count after creation: ", newZoneCount);
            }
        }
        else
        {
            string errorMsg = "Zone konnte nicht erstellt werden.\n\n";
            errorMsg += "Mögliche Ursachen:\n";
            errorMsg += "- Zone ist zu klein (min. 1 Pip)\n";
            errorMsg += "- Ungültige Preise\n\n";
            errorMsg += "Aktuelle Zone-Größe: " + DoubleToString(MathAbs(upperPrice - lowerPrice), _Digits) + " Punkte";
            MessageBox(errorMsg, "Zone Creation Error", MB_OK | MB_ICONERROR);
        }
    }
    else
    {
        MessageBox("Zone Manager not available.", "Zone Creation Error", MB_OK | MB_ICONERROR);
    }
}

//+------------------------------------------------------------------+
//| Zone level getters and setters                                  |
//+------------------------------------------------------------------+
double CZoneTradePanel::GetZoneTop() const
{
    string text = m_zoneTopEdit.Text();
    double value = StringToDouble(text);
    Print("GetZoneTop() - Field text: '", text, "', Converted value: ", value);
    return value;
}

double CZoneTradePanel::GetZoneBottom() const
{
    string text = m_zoneBottomEdit.Text();
    double value = StringToDouble(text);
    Print("GetZoneBottom() - Field text: '", text, "', Converted value: ", value);
    return value;
}

void CZoneTradePanel::SetZoneTop(double price)
{
    // Truncate (not round) to symbol digits
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    double multiplier = MathPow(10, digits);
    double truncated = MathFloor(price * multiplier) / multiplier;
    m_zoneTopEdit.Text(DoubleToString(truncated, digits));
    
    // Capture start time when first level is set (will be set in HandleZoneLevelClick)
    if(m_zoneStartTime == 0)
    {
        m_zoneStartTime = TimeCurrent(); // Fallback if not set via click
        Print("Zone start time captured (fallback): ", TimeToString(m_zoneStartTime));
    }
    
    // Update line if in selection mode
    if(GetSelectionMode() == MODE_ZONE_TOP)
    {
        UpdateZoneLevelLine(ZONE_TOP_LINE_NAME, price, clrBlue);
    }
}

void CZoneTradePanel::SetZoneBottom(double price)
{
    // Truncate (not round) to symbol digits
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    double multiplier = MathPow(10, digits);
    double truncated = MathFloor(price * multiplier) / multiplier;
    m_zoneBottomEdit.Text(DoubleToString(truncated, digits));
    
    // Capture start time when first level is set (will be set in HandleZoneLevelClick)
    if(m_zoneStartTime == 0)
    {
        m_zoneStartTime = TimeCurrent(); // Fallback if not set via click
        Print("Zone start time captured (fallback): ", TimeToString(m_zoneStartTime));
    }
    
    // Update line if in selection mode
    if(GetSelectionMode() == MODE_ZONE_BOTTOM)
    {
        UpdateZoneLevelLine(ZONE_BOTTOM_LINE_NAME, price, clrRed);
    }
}

//+------------------------------------------------------------------+
//| Update zone level line visualization                            |
//+------------------------------------------------------------------+
void CZoneTradePanel::UpdateZoneLevelLine(const string& lineName, double price, color lineColor)
{
    // Remove existing line first
    if(ObjectFind(0, lineName) >= 0)
    {
        ObjectDelete(0, lineName);
    }
    
    // Create new horizontal line
    if(ObjectCreate(0, lineName, OBJ_HLINE, 0, 0, price))
    {
        ObjectSetInteger(0, lineName, OBJPROP_COLOR, lineColor);
        ObjectSetInteger(0, lineName, OBJPROP_STYLE, STYLE_SOLID);
        ObjectSetInteger(0, lineName, OBJPROP_WIDTH, 2);
        ObjectSetInteger(0, lineName, OBJPROP_BACK, false);
        ObjectSetInteger(0, lineName, OBJPROP_SELECTABLE, true);
        ObjectSetInteger(0, lineName, OBJPROP_HIDDEN, false);
        
        // Set description for the line
        string description = (lineName == ZONE_TOP_LINE_NAME) ? "Zone Top Level" : "Zone Bottom Level";
        ObjectSetString(0, lineName, OBJPROP_TEXT, description);
        
        ChartRedraw(0);
    }
    else
    {
        Print("Error creating zone level line: ", lineName, " at price: ", price);
    }
}

//+------------------------------------------------------------------+
//| Remove zone level line                                          |
//+------------------------------------------------------------------+
void CZoneTradePanel::RemoveZoneLevelLine(const string& lineName)
{
    if(ObjectFind(0, lineName) >= 0)
    {
        ObjectDelete(0, lineName);
        ChartRedraw(0);
    }
}

//+------------------------------------------------------------------+
//| Initialize zone table                                           |
//+------------------------------------------------------------------+
void CZoneTradePanel::InitializeZoneTable()
{
    // Table header
    if (m_zoneTableHeader.Create(0, Name() + "ZoneTableHeader", 0,
                                MARGIN, m_zoneTableY, 
                                MARGIN + 550, m_zoneTableY + 25))
    {
        m_zoneTableHeader.Text("Zonen-Übersicht (Zones werden automatisch angezeigt)");
        m_zoneTableHeader.Color(clrBlack);
        m_zoneTableHeader.ColorBackground(clrLightGray);
        m_zoneTableHeader.ColorBorder(clrGray);
        Add(m_zoneTableHeader);
    }
    
    Print("Zone table initialized - dynamic layout ready");
}

//+------------------------------------------------------------------+
//| Update zone table with current zones                            |
//+------------------------------------------------------------------+
void CZoneTradePanel::UpdateZoneTable()
{
    if (m_zoneManager == NULL)
    {
        Print("UpdateZoneTable: ZoneManager is NULL");
        return;
    }
        
    int totalZones = m_zoneManager.GetZoneCount();

    // Calculate required height and resize dialog if needed
    ResizeDialogForZones(totalZones);
    
    // Clear existing zone displays
    for (int i = 0; i < 20; i++)
    {
        if (m_zoneLabels[i].Name() != "")
        {
            m_zoneLabels[i].Destroy();
        }
        if (m_zoneDeleteButtons[i].Name() != "")
        {
            m_zoneDeleteButtons[i].Destroy();
        }
    }
    
    if (totalZones == 0)
    {
        // Show "no zones" message
        if (m_zoneLabels[0].Create(0, Name() + "NoZones", 0,
                                  MARGIN, m_zoneTableY + 35,
                                  MARGIN + 400, m_zoneTableY + 60))
        {
            m_zoneLabels[0].Text("Keine Zonen vorhanden");
            m_zoneLabels[0].Color(clrGray);
            m_zoneLabels[0].ColorBackground(clrWhite);
            Add(m_zoneLabels[0]);
        }
    }
    else
    {
        // Show zones with individual delete buttons
        int startY = m_zoneTableY + 35;
        int rowHeight = 35; // Increased spacing between zones
        
        for (int i = 0; i < totalZones; i++)
        {
            CTradingZone* zone = m_zoneManager.GetZone(i);
            if (zone != NULL)
            {
                int rowY = startY + (i * rowHeight);
                
                // Zone info label
                string statusText = "";
                switch(zone.GetStatus())
                {
                    case ZONE_INACTIVE: statusText = "Inaktiv"; break;
                    case ZONE_ACTIVE: statusText = "Aktiv"; break;
                    case ZONE_TRIGGERED: statusText = "Ausgelöst"; break;
                    case ZONE_DISABLED: statusText = "Deaktiviert"; break;
                }
                
                string zoneText = StringFormat("%d. %s | %.5f-%.5f | %s", 
                                              i + 1,
                                              zone.GetName(),
                                              zone.GetLowerPrice(), 
                                              zone.GetUpperPrice(),
                                              statusText);
                
                if (m_zoneLabels[i].Create(0, Name() + "Zone" + IntegerToString(i), 0,
                                          MARGIN, rowY,
                                          MARGIN + 400, rowY + 25))
                {
                    m_zoneLabels[i].Text(zoneText);
                    m_zoneLabels[i].Color(clrBlack);
                    m_zoneLabels[i].ColorBackground(clrWhite);
                    m_zoneLabels[i].ColorBorder(clrLightGray);
                    Add(m_zoneLabels[i]);
                }
                
                // Individual delete button for this zone (positioned to the right of text)
                if (m_zoneDeleteButtons[i].Create(0, Name() + "DelZone" + IntegerToString(i), 0,
                                                 MARGIN + 510, rowY + 5,
                                                 MARGIN + 620, rowY + 33))
                {
                    m_zoneDeleteButtons[i].Text("Löschen");
                    m_zoneDeleteButtons[i].Color(clrWhite);
                    m_zoneDeleteButtons[i].ColorBackground(clrRed);
                    m_zoneDeleteButtons[i].ColorBorder(clrGray);
                    Add(m_zoneDeleteButtons[i]);
                }
            }
        }
    }
    
    ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Get selected zone index from input field                        |
//+------------------------------------------------------------------+
int CZoneTradePanel::GetSelectedZoneIndex()
{
    string indexText = m_zoneIndexEdit.Text();
    int index = (int)StringToInteger(indexText);
    return index - 1; // Convert from 1-based to 0-based index
}

//+------------------------------------------------------------------+
//| Delete selected zone                                            |
//+------------------------------------------------------------------+
void CZoneTradePanel::DeleteSelectedZone()
{
    if (m_zoneManager == NULL)
        return;
        
    int zoneIndex = GetSelectedZoneIndex();
    int totalZones = m_zoneManager.GetZoneCount();
    
    if (zoneIndex < 0 || zoneIndex >= totalZones)
    {
        MessageBox("Ungültige Zone-Nummer. Bitte wählen Sie eine Nummer zwischen 1 und " + IntegerToString(totalZones) + ".", "Fehler", MB_OK | MB_ICONWARNING);
        return;
    }
        
    CTradingZone* zone = m_zoneManager.GetZone(zoneIndex);
    if (zone != NULL)
    {
        string zoneName = zone.GetName();
        string confirmMessage = "Zone " + IntegerToString(zoneIndex + 1) + " ('" + zoneName + "') löschen?";
        
        if (MessageBox(confirmMessage, "Bestätigen", MB_YESNO | MB_ICONQUESTION) == IDYES)
        {
            if (m_zoneManager.RemoveZoneByIndex(zoneIndex))
            {
                Print("Zone gelöscht: ", zoneName);
                m_zoneIndexEdit.Text("1"); // Reset to 1
                UpdateZoneTable();
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Check for zone updates and refresh table (no resize)            |
//+------------------------------------------------------------------+
void CZoneTradePanel::CheckForZoneUpdatesNoResize()
{
    if (m_zoneManager == NULL)
    {
        // Print this only occasionally to avoid spam
        static datetime lastNullWarning = 0;
        if (TimeCurrent() - lastNullWarning > 10)
        {
            Print("CheckForZoneUpdatesNoResize: ZoneManager is NULL");
            lastNullWarning = TimeCurrent();
        }
        return;
    }
        
    datetime currentTime = TimeCurrent();
    
    // Check every 2 seconds or when zone count changes
    if (currentTime - m_lastUpdateTime > 2 || m_lastUpdateTime == 0)
    {
        int currentZoneCount = m_zoneManager.GetZoneCount();
        
        // Debug: Show periodic updates
        static int debugCounter = 0;
        debugCounter++;
        if (debugCounter % 10 == 0 || currentZoneCount != m_lastZoneCount)
        {
            CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Zone update check #" + IntegerToString(debugCounter) + ": Current zones = " + IntegerToString(currentZoneCount) + ", Last = " + IntegerToString(m_lastZoneCount));
        }
        
        // Always update if time elapsed, or if zone count changed
        if (currentTime - m_lastUpdateTime > 2 || currentZoneCount != m_lastZoneCount)
        {
            if (currentZoneCount != m_lastZoneCount)
            {
                Print("Zone count changed from ", m_lastZoneCount, " to ", currentZoneCount);
            }
            
            // Update the table only
            UpdateZoneTable();
            
            m_lastZoneCount = currentZoneCount;
        }
        
        m_lastUpdateTime = currentTime;
    }
}


//+------------------------------------------------------------------+
//| Force immediate zone table update                               |
//+------------------------------------------------------------------+
void CZoneTradePanel::ForceZoneTableUpdate()
{
    Print("ForceZoneTableUpdate called");
    m_lastUpdateTime = 0;  // Reset timer to force update
    CheckForZoneUpdatesNoResize();
}

//+------------------------------------------------------------------+
//| Test zone table display functionality                           |
//+------------------------------------------------------------------+
void CZoneTradePanel::TestZoneTableDisplay()
{
    Print("Testing zone table display...");
    
    if (m_zoneManager != NULL)
    {
        int zones = m_zoneManager.GetZoneCount();
        Print("Zone Manager connected - Zones found: ", zones);
        
        // Show first few zones for debugging
        for (int i = 0; i < MathMin(zones, 3); i++)
        {
            CTradingZone* zone = m_zoneManager.GetZone(i);
            if (zone != NULL)
            {
                Print("Zone ", i+1, ": ", zone.GetName());
            }
        }
        
        // Force update of zone table
        UpdateZoneTable();
    }
    else
    {
        Print("Zone Manager is NULL - cannot test display");
    }
}

//+------------------------------------------------------------------+
//| Dynamic dialog resizing                                         |
//+------------------------------------------------------------------+
void CZoneTradePanel::ResizeDialogForZones(int zoneCount)
{
    int baseHeight = 550; // Base height for standard controls
    int zoneTableHeight = MathMax(60, (zoneCount * 35) + 60); // 35px per zone + header
    int requiredHeight = baseHeight + zoneTableHeight;
    
    if (requiredHeight != m_currentDialogHeight)
    {
        Print("Calculating dialog height: Base=", baseHeight, ", ZoneTable=", zoneTableHeight, ", Required=", requiredHeight);
        
        // Set height using the Height property
        if (Height() != requiredHeight)
        {
            Height(requiredHeight);
            Print("Dialog height set to: ", requiredHeight);
        }
        
        m_currentDialogHeight = requiredHeight;
        
        // Force chart redraw to update display
        ChartRedraw(0);
    }
}

//+------------------------------------------------------------------+
//| Handle individual zone delete clicks                            |
//+------------------------------------------------------------------+
void CZoneTradePanel::HandleZoneDeleteClick(int zoneIndex)
{
    if (m_zoneManager == NULL || zoneIndex < 0 || zoneIndex >= m_zoneManager.GetZoneCount())
        return;
        
    CTradingZone* zone = m_zoneManager.GetZone(zoneIndex);
    if (zone != NULL)
    {
        string zoneName = zone.GetName();
        string confirmMessage = "Zone '" + zoneName + "' löschen?";
        
        if (MessageBox(confirmMessage, "Bestätigen", MB_YESNO | MB_ICONQUESTION) == IDYES)
        {
            if (m_zoneManager.RemoveZoneByIndex(zoneIndex))
            {
                Print("Zone gelöscht: ", zoneName);
                ForceZoneTableUpdate();
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Initialize zone timeframe combo box                             |
//+------------------------------------------------------------------+
void CZoneTradePanel::InitializeZoneTimeframeCombo()
{
    // Button is already created and set to M1
    m_zoneTradingTimeframe = PERIOD_M1;
    Print("Zone timeframe button initialized with default M1");
}

//+------------------------------------------------------------------+
//| Update zone trading timeframe from combo selection              |
//+------------------------------------------------------------------+
void CZoneTradePanel::UpdateZoneTradingTimeframe()
{
    // Update zone manager with current timeframe
    if (m_zoneManager != NULL)
    {
        m_zoneManager.SetZoneTradingTimeframe(m_zoneTradingTimeframe);
        Print("Zone manager updated with trading timeframe: ", EnumToString(m_zoneTradingTimeframe));
    }
}

//+------------------------------------------------------------------+
//| Cycle through available timeframes                              |
//+------------------------------------------------------------------+
void CZoneTradePanel::CycleZoneTimeframe()
{
    ENUM_TIMEFRAMES timeframes[] = {PERIOD_M1, PERIOD_M5, PERIOD_M15, PERIOD_M30, PERIOD_H1, PERIOD_H4, PERIOD_D1, PERIOD_W1, PERIOD_MN1};
    string timeframeNames[] = {"M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"};
    
    // Find current timeframe index
    int currentIndex = 0;
    for (int i = 0; i < ArraySize(timeframes); i++)
    {
        if (timeframes[i] == m_zoneTradingTimeframe)
        {
            currentIndex = i;
            break;
        }
    }
    
    // Cycle to next timeframe
    int nextIndex = (currentIndex + 1) % ArraySize(timeframes);
    m_zoneTradingTimeframe = timeframes[nextIndex];
    
    // Update button text
    m_zoneTimeframeButton.Text(timeframeNames[nextIndex]);
    
    Print("Zone trading timeframe cycled to: ", EnumToString(m_zoneTradingTimeframe));
    
    // Update zone manager
    UpdateZoneTradingTimeframe();
}

//+------------------------------------------------------------------+
//| Calculate automatic zone based on chart click and imbalances   |
//+------------------------------------------------------------------+
void CZoneTradePanel::CalculateAutomaticZone(int x, int y)
{
    CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "=== CalculateAutomaticZone CALLED ===");
    CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "x=" + IntegerToString(x) + " y=" + IntegerToString(y));
    CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Current selection mode=" + IntegerToString(GetSelectionMode()));
    
    datetime time;
    double price;
    int window;
    
    // Convert chart coordinates to time/price
    if (!ChartXYToTimePrice(0, x, y, window, time, price))
    {
        Print("Error: Could not convert chart coordinates x=", x, " y=", y);
        MessageBox("Fehler beim Konvertieren der Chart-Koordinaten", "Automatic Zone", MB_OK | MB_ICONERROR);
        return;
    }
    
    CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Converted to time=" + TimeToString(time) + " price=" + DoubleToString(price, _Digits) + " window=" + IntegerToString(window));
    
    if (window != 0)
    {
        Print("Error: Click must be on main chart window");
        MessageBox("Klick muss im Hauptchart-Fenster sein", "Automatic Zone", MB_OK | MB_ICONERROR);
        return;
    }
    
    Print("Calculating automatic zone for time: ", TimeToString(time), " price: ", price);
    
    // Get current chart timeframe (not trading timeframe)
    ENUM_TIMEFRAMES currentTimeframe = (ENUM_TIMEFRAMES)ChartPeriod(0);
    Print("Using current chart timeframe: ", EnumToString(currentTimeframe));
    
    // We'll use our own imbalance detection instead of relying on ImbalanceDetector
    Print("Using custom imbalance detection for zone calculation");
    
    // Step 1: Find the clicked candle
    CCandle* clickedCandle = NULL;
    datetime targetTime = time;
    
    // First check if chart is available
    CBaseChart* chartForSearch = NULL;
    chartForSearch = CChartManager::GetInstance().GetChart(_Symbol, currentTimeframe);
    if (chartForSearch == NULL)
    {
        Print("Error: Cannot get chart for symbol ", _Symbol, " timeframe ", EnumToString(currentTimeframe));
        MessageBox("Fehler: Chart für aktuelles Zeitfenster nicht verfügbar", "Automatic Zone", MB_OK | MB_ICONERROR);
        return;
    }
    
    // Search for the candle that corresponds to the clicked time
    for (int i = 0; i <= 1000; i++)  // Look through recent candles
    {
        CCandle* candle = chartForSearch.getCandleAt(i);
        if (candle == NULL) 
        {
            CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "No candle at index " + IntegerToString(i) + " - end of data");
            break;
        }
        
        // Debug: Show candle info
        CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Index " + IntegerToString(i) + " Candle time: " + TimeToString(candle.openTime) + " Target time: " + TimeToString(targetTime));
        
        // Check if this candle contains the clicked time
        if (candle.openTime <= targetTime && targetTime < candle.openTime + PeriodSeconds(currentTimeframe))
        {
            clickedCandle = candle;
            Print("SUCCESS: Found clicked candle at index ", i, " with time: ", TimeToString(candle.openTime));
            Print("  Candle range: ", TimeToString(candle.openTime), " to ", TimeToString(candle.openTime + PeriodSeconds(currentTimeframe)));
            break;
        }
    }
    
    if (clickedCandle == NULL)
    {
        Print("Warning: Could not find exact candle for clicked time: ", TimeToString(targetTime));
        Print("This might be because you clicked on the current (not yet completed) candle.");
        Print("Using the most recent completed candle (index 0) instead.");
        
        // Fallback: Use the most recent completed candle
        clickedCandle = chartForSearch.getCandleAt(0);
        if (clickedCandle == NULL)
        {
            Print("Error: Cannot get even the most recent candle!");
            MessageBox("Fehler: Keine Kerzendaten verfügbar", "Automatic Zone", MB_OK | MB_ICONERROR);
            return;
        }
        
        Print("Fallback: Using most recent completed candle at ", TimeToString(clickedCandle.openTime));
    }
    
    // Step 2: Find the index of clicked candle for forward search (reuse existing chart reference)
    int clickedIndex = -1;
    
    for (int i = 0; i <= 1000; i++)
    {
        CCandle* candle = chartForSearch.getCandleAt(i);
        if (candle == NULL) break;
        
        if (candle.openTime == clickedCandle.openTime)
        {
            clickedIndex = i;
            break;
        }
    }
    
    if (clickedIndex == -1)
    {
        Print("Error: Could not find clicked candle index");
        MessageBox("Fehler: Kerzen-Index nicht gefunden", "Automatic Zone", MB_OK | MB_ICONERROR);
        return;
    }
    
    // Step 3: Search FORWARD from clicked candle to find first imbalance
    CCandle* candleBeforeImbalance = NULL;
    CCandle* candleAfterImbalance = NULL;
    bool isBullishZone = false;
    bool imbalanceFound = false;
    
    Print("Searching for first imbalance after clicked candle (index ", clickedIndex, ")");
    Print("Note: Index 0 = newest candle, higher index = older candle");
    Print("Will check indices from ", (clickedIndex - 1), " down to 0");
    Print("This means checking candles from time AFTER ", TimeToString(clickedCandle.openTime), " forward to present");
    
    // Search FORWARD in time = BACKWARD in index (from clickedIndex toward 0)
    // We want to find imbalances that happened AFTER the clicked candle
    // Need 3 candles: vorgaenger, imbalance-candle, nachfolger
    for (int i = clickedIndex - 1; i >= 1; i--) // Start at i-1, stop at 1 (need i-1 for nachfolger)
    {
        CCandle* vorgaenger = chartForSearch.getCandleAt(i + 1);      // Ältere Kerze (Kerze 1)
        CCandle* imbalanceCandle = chartForSearch.getCandleAt(i);     // Mittlere Kerze (Kerze 2) - DIE IMBALANCE
        CCandle* nachfolger = chartForSearch.getCandleAt(i - 1);      // Neuere Kerze (Kerze 3)
        
        if (vorgaenger == NULL || imbalanceCandle == NULL || nachfolger == NULL) 
        {
            CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Missing candle data at indices " + IntegerToString(i + 1) + ", " + IntegerToString(i) + ", or " + IntegerToString(i - 1));
            break;
        }
        
        CLogManager::GetInstance().LogMessage("CZoneTradePanel", LL_DEBUG, "Checking for imbalance pattern:");
        Print("  Vorgaenger[", (i + 1), "]: ", TimeToString(vorgaenger.openTime), " High=", vorgaenger.high, " Low=", vorgaenger.low);
        Print("  Imbalance[", i, "]: ", TimeToString(imbalanceCandle.openTime), " High=", imbalanceCandle.high, " Low=", imbalanceCandle.low);
        Print("  Nachfolger[", (i - 1), "]: ", TimeToString(nachfolger.openTime), " High=", nachfolger.high, " Low=", nachfolger.low);
        
        // Check for imbalance: Vorgänger und Nachfolger überschneiden sich NICHT
        // (Die Imbalance-Kerze dazwischen ist irrelevant für den Gap-Check)
        bool hasUpwardImbalance = (nachfolger.low > vorgaenger.high);   // Nachfolger über Vorgänger = Upward Gap
        bool hasDownwardImbalance = (nachfolger.high < vorgaenger.low); // Nachfolger unter Vorgänger = Downward Gap
        
        Print("  Upward gap check: nachfolger.low(", nachfolger.low, ") > vorgaenger.high(", vorgaenger.high, ") = ", hasUpwardImbalance);
        Print("  Downward gap check: nachfolger.high(", nachfolger.high, ") < vorgaenger.low(", vorgaenger.low, ") = ", hasDownwardImbalance);
        
        if (hasUpwardImbalance || hasDownwardImbalance)
        {
            candleBeforeImbalance = vorgaenger;        // Kerze VOR der Imbalance
            candleAfterImbalance = nachfolger;         // Kerze NACH der Imbalance
            isBullishZone = hasUpwardImbalance;        // Upward imbalance = bullish zone
            imbalanceFound = true;
            
            Print("FOUND IMBALANCE! The middle candle is the imbalance:");
            Print("  Vorgaenger: ", TimeToString(vorgaenger.openTime), " High=", vorgaenger.high, " Low=", vorgaenger.low);
            Print("  IMBALANCE: ", TimeToString(imbalanceCandle.openTime), " High=", imbalanceCandle.high, " Low=", imbalanceCandle.low);
            Print("  Nachfolger: ", TimeToString(nachfolger.openTime), " High=", nachfolger.high, " Low=", nachfolger.low);
            Print("  Gap direction: ", (isBullishZone ? "UPWARD" : "DOWNWARD"));
            break;
        }
        else
        {
            Print("  No imbalance - vorgaenger and nachfolger overlap");
        }
    }
    
    // Step 4: Calculate zone boundaries based on imbalance type
    double zoneTop = 0.0;
    double zoneBottom = 0.0;
    
    if (imbalanceFound && candleBeforeImbalance != NULL)
    {
        if (isBullishZone)
        {
            // Bullish zone (upward imbalance): use body top of candle before imbalance
            zoneTop = candleBeforeImbalance.getBodyTop();
            zoneBottom = clickedCandle.low; // Use low of clicked candle as bottom
            Print("Bullish zone calculated:");
            Print("  Zone Top = Body top of candle before imbalance: ", zoneTop);
            Print("  Zone Bottom = Low of clicked candle: ", zoneBottom);
        }
        else
        {
            // Bearish zone (downward imbalance): use body bottom of candle before imbalance  
            zoneBottom = candleBeforeImbalance.getBodyBottom();
            zoneTop = clickedCandle.high; // Use high of clicked candle as top
            Print("Bearish zone calculated:");
            Print("  Zone Top = High of clicked candle: ", zoneTop);
            Print("  Zone Bottom = Body bottom of candle before imbalance: ", zoneBottom);
        }
    }
    else
    {
        Print("Warning: No imbalance found after clicked candle - using clicked candle body as fallback");
        
        // Fallback: Use body of clicked candle + some extension
        zoneTop = clickedCandle.getBodyTop();
        zoneBottom = clickedCandle.getBodyBottom();
        
        // Add small extension to make zone more useful
        double bodySize = zoneTop - zoneBottom;
        double extension = bodySize * 0.2; // 20% extension
        zoneTop += extension;
        zoneBottom -= extension;
        
        Print("Fallback zone: Body + 20% extension");
        Print("  Zone Top: ", zoneTop);
        Print("  Zone Bottom: ", zoneBottom);
    }
    
    // Ensure zone is valid (minimum size)
    double minZoneSize = 10 * _Point;  // Minimum 10 pips
    if (zoneTop - zoneBottom < minZoneSize)
    {
        double center = (zoneTop + zoneBottom) / 2;
        zoneTop = center + (minZoneSize / 2);
        zoneBottom = center - (minZoneSize / 2);
    }
    
    Print("Automatic zone calculated: Top=", zoneTop, " Bottom=", zoneBottom);
    
    // Auto-populate the zone fields
    SetZoneTop(zoneTop);
    SetZoneBottom(zoneBottom);
    
    // Store the clicked candle time as zone start time
    m_zoneStartTime = clickedCandle.openTime;
    Print("Zone start time set to clicked candle time: ", TimeToString(m_zoneStartTime));
    
    // Reset selection mode to normal FIRST
    SetSelectionMode(MODE_NONE);
    UpdateZoneButtonsAppearance();
    
    // Show zone visualization like a real zone (with fill, from clicked candle time)
    ShowAutomaticZoneVisualization(zoneTop, zoneBottom, clickedCandle.openTime);
    
    Print("Zone visualization created from clicked candle time: ", TimeToString(clickedCandle.openTime));
    
    // Log success message (no dialog)
    Print("Automatische Zone berechnet: Oben=", zoneTop, " Unten=", zoneBottom, " Bereich=", ((zoneTop - zoneBottom) / _Point), " Pips");
    
    Print("Automatic zone calculation completed successfully");
}

//+------------------------------------------------------------------+
//| Show automatic zone visualization like real zones               |
//+------------------------------------------------------------------+
void CZoneTradePanel::ShowAutomaticZoneVisualization(double zoneTop, double zoneBottom, datetime startTime)
{
    Print("ShowAutomaticZoneVisualization called: Top=", zoneTop, " Bottom=", zoneBottom, " StartTime=", TimeToString(startTime));
    
    // Remove any existing automatic zone visualization
    if (ObjectFind(0, "AutoZone_Rect") >= 0)
        ObjectDelete(0, "AutoZone_Rect");
    if (ObjectFind(0, "AutoZone_Label") >= 0)
        ObjectDelete(0, "AutoZone_Label");
    
    // Create rectangle from startTime extending into the future (like real zones)
    datetime currentTime = TimeCurrent();
    datetime endTime = currentTime + PeriodSeconds(PERIOD_D1) * 30; // 30 days into future
    
    Print("Creating rectangle from ", TimeToString(startTime), " to ", TimeToString(endTime));
    
    // Create rectangle
    if (!ObjectCreate(0, "AutoZone_Rect", OBJ_RECTANGLE, 0, startTime, zoneBottom, endTime, zoneTop))
    {
        Print("Error creating automatic zone rectangle: ", GetLastError());
        return;
    }
    
    // Set rectangle properties like real zones
    color zoneColor = clrLightGray; // Neutral color for automatic zones
    ObjectSetInteger(0, "AutoZone_Rect", OBJPROP_COLOR, zoneColor);
    ObjectSetInteger(0, "AutoZone_Rect", OBJPROP_FILL, true);        // Filled rectangle
    ObjectSetInteger(0, "AutoZone_Rect", OBJPROP_BACK, true);        // Background
    ObjectSetInteger(0, "AutoZone_Rect", OBJPROP_SELECTABLE, true);
    ObjectSetInteger(0, "AutoZone_Rect", OBJPROP_HIDDEN, false);
    ObjectSetInteger(0, "AutoZone_Rect", OBJPROP_TIMEFRAMES, OBJ_ALL_PERIODS); // Visible on all timeframes
    ObjectSetInteger(0, "AutoZone_Rect", OBJPROP_CHART_ID, 0);
    
    // Create label
    if (ObjectCreate(0, "AutoZone_Label", OBJ_TEXT, 0, startTime, zoneTop))
    {
        string labelText = "Auto Zone (" + DoubleToString((zoneTop - zoneBottom) / _Point, 1) + " pips)";
        ObjectSetString(0, "AutoZone_Label", OBJPROP_TEXT, labelText);
        ObjectSetInteger(0, "AutoZone_Label", OBJPROP_COLOR, clrBlack);
        ObjectSetInteger(0, "AutoZone_Label", OBJPROP_FONTSIZE, 10);
        ObjectSetInteger(0, "AutoZone_Label", OBJPROP_TIMEFRAMES, OBJ_ALL_PERIODS);
    }
    
    ChartRedraw(0);
    Print("Automatic zone visualization created successfully");
}

//+------------------------------------------------------------------+
//| Prevent dialog minimization and restore it                      |
//+------------------------------------------------------------------+
void CZoneTradePanel::PreventMinimizeAndRestore()
{
    // Force dialog to be visible and not minimized
    if (IsVisible() == false)
    {
        Show();
        Print("Dialog was hidden, restored visibility");
    }
    
    // Bring dialog to front
    BringToTop();
    
    // Ensure dialog is at a reasonable position (not hidden behind MT5 controls)
    int currentLeft = Left();
    int currentTop = Top();
    
    // If dialog is too far right or too low, reposition it
    if (currentLeft > 1000 || currentTop > 600)
    {
        Move(50, 50); // Move to safe position
        Print("Dialog was malpositioned, moved to safe location (50,50)");
    }
    
    // Force redraw
    ChartRedraw(0);
    Print("Dialog minimize prevention and restoration complete");
}

//+------------------------------------------------------------------+
//| Public method to restore dialog visibility (call from outside)  |
//+------------------------------------------------------------------+
void CZoneTradePanel::RestoreDialogVisibility()
{
    PreventMinimizeAndRestore();
}

//+------------------------------------------------------------------+
//| Maximize dialog window (public wrapper for protected Maximize) |
//+------------------------------------------------------------------+
void CZoneTradePanel::maximizeWindow(void)
{
    Maximize(); // Call protected CAppDialog::Maximize() method
    Print("Dialog maximized after chart change");
}

#endif // ZONE_TRADE_PANEL_MQH

