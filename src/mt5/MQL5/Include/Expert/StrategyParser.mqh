//+------------------------------------------------------------------+
//|                                               StrategyParser.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef STRATEGY_PARSER_MQH
#define STRATEGY_PARSER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\Strategy.mqh>
#include <Expert\StrategyModule.mqh>
#include <Expert\ParserHelper.mqh>
#include <Expert\ConfigurationManager.mqh>
#include <Expert\ValidationCondition.mqh>
#include <Expert\ModuleTypes.mqh>
#include <Expert\LogManager.mqh>

class CValidationCondition;
class CStrategyModule;

class CStrategyParser : public CObject
{
private:
    int m_defaultTimeframe;
    
    string ParseStrategyName(const string& line);
    CStrategyModule* ParseModuleDefinition(const string& line);
    CStrategyModule* FindAndCloneModule(const string& moduleName);
    void ApplyModuleParameters(CStrategyModule* module, const string& parameters[]);
    CValidationCondition* ParseValidation(const string& line);

public:
    void Parse(const string& content, CArrayObj* strategies, int defaultTimeframe);
};

void CStrategyParser::Parse(const string& content, CArrayObj* strategies, int defaultTimeframe)
{
    m_defaultTimeframe = defaultTimeframe;
    
    string lines[];
    CParserHelper::SplitLines(content, lines);
    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Total lines to parse: " + IntegerToString(ArraySize(lines)));
    
    if(ArraySize(lines) < 1) 
    {
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "No lines to parse");
        return;
    }
    
    string firstLine = lines[0];
    if(StringFind(firstLine, "Strategy:") != 0) 
    {
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "First line is not a strategy definition: " + firstLine);
        return;
    }
    
    CStrategy* strategy = new CStrategy();
    strategy.Name = ParseStrategyName(firstLine);
    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Creating new strategy: " + strategy.Name);
    
    bool parsingLong = false;
    bool parsingShort = false;
    bool parsingValidations = false;
    CArrayObj* currentValidations = new CArrayObj();
    
    for(int i = 1; i < ArraySize(lines); i++)
    {
        string line = CParserHelper::TrimString(lines[i]);
        if(line == "") continue;
        
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Parsing line " + IntegerToString(i) + ": " + line);
        
        if(line == "LongStrategy:")
        {
            CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Starting Long Strategy section");
            parsingLong = true;
            parsingShort = false;
            parsingValidations = false;
            continue;
        }
        else if(line == "ShortStrategy:")
        {
            CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Starting Short Strategy section");
            parsingLong = false;
            parsingShort = true;
            parsingValidations = false;
            continue;
        }
        else if(line == "Validations:")
        {
            CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Starting Validations section");
            parsingValidations = true;
            currentValidations = new CArrayObj();
            continue;
        }
        else if(line == "EndLongStrategy")
        {
            CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "End of Long Strategy section");
            if(currentValidations.Total() > 0)
            {
                CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Setting Long Validations");
                strategy.SetLongValidations(currentValidations);
                currentValidations = new CArrayObj();
            }
            parsingLong = false;
            parsingValidations = false;
            continue;
        }
        else if(line == "EndShortStrategy")
        {
            CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "End of Short Strategy section");
            if(currentValidations.Total() > 0)
            {
                CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Setting Short Validations");
                strategy.SetShortValidations(currentValidations);
                currentValidations = new CArrayObj();
            }
            parsingShort = false;
            parsingValidations = false;
            continue;
        }
        else if(line == "EndStrategy")
        {
            CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "End of Strategy");
            break;
        }
        
        if(parsingLong || parsingShort)
        {
            if(parsingValidations)
            {
                CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Parsing validation: " + line);
                CValidationCondition* condition = ParseValidation(line);
                if(condition != NULL)
                {
                    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Adding validation condition");
                    currentValidations.Add(condition);
                }
                else
                {
                    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Failed to parse validation condition");
                }
            }
            else
            {
                CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Parsing module definition: " + line);
                CStrategyModule* module = ParseModuleDefinition(line);
                if(module != NULL)
                {
                    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Created module: " + module.GetName() + " Type: " + module.GetModuleType() + " IsLong: " + (parsingLong ? "true" : "false"));
                    strategy.SetModule(module, parsingLong);
                }
                else
                {
                    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Failed to create module from line: " + line);
                }
            }
        }
    }
    
    delete currentValidations;
    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Strategy parsing complete. Adding to strategies array.");
    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Strategy modules before adding:");
    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "toString output: \n" + strategy.ToString());
    strategies.Add(strategy);
}

CValidationCondition* CStrategyParser::ParseValidation(const string& line)
{
    string parts[];
    CParserHelper::Split(line, " ", parts);
    
    if(ArraySize(parts) < 2) return NULL;
    
    string conditionName = parts[0];
    CValidationCondition* condition = new CValidationCondition(conditionName);
    
    for(int i = 1; i < ArraySize(parts); i++)
    {
        string paramParts[];
        if(StringSplit(parts[i], ':', paramParts) == 2)
        {
            condition.AddParameter(paramParts[0], paramParts[1]);
        }
    }
    
    return condition;
}

string CStrategyParser::ParseStrategyName(const string& line)
{
    return CParserHelper::ExtractName(line);
}

CStrategyModule* CStrategyParser::ParseModuleDefinition(const string& line)
{
    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "ParseModuleDefinition start with line: " + line);
    
    string moduleType = "";
    if(StringFind(line, MODULE_TYPE_SETUP+":") == 0) 
    {
        moduleType = MODULE_TYPE_SETUP;
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Detected Setup module");
    }
    else if(StringFind(line, MODULE_TYPE_ENTRY+":") == 0) 
    {
        moduleType = MODULE_TYPE_ENTRY;
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Detected Entry module");
    }
    else if(StringFind(line, MODULE_TYPE_INVALIDATION+":") == 0) 
    {
        moduleType = MODULE_TYPE_INVALIDATION;
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Detected Invalidation module");
    }
    else 
    {
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Unknown module type in line");
        return NULL;
    }
    
    int startPos = StringFind(line, ":") + 1;
    string remainingLine = StringSubstr(line, startPos);
    StringTrimLeft(remainingLine);
    
    string name;
    string parameters[];
    CParserHelper::ExtractNameAndParameters(line, name, parameters);
    
    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Extracted module name: " + name);
    CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Number of parameters: " + IntegerToString(ArraySize(parameters)));
    
    if(name == "") 
    {
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "No module name found");
        return NULL;
    }
    
    CStrategyModule* module = FindAndCloneModule(name);
    if(module != NULL)
    {
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Successfully cloned module: " + module.GetName());
        ApplyModuleParameters(module, parameters);
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Applied parameters to module");
        module.SetModuleType(moduleType);
    }
    else
    {
        CLogManager::GetInstance().LogMessage("CStrategyParser", LL_DEBUG, "Failed to find and clone module: " + name);
    }
    
    return module;
}

CStrategyModule* CStrategyParser::FindAndCloneModule(const string& moduleName)
{
    CStrategyModule* moduleTemplate = CConfigurationManager::GetInstance().FindModule(moduleName);
    if(moduleTemplate == NULL) return NULL;
    
    return moduleTemplate.Clone();
}

void CStrategyParser::ApplyModuleParameters(CStrategyModule* module, const string& parameters[])
{
    string paramNames[];
    module.GetParameterNames(paramNames);
    
    for(int i = 0; i < ArraySize(paramNames) && i < ArraySize(parameters); i++)
    {
        module.AddParameterValue(parameters[i]);
    }
}

#endif


