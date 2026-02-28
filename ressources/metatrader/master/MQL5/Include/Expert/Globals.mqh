//+------------------------------------------------------------------+
//|                                                      Globals.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef GLOBALS_MQH
#define GLOBALS_MQH

// Enum-Definition für UTC-Zeitzonen
enum ENUM_UTC_TIMEZONE
{
    UTC_MINUS_10 = -10,  // UTC-10
    UTC_MINUS_9 = -9,    // UTC-9
    UTC_MINUS_8 = -8,    // UTC-8
    UTC_MINUS_7 = -7,    // UTC-7
    UTC_MINUS_6 = -6,    // UTC-6
    UTC_MINUS_5 = -5,    // UTC-5
    UTC_MINUS_4 = -4,    // UTC-4
    UTC_MINUS_3 = -3,    // UTC-3
    UTC_MINUS_2 = -2,    // UTC-2
    UTC_MINUS_1 = -1,    // UTC-1
    UTC_ZERO = 0,        // UTC
    UTC_PLUS_1 = 1,      // UTC+1
    UTC_PLUS_2 = 2,      // UTC+2
    UTC_PLUS_3 = 3,      // UTC+3
    UTC_PLUS_4 = 4,      // UTC+4
    UTC_PLUS_5 = 5,      // UTC+5
    UTC_PLUS_6 = 6,      // UTC+6
    UTC_PLUS_7 = 7,      // UTC+7
    UTC_PLUS_8 = 8,      // UTC+8
    UTC_PLUS_9 = 9,      // UTC+9
    UTC_PLUS_10 = 10,    // UTC+10
    UTC_PLUS_11 = 11,    // UTC+11
    UTC_PLUS_12 = 12     // UTC+12
};

enum ENUM_MARKET_DIRECTION {
   MARKET_DIRECTION_NEUTRAL,
   MARKET_DIRECTION_BULLISH,
   MARKET_DIRECTION_BEARISH
};

enum STRATEGY_TYPE
{
   REGULAR,
   MACRO,
   BIAS
};

enum ENUM_TRADING_TIMEFRAME_TYPE
{
   TT_CURRENT, // Chart-Timeframe
   TT_SPECIFY  // Timeframe hinterlegen
};

enum ENUM_BREAK_TYPE {
    BT_NONE = 0,
    BT_SWEEP = 1,
    BT_BREAK = 2
};

enum SINGALS_HANDLING_MODE {
   SIGNALS_MANUAL_HANDLING,     // Signale manuell über App bearbeiten
   SIGNALS_AUTOMATIC_HANDLING   // Signale automatische verarbeiten
};

// Enum für Timeframe-Typen
enum ENUM_TIMEFRAME_TYPE {
    TIMEFRAME_STANDARD = 0,  // Standard MT5 Timeframes
    TIMEFRAME_TICK    = 1,   // Tick-basierte Timeframes
    TIMEFRAME_SECOND  = 2,   // Sekunden-basierte Timeframes
    TIMEFRAME_RENKO   = 3    // Renko Charts
};

// Konstanten für die Statistiken
#define STAT_EMA               0
#define STAT_SMA               1
#define STAT_ATR               2
#define STAT_STDEV             3
#define STAT_ATR_TRAILING_STOP 4
#define STAT_ZLEMA             5
#define STAT_ATR_HIGHEST      6
#define STAT_TOTAL            7

// Basisbereiche für Custom-Timeframes
#define PERIOD_TICK_BASE    31000  // Bereich 31000-31999 für Tick-basierte Timeframes
#define PERIOD_SECOND_BASE  34000  // Bereich 34000-34999 für Sekunden-basierte Timeframes
#define PERIOD_RENKO_BASE   33000  // Bereich 33000-33999 für Renko-Charts

// Konstanten für Tick-Timeframes
#define PERIOD_T1000       31000  // 1000 Tick Chart
#define PERIOD_T2000       32000  // 2000 Tick Chart

// Konstanten für Sekunden-Timeframes
#define PERIOD_S5          34005  // 5-Sekunden Timeframe
#define PERIOD_S15         34015  // 15-Sekunden Timeframe
#define PERIOD_S30         34030  // 30-Sekunden Timeframe

// Konstanten für Renko-Charts
// Format: 33XXYY - wobei XX die Boxgröße in Pipetten und YY die Reversalgröße in Pipetten ist
#define PERIOD_R10_05      331005  // 10 Pipetten Box, 5 Pipetten Reversal
#define PERIOD_R10_10      331010  // 10 Pipetten Box, 10 Pipetten Reversal
#define PERIOD_R20_10      332010  // 20 Pipetten Box, 10 Pipetten Reversal
#define PERIOD_R20_20      332020  // 20 Pipetten Box, 20 Pipetten Reversal
#define PERIOD_R50_25      335025  // 50 Pipetten Box, 25 Pipetten Reversal

#endif
