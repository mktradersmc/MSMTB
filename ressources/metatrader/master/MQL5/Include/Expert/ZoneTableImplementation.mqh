//+------------------------------------------------------------------+
//| New Zone Table Implementation with Dynamic Height               |
//+------------------------------------------------------------------+

// New InitializeZoneTable method
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

// New UpdateZoneTable method with dynamic height and individual delete buttons
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
            m_zoneLabels[0].Text("Keine Zonen vorhanden. Erstellen Sie eine Zone mit den obigen Feldern.");
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
                
                // Individual delete button for this zone
                if (m_zoneDeleteButtons[i].Create(0, Name() + "DelZone" + IntegerToString(i), 0,
                                                 MARGIN + 410, rowY,
                                                 MARGIN + 460, rowY + 25))
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

// Dynamic dialog resizing
void CZoneTradePanel::ResizeDialogForZones(int zoneCount)
{
    int baseHeight = 550; // Base height for standard controls
    int zoneTableHeight = MathMax(60, (zoneCount * 35) + 60); // 35px per zone + header
    int requiredHeight = baseHeight + zoneTableHeight;
    
    if (requiredHeight != m_currentDialogHeight)
    {
        Print("Resizing dialog from ", m_currentDialogHeight, " to ", requiredHeight, " for ", zoneCount, " zones");
        
        // Get current position
        int left = Left();
        int top = Top();
        int width = Width();
        
        // Resize the dialog
        Resize(left, top, left + width, top + requiredHeight);
        m_currentDialogHeight = requiredHeight;
        
        ChartRedraw(0);
    }
}

// Handle individual zone delete clicks
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