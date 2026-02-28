//+------------------------------------------------------------------+
//|                                        CConfigurationManager.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef CONFIGURATION_MANAGER_MQH
#define CONFIGURATION_MANAGER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\Strategy.mqh>
#include <Expert\StrategyModule.mqh>
#include <Expert\MacroDefinition.mqh>
#include <Expert\SessionDefinition.mqh>
#include <Expert\ConfigurationParser.mqh>
#include <Expert\ModuleTypes.mqh>

class CStrategy;
class CStrategyModule;

class CConfigurationManager : public CObject
{
private:
    static CConfigurationManager* m_instance;
    CArrayObj* m_modules;         // Verfügbare Module
    CArrayObj* m_strategies;      // Definierte Strategien
    CArrayObj* m_macros;          // Definierte Makros
    CArrayObj* m_sessions;        // Definierte Sessions
    
    // Private Konstruktor für Singleton
    CConfigurationManager();
    
public:
    static CConfigurationManager* GetInstance();
    ~CConfigurationManager();
    
    // Hauptfunktionalität
    bool LoadConfiguration(const string filename, int defaultTimeframe);
    
    // Module Management
    CStrategyModule* FindModule(const string& name) const;
    CArrayObj* GetModules() const { return m_modules; }
    
    // Strategy Management
    CStrategy* FindStrategy(const string& name) const;
    CArrayObj* GetStrategies() const { return m_strategies; }
    
    // Macro Management
    CMacroDefinition* FindMacro(const string& name) const;
    CArrayObj* GetMacros() const { return m_macros; }
    
    // Session Management
    CArrayObj* GetSessionDefinitions() const { return m_sessions; }
};

// Static member initialization
CConfigurationManager* CConfigurationManager::m_instance = NULL;

CConfigurationManager::CConfigurationManager()
{
    m_modules = new CArrayObj();
    m_strategies = new CArrayObj();
    m_macros = new CArrayObj();
    m_sessions = new CArrayObj();
}

CConfigurationManager* CConfigurationManager::GetInstance()
{
    if(m_instance == NULL)
    {
        m_instance = new CConfigurationManager();
    }
    return m_instance;
}

CConfigurationManager::~CConfigurationManager()
{
    // Cleanup modules
    if(m_modules != NULL)
    {
        for(int i = 0; i < m_modules.Total(); i++)
            delete m_modules.At(i);
        delete m_modules;
    }
    
    // Cleanup strategies
    if(m_strategies != NULL)
    {
        for(int i = 0; i < m_strategies.Total(); i++)
            delete m_strategies.At(i);
        delete m_strategies;
    }
    
    // Cleanup macros
    if(m_macros != NULL)
    {
        for(int i = 0; i < m_macros.Total(); i++)
            delete m_macros.At(i);
        delete m_macros;
    }
    
    // Cleanup sessions
    if(m_sessions != NULL)
    {
        for(int i = 0; i < m_sessions.Total(); i++)
            delete m_sessions.At(i);
        delete m_sessions;
    }
}

bool CConfigurationManager::LoadConfiguration(const string filename, int defaultTimeframe)
{
    // Bestehende Konfiguration löschen
    for(int i = m_modules.Total()-1; i >= 0; i--) { delete m_modules.At(i); }
    for(int i = m_strategies.Total()-1; i >= 0; i--) { delete m_strategies.At(i); }
    for(int i = m_macros.Total()-1; i >= 0; i--) { delete m_macros.At(i); }
    for(int i = m_sessions.Total()-1; i >= 0; i--) { delete m_sessions.At(i); }
    
    m_modules.Clear();
    m_strategies.Clear();
    m_macros.Clear();
    m_sessions.Clear();
    
    // Datei einlesen
    int handle = FileOpen(filename, FILE_READ|FILE_TXT|FILE_ANSI);
    if(handle == INVALID_HANDLE)
    {
        Print("Error opening configuration file: ", filename);
        return false;
    }
    
    string content = "";
    while(!FileIsEnding(handle))
    {
        content += FileReadString(handle) + "\n";
    }
    FileClose(handle);
    
    Print("File-Content");
    Print(content);
    // Konfiguration parsen
    return CConfigurationParser::ParseConfiguration(
        content, m_modules, m_strategies, m_macros, m_sessions, defaultTimeframe
    );
}

CStrategyModule* CConfigurationManager::FindModule(const string& name) const
{
    for(int i = 0; i < m_modules.Total(); i++)
    {
        CStrategyModule* module = m_modules.At(i);
        if(module.GetName() == name)
            return module;
    }
    Print("Module not found: ", name);
    return NULL;
}

CStrategy* CConfigurationManager::FindStrategy(const string& name) const
{
    for(int i = 0; i < m_strategies.Total(); i++)
    {
        CStrategy* strategy = m_strategies.At(i);
        if(strategy.Name == name)
            return strategy;
    }
    Print("Strategy not found: ", name);
    return NULL;
}

CMacroDefinition* CConfigurationManager::FindMacro(const string& name) const
{
    for(int i = 0; i < m_macros.Total(); i++)
    {
        CMacroDefinition* macro = m_macros.At(i);
        if(macro.GetStrategyName() == name)
            return macro;
    }
    Print("Macro not found: ", name);
    return NULL;
}

#endif


