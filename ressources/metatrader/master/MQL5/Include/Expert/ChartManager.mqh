#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.03"
#property strict

#ifndef CHART_MANAGER_MQH
#define CHART_MANAGER_MQH

#include <Object.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Arrays\ArrayString.mqh>
#include <Expert\BaseChart.mqh>
#include <Expert\TimeframeChart.mqh>
#include <Expert\TickChart.mqh>
#include <Expert\RenkoChart.mqh>
#include <Expert\SecondBasedTimeframeChart.mqh>
#include <Expert\LogManager.mqh>

// CTimeframeInfo Klasse - Verwaltet Informationen zu einem Timeframe
class CTimeframeInfo : public CObject {
private:
    int m_timeframe;
    int m_days;
    datetime m_startTime;

public:
    CTimeframeInfo(int timeframe, int days) {
        m_timeframe = timeframe;
        m_days = days;
        m_startTime = TimeCurrent() - (days * PeriodSeconds(PERIOD_D1));
    }

    int getTimeframe() const { return m_timeframe; }
    int getDays() const { return m_days; }
    datetime getStartTime() const { return m_startTime; }
    void setStartTime(datetime time) { m_startTime = time; }
    
    string toString() const {
        return StringFormat("Timeframe: %s, Days: %d, StartTime: %s",
            CChartHelper::GetTimeframeName(m_timeframe),
            m_days,
            TimeToString(m_startTime));
    }
};

// CChartManager Klasse - Hauptklasse für die Chart-Verwaltung
class CChartManager : public CObject {
private:
    CArrayObj* charts;            // Sammlung aller Charts
    CArrayString* symbols;        // Liste der verwalteten Symbole
    CArrayObj* timeframes;        // Liste der Timeframe-Konfigurationen
    static CChartManager* m_instance;
    long timer_handle;            // Timer-Handle für sekundenbasierte Charts
    bool is_initialized;          // Flag für Initialisierungsstatus

    // Private Konstruktor (Singleton Pattern)
    CChartManager() {
        charts = new CArrayObj();
        symbols = new CArrayString();
        timeframes = new CArrayObj();
        timer_handle = 0;
        is_initialized = false;
        InitializeTimer();
    }

    // Hilfsmethoden für die Chart-Initialisierung
    void InitializeChartsForSymbol(string symbol) {
        CLogManager::GetInstance().LogMessage("CChartManager::InitializeChartsForSymbol", LL_INFO,
            StringFormat("Initialisiere Charts für Symbol %s", symbol));
            
        for(int i = 0; i < timeframes.Total(); i++) {
            CTimeframeInfo* info = timeframes.At(i);
            InitializeChart(symbol, info.getTimeframe(), info.getStartTime());
        }
    }

    void InitializeChartsForTimeframe(int timeframe, int days) {
        CLogManager::GetInstance().LogMessage("CChartManager::InitializeChartsForTimeframe", LL_INFO,
            StringFormat("Initialisiere Charts für Timeframe %s", CChartHelper::GetTimeframeName(timeframe)));
            
        datetime startTime = TimeCurrent() - (days * PeriodSeconds(PERIOD_D1));
        for(int i = 0; i < symbols.Total(); i++) {
            string symbol = symbols.At(i);
            InitializeChart(symbol, timeframe, startTime);
        }
    }

    void RemoveChartsForSymbol(string symbol) {
        CLogManager::GetInstance().LogMessage("CChartManager::RemoveChartsForSymbol", LL_INFO,
            StringFormat("Entferne Charts für Symbol %s", symbol));
            
        for(int i = charts.Total() - 1; i >= 0; i--) {
            CBaseChart* chart = charts.At(i);
            if(chart.getSymbol() == symbol) {
                delete chart;
                charts.Delete(i);
            }
        }
    }

    CBaseChart* CreateChart(string symbol, int timeframe) {
        CLogManager::GetInstance().LogMessage("CChartManager::CreateChart", LL_DEBUG,
            StringFormat("Erstelle Chart für Symbol %s, Timeframe %s", 
            symbol, CChartHelper::GetTimeframeName(timeframe)));
            
        if(CChartHelper::IsTickTimeframe(timeframe))
            return new CTickChart(symbol, timeframe);
        if(CChartHelper::IsRenkoTimeframe(timeframe))
            return new CRenkoChart(symbol, timeframe);
        if(CChartHelper::IsSecondTimeframe(timeframe))
            return new CSecondBasedTimeframeChart(symbol, timeframe);
        return new CTimeframeChart(symbol, timeframe);
    }

    void InitializeTimer() {
        if(timer_handle == 0) {
            timer_handle = EventSetTimer(1); // 1-Sekunden Timer
            if(timer_handle != 0) {
                CLogManager::GetInstance().LogMessage("CChartManager::InitializeTimer", LL_INFO,
                    "Timer erfolgreich initialisiert");
            } else {
                CLogManager::GetInstance().LogMessage("CChartManager::InitializeTimer", LL_ERROR,
                    "Timer-Initialisierung fehlgeschlagen");
            }
        }
    }

public:
    ~CChartManager() {
        if(timer_handle != 0) {
            EventKillTimer();
            timer_handle = 0;
        }
        
        // Aufräumen der Charts
        for(int i = 0; i < charts.Total(); i++)
            delete charts.At(i);
        delete charts;
        
        // Aufräumen der Symbole
        delete symbols;
        
        // Aufräumen der Timeframe-Informationen
        for(int i = 0; i < timeframes.Total(); i++)
            delete timeframes.At(i);
        delete timeframes;
        
        m_instance = NULL;
    }

    // Singleton Instance Getter
    static CChartManager* GetInstance() {
        if(m_instance == NULL)
            m_instance = new CChartManager();
        return m_instance;
    }

    // Symbol-Verwaltung
    void AddSymbol(string symbol) {
        if(symbols.SearchLinear(symbol) == -1) {
            symbols.Add(symbol);
            InitializeChartsForSymbol(symbol);
            CLogManager::GetInstance().LogMessage("CChartManager::AddSymbol", LL_INFO,
                StringFormat("Symbol %s hinzugefügt", symbol));
        }
    }

    void RemoveSymbol(string symbol) {
        int index = symbols.SearchLinear(symbol);
        if(index != -1) {
            symbols.Delete(index);
            RemoveChartsForSymbol(symbol);
            CLogManager::GetInstance().LogMessage("CChartManager::RemoveSymbol", LL_INFO,
                StringFormat("Symbol %s entfernt", symbol));
        }
    }

    // Timeframe-Verwaltung
    void AddTimeframe(int timeframe, int days) {
        // Prüfen ob Timeframe bereits existiert
        for(int i = 0; i < timeframes.Total(); i++) {
            CTimeframeInfo* info = timeframes.At(i);
            if(info.getTimeframe() == timeframe) {
                CLogManager::GetInstance().LogMessage("CChartManager::AddTimeframe", LL_INFO,
                    StringFormat("Timeframe %s existiert bereits", CChartHelper::GetTimeframeName(timeframe)));
                return;
            }
        }

        CTimeframeInfo* info = new CTimeframeInfo(timeframe, days);
        timeframes.Add(info);
        InitializeChartsForTimeframe(timeframe, days);
        
        CLogManager::GetInstance().LogMessage("CChartManager::AddTimeframe", LL_INFO,
            StringFormat("Timeframe %s hinzugefügt: %s", 
            CChartHelper::GetTimeframeName(timeframe), 
            info.toString()));
    }

    // Timeframe Navigation
    int GetNextLowerTimeframe(int timeframe) {
        int lower = -1;
        for(int i = 0; i < timeframes.Total(); i++) {
            CTimeframeInfo* info = timeframes.At(i);
            if(info.getTimeframe() < timeframe && info.getTimeframe() > lower)
                lower = info.getTimeframe();
        }
        return lower;
    }

    int GetNextHigherTimeframe(int timeframe) {
        int higher = INT_MAX;
        for(int i = 0; i < timeframes.Total(); i++) {
            CTimeframeInfo* info = timeframes.At(i);
            if(info.getTimeframe() > timeframe && info.getTimeframe() < higher)
                higher = info.getTimeframe();
        }
        return (higher == INT_MAX) ? -1 : higher;
    }

    // Chart-Aktualisierung und Events
    void Update(MqlTick& tick) {        
        for(int i = 0; i < charts.Total(); i++) {
            CBaseChart* chart = charts.At(i);
            chart.OnTick(tick);
        }
    }

    // Chart-Zugriff und Initialisierung
    CBaseChart* GetChart(string symbol, int timeframe) {
        for(int i = 0; i < charts.Total(); i++) {
            CBaseChart* chart = charts.At(i);
            if(chart.getSymbol() == symbol && chart.getTimeframe() == timeframe)
                return chart;
        }
        return NULL;
    }

    void InitializeChart(string symbol, int timeframe, datetime startTime) {
        CLogManager::GetInstance().LogMessage("CChartManager::InitializeChart", LL_INFO,
            StringFormat("Initialisiere Chart für Symbol %s, Timeframe %s, StartTime %s",
            symbol, CChartHelper::GetTimeframeName(timeframe), TimeToString(startTime)));
            
        CBaseChart* chart = CreateChart(symbol, timeframe);
        charts.Add(chart);
        
        datetime actualStartTime = chart.InitializeHistory(startTime);
        
        // Aktualisiere die tatsächliche Startzeit in der TimeframeInfo
        for(int i = 0; i < timeframes.Total(); i++) {
            CTimeframeInfo* info = timeframes.At(i);
            if(info.getTimeframe() == timeframe) {
                info.setStartTime(actualStartTime);
                CLogManager::GetInstance().LogMessage("CChartManager::InitializeChart", LL_DEBUG,
                    StringFormat("Aktualisierte Startzeit für %s: %s",
                    CChartHelper::GetTimeframeName(timeframe),
                    TimeToString(actualStartTime)));
                break;
            }
        }
    }
    
    // Debug-Informationen
    string GetStatus() {
        string status = "ChartManager Status:\n";
        status += StringFormat("Symbols: %d, Timeframes: %d, Charts: %d\n", 
            symbols.Total(), timeframes.Total(), charts.Total());
            
        status += "\nSymbole:\n";
        for(int i = 0; i < symbols.Total(); i++)
            status += symbols.At(i) + "\n";
            
        status += "\nTimeframes:\n";
        for(int i = 0; i < timeframes.Total(); i++) {
            CTimeframeInfo* info = timeframes.At(i);
            status += info.toString() + "\n";
        }
        
        return status;
    }
};

// Statische Member-Initialisierung
CChartManager* CChartManager::m_instance = NULL;

#endif


