//+------------------------------------------------------------------+
//|                                                TradingConfig.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#ifndef TRADING_CONFIG_MQH
#define TRADING_CONFIG_MQH

#include <Object.mqh>
#include <Expert\JAson.mqh>

enum ENUM_AUTO_CLOSE
{
   Never = 0, // Niemals
   End_of_day = 1, // Am Ende des Tages
   End_of_week = 2 // Am Ende der Woche
};

enum ENUM_NEWS_SYMBOL
{
   News_Current_Symbol = 0, // Automatisch aus aktuellem Symbol ermitteln
   News_Manual_Symbol = 1 // Manuellen Wert hinterlegen
};

// --- Global Inputs Moved Here ---

// Account Management Inputs
input group "Account Management";
input double basic_account_size = 100000;                // Initial Account Size
input bool equity_loss_protection = false;               // Enable Daily Loss Protection
input double equity_loss_protection_percentage = 2;      // Max Daily Loss %
input int equity_take_profit_option = 0;                 // 0=None, 1=Daily%, 2=Absolute
input double equity_take_profit_percent = 0;             // Daily Profit Target %
input double equity_take_profit_value = 0;               // Daily Profit Target (Value)

// Risk Management Inputs
input group "Risk Management"
input bool risk_include_commissions_in_risk_calculation = false; // Include Commissions in Risk Calc
input int risk_security_buffer_in_points = 0;           // Security Buffer (Points)
input double risk_commissions_per_lot = 3;               // Commissions per Lot
input int risk_slippage = 3;                             // Max Slippage
input double risk_percentage = 0.25;                      // Risk per Trade %
input double lot_split_size = 20;                        // Split orders larger than X lots

// Trade Management Inputs
input group "Trade Management"
input ENUM_AUTO_CLOSE auto_close_mode = Never;           // Trades automatisch schliessen
input string auto_close_time = "00:00";                  // Uhrzeit zum Schliessen
input bool delete_open_entries_at_end_of_day = true;     // Delete pending entries at EOD
input double min_lot_size = 0.01;                        // Min Lot Size
input double max_lot_size = 100.0;                       // Max Lot Size
input double max_stoploss_in_points = 500;               // Max StopLoss (Points)

// News Inputs
input group "News Management"
input bool disable_trading_at_news = true;               // Disable Trading at News
input int disable_trading_minutes_before = 15;           // Minutes before
input int disable_trading_minutes_after = 3;             // Minutes after
input bool close_open_trades_before_news = true;         // Close trades before news
input int close_open_trades_minutes_before = 3;          // Close minutes before
input bool delete_trades_tagged_in_news = false;         // Delete news-tagged trades
input ENUM_NEWS_SYMBOL calendar_symbol_type = News_Current_Symbol; // Symbol detection
input string calendar_symbol_for_news = "";              // Manual Symbol

// --- Configuration Class ---

class CTradingConfig : public CObject
{
private:
   static CTradingConfig* m_instance;
   
   CTradingConfig();
   
public:
   ~CTradingConfig();
   static CTradingConfig* GetInstance();
   
   // --- Runtime Parameters ---
   
   // Account
   double Account_BasicSize;
   bool   Account_LossProtection;
   double Account_LossProtectionPercent;
   int    Account_TakeProfitOption; // 0=None, 1=%, 2=Abs
   double Account_TakeProfitPercent;
   double Account_TakeProfitValue;
   
   // Risk
   bool   Risk_IncludeCommissions;
   int    Risk_SecurityBuffer;
   double Risk_CommissionsPerLot;
   int    Risk_Slippage;
   double Risk_Percent;
   double Risk_LotSplitSize;
   
   // Trade Limits & AutoClose
   ENUM_AUTO_CLOSE Trade_AutoCloseMode;
   string Trade_AutoCloseTime;
   bool   Trade_DeleteEntriesEOD;
   double Limit_MinLot;
   double Limit_MaxLot;
   double Limit_MaxSL;
   
   // News
   bool   News_DisableTrading;
   int    News_MinutesBefore;
   int    News_MinutesAfter;
   bool   News_CloseTrades;
   int    News_CloseMinutesBefore;
   bool   News_DeleteTagged;
   ENUM_NEWS_SYMBOL News_SymbolType;
   string News_SymbolManual;
   
   // --- Methods ---
   
   void InitFromInputs();
   void UpdateFromJSON(CJAVal &json);
   string Dump();
};

CTradingConfig* CTradingConfig::m_instance = NULL;

CTradingConfig* CTradingConfig::GetInstance()
{
    if(m_instance == NULL)
    {
        m_instance = new CTradingConfig();
        m_instance.InitFromInputs();
    }
    return m_instance;
}

CTradingConfig::CTradingConfig()
{
}

CTradingConfig::~CTradingConfig()
{
}

void CTradingConfig::InitFromInputs()
{
   // Account
   Account_BasicSize = basic_account_size;
   Account_LossProtection = equity_loss_protection;
   Account_LossProtectionPercent = equity_loss_protection_percentage;
   Account_TakeProfitOption = equity_take_profit_option;
   Account_TakeProfitPercent = equity_take_profit_percent;
   Account_TakeProfitValue = equity_take_profit_value;
   
   // Risk
   Risk_IncludeCommissions = risk_include_commissions_in_risk_calculation;
   Risk_SecurityBuffer = risk_security_buffer_in_points;
   Risk_CommissionsPerLot = risk_commissions_per_lot;
   Risk_Slippage = risk_slippage;
   Risk_Percent = risk_percentage;
   Risk_LotSplitSize = lot_split_size;
   
   // Trade
   Trade_AutoCloseMode = auto_close_mode;
   Trade_AutoCloseTime = auto_close_time;
   Trade_DeleteEntriesEOD = delete_open_entries_at_end_of_day;
   Limit_MinLot = min_lot_size;
   Limit_MaxLot = max_lot_size;
   Limit_MaxSL = max_stoploss_in_points;
   
   // News
   News_DisableTrading = disable_trading_at_news;
   News_MinutesBefore = disable_trading_minutes_before;
   News_MinutesAfter  = disable_trading_minutes_after;
   News_CloseTrades   = close_open_trades_before_news;
   News_CloseMinutesBefore = close_open_trades_minutes_before;
   News_DeleteTagged = delete_trades_tagged_in_news;
   News_SymbolType = calendar_symbol_type;
   News_SymbolManual = calendar_symbol_for_news;
}

void CTradingConfig::UpdateFromJSON(CJAVal &json)
{
   // Account Block
   if(json.HasKey("account"))
   {
      CJAVal* section = json["account"];
      if(section.HasKey("basicSize")) Account_BasicSize = section["basicSize"].ToDbl();
      if(section.HasKey("lossProtection")) Account_LossProtection = section["lossProtection"].ToBool();
      if(section.HasKey("lossProtectionPercent")) Account_LossProtectionPercent = section["lossProtectionPercent"].ToDbl();
      if(section.HasKey("takeProfitOption")) Account_TakeProfitOption = (int)section["takeProfitOption"].ToInt();
      if(section.HasKey("takeProfitPercent")) Account_TakeProfitPercent = section["takeProfitPercent"].ToDbl();
      if(section.HasKey("takeProfitValue")) Account_TakeProfitValue = section["takeProfitValue"].ToDbl();
   }
   
   // Risk Block
   if(json.HasKey("risk"))
   {
      CJAVal* section = json["risk"];
      if(section.HasKey("percent")) Risk_Percent = section["percent"].ToDbl();
      if(section.HasKey("slippage")) Risk_Slippage = (int)section["slippage"].ToInt();
      if(section.HasKey("commissions")) Risk_IncludeCommissions = section["commissions"].ToBool();
      if(section.HasKey("lotSplitSize")) Risk_LotSplitSize = section["lotSplitSize"].ToDbl();
      if(section.HasKey("securityBuffer")) Risk_SecurityBuffer = (int)section["securityBuffer"].ToInt(); 
   }
   
   // Limits
   if(json.HasKey("limits"))
   {
      CJAVal* section = json["limits"];
      if(section.HasKey("minLot")) Limit_MinLot = section["minLot"].ToDbl();
      if(section.HasKey("maxLot")) Limit_MaxLot = section["maxLot"].ToDbl();
   }
   
   // Explicit top-level overrides (convenience)
   if(json.HasKey("riskPercent")) Risk_Percent = json["riskPercent"].ToDbl();
   
   Print("[TradingConfig] Configuration Updated: ", Dump());
}

string CTradingConfig::Dump()
{
   return StringFormat("Risk=%.2f%%, LossProt=%s, MaxLoss=%.2f%%", 
      Risk_Percent, 
      Account_LossProtection ? "YES" : "NO",
      Account_LossProtectionPercent);
}

#endif
