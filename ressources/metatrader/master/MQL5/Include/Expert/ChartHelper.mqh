#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.05"
#property strict

#ifndef CHARTHELPER_MQH
#define CHARTHELPER_MQH

#include <Object.mqh>
#include <Expert\Globals.mqh>
#include <Expert\LogManager.mqh>

// Hilfsfunktionen für Renko-Parameter
struct RenkoParams {
    int boxSize;      // Boxgröße in Pipetten
    int reversalSize; // Reversalgröße in Pipetten
    
    RenkoParams() {   // Default constructor
        boxSize = 0;
        reversalSize = 0;
    }
    
    RenkoParams(int timeframe) {
        if(CChartHelper::IsRenkoTimeframe(timeframe)) {
            int params = timeframe - PERIOD_RENKO_BASE;
            boxSize = params / 100;     // Erste zwei Stellen für Boxgröße
            reversalSize = params % 100; // Letzte zwei Stellen für Reversalgröße
        } else {
            boxSize = 0;
            reversalSize = 0;
        }
    }
    
    string toString() const {
        return StringFormat("Box Size: %d, Reversal Size: %d", boxSize, reversalSize);
    }
};

// Hilfsklasse für das Handling der Charts
class CChartHelper : public CObject {
private:
    static int ExtractTimeValue(string timeStr);
    static bool ValidateTimeValue(int value, ENUM_TIMEFRAME_TYPE type);

public:
    CChartHelper();
    ~CChartHelper();
    
    // Basis Hilfsfunktionen
    static double CutToDigits(double number, int digits);
    static string GetTimeframeName(int timeframe);
    static int StringToTimeframe(string tfStr);
    static int GetPeriodMinutes(int timeframe);   
    static string GetStatisticsMethodName(int method);
    static int GetDaysInMonth(int year, int month);
    
    // Timeframe-Typ Erkennungsfunktionen
    static bool IsTickTimeframe(int timeframe);
    static bool IsRenkoTimeframe(int timeframe);
    static bool IsSecondTimeframe(int timeframe);
    static bool IsStandardTimeframe(int timeframe);
    
    // Zeit-Konvertierungsfunktionen
    static int GetTickCount(int timeframe);
    static int GetPeriodSeconds(int timeframe);
    static datetime AlignTimeToTimeframe(datetime time, int targetTimeframe, bool roundDown = true);
    static datetime GetNextTimeframeTime(datetime currentTime, int timeframe);
    static datetime AlignTimeToSeconds(datetime time, int seconds);
    static datetime CalculateCandleOpenTime(datetime time, int targetTimeframe);
    static datetime CalculateCandleCloseTime(datetime openTime, int targetTimeframe);
    
    // Validierung und Konvertierung
    static bool IsValidTimeframe(int timeframe);
    static bool IsValidTimeframeString(string tfStr);
    static ENUM_TIMEFRAMES ConvertToStandardTimeframe(int timeframe);
    
    // Timeframe-Vergleichsfunktionen
    static bool IsHigherTimeframe(int timeframe1, int timeframe2);
    static bool IsLowerTimeframe(int timeframe1, int timeframe2);
    static int GetNextHigherStandardTimeframe(int timeframe);
    static int GetNextLowerStandardTimeframe(int timeframe);
};

CChartHelper::CChartHelper() {
}

CChartHelper::~CChartHelper() {
}

double CChartHelper::CutToDigits(double number, int digits) {
    return NormalizeDouble(number, digits);
}

bool CChartHelper::IsTickTimeframe(int timeframe) {
    return (timeframe >= PERIOD_TICK_BASE && timeframe < PERIOD_TICK_BASE + 1000);
}

bool CChartHelper::IsRenkoTimeframe(int timeframe) {
    return (timeframe >= PERIOD_RENKO_BASE && timeframe < PERIOD_RENKO_BASE + 1000);
}

int CChartHelper::GetDaysInMonth(int year, int month) {
    switch(month) {
        case 4:
        case 6:
        case 9:
        case 11:
            return 30;
        case 2:
            {
                // Schaltjahr-Berechnung
                bool isLeapYear = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
                return isLeapYear ? 29 : 28;
            }
        default:
            return 31;
    }
}

bool CChartHelper::IsSecondTimeframe(int timeframe) {
    return (timeframe >= PERIOD_SECOND_BASE && timeframe < PERIOD_SECOND_BASE + 1000);
}

bool CChartHelper::IsStandardTimeframe(int timeframe) {
    switch(timeframe) {
        case PERIOD_M1:
        case PERIOD_M2:
        case PERIOD_M3:
        case PERIOD_M5:
        case PERIOD_M15:
        case PERIOD_M30:
        case PERIOD_H1:
        case PERIOD_H2:
        case PERIOD_H3:
        case PERIOD_H4:
        case PERIOD_H6:
        case PERIOD_H8:
        case PERIOD_H12:
        case PERIOD_D1:
        case PERIOD_W1:
        case PERIOD_MN1:
            return true;
        default:
            return false;
    }
}

int CChartHelper::GetTickCount(int timeframe) {
    if(!IsTickTimeframe(timeframe)) return 0;
    return timeframe - PERIOD_TICK_BASE;
}

int CChartHelper::GetPeriodSeconds(int timeframe) {
    if(IsSecondTimeframe(timeframe))
        return timeframe - PERIOD_SECOND_BASE;
        
    if(IsStandardTimeframe(timeframe))
        return GetPeriodMinutes(timeframe) * 60;
        
    return 0;
}

datetime CChartHelper::AlignTimeToTimeframe(datetime time, int targetTimeframe, bool roundDown = true) {
    MqlDateTime dt;
    TimeToStruct(time, dt);
    
    int timeframe = CChartHelper::GetPeriodMinutes(targetTimeframe);
    if (timeframe >= PERIOD_MN1) {
        if (roundDown || (dt.day == 1 && dt.hour == 0 && dt.min == 0)) {
            dt.day = 1;
        } else {
            if (dt.mon == 12) {
                dt.mon = 1;
                dt.year++;
            } else {
                dt.mon++;
            }
            dt.day = 1;
        }
        dt.hour = 0;
        dt.min = 0;
        dt.sec = 0;
    } else if (timeframe == PERIOD_W1) {
        int daysToSubtract = dt.day_of_week == 0 ? 6 : dt.day_of_week - 1;
        if (roundDown || daysToSubtract == 0) {
            time -= daysToSubtract * 24 * 60 * 60;
        } else {
            time += (7 - daysToSubtract) * 24 * 60 * 60;
        }
        TimeToStruct(time, dt);
        dt.hour = 0;
        dt.min = 0;
        dt.sec = 0;
    } else if (timeframe >= PERIOD_D1) {
        dt.hour = 0;
        dt.min = 0;
        dt.sec = 0;
        if (!roundDown && (dt.hour != 0 || dt.min != 0 || dt.sec != 0)) {
            time += 24 * 60 * 60;
            TimeToStruct(time, dt);
            dt.hour = 0;
            dt.min = 0;
            dt.sec = 0;
        }
    } else if (timeframe > PERIOD_H1) {
        int hours = timeframe / 60;
        dt.min = 0;
        dt.sec = 0;
        int alignedHours = dt.hour - MathMod(dt.hour, hours);
        if (!roundDown) {
            alignedHours += hours;
        }
        dt.hour = alignedHours;
        if (dt.hour >= 24) {
            dt.hour -= 24;
            dt.day++;               
        }
    } else if (timeframe == PERIOD_H1) {
        int hours = timeframe / 60;
        dt.min = 0;
        dt.sec = 0;
        int alignedHours = (dt.hour / hours) * hours;
        if (!roundDown && dt.hour % hours != 0) {
            alignedHours += hours;
        }
        dt.hour = alignedHours;
        if (dt.hour >= 24) {
            dt.hour -= 24;
            time += 24 * 60 * 60;
            TimeToStruct(time, dt);
        }
    } else {
        int minutes = (int)timeframe;
        dt.sec = 0;
        int totalMinutes = dt.hour * 60 + dt.min;
        int alignedMinutes = (totalMinutes / minutes) * minutes;
        if (!roundDown && totalMinutes % minutes != 0) {
            alignedMinutes += minutes;
        }
        dt.hour = alignedMinutes / 60;
        dt.min = alignedMinutes % 60;
    }

    return StructToTime(dt);
}
   
datetime CChartHelper::CalculateCandleOpenTime(datetime time, int targetTimeframe) {
    MqlDateTime dt;
    TimeToStruct(time, dt);
   
    int timeframe = CChartHelper::GetPeriodMinutes(targetTimeframe);
   
    switch(timeframe) {
    case PERIOD_MN1:
        dt.day = 1;
        dt.hour = 0;
        dt.min = 0;
        dt.sec = 0;
        break;
    case PERIOD_W1: {
        // Berechne den Start der Handelswoche (Montag 00:00)
        int daysToSubtract = dt.day_of_week == 0 ? 6 : dt.day_of_week - 1;
        datetime mondayMidnight = time - daysToSubtract * 24 * 60 * 60;
        TimeToStruct(mondayMidnight, dt);
        dt.hour = 0;
        dt.min = 0;
        dt.sec = 0;
        break;
    }
    case PERIOD_D1:
        dt.hour = 0;
        dt.min = 0;
        dt.sec = 0;
        break;
    case PERIOD_H1:
        dt.min = 0;
        dt.sec = 0;
        break;
    default:
        if (timeframe >= PERIOD_M1) {
            int minutes = (int)timeframe;
            dt.sec = 0;
            dt.min = (dt.min / minutes) * minutes;
        }
        break;
    }
    return StructToTime(dt);
}

datetime CChartHelper::CalculateCandleCloseTime(datetime openTime, int targetTimeframe) {
    MqlDateTime dt;
    TimeToStruct(openTime, dt);
    datetime closeTime = openTime;
   
    int timeframe = CChartHelper::GetPeriodMinutes(targetTimeframe);
 
    switch(timeframe) {
        case PERIOD_MN1: {
            if (dt.mon == 12) {
                dt.year++;
                dt.mon = 1;
            } else {
                dt.mon++;
            }
            closeTime = StructToTime(dt);
            break;
        }
        case PERIOD_W1: {
            // Berechne das Ende der Handelswoche (Freitag 23:55)
            closeTime = openTime + 5 * 24 * 60 * 60; // Gehe zum Freitag
            TimeToStruct(closeTime, dt);
            dt.hour = 23;
            dt.min = 55;
            dt.sec = 0;
            closeTime = StructToTime(dt);
            break;
        }
        case PERIOD_D1: {
            closeTime += 24 * 60 * 60 - 300; // Ein Tag minus 5 Minuten
            break;
        }
        case PERIOD_H1:
            closeTime += 1 * 60 * 60;
            break;
        default:
            closeTime += timeframe * 60;
            break;
    }

    return closeTime;
}

datetime CChartHelper::GetNextTimeframeTime(datetime currentTime, int timeframe) {
    datetime alignedTime = AlignTimeToTimeframe(currentTime, timeframe);
    
    if(IsSecondTimeframe(timeframe)) {
        return alignedTime + GetPeriodSeconds(timeframe);
    }
    
    if(IsStandardTimeframe(timeframe)) {
        return alignedTime + GetPeriodMinutes(timeframe) * 60;
    }
    
    return 0;
}

bool CChartHelper::IsValidTimeframe(int timeframe) {
    if(IsStandardTimeframe(timeframe)) return true;
    if(IsTickTimeframe(timeframe)) return GetTickCount(timeframe) > 0;
    if(IsRenkoTimeframe(timeframe)) {
        RenkoParams params(timeframe);
        return params.boxSize > 0 && params.reversalSize > 0;
    }
    if(IsSecondTimeframe(timeframe)) return GetPeriodSeconds(timeframe) > 0;
    
    return false;
}

ENUM_TIMEFRAMES CChartHelper::ConvertToStandardTimeframe(int timeframe) {
    if(IsStandardTimeframe(timeframe))
        return (ENUM_TIMEFRAMES)timeframe;
        
    return PERIOD_CURRENT;
}

int CChartHelper::GetPeriodMinutes(int timeframe) {
    if(IsTickTimeframe(timeframe) || IsRenkoTimeframe(timeframe) || IsSecondTimeframe(timeframe))
        return 0;
        
    switch(timeframe) {
        case PERIOD_M1:  return 1;
        case PERIOD_M2:  return 2;
        case PERIOD_M3:  return 3;
        case PERIOD_M5:  return 5;
        case PERIOD_M15: return 15;
        case PERIOD_M30: return 30;
        case PERIOD_H1:  return 60;
        case PERIOD_H2:  return 120;
        case PERIOD_H3:  return 180;
        case PERIOD_H4:  return 240;
        case PERIOD_H6:  return 360;
        case PERIOD_H8:  return 480;
        case PERIOD_H12: return 720;
        case PERIOD_D1:  return 1440;
        case PERIOD_W1:  return 10080;
        case PERIOD_MN1: return 43200;
        default:         return 0;
    }
}

string CChartHelper::GetTimeframeName(int timeframe) {
    if(timeframe == 0)
        timeframe = Period();
        
    if(IsTickTimeframe(timeframe)) {
        int ticks = GetTickCount(timeframe);
        return StringFormat("T%d", ticks);
    }
    
    if(IsSecondTimeframe(timeframe)) {
        int seconds = GetPeriodSeconds(timeframe);
        return StringFormat("S%d", seconds);
    }
    
    if(IsRenkoTimeframe(timeframe)) {
        RenkoParams params(timeframe);
        return StringFormat("R%d_%d", params.boxSize, params.reversalSize);
    }
    
    switch(timeframe) {
        case PERIOD_M1:  return "M1";
        case PERIOD_M2:  return "M2";
        case PERIOD_M3:  return "M3";
        case PERIOD_M5:  return "M5";
        case PERIOD_M15: return "M15";
        case PERIOD_M30: return "M30";
        case PERIOD_H1:  return "H1";
        case PERIOD_H2:  return "H2";
        case PERIOD_H3:  return "H3";
        case PERIOD_H4:  return "H4";
        case PERIOD_H6:  return "H6";
        case PERIOD_H8:  return "H8";
        case PERIOD_H12: return "H12";
        case PERIOD_D1:  return "D1";
        case PERIOD_W1:  return "W1";
        case PERIOD_MN1: return "MN1";
        default:         return "Unknown";
    }
}

int CChartHelper::StringToTimeframe(string tfStr) {
    if(StringFind(tfStr, "PERIOD_") == -1)
        tfStr = "PERIOD_" + tfStr;
    
    // Standard Timeframes
    if(tfStr == "PERIOD_CURRENT") return Period();
    if(tfStr == "PERIOD_M1")  return PERIOD_M1;
    if(tfStr == "PERIOD_M2")  return PERIOD_M2;
    if(tfStr == "PERIOD_M3")  return PERIOD_M3;
    if(tfStr == "PERIOD_M5")  return PERIOD_M5;
    if(tfStr == "PERIOD_M15") return PERIOD_M15;
    if(tfStr == "PERIOD_M30") return PERIOD_M30;
    if(tfStr == "PERIOD_H1")  return PERIOD_H1;
    if(tfStr == "PERIOD_H2")  return PERIOD_H2;
    if(tfStr == "PERIOD_H3")  return PERIOD_H3;
    if(tfStr == "PERIOD_H4")  return PERIOD_H4;
    if(tfStr == "PERIOD_H6")  return PERIOD_H6;
    if(tfStr == "PERIOD_H8")  return PERIOD_H8;
    if(tfStr == "PERIOD_H12") return PERIOD_H12;
    if(tfStr == "PERIOD_D1")  return PERIOD_D1;
    if(tfStr == "PERIOD_W1")  return PERIOD_W1;
    if(tfStr == "PERIOD_MN1") return PERIOD_MN1;
    
    // Tick Timeframes (Format: T1000, T2000, etc.)
    if(StringGetCharacter(tfStr, 0) == 'T') {
        int ticks = ExtractTimeValue(tfStr);
        if(ticks > 0) return PERIOD_TICK_BASE + ticks;
    }
    
    // Second Timeframes (Format: S15, S30, etc.)
    if(StringGetCharacter(tfStr, 0) == 'S') {
        int seconds = ExtractTimeValue(tfStr);
        if(seconds > 0) return PERIOD_SECOND_BASE + seconds;
    }
    
    // Renko Timeframes (Format: R10_2 - Box 10, Reversal 2)
    if(StringGetCharacter(tfStr, 0) == 'R') {
        string parts[];
        if(StringSplit(tfStr, '_', parts) == 2) {
            int boxSize = (int)StringToInteger(StringSubstr(parts[0], 1));
            int reversalSize = (int)StringToInteger(parts[1]);
            if(boxSize > 0 && reversalSize > 0) {
                return PERIOD_RENKO_BASE + (boxSize * 100) + reversalSize;
            }
        }
    }
    
    return -1;
}

int CChartHelper::ExtractTimeValue(string timeStr) {
    int value = (int)StringToInteger(StringSubstr(timeStr, 1));
    return value;
}

string CChartHelper::GetStatisticsMethodName(int method) {
    switch(method) {
        case STAT_EMA: return "EMA";
        case STAT_SMA: return "SMA";
        case STAT_ATR: return "ATR";
        case STAT_ATR_TRAILING_STOP: return "ATR Trailing Stop";
        case STAT_STDEV: return "STDDEV";
        case STAT_ZLEMA: return "Zero Lag EMA";
        case STAT_ATR_HIGHEST: return "ATR Highest";
        default: return "Unknown";
    }
}

bool CChartHelper::IsHigherTimeframe(int timeframe1, int timeframe2) {
    int period1 = GetPeriodMinutes(timeframe1);
    int period2 = GetPeriodMinutes(timeframe2);
    
    if(period1 == 0 || period2 == 0) {
        if(IsSecondTimeframe(timeframe1) && IsSecondTimeframe(timeframe2))
            return GetPeriodSeconds(timeframe1) > GetPeriodSeconds(timeframe2);
            
        return false;
    }
    
    return period1 > period2;
}

bool CChartHelper::IsLowerTimeframe(int timeframe1, int timeframe2) {
    return IsHigherTimeframe(timeframe2, timeframe1);
}

int CChartHelper::GetNextHigherStandardTimeframe(int timeframe) {
    if(!IsStandardTimeframe(timeframe))
        return -1;
        
    int period = GetPeriodMinutes(timeframe);
    int nextPeriod = period;
    
    int standardPeriods[] = {1, 2, 3, 5, 15, 30, 60, 120, 180, 240, 360, 480, 720, 1440, 10080, 43200};
    
    for(int i = 0; i < ArraySize(standardPeriods); i++) {
        if(standardPeriods[i] > period) {
            nextPeriod = standardPeriods[i];
            break;
        }
    }
    
    switch(nextPeriod) {
        case 1:     return PERIOD_M1;
        case 2:     return PERIOD_M2;
        case 3:     return PERIOD_M3;
        case 5:     return PERIOD_M5;
        case 15:    return PERIOD_M15;
        case 30:    return PERIOD_M30;
        case 60:    return PERIOD_H1;
        case 120:   return PERIOD_H2;
        case 180:   return PERIOD_H3;
        case 240:   return PERIOD_H4;
        case 360:   return PERIOD_H6;
        case 480:   return PERIOD_H8;
        case 720:   return PERIOD_H12;
        case 1440:  return PERIOD_D1;
        case 10080: return PERIOD_W1;
        case 43200: return PERIOD_MN1;
        default:    return -1;
    }
}

int CChartHelper::GetNextLowerStandardTimeframe(int timeframe) {
    if(!IsStandardTimeframe(timeframe))
        return -1;
        
    int period = GetPeriodMinutes(timeframe);
    int prevPeriod = period;
    
    int standardPeriods[] = {43200, 10080, 1440, 720, 480, 360, 240, 180, 120, 60, 30, 15, 5, 3, 2, 1};
    
    for(int i = 0; i < ArraySize(standardPeriods); i++) {
        if(standardPeriods[i] < period) {
            prevPeriod = standardPeriods[i];
            break;
        }
    }
    
    switch(prevPeriod) {
        case 1:     return PERIOD_M1;
        case 2:     return PERIOD_M2;
        case 3:     return PERIOD_M3;
        case 5:     return PERIOD_M5;
        case 15:    return PERIOD_M15;
        case 30:    return PERIOD_M30;
        case 60:    return PERIOD_H1;
        case 120:   return PERIOD_H2;
        case 180:   return PERIOD_H3;
        case 240:   return PERIOD_H4;
        case 360:   return PERIOD_H6;
        case 480:   return PERIOD_H8;
        case 720:   return PERIOD_H12;
        case 1440:  return PERIOD_D1;
        case 10080: return PERIOD_W1;
        case 43200: return PERIOD_MN1;
        default:    return -1;
    }
}

datetime CChartHelper::AlignTimeToSeconds(datetime time, int seconds) {
    if(seconds <= 0) return time;
    
    MqlDateTime dt;
    TimeToStruct(time, dt);
    
    // Gesamtanzahl der Sekunden seit Mitternacht berechnen
    int totalSeconds = dt.hour * 3600 + dt.min * 60 + dt.sec;
    
    // Rundung nach unten auf das nächste Vielfache der gewünschten Sekundenanzahl
    int alignedSeconds = (totalSeconds / seconds) * seconds;
    
    // Die Sekunden wieder in Stunden, Minuten und Sekunden aufteilen
    dt.hour = (alignedSeconds / 3600) % 24;  // Modulo 24 für Stundenüberlauf
    int remainingSeconds = alignedSeconds % 3600;
    dt.min = remainingSeconds / 60;
    dt.sec = remainingSeconds % 60;
    
    // Sicherstellen, dass wir keinen Tagesüberlauf haben
    if(alignedSeconds >= 86400) {  // 24 * 60 * 60 = 86400 Sekunden pro Tag
        dt.day++;
        if(dt.day > CChartHelper::GetDaysInMonth(dt.year, dt.mon)) {
            dt.day = 1;
            dt.mon++;
            if(dt.mon > 12) {
                dt.mon = 1;
                dt.year++;
            }
        }
    }
    
    CLogManager::GetInstance().LogMessage("CChartHelper::AlignTimeToSeconds", LL_DEBUG,
        StringFormat("Aligning time %s to %d seconds interval: %s",
        TimeToString(time), seconds, TimeToString(StructToTime(dt))));
    
    return StructToTime(dt);
}

bool CChartHelper::ValidateTimeValue(int value, ENUM_TIMEFRAME_TYPE type) {
    switch(type) {
        case TIMEFRAME_TICK:
            return value > 0 && value <= 10000;  // Maximum 10.000 Ticks
            
        case TIMEFRAME_SECOND:
            // Prüfe ob das Sekundenintervall gültig ist
            if(value <= 0 || value > 60) return false;  // Maximale Länge ist 60 Sekunden
            
            // Erlaubte Sekundenintervalle sind:
            // 5, 15, 30 Sekunden
            switch(value) {
                case 5:  // PERIOD_S5
                case 15: // PERIOD_S15
                case 30: // PERIOD_S30
                    return true;
            }
            return false;
            
        case TIMEFRAME_RENKO:
            {
                int boxSize = value / 100;
                int reversalSize = value % 100;
                return boxSize > 0 && reversalSize > 0 && boxSize <= 100 && reversalSize <= 100;
            }
        default:
            return false;
    }
}

bool CChartHelper::IsValidTimeframeString(string tfStr) {
    // Entferne "PERIOD_" Prefix falls vorhanden
    if(StringFind(tfStr, "PERIOD_") != -1)
        tfStr = StringSubstr(tfStr, 7);
    
    // Standard Timeframes
    string standardTf[] = {"M1","M2","M3","M5","M15","M30","H1","H2","H3","H4","H6","H8","H12","D1","W1","MN1"};
    for(int i = 0; i < ArraySize(standardTf); i++)
        if(tfStr == standardTf[i]) return true;
    
    // Tick Timeframes (T1000, T2000, etc.)
    if(StringGetCharacter(tfStr, 0) == 'T') {
        int ticks = ExtractTimeValue(tfStr);
        return ValidateTimeValue(ticks, TIMEFRAME_TICK);
    }
    
    // Second Timeframes (S15, S30, etc.)
    if(StringGetCharacter(tfStr, 0) == 'S') {
        int seconds = ExtractTimeValue(tfStr);
        return ValidateTimeValue(seconds, TIMEFRAME_SECOND);
    }
    
    // Renko Timeframes (R10_2)
    if(StringGetCharacter(tfStr, 0) == 'R') {
        string parts[];
        if(StringSplit(tfStr, '_', parts) == 2) {
            int boxSize = (int)StringToInteger(StringSubstr(parts[0], 1));
            int reversalSize = (int)StringToInteger(parts[1]);
            int value = boxSize * 100 + reversalSize;
            return ValidateTimeValue(value, TIMEFRAME_RENKO);
        }
    }
    
    return false;
}

#endif // CHARTHELPER_MQH


