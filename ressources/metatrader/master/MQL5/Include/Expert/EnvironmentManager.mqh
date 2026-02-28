//+------------------------------------------------------------------+
//|                                          EnvironmentManager.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef ENVIRONMENT_MANAGER_MQH
#define ENVIRONMENT_MANAGER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Arrays/ArrayInt.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\Feature.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\Strategy.mqh>
#include <Expert\Event.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\ConfigurationManager.mqh>
#include <Expert\FeatureRegistry.mqh>
#include <Expert\FeatureFactory.mqh>
#include <Expert\TimeZoneCalendar.mqh>
#include <Expert\ModuleTypes.mqh>

class CConfigurationManager;
class CStrategy;

// Definition der CEnvironmentManager-Klasse
class CEnvironmentManager
{
private:
   // Singleton-Instanz
   static CEnvironmentManager* s_instance;
   
   // Interne Datenfelder
   CArrayInt* m_activeTimeframes;   
   CArrayString* m_activeSymbols;
   CArrayObj* m_symbolFeatures;  
   CArrayString* m_correlationSymbols;
   CArrayString* m_correlatedSymbols;
   CArrayInt* m_timeframes;
   CArrayInt* m_historyDays;
   CConfigurationManager* m_configManager;
   CTimeZoneCalendar* m_timeZoneCalendar;
   
   // Felder für Client-Konfiguration
   string m_clientId;                
   bool m_isMasterClient;            
   string m_assignmentString;        
   int m_currentTradeIndex;          
   CArrayString* m_assignmentGroups; 
   // Felder für Symbol-Mapping
   CArrayString* m_normalizedSymbols;
   CArrayString* m_brokerSymbols;
   
   // Private Methoden für die Kernfunktionalität
   void ProcessStrategySteps(CStrategy* strategy, bool isLong);
   void AddTimeframe(int timeframe);
   void ActivateFeatureForEventType(string eventName);
   void AddFeatureForSymbol(const string& featureName, const string& symbol);
   void ActivateCorrelatedFeatures(const string featureName);
   void ActivateRequiredFeatures(const string featureName, const string& symbol);
   void ParseAssignmentString();

public:
   // Konstruktor und Destruktor
   CEnvironmentManager();
   ~CEnvironmentManager();
   
   // Singleton-Zugriffsmethoden
   static CEnvironmentManager* GetInstance();
   static void DeleteInstance();
   
   // Allgemeine Methoden
   void Reset();
   void LoadEnvironment(const string filename);
   string GetCorrelatedSymbol(const string symbol);
   int GetHistoryDays(const int timeframe);
   void AddStrategyEnvironment(CStrategy* strategy);
   void ApplyConfiguration();
   void GetActiveTimeframes(int& timeframes[]);
   CArrayObj* GetFeaturesForSymbol(string symbol);
   CFeature* GetFeatureForSymbol(string symbol, string name);
   bool IsFeatureActive(const string symbol, const string featureName);
   bool HasActiveCorrelatedSymbol(const string symbol);
   
   // TimeZone-Management-Methoden
   int GetUTCOffset(const string& identifier, const datetime date);
   void AddTimeZoneDefinition(const string& identifier, const datetime startDate, const int utcOffset);
   void AddTimeZoneDefinitions(const string& identifier, const string& definitions);
   
   // Client-Konfiguration und State-Management-Methoden (keine Tradinglogik)
   string GetClientId() { return m_clientId; }
   bool IsMasterClient() { return m_isMasterClient; }
   string GetAssignmentString() { return m_assignmentString; }
   void SetAssignmentString(string assignmentString);
   int GetCurrentTradeIndex() { return m_currentTradeIndex; }
   void SetCurrentTradeIndex(int index);
   void GetNextTargetClients(string &result[]);  // Nur Datenextraktionsfunktion
   void LoadTradeDistributionState();
   void SaveTradeDistributionState();
   
   // Symbol-Mapping-Methoden
   string GetBrokerSymbol(string normalizedSymbol);
   string GetNormalizedSymbol(string brokerSymbol);
};

// Initialisierung der statischen Variablen
CEnvironmentManager* CEnvironmentManager::s_instance = NULL;

//+------------------------------------------------------------------+
//| Konstruktor                                                      |
//+------------------------------------------------------------------+
CEnvironmentManager::CEnvironmentManager()
{
   m_activeTimeframes = new CArrayInt();
   m_activeSymbols = new CArrayString();
   m_symbolFeatures = new CArrayObj();
   m_correlationSymbols = new CArrayString();
   m_correlatedSymbols = new CArrayString();
   m_timeframes = new CArrayInt();
   m_historyDays = new CArrayInt();
   m_configManager = CConfigurationManager::GetInstance();
   m_timeZoneCalendar = new CTimeZoneCalendar();
   
   // Initialisierung der Client-Konfigurationsfelder
   m_clientId = "";
   m_isMasterClient = false;
   m_assignmentString = "";
   m_currentTradeIndex = 0;
   m_assignmentGroups = new CArrayString();
   
   m_normalizedSymbols = new CArrayString();
   m_brokerSymbols = new CArrayString();
}

//+------------------------------------------------------------------+
//| Destruktor                                                       |
//+------------------------------------------------------------------+
CEnvironmentManager::~CEnvironmentManager()
{
   if(CheckPointer(m_activeTimeframes) == POINTER_DYNAMIC)
       delete m_activeTimeframes;
   if(CheckPointer(m_activeSymbols) == POINTER_DYNAMIC)
       delete m_activeSymbols;
   if(CheckPointer(m_symbolFeatures) == POINTER_DYNAMIC)
   {
       for(int i = 0; i < m_symbolFeatures.Total(); i++)
       {
           CArrayObj* features = m_symbolFeatures.At(i);
           if(CheckPointer(features) == POINTER_DYNAMIC)
               delete features;
       }
       delete m_symbolFeatures;
   }
   if(CheckPointer(m_correlationSymbols) == POINTER_DYNAMIC)
       delete m_correlationSymbols;
   if(CheckPointer(m_correlatedSymbols) == POINTER_DYNAMIC)
       delete m_correlatedSymbols;
   if(CheckPointer(m_timeframes) == POINTER_DYNAMIC)
       delete m_timeframes;
   if(CheckPointer(m_historyDays) == POINTER_DYNAMIC)
       delete m_historyDays;
   if(CheckPointer(m_timeZoneCalendar) == POINTER_DYNAMIC)
       delete m_timeZoneCalendar;
   if(CheckPointer(m_assignmentGroups) == POINTER_DYNAMIC)
       delete m_assignmentGroups;
   if(CheckPointer(m_normalizedSymbols) == POINTER_DYNAMIC)
       delete m_normalizedSymbols;
   if(CheckPointer(m_brokerSymbols) == POINTER_DYNAMIC)
       delete m_brokerSymbols;
}

CEnvironmentManager* CEnvironmentManager::GetInstance()
{
   if(s_instance == NULL)
       s_instance = new CEnvironmentManager();
   return s_instance;
}

void CEnvironmentManager::DeleteInstance()
{
   if(CheckPointer(s_instance) == POINTER_DYNAMIC)
   {
       delete s_instance;
       s_instance = NULL;
   }
}

void CEnvironmentManager::Reset()
{
   m_activeTimeframes.Clear();
   for(int i = 0; i < m_symbolFeatures.Total(); i++)
   {
       CArrayObj* features = m_symbolFeatures.At(i);
       features.Clear();
   }
   m_activeSymbols.Clear();
}

void CEnvironmentManager::LoadEnvironment(const string filename)
{
   Print("Loading environment from: ", filename);
   int handle = FileOpen(filename, FILE_READ|FILE_TXT|FILE_ANSI);
   if(handle != INVALID_HANDLE)
   {
       Print("Environment file opened successfully");
       string line;
       string section = "";
       
       while(!FileIsEnding(handle))
       {
           line = FileReadString(handle);
           StringTrimRight(line);
           StringTrimLeft(line);
           
           if(StringLen(line) > 0)
           {
               if(StringSubstr(line, 0, 1) == "[")
               {
                   section = line;
                   CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadEnvironment",LL_DEBUG,"Processing section: "+ section);
                   continue;
               }
               
               if(section == "[TimeframeHistory]")
               {
                   string parts[];
                   StringSplit(line, '=', parts);
                   if(ArraySize(parts) == 2)
                   {
                       m_timeframes.Add(CChartHelper::StringToTimeframe(parts[0]));
                       m_historyDays.Add((int)StringToInteger(parts[1]));
                       CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadEnvironment",LL_DEBUG,
                           "Added timeframe history: Timeframe="+ parts[0]+ " History days="+ parts[1]);
                   }
               }
               else if(section == "[TimeZones]")
               {
                   string parts[];
                   StringSplit(line, '=', parts);
                   if(ArraySize(parts) == 2)
                   {
                       string identifier = CHelper::TrimString(parts[0]);
                       string definitions = CHelper::TrimString(parts[1]);
                       AddTimeZoneDefinitions(identifier, definitions);
                       
                       CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadEnvironment",LL_DEBUG,
                           StringFormat("Added timezone definitions for %s: %s", identifier, definitions));
                   }
               }
               else if(section == "[CorrelatedPairs]")
               {
                   string parts[];
                   StringSplit(line, '=', parts);
                   if(ArraySize(parts) == 2)
                   {
                       m_correlationSymbols.Add(parts[0]);
                       m_correlatedSymbols.Add(parts[1]);
                   }
               }
               else if(section == "[Strategies]")
               {
                   string parts[];
                   StringSplit(line, '=', parts);
                   if(ArraySize(parts) == 2 && parts[0] == "Files")
                   {
                       string files[];
                       StringSplit(parts[1], ',', files);
                       for(int i = 0; i < ArraySize(files); i++)
                       {
                           string filename = CHelper::TrimString(CHelper::TrimString(files[i]));
                           CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadEnvironment",LL_DEBUG,
                               "Loading strategy file: "+ filename);
                           m_configManager.LoadConfiguration(filename, 0);
                       }
                   }
               }
               else if(section == "[ClientSettings]")
               {
                   string parts[];
                   StringSplit(line, '=', parts);
                   if(ArraySize(parts) == 2)
                   {
                       string key = CHelper::TrimString(parts[0]);
                       string value = CHelper::TrimString(parts[1]);
                       
                       if(key == "ID")
                           m_clientId = value;
                       else if(key == "IsMasterClient")
                           m_isMasterClient = (StringToLower(value) == "true" || value == "1");
                       
                        CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadEnvironment", LL_DEBUG,
                            StringFormat("Client setting: %s = %s", key, value));
                    }
                }
                else if(section == "[SymbolMapping]")
                {
                    string parts[];
                    StringSplit(line, '=', parts);
                    if(ArraySize(parts) == 2)
                    {
                        m_normalizedSymbols.Add(CHelper::TrimString(parts[0]));
                        m_brokerSymbols.Add(CHelper::TrimString(parts[1]));
                        
                        CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadEnvironment", LL_DEBUG,
                            StringFormat("Symbol mapping: %s -> %s", CHelper::TrimString(parts[0]), CHelper::TrimString(parts[1])));
                    }
                }
            }
        }
       FileClose(handle);
   }
   else
   {
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadEnvironment",LL_ERROR,
           "ERROR: Could not open environment file: "+ filename+ " Error code: "+ GetLastError());
   }
}

string CEnvironmentManager::GetCorrelatedSymbol(const string symbol)
{
   for(int i = 0; i < m_correlationSymbols.Total(); i++)
   {
       if(m_correlationSymbols.At(i) == symbol)
       {
           return m_correlatedSymbols.At(i);
       }
   }
   return "";
}

int CEnvironmentManager::GetHistoryDays(const int timeframe)
{
   for(int i = 0; i < m_timeframes.Total(); i++)
   {
       if(m_timeframes.At(i) == timeframe)
       {
           return m_historyDays.At(i);
       }
   }
   return 30; // Default falls nicht konfiguriert
}

void CEnvironmentManager::AddStrategyEnvironment(CStrategy* strategy)
{
   ProcessStrategySteps(strategy, true);
   ProcessStrategySteps(strategy, false);
}

void CEnvironmentManager::ApplyConfiguration()
{
   CLogManager::GetInstance().LogMessage("CEnvironmentManager::ApplyConfiguration",LL_DEBUG,"Starting environment configuration");
   
   CArrayObj* strategies = m_configManager.GetStrategies();
   CLogManager::GetInstance().LogMessage("CEnvironmentManager::ApplyConfiguration",LL_DEBUG,
        StringFormat("Processing %d strategies", strategies.Total()));
   
   for(int i = 0; i < strategies.Total(); i++)
   {
       CStrategy* strategy = strategies.At(i);
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::ApplyConfiguration",LL_DEBUG,
            StringFormat("Processing strategy: %s", strategy.Name));
       AddStrategyEnvironment(strategy);
   }
   
   // Features für alle Symbole initialisieren
   for(int i = 0; i < m_activeSymbols.Total(); i++)
   {
       string symbol = m_activeSymbols.At(i);
       CArrayObj* features = m_symbolFeatures.At(i);
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::ApplyConfiguration",LL_INFO,
            StringFormat("Initializing %d features for symbol: %s", features.Total(), symbol));
       for(int j = 0; j < features.Total(); j++)
       {
           CFeature* feature = features.At(j);
           CLogManager::GetInstance().LogMessage("CEnvironmentManager::ApplyConfiguration",LL_INFO,
                StringFormat("Initializing feature: %s", feature.GetName()));
           feature.Initialize();
           int timeframes[];
           feature.GetRequiredTimeframes(timeframes);
           for (int i=0; i<timeframes.Size();i++)
               AddTimeframe(timeframes[i]);
       }
   }
   
   int timeframes[];
    // Removed hardcoded timeframes (M1, M15, D1, W1) to save resources
    // Only timeframes required by strategy/features are now active.
    
    GetActiveTimeframes(timeframes);
   Print("Initializing ", ArraySize(timeframes), " active timeframes");
   
   for(int i = 0; i < ArraySize(timeframes); i++)
   {
       int days = GetHistoryDays(timeframes[i]);
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::ApplyConfiguration",LL_INFO,
            StringFormat("Initializing Timeframe: %s with %d days of history", CChartHelper::GetTimeframeName(timeframes[i]), days));
       CChartManager::GetInstance().AddTimeframe(timeframes[i], days);
   }
}

void CEnvironmentManager::GetActiveTimeframes(int& timeframes[])
{
   ArrayResize(timeframes, m_activeTimeframes.Total());
   for(int i = 0; i < m_activeTimeframes.Total(); i++)
   {
       timeframes[i] = m_activeTimeframes.At(i);
   }
   ArraySort(timeframes);
}

void CEnvironmentManager::ProcessStrategySteps(CStrategy* strategy, bool isLong) 
{
   CLogManager::GetInstance().LogMessage("CEnvironmentManager::ProcessStrategySteps",LL_DEBUG,
        StringFormat("Processing %s strategy steps for strategy: %s", isLong ? "Long" : "Short", strategy.Name));
   
   CStrategyModule* setupModule = strategy.GetModule(MODULE_TYPE_SETUP, isLong);
   if(setupModule != NULL)
   {
       Print("Found Setup Module with ", setupModule.GetStepCount(), " steps");
       for(int i = 0; i < setupModule.GetStepCount(); i++)
       {
           CStrategyStep* step = setupModule.GetStep(i);
           if(step != NULL)
           {
               int originTf = step.GetResolvedOriginTimeframe(setupModule.GetParameterNames(), setupModule.GetParameterValues());
               int targetTf = step.GetResolvedTargetTimeframe(setupModule.GetParameterNames(), setupModule.GetParameterValues());
               string eventName = step.GetEventName(0,setupModule.GetParameterNames(),setupModule.GetParameterValues());
               CLogManager::GetInstance().LogMessage("CEnvironmentManager::ProcessStrategySteps",LL_DEBUG,
                    StringFormat("Setup Step %d: Event=%s OriginTF=%s TargetTF=%s", i, eventName, CChartHelper::GetTimeframeName(originTf), CChartHelper::GetTimeframeName(targetTf)));
               
               if(originTf > 0) AddTimeframe(originTf);
               if(targetTf > 0) AddTimeframe(targetTf);
               
               ActivateFeatureForEventType(eventName);
           }
       }
   }
   
   CStrategyModule* entryModule = strategy.GetModule(MODULE_TYPE_ENTRY, isLong);
   if(entryModule != NULL)
   {
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::ProcessStrategySteps",LL_DEBUG,
            StringFormat("Found Entry Module with %d steps", entryModule.GetStepCount()));
       for(int i = 0; i < entryModule.GetStepCount(); i++)
       {
           CStrategyStep* step = entryModule.GetStep(i);
           if(step != NULL)
           {
               int originTf = step.GetResolvedOriginTimeframe(entryModule.GetParameterNames(), entryModule.GetParameterValues());
               int targetTf = step.GetResolvedTargetTimeframe(entryModule.GetParameterNames(), entryModule.GetParameterValues());
               string eventName = step.GetEventName(0,entryModule.GetParameterNames(),entryModule.GetParameterValues());
               CLogManager::GetInstance().LogMessage("CEnvironmentManager::ProcessStrategySteps",LL_DEBUG,
                    StringFormat("Entry Step %d: Event=%s OriginTF=%d TargetTF=%d", i, eventName, originTf, targetTf));
               
               if(originTf > 0) AddTimeframe(originTf);
               if(targetTf > 0) AddTimeframe(targetTf);
               
               ActivateFeatureForEventType(eventName);
           }
       }
   }
   
   CStrategyModule* invalidationModule = strategy.GetModule(MODULE_TYPE_INVALIDATION, isLong);
   if(invalidationModule != NULL)
   {
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::ProcessStrategySteps",LL_DEBUG,
            StringFormat("Found Invalidation Module with %d steps", invalidationModule.GetStepCount()));
       for(int i = 0; i < invalidationModule.GetStepCount(); i++)
       {
           CStrategyStep* step = invalidationModule.GetStep(i);
           if(step != NULL)
           {
               int originTf = step.GetResolvedOriginTimeframe(invalidationModule.GetParameterNames(), invalidationModule.GetParameterValues());
               int targetTf = step.GetResolvedTargetTimeframe(invalidationModule.GetParameterNames(), invalidationModule.GetParameterValues());
               string eventName = step.GetEventName(0,invalidationModule.GetParameterNames(),invalidationModule.GetParameterValues());
               CLogManager::GetInstance().LogMessage("CEnvironmentManager::ProcessStrategySteps",LL_DEBUG,
                    StringFormat("Invalidation Step %d: Event=%s OriginTF=%d TargetTF=%d", i, eventName, originTf, targetTf));
               
               if(originTf > 0) AddTimeframe(originTf);
               if(targetTf > 0) AddTimeframe(targetTf);
               
               ActivateFeatureForEventType(eventName);
           }
       }
   }
}

void CEnvironmentManager::AddTimeframe(int timeframe)
{
   bool found = false;
   for(int i = 0; i < m_activeTimeframes.Total(); i++)
   {
       if(m_activeTimeframes.At(i) == timeframe)
       {
           found = true;
           CLogManager::GetInstance().LogMessage("CEnvironmentManager::AddTimeframe",LL_DEBUG,
                StringFormat("Timeframe %d already active", timeframe));
           break;
       }
   }
   
   if(!found)
   {
       m_activeTimeframes.Add(timeframe);
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::AddTimeframe",LL_INFO,
            StringFormat("Added new active timeframe: %s", CChartHelper::GetTimeframeName(timeframe)));
   }
}

void CEnvironmentManager::ActivateFeatureForEventType(string eventName)
{
    string featureName = CFeatureRegistry::GetInstance().FindFeatureNameForEvent(eventName);
    if(featureName != "")
    {
        // Feature für Haupt-Symbol aktivieren
        AddFeatureForSymbol(featureName, _Symbol);
        
        // Required Events aktivieren
        ActivateRequiredFeatures(featureName, _Symbol);
        
        // Korrelierte Events prüfen und aktivieren
        ActivateCorrelatedFeatures(featureName);
    }
}

void CEnvironmentManager::AddFeatureForSymbol(const string& featureName, const string& symbol)
{
   int symbolIndex = -1;
   for(int i = 0; i < m_activeSymbols.Total(); i++)
   {
       if(m_activeSymbols.At(i) == symbol)
       {
           symbolIndex = i;
           break;
       }
   }
   
   if(symbolIndex == -1)
   {
       m_activeSymbols.Add(symbol);
       CArrayObj* features = new CArrayObj();
       m_symbolFeatures.Add(features);
       symbolIndex = m_activeSymbols.Total() - 1;
   }
   
   CArrayObj* features = m_symbolFeatures.At(symbolIndex);
   if(!IsFeatureActive(symbol, featureName))
   {
       CFeature* feature = CFeatureFactory::CreateFeature(featureName);
       
       if(feature != NULL)
       {
           features.Add(feature);
           feature.Initialize();
           CLogManager::GetInstance().LogMessage("CEnvironmentManager::AddFeatureForSymbol",LL_INFO,
                StringFormat("Added feature: %s for symbol: %s", featureName, symbol));
       }
       else
           Print("Feature "+featureName+" not created");
   }
}

bool CEnvironmentManager::IsFeatureActive(const string symbol, const string featureName)
{
   for(int i = 0; i < m_activeSymbols.Total(); i++)
   {
       if(m_activeSymbols.At(i) == symbol)
       {
           CArrayObj* features = m_symbolFeatures.At(i);
           for(int j = 0; j < features.Total(); j++)
           {
               CFeature* feature = features.At(j);
               if(feature.GetName() == featureName)
                   return true;
           }
           break;
       }
   }
   return false;
}

CArrayObj* CEnvironmentManager::GetFeaturesForSymbol(string symbol)
{
   for(int i = 0; i < m_activeSymbols.Total(); i++)
   {
       if(m_activeSymbols.At(i) == symbol)
       {
           return m_symbolFeatures.At(i);
       }
   }
   return NULL;
}

CFeature* CEnvironmentManager::GetFeatureForSymbol(string symbol, string name)
{
   CArrayObj* features = GetFeaturesForSymbol(symbol);
   if(features != NULL)
   {
       for(int i = 0; i < features.Total(); i++)
       {
           if(((CFeature*)features.At(i)).GetName() == name)
           {           
               return features.At(i);
           }
       }
   }
   return NULL;
}

bool CEnvironmentManager::HasActiveCorrelatedSymbol(const string symbol)
{
   string correlatedSymbol = GetCorrelatedSymbol(symbol);
   if(correlatedSymbol == "")
       return false;
       
   // Prüfen ob korreliertes Symbol aktiv ist (hat Features)
   for(int i = 0; i < m_activeSymbols.Total(); i++)
   {
       if(m_activeSymbols.At(i) == correlatedSymbol)
       {
           CArrayObj* features = m_symbolFeatures.At(i);
           return features.Total() > 0;
       }
   }
   return false;
}

void CEnvironmentManager::ActivateCorrelatedFeatures(const string featureName)
{
    ENUM_EVENT_TYPE correlatedTypes[];
    CFeatureRegistry::GetInstance().GetCorrelatedEvents(featureName, correlatedTypes);
    
    if(ArraySize(correlatedTypes) > 0)
    {
        string correlatedSymbol = GetCorrelatedSymbol(_Symbol);
        if(correlatedSymbol != "")
        {
            CLogManager::GetInstance().LogMessage("CEnvironmentManager::ActivateCorrelatedFeatures",LL_DEBUG,
                StringFormat("Processing %d correlated events for symbol: %s",
                    ArraySize(correlatedTypes), correlatedSymbol));
            
            for(int i = 0; i < ArraySize(correlatedTypes); i++)
            {
                string correlatedEventName = EnumToString(correlatedTypes[i]);
                CLogManager::GetInstance().LogMessage("CEnvironmentManager::ActivateCorrelatedFeatures",LL_DEBUG,
                    StringFormat("Processing correlated event: %s for feature: %s",
                        correlatedEventName, featureName));
                
                // Finde Feature für das korrelierte Event
                string correlatedFeatureName = CFeatureRegistry::GetInstance().FindFeatureNameForEvent(correlatedEventName);
                if(correlatedFeatureName != "")
                {
                    CLogManager::GetInstance().LogMessage("CEnvironmentManager::ActivateCorrelatedFeatures",LL_DEBUG,
                        StringFormat("Adding correlated feature: %s for symbol: %s",
                            correlatedFeatureName, correlatedSymbol));
                        
                    // Feature für korreliertes Symbol aktivieren
                    AddFeatureForSymbol(correlatedFeatureName, correlatedSymbol);
                    
                    // Required Events für das korrelierte Symbol aktivieren
                    ActivateRequiredFeatures(correlatedFeatureName, correlatedSymbol);
                }
            }
        }
    }
}

void CEnvironmentManager::ActivateRequiredFeatures(const string featureName, const string& symbol)
{
    ENUM_EVENT_TYPE requiredTypes[];
    CFeatureRegistry::GetInstance().GetRequiredEvents(featureName, requiredTypes);
   
    CLogManager::GetInstance().LogMessage("CEnvironmentManager::ActivateRequiredFeatures",LL_DEBUG,
        StringFormat("Processing %d required events for feature: %s on symbol: %s",
            ArraySize(requiredTypes), featureName, symbol));
   
    for(int i = 0; i < ArraySize(requiredTypes); i++)
    {
        string requiredEventName = EnumToString(requiredTypes[i]);
        CLogManager::GetInstance().LogMessage("CEnvironmentManager::ActivateRequiredFeatures",LL_DEBUG,
            StringFormat("Processing required event: %s", requiredEventName));
            
        string requiredFeatureName = CFeatureRegistry::GetInstance().FindFeatureNameForEvent(requiredEventName);
        if(requiredFeatureName != "")
        {
            AddFeatureForSymbol(requiredFeatureName, symbol);
        }
    }
}

// Neue TimeZone-Funktionen
int CEnvironmentManager::GetUTCOffset(const string& identifier, const datetime date)
{
    return m_timeZoneCalendar.GetUTCOffset(identifier, date);
}

void CEnvironmentManager::AddTimeZoneDefinition(const string& identifier, const datetime startDate, const int utcOffset)
{
    m_timeZoneCalendar.AddDefinition(identifier, startDate, utcOffset);
}

void CEnvironmentManager::AddTimeZoneDefinitions(const string& identifier, const string& definitions)
{
    m_timeZoneCalendar.AddDefinitions(identifier, definitions);
}


//+------------------------------------------------------------------+
//| Laden des Trade-Distribution-Zustands                            |
//+------------------------------------------------------------------+
void CEnvironmentManager::LoadTradeDistributionState()
{
   string filename = "trade_distribution_state.json";
   int handle = FileOpen(filename, FILE_READ|FILE_TXT);
   
   if(handle != INVALID_HANDLE)
   {
       string content = "";
       while(!FileIsEnding(handle))
       {
           content += FileReadString(handle);
       }
       FileClose(handle);
       
       // Extraktion des assignmentString
       int startPos = StringFind(content, "\"assignmentString\":\"") + 19;
       int endPos = StringFind(content, "\"", startPos);
       if(startPos > 19 && endPos > startPos)
       {
           m_assignmentString = StringSubstr(content, startPos, endPos - startPos);
           ParseAssignmentString(); // Parsen des Assignment Strings
       }
       
       // Extraktion des currentIndex
       startPos = StringFind(content, "\"currentIndex\":") + 15;
       endPos = StringFind(content, ",", startPos);
       if(endPos == -1) endPos = StringFind(content, "}", startPos);
       if(startPos > 15 && endPos > startPos)
       {
           string indexStr = StringSubstr(content, startPos, endPos - startPos);
           m_currentTradeIndex = (int)StringToInteger(indexStr);
       }
       
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadTradeDistributionState", LL_INFO,
           StringFormat("Loaded trade distribution state: AssignmentString=%s, CurrentIndex=%d", 
               m_assignmentString, m_currentTradeIndex));
   }
   else
   {
       // Standardwerte, wenn Datei nicht existiert
       m_assignmentString = "";
       m_currentTradeIndex = 0;
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::LoadTradeDistributionState", LL_INFO,
           "Trade distribution state file not found. Using default values.");
   }
}

//+------------------------------------------------------------------+
//| Speichern des Trade-Distribution-Zustands                        |
//+------------------------------------------------------------------+
void CEnvironmentManager::SaveTradeDistributionState()
{
   string filename = "trade_distribution_state.json";
   int handle = FileOpen(filename, FILE_WRITE|FILE_TXT);
   
   if(handle != INVALID_HANDLE)
   {
       string content = "{\n";
       content += "  \"assignmentString\": \"" + m_assignmentString + "\",\n";
       content += "  \"currentIndex\": " + IntegerToString(m_currentTradeIndex) + "\n";
       content += "}";
       
       FileWriteString(handle, content);
       FileClose(handle);
       
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::SaveTradeDistributionState", LL_INFO,
           StringFormat("Saved trade distribution state: AssignmentString=%s, CurrentIndex=%d", 
               m_assignmentString, m_currentTradeIndex));
   }
   else
   {
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::SaveTradeDistributionState", LL_ERROR,
           StringFormat("Error saving trade distribution state: %d", GetLastError()));
   }
}

//+------------------------------------------------------------------+
//| Setzen des Assignment-Strings                                    |
//+------------------------------------------------------------------+
void CEnvironmentManager::SetAssignmentString(string assignmentString)
{
   // Nur grundlegende Validierung (ohne Logik)
   if(StringLen(assignmentString) > 0)
   {
       m_assignmentString = assignmentString;
       ParseAssignmentString();
       SaveTradeDistributionState();
       
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::SetAssignmentString", LL_INFO,
           StringFormat("Assignment string updated: %s", assignmentString));
   }
   else
   {
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::SetAssignmentString", LL_ERROR,
           "Invalid assignment string format");
   }
}

//+------------------------------------------------------------------+
//| Setzen des aktuellen Trade-Index                                 |
//+------------------------------------------------------------------+
void CEnvironmentManager::SetCurrentTradeIndex(int index)
{
   m_currentTradeIndex = index; 
   SaveTradeDistributionState();
}

//+------------------------------------------------------------------+
//| Get Broker Symbol from Normalized Name                           |
//+------------------------------------------------------------------+
string CEnvironmentManager::GetBrokerSymbol(string normalizedSymbol)
{
   for(int i = 0; i < m_normalizedSymbols.Total(); i++)
   {
      if(m_normalizedSymbols.At(i) == normalizedSymbol)
      {
         return m_brokerSymbols.At(i);
      }
   }
   return normalizedSymbol; // Fallback: Name ist gleich
}

//+------------------------------------------------------------------+
//| Get Normalized Name from Broker Symbol                           |
//+------------------------------------------------------------------+
string CEnvironmentManager::GetNormalizedSymbol(string brokerSymbol)
{
   for(int i = 0; i < m_brokerSymbols.Total(); i++)
   {
      if(m_brokerSymbols.At(i) == brokerSymbol)
      {
         return m_normalizedSymbols.At(i);
      }
   }
   return brokerSymbol; // Fallback: Name ist gleich
}

//+------------------------------------------------------------------+
//| Holen der nächsten Target-Clients (nur Datenextraktion)          |
//+------------------------------------------------------------------+
void CEnvironmentManager::GetNextTargetClients(string &result[])
{
   if(m_assignmentGroups.Total() == 0)
   {
       ArrayResize(result, 0);
       return;
   }
   
   // Aktuellen Eintrag holen
   string groupStr = m_assignmentGroups.At(m_currentTradeIndex);
   
   // Entferne [ und ] aus der Gruppe
   groupStr = StringSubstr(groupStr, 1, StringLen(groupStr) - 2);
   
   // Teile die Gruppe in Client-IDs auf
   string parts[];
   StringSplit(groupStr, ',', parts);
   
   // In Ergebnis-Array kopieren
   ArrayResize(result, ArraySize(parts));
   for(int i = 0; i < ArraySize(parts); i++)
   {
       result[i] = CHelper::TrimString(parts[i]);
   }
   
   // Inkrementiere den Index und setze ihn zurück, wenn am Ende
   m_currentTradeIndex = (m_currentTradeIndex + 1) % m_assignmentGroups.Total();
   
   // Speichere den neuen Zustand
   SaveTradeDistributionState();
}

//+------------------------------------------------------------------+
//| Parsen des Assignment-Strings (nur Datenverarbeitung)            |
//+------------------------------------------------------------------+
void CEnvironmentManager::ParseAssignmentString()
{
   if(m_assignmentGroups == NULL)
       m_assignmentGroups = new CArrayString();
   else
       m_assignmentGroups.Clear();
   
   string remaining = m_assignmentString;
   int startPos = 0;
   int endPos = 0;
   
   while((startPos = StringFind(remaining, "[", 0)) != -1)
   {
       endPos = StringFind(remaining, "]", startPos);
       if(endPos == -1) break;
       
       string group = StringSubstr(remaining, startPos, endPos - startPos + 1);
       m_assignmentGroups.Add(group);
       
       remaining = StringSubstr(remaining, endPos + 1);
   }
   
   CLogManager::GetInstance().LogMessage("CEnvironmentManager::ParseAssignmentString", LL_INFO,
       StringFormat("Parsed %d assignment groups from string: %s", 
           m_assignmentGroups.Total(), m_assignmentString));
           
   // Validiere den aktuellen Index
   if(m_currentTradeIndex >= m_assignmentGroups.Total() && m_assignmentGroups.Total() > 0)
   {
       m_currentTradeIndex = 0;
       CLogManager::GetInstance().LogMessage("CEnvironmentManager::ParseAssignmentString", LL_INFO,
           "Current index was out of bounds, reset to 0");
   }
}

#endif


