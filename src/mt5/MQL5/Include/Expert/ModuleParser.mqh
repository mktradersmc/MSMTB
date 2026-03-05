#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef MODULE_PARSER_MQH
#define MODULE_PARSER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\StrategyModule.mqh>
#include <Expert\StrategyStep.mqh>
#include <Expert\ParserHelper.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\ModuleTypes.mqh>

class CStrategyStep;

class CModuleParser : public CObject
{
private:
    string ExtractModuleName(const string& line);
    void ExtractParameters(const string& line, string &params[]);
    CStrategyStep* ParseStep(const string& line, const string& parameterList[]);
    void ProcessParameterReferences(CStrategyStep* step, const string& line, const string& parameterList[]);
    bool ContainsParameter(const string& text) const;
    void FindParameterReferences(const string& text, string &refs[]) const;
    string CreateParameterPlaceholder(const string& paramName) const;
    string DetermineModuleType(const string& content) const;

public:
    void Parse(const string& content, CArrayObj* modules);
};

void CModuleParser::Parse(const string& content, CArrayObj* modules)
{
    CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"\n=== Starting Module Parsing ===");
    
    string lines[];
    CParserHelper::SplitLines(content, lines);
    CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"Lines to parse: "+ ArraySize(lines));
    
    if(ArraySize(lines) < 1) return;
    
    string firstLine = lines[0];
    StringTrimRight(firstLine);
    StringTrimLeft(firstLine);
    Print("First line: ", firstLine);
    
    if(StringFind(firstLine, "Module:") != 0) return;
    
    string moduleName = ExtractModuleName(firstLine);
    string moduleType = DetermineModuleType(content);
    
    CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,
        StringFormat("Module name: %s, type: %s", moduleName, moduleType));
    
    string parameterNames[];
    ExtractParameters(firstLine, parameterNames);
    CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"Parameters found: "+ ArraySize(parameterNames));
    for(int i = 0; i < ArraySize(parameterNames); i++)
    {
        CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"  Parameter "+ i + ": " + parameterNames[i]);
    }
    
    CStrategyModule* module = new CStrategyModule(moduleName, moduleType);
    
    for(int i = 0; i < ArraySize(parameterNames); i++)
    {
        module.AddParameter(parameterNames[i]);
    }
    
    CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"\nParsing steps:");
    for(int i = 1; i < ArraySize(lines); i++)
    {
        string line = lines[i];
        StringTrimRight(line);
        StringTrimLeft(line);
        if(line == "" || line == "EndModule") 
        {
            CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"Skipping empty or end line");
            continue;
        }
        
        // Prüfe auf Invalidierung
        if(StringFind(line, "Invalidation:") == 0)
        {
            string invalidationLine = StringSubstr(line, 13);  // Length of "Invalidation: "
            StringTrimLeft(invalidationLine);
            
            CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,
                StringFormat("Found Invalidation line: '%s'", invalidationLine));
            
            CStrategyStep* step = ParseStep(invalidationLine, parameterNames);
            if(step != NULL)
            {
                step.SetIsInvalidation(true);
                
                CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,
                    StringFormat("Created invalidation step with template: %s, IsInvalidation=%s", 
                        step.GetEventNameTemplate(),
                        step.IsInvalidation() ? "true" : "false"));
                
                module.AddStep(step);
                CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,
                    StringFormat("Invalidation step added to module, checking again: IsInvalidation=%s", 
                        step.IsInvalidation() ? "true" : "false"));
            }
            else
            {
                CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"Failed to create invalidation step!");
            }
            continue;
        }
        
        CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"Processing step line: "+ line);
        CStrategyStep* step = ParseStep(line, parameterNames);
        if(step != NULL)
        {
            CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,
                StringFormat("Created regular step with template: %s, IsInvalidation=%s", 
                    step.GetEventNameTemplate(),
                    step.IsInvalidation() ? "true" : "false"));
                    
            module.AddStep(step);
            CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"Step added to module");
        }
        else
        {
            CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"Failed to create step!");
        }
    }
    
    // Zusätzliche Debug-Ausgabe für alle Steps im Modul
    CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"\nModule parsing complete, final step overview:");
    for(int i = 0; i < module.GetStepCount(); i++)
    {
        CStrategyStep* step = module.GetStep(i);
        CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,
            StringFormat("Step %d: Template=%s, IsInvalidation=%s", 
                i+1,
                step.GetEventNameTemplate(),
                step.IsInvalidation() ? "true" : "false"));
    }
    
    modules.Add(module);
    CLogManager::GetInstance().LogMessage("CModuleParser",LL_DEBUG,"=== Module Parsing Complete ===\n");
}

string CModuleParser::ExtractModuleName(const string& line)
{
    int startPos = StringFind(line, ": ") + 2;
    int endPos = StringFind(line, "[");
    if(endPos == -1) endPos = StringLen(line);
    
    string name = StringSubstr(line, startPos, endPos - startPos);
    StringTrimRight(name);
    StringTrimLeft(name);
    
    return name;
}

void CModuleParser::ExtractParameters(const string& line, string &params[])
{
    ArrayFree(params);
    int pos = 0;
    
    while(true)
    {
        int startPos = StringFind(line, "[", pos);
        if(startPos == -1) break;
        
        int endPos = StringFind(line, "]", startPos);
        if(endPos == -1) break;
        
        string param = StringSubstr(line, startPos + 1, endPos - startPos - 1);
        StringTrimRight(param);
        StringTrimLeft(param);
        
        int size = ArraySize(params);
        ArrayResize(params, size + 1);
        params[size] = param;
        
        pos = endPos + 1;
    }
}

CStrategyStep* CModuleParser::ParseStep(const string& line, const string& parameterList[])
{
    CLogManager::GetInstance().LogMessage("CModuleParser::ParseStep",LL_DEBUG,
        StringFormat("Parsing line: '%s'", line));
        
    CStrategyStep* step = new CStrategyStep();
    
    // Finde den ersten Parameter (mit :)
    int paramStartPos = -1;
    string checkParts[];
    StringSplit(line, ' ', checkParts);
    
    for(int i = 0; i < ArraySize(checkParts); i++)
    {
        if(StringFind(checkParts[i], ":") != -1)
        {
            paramStartPos = StringFind(line, checkParts[i]);
            break;
        }
    }
    
    // Extrahiere den Event-Teil (alles vor den Parametern oder die ganze Zeile wenn keine Parameter)
    string eventPart = (paramStartPos == -1) ? line : StringSubstr(line, 0, paramStartPos);
    StringTrimRight(eventPart);  // Entferne Leerzeichen am Ende
    
    CLogManager::GetInstance().LogMessage("CModuleParser::ParseStep",LL_DEBUG,
        StringFormat("Extracted event part: '%s'", eventPart));
        
    // Setze die Event-Namen (inkl. möglicher |-Operatoren)
    step.SetEventNameTemplates(eventPart);
    
    // Verarbeite Parameter wenn vorhanden
    if(paramStartPos != -1)
    {
        ProcessParameterReferences(step, StringSubstr(line, paramStartPos), parameterList);
    }
    
    return step;
}

void CModuleParser::ProcessParameterReferences(CStrategyStep* step, const string& line, const string& parameterList[])
{
   string pairs[];
   StringSplit(line, ' ', pairs);
   
   for(int i = 0; i < ArraySize(pairs); i++)
   {
       string pair = pairs[i];
       int colonPos = StringFind(pair, ":");
       
       if(colonPos != -1)
       {
           string key = StringSubstr(pair, 0, colonPos);
           string value = StringSubstr(pair, colonPos + 1);

           // Parameter-Referenz oder direkter Wert
           bool hasParameter = ContainsParameter(value);
           
           if(key == "ORIGIN_TF" && hasParameter)
               step.SetOriginTimeframe(value);
           else if(key == "TARGET_TF" && hasParameter)
               step.SetTargetTimeframe(value);
           else if(key == "DIRECTION" && hasParameter)
               step.SetDirection(value);
           else if(key == "UNMITIGATED")
               step.SetUnmitigated(StringCompare(value, "TRUE") == 0);
           else if(key == "ID")
           {
               step.SetEventParameter("ID", value);
               CLogManager::GetInstance().LogMessage("CModuleParser::ProcessParameterReferences",
                   LL_DEBUG,
                   StringFormat("Set event parameter ID=%s for step", value));
           }
       }
   }
}

bool CModuleParser::ContainsParameter(const string& text) const
{
    return StringFind(text, "${") != -1 && StringFind(text, "}") != -1;
}

void CModuleParser::FindParameterReferences(const string& text, string &refs[]) const
{
    ArrayFree(refs);
    int pos = 0;
    
    while(true)
    {
        int startPos = StringFind(text, "${", pos);
        if(startPos == -1) break;
        
        int endPos = StringFind(text, "}", startPos);
        if(endPos == -1) break;
        
        string paramName = StringSubstr(text, startPos + 2, endPos - startPos - 2);
        
        int size = ArraySize(refs);
        ArrayResize(refs, size + 1);
        refs[size] = paramName;
        
        pos = endPos + 1;
    }
}

string CModuleParser::CreateParameterPlaceholder(const string& paramName) const
{
    return "${" + paramName + "}";
}

string CModuleParser::DetermineModuleType(const string& content) const
{
    string lines[];
    CParserHelper::SplitLines(content, lines);
    
    for(int i = 0; i < ArraySize(lines); i++)
    {
        string line = lines[i];
        StringTrimRight(line);
        StringTrimLeft(line);
        
        if(StringFind(line, "Type:") == 0)
        {
            string type = StringSubstr(line, 5);
            StringTrimLeft(type);
            StringTrimRight(type);
            return type;
        }
    }
    
    return MODULE_TYPE_SETUP;  // Default für Abwärtskompatibilität
}

#endif


