//+------------------------------------------------------------------+
//|                                         CConfigurationParser.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef CONFIGURATION_PARSER_MQH
#define CONFIGURATION_PARSER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\Strategy.mqh>
#include <Expert\SessionDefinition.mqh>
#include <Expert\StrategyModule.mqh>
#include <Expert\MacroDefinition.mqh>
#include <Expert\ParserHelper.mqh>
#include <Expert\SessionParser.mqh>
#include <Expert\StrategyParser.mqh>
#include <Expert\MacroParser.mqh>
#include <Expert\ModuleParser.mqh>
#include <Expert\ModuleTypes.mqh>

enum ENUM_PARSING_SECTION
{
    SECTION_NONE,
    SECTION_MODULE,
    SECTION_STRATEGY,
    SECTION_MACROS,
    SECTION_SESSION
};

class CStrategyParser;

class CConfigurationParser : public CObject
{
private:
    static CModuleParser* m_moduleParser;
    static CStrategyParser* m_strategyParser;
    static CSessionParser* m_sessionParser;
    static CMacroParser* m_macroParser;
    
    static void ProcessContent(const string& content,
                             ENUM_PARSING_SECTION section,
                             CArrayObj* modules,
                             CArrayObj* strategies,
                             CArrayObj* macros,
                             CArrayObj* sessions,
                             int defaultTimeframe);
                             
    static ENUM_PARSING_SECTION IdentifySection(const string& line);
    static bool ValidateConfiguration(CArrayObj* modules,
                                    CArrayObj* strategies,
                                    CArrayObj* macros,
                                    CArrayObj* sessions);
                                    
    static bool LineEndsWithString(const string& line, const string& ending);

public:
    static void Initialize();
    static void Deinitialize();
    
    static bool ParseConfiguration(const string content, 
                                 CArrayObj* modules,
                                 CArrayObj* strategies, 
                                 CArrayObj* macros,
                                 CArrayObj* sessions,
                                 int defaultTimeframe);
};

CModuleParser* CConfigurationParser::m_moduleParser = NULL;
CStrategyParser* CConfigurationParser::m_strategyParser = NULL;
CSessionParser* CConfigurationParser::m_sessionParser = NULL;
CMacroParser* CConfigurationParser::m_macroParser = NULL;

void CConfigurationParser::Initialize()
{
    if(m_moduleParser == NULL) m_moduleParser = new CModuleParser();
    if(m_strategyParser == NULL) m_strategyParser = new CStrategyParser();
    if(m_sessionParser == NULL) m_sessionParser = new CSessionParser();
    if(m_macroParser == NULL) m_macroParser = new CMacroParser();
}

void CConfigurationParser::Deinitialize()
{
    if(CheckPointer(m_moduleParser) == POINTER_DYNAMIC)
    {
        delete m_moduleParser;
        m_moduleParser = NULL;
    }
    if(CheckPointer(m_strategyParser) == POINTER_DYNAMIC)
    {
        delete m_strategyParser;
        m_strategyParser = NULL;
    }
    if(CheckPointer(m_sessionParser) == POINTER_DYNAMIC)
    {
        delete m_sessionParser;
        m_sessionParser = NULL;
    }
    if(CheckPointer(m_macroParser) == POINTER_DYNAMIC)
    {
        delete m_macroParser;
        m_macroParser = NULL;
    }
}

bool CConfigurationParser::ParseConfiguration(const string content,
                                           CArrayObj* modules,
                                           CArrayObj* strategies,
                                           CArrayObj* macros,
                                           CArrayObj* sessions,
                                           int defaultTimeframe)
{
    Initialize();
    
    string lines[];
    StringSplit(content, '\n', lines);
    
    ENUM_PARSING_SECTION currentSection = SECTION_NONE;
    string currentContent = "";
    
    Print("Starting to parse configuration. Total lines: ", ArraySize(lines));
    
    for(int i = 0; i < ArraySize(lines); i++)
    {
        string line = lines[i];
        StringTrimLeft(line);
        StringTrimRight(line);
        if(line == "" || StringFind(line, "//") == 0) continue;
        
        ENUM_PARSING_SECTION newSection = IdentifySection(line);
        if(newSection != SECTION_NONE)
        {
            if(currentContent != "")
            {
                ProcessContent(currentContent, currentSection, modules, strategies, macros, sessions, defaultTimeframe);
                currentContent = "";
            }
            currentSection = newSection;
        }
        
        if(!LineEndsWithString(line, "EndModule") && 
           !LineEndsWithString(line, "EndStrategy") && 
           !LineEndsWithString(line, "EndMacros") && 
           !LineEndsWithString(line, "EndSession"))
        {
            currentContent += line + "\n";
        }
    }
    
    // Verarbeite letzten Block
    if(currentContent != "")
    {
        ProcessContent(currentContent, currentSection, modules, strategies, macros, sessions, defaultTimeframe);
    }
    
    // Validiere die gesamte Konfiguration
    if(!ValidateConfiguration(modules, strategies, macros, sessions))
    {
        Print("Configuration validation failed!");
        return false;
    }
    
    Print("Parsing complete. Total modules: ", modules.Total(),
          ", strategies: ", strategies.Total(),
          ", macros: ", macros.Total(),
          ", sessions: ", sessions.Total());
    
    return true;
}

bool CConfigurationParser::LineEndsWithString(const string& line, const string& ending)
{
    int lineLen = StringLen(line);
    int endLen = StringLen(ending);
    
    if(endLen > lineLen) return false;
    
    string endOfLine = StringSubstr(line, lineLen - endLen, endLen);
    return endOfLine == ending;
}

void CConfigurationParser::ProcessContent(const string& content,
                                        ENUM_PARSING_SECTION section,
                                        CArrayObj* modules,
                                        CArrayObj* strategies,
                                        CArrayObj* macros,
                                        CArrayObj* sessions,
                                        int defaultTimeframe)
{
    switch(section)
    {
        case SECTION_MODULE:
            if(m_moduleParser != NULL)
                m_moduleParser.Parse(content, modules);
            break;
            
        case SECTION_STRATEGY:
            if(m_strategyParser != NULL)
                m_strategyParser.Parse(content, strategies, defaultTimeframe);
            break;
            
        case SECTION_MACROS:
            if(m_macroParser != NULL)
                m_macroParser.Parse(content, macros);
            break;
            
        case SECTION_SESSION:
            if(m_sessionParser != NULL)
                m_sessionParser.Parse(content, sessions);
            break;
    }
}

ENUM_PARSING_SECTION CConfigurationParser::IdentifySection(const string& line)
{
    if(StringFind(line, "Module:") == 0)
        return SECTION_MODULE;
    if(StringFind(line, "Strategy:") == 0)
        return SECTION_STRATEGY;
    if(line == "Macros:")
        return SECTION_MACROS;
    if(StringFind(line, "Session:") == 0)
        return SECTION_SESSION;
        
    return SECTION_NONE;
}

bool CConfigurationParser::ValidateConfiguration(CArrayObj* modules,
                                               CArrayObj* strategies,
                                               CArrayObj* macros,
                                               CArrayObj* sessions)
{
    // Überprüfe, ob alle in Strategien verwendeten Module existieren
    for(int i = 0; i < strategies.Total(); i++)
    {
        CStrategy* strategy = strategies.At(i);
        
        string moduleNames[];
        strategy.GetUsedModuleNames(moduleNames);
        
        for(int j = 0; j < ArraySize(moduleNames); j++)
        {
            bool moduleFound = false;
            for(int k = 0; k < modules.Total(); k++)
            {
                CStrategyModule* module = modules.At(k);
                if(module.GetName() == moduleNames[j])
                {
                    moduleFound = true;
                    break;
                }
            }
            
            if(!moduleFound)
            {
                Print("Error: Module '", moduleNames[j], "' used in strategy '", strategy.Name, "' not found!");
                return false;
            }
        }
    }
    
    // Überprüfe, ob alle Makros auf existierende Strategien verweisen
    for(int i = 0; i < macros.Total(); i++)
    {
        CMacroDefinition* macro = macros.At(i);
        bool strategyFound = false;
        
        for(int j = 0; j < strategies.Total(); j++)
        {
            CStrategy* strategy = strategies.At(j);
            if(strategy.Name == macro.GetStrategyName())
            {
                strategyFound = true;
                break;
            }
        }
        
        if(!strategyFound)
        {
            Print("Error: Strategy '", macro.GetStrategyName(), "' referenced in macro not found!");
            return false;
        }
    }
    
    return true;
}

#endif


