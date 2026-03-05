//+------------------------------------------------------------------+
//|                                            TradePanelConfig.mqh |
//|                        Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef TRADE_PANEL_CONFIG_MQH
#define TRADE_PANEL_CONFIG_MQH

// Constants for TradePanel and ZoneManagement
#define MODE_NONE       0
#define MODE_SL         1
#define MODE_TP         2
#define MODE_ENTRY      3
#define MODE_ZONE_TOP   4     // Zone top selection mode
#define MODE_ZONE_BOTTOM 5    // Zone bottom selection mode
#define MODE_ZONE_AUTOMATIC 6 // Automatic zone detection mode

// Level line names
#define ENTRY_LEVEL_LINE_NAME   "TP_EntryLine"
#define SL_LEVEL_LINE_NAME      "TP_StopLossLine"
#define TP_LEVEL_LINE_NAME      "TP_TakeProfitLine"
#define ZONE_TOP_LINE_NAME      "TP_ZoneTopLine"
#define ZONE_BOTTOM_LINE_NAME   "TP_ZoneBottomLine"

// Zone UI constants - Edit field IDs
#define ZONE_TOP_EDIT             20
#define ZONE_BOTTOM_EDIT          21

// Zone UI constants - Button IDs  
#define ZONE_TOP_MODE_BUTTON      25
#define ZONE_BOTTOM_MODE_BUTTON   26
#define ZONE_TOP_CLEAR_BUTTON     27
#define ZONE_BOTTOM_CLEAR_BUTTON  28
#define ZONE_CREATE_BUTTON        29
#define ZONE_LIST_BUTTON          30
#define ZONE_CLEAR_ALL_BUTTON     31
#define ZONE_TIMEFRAME_COMBO      32
#define ZONE_AUTOMATIC_BUTTON     33

// Zone table constants
#define ZONE_DELETE_BUTTON_START  100  // Starting ID for zone delete buttons
#define MAX_ZONE_TABLE_ROWS       10   // Maximum visible rows in zone table
#define ZONE_TABLE_ROW_HEIGHT     25    // Height of each table row
#define ZONE_TABLE_HEADER_HEIGHT  25    // Height of table header
#define ZONE_DELETE_BUTTON_WIDTH  30    // Width of delete button
#define ZONE_NAME_COLUMN_WIDTH    80    // Width of zone name column
#define ZONE_RANGE_COLUMN_WIDTH   120   // Width of zone range column
#define ZONE_STATUS_COLUMN_WIDTH  70    // Width of zone status column

// Zone table scroll controls
#define ZONE_SCROLL_UP_BUTTON     200
#define ZONE_SCROLL_DOWN_BUTTON   201

#endif // TRADE_PANEL_CONFIG_MQH