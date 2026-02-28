//+------------------------------------------------------------------+
//|                                            SupportResistanceArea.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef SUPPORT_RESISTANCE_AREA_MQH
#define SUPPORT_RESISTANCE_AREA_MQH

#include <Expert\ITreeNode.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Helper.mqh>

enum ENUM_AREA_SOURCE
{
    AREA_SOURCE_IMBALANCE_CANDLE_BODY,
    AREA_SOURCE_CANDLE_BODY,
    AREA_SOURCE_CANDLE_WICK,
    AREA_SOURCE_MANUAL
};

enum ENUM_ZONE_CHARACTER
{
    ZONE_NEUTRAL,
    ZONE_SUPPORT,
    ZONE_RESISTANCE
};

enum ENUM_ZONE_QUALITY
{
    ZONE_UNTESTED,
    ZONE_DEVELOPING,
    ZONE_MODERATE,
    ZONE_STRONG,
    ZONE_WEAK
};

struct SupportResistanceAreaTimeframeStatus
{
    int timeframe;
    int supportTests;           // Support-Tests auf diesem Timeframe
    int resistanceTests;        // Resistance-Tests auf diesem Timeframe
    datetime lastTestTime;      // Zeit des letzten Tests
    double lastTestLevel;       // Level des letzten Tests
};

class CSupportResistanceArea : public ITreeNode
{
private:
    static ulong s_currentId;
    ulong m_uniqueId;

public:
    // Basis-Definition
    double upperBound;          // Top des Bereichs
    double lowerBound;          // Bottom des Bereichs
    int originTimeframe;        // Timeframe der Erstellung
    datetime creationTime;      // Erstellungszeit
    
    // Quelle der Area
    ENUM_AREA_SOURCE source;
    string sourceId;            // ID des ursprünglichen Objekts
    CCandle* associatedCandle;  // Referenz zur ursprünglichen Kerze
    
    // Character & Status
    ENUM_ZONE_CHARACTER character;
    bool hasActedAsBoth;        // War sowohl Support als auch Resistance
    
    // Zähler
    int supportTestCount;       // Gesamte Support-Tests
    int resistanceTestCount;    // Gesamte Resistance-Tests
    int breakthroughCount;      // Anzahl Character-Flips
    
    // Multi-Timeframe Status
    SupportResistanceAreaTimeframeStatus tfStatus[];
    
    CSupportResistanceArea(double upper, double lower, int timeframe, ENUM_AREA_SOURCE src, string srcId, CCandle* candle = NULL);
    
    virtual double GetTreeValue() const override
    {
        return lowerBound; // Sortierung nach unterem Rand
    }
    
    ulong GetUniqueId() const { return m_uniqueId; }
    
    // Area-Management
    void AddSupportTest(int timeframe, datetime testTime, double testLevel);
    void AddResistanceTest(int timeframe, datetime testTime, double testLevel);
    void ProcessBreakthrough(ENUM_ZONE_CHARACTER newCharacter);
    
    // Character-Management
    void SetInitialCharacter(ENUM_ZONE_CHARACTER newCharacter);
    ENUM_ZONE_QUALITY GetQuality() const;
    
    // Utility
    string ToString() const;
    virtual string toString() override { return ToString(); }  // ITreeNode interface
    bool IsInArea(double price) const;
    
    // Timeframe-spezifische Methoden
    int GetSupportTestsForTimeframe(int timeframe) const;
    int GetResistanceTestsForTimeframe(int timeframe) const;
};

// Statische Variable initialisieren
ulong CSupportResistanceArea::s_currentId = 0;

CSupportResistanceArea::CSupportResistanceArea(double upper, double lower, int timeframe, ENUM_AREA_SOURCE src, string srcId, CCandle* candle)
    : upperBound(upper), lowerBound(lower), originTimeframe(timeframe), 
      source(src), sourceId(srcId), associatedCandle(candle),
      character(ZONE_NEUTRAL), hasActedAsBoth(false),
      supportTestCount(0), resistanceTestCount(0), breakthroughCount(0)
{
    m_uniqueId = ++s_currentId;
    creationTime = TimeCurrent();
}

void CSupportResistanceArea::AddSupportTest(int timeframe, datetime testTime, double testLevel)
{
    supportTestCount++;
    
    if(character == ZONE_NEUTRAL) {
        character = ZONE_SUPPORT;
    }
    
    // Timeframe-spezifisches Tracking
    int index = -1;
    for(int i = 0; i < ArraySize(tfStatus); i++) {
        if(tfStatus[i].timeframe == timeframe) {
            index = i;
            break;
        }
    }
    
    if(index == -1) {
        int size = ArraySize(tfStatus);
        ArrayResize(tfStatus, size + 1);
        index = size;
        tfStatus[index].timeframe = timeframe;
        tfStatus[index].supportTests = 0;
        tfStatus[index].resistanceTests = 0;
    }
    
    tfStatus[index].supportTests++;
    tfStatus[index].lastTestTime = testTime;
    tfStatus[index].lastTestLevel = testLevel;
}

void CSupportResistanceArea::AddResistanceTest(int timeframe, datetime testTime, double testLevel)
{
    resistanceTestCount++;
    
    if(character == ZONE_NEUTRAL) {
        character = ZONE_RESISTANCE;
    }
    
    // Timeframe-spezifisches Tracking
    int index = -1;
    for(int i = 0; i < ArraySize(tfStatus); i++) {
        if(tfStatus[i].timeframe == timeframe) {
            index = i;
            break;
        }
    }
    
    if(index == -1) {
        int size = ArraySize(tfStatus);
        ArrayResize(tfStatus, size + 1);
        index = size;
        tfStatus[index].timeframe = timeframe;
        tfStatus[index].supportTests = 0;
        tfStatus[index].resistanceTests = 0;
    }
    
    tfStatus[index].resistanceTests++;
    tfStatus[index].lastTestTime = testTime;
    tfStatus[index].lastTestLevel = testLevel;
}

void CSupportResistanceArea::ProcessBreakthrough(ENUM_ZONE_CHARACTER newCharacter)
{
    ENUM_ZONE_CHARACTER previousCharacter = character;
    
    if(previousCharacter != ZONE_NEUTRAL && previousCharacter != newCharacter) {
        hasActedAsBoth = true;
    }
    
    character = newCharacter;
    breakthroughCount++;
}

void CSupportResistanceArea::SetInitialCharacter(ENUM_ZONE_CHARACTER newCharacter)
{
    if(character == ZONE_NEUTRAL) {
        character = newCharacter;
    }
}

ENUM_ZONE_QUALITY CSupportResistanceArea::GetQuality() const
{
    int totalTests = supportTestCount + resistanceTestCount;
    
    if(totalTests == 0) return ZONE_UNTESTED;
    
    double breakthroughRatio = (double)breakthroughCount / MathMax(totalTests, 1);
    
    if(breakthroughRatio > 0.5) return ZONE_WEAK;        // Mehr als 50% Durchbrüche
    if(breakthroughRatio > 0.2) return ZONE_MODERATE;    // 20-50% Durchbrüche
    if(totalTests >= 3) return ZONE_STRONG;              // Viele Tests, wenig Durchbrüche
    return ZONE_DEVELOPING;                               // Noch in Entwicklung
}

string CSupportResistanceArea::ToString() const
{
    string qualityStr;
    switch(GetQuality()) {
        case ZONE_UNTESTED: qualityStr = "UNTESTED"; break;
        case ZONE_DEVELOPING: qualityStr = "DEVELOPING"; break;
        case ZONE_MODERATE: qualityStr = "MODERATE"; break;
        case ZONE_STRONG: qualityStr = "STRONG"; break;
        case ZONE_WEAK: qualityStr = "WEAK"; break;
        default: qualityStr = "UNKNOWN"; break;
    }
    
    return StringFormat("%s Area %d: %.5f-%.5f [S:%d|R:%d|B:%d] %s%s",
        EnumToString(character),
        m_uniqueId,
        lowerBound, upperBound,
        supportTestCount, resistanceTestCount, breakthroughCount,
        qualityStr,
        hasActedAsBoth ? " (Both)" : ""
    );
}

bool CSupportResistanceArea::IsInArea(double price) const
{
    return price >= lowerBound && price <= upperBound;
}

int CSupportResistanceArea::GetSupportTestsForTimeframe(int timeframe) const
{
    for(int i = 0; i < ArraySize(tfStatus); i++) {
        if(tfStatus[i].timeframe == timeframe) {
            return tfStatus[i].supportTests;
        }
    }
    return 0;
}

int CSupportResistanceArea::GetResistanceTestsForTimeframe(int timeframe) const
{
    for(int i = 0; i < ArraySize(tfStatus); i++) {
        if(tfStatus[i].timeframe == timeframe) {
            return tfStatus[i].resistanceTests;
        }
    }
    return 0;
}

#endif // SUPPORT_RESISTANCE_AREA_MQH

