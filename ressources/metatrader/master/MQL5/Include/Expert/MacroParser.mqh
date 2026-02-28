//+------------------------------------------------------------------+
//|                                                  MacroParser.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef MACRO_PARSER_MQH
#define MACRO_PARSER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\MacroDefinition.mqh>
#include <Expert\ParserHelper.mqh>

class CMacroParser : public CObject
{
private:
    bool IsMacroSection(const string& line) const;
    bool IsEndMacros(const string& line) const;
    bool ParseMacroLine(const string& line, string& strategyName, string& buttonLabel) const;
    bool ValidateMacroDefinition(const string& strategyName, const string& buttonLabel) const;

public:
    void Parse(const string& content, CArrayObj* macros);
};

void CMacroParser::Parse(const string& content, CArrayObj* macros)
{
    string lines[];
    CParserHelper::SplitLines(content, lines);
    
    bool parsingMacros = false;
    
    for(int i = 0; i < ArraySize(lines); i++)
    {
        string line = CParserHelper::TrimString(lines[i]);
        if(line == "") continue;
        
        if(IsMacroSection(line))
        {
            parsingMacros = true;
            continue;
        }
        
        if(IsEndMacros(line))
        {
            parsingMacros = false;
            break;
        }
        
        if(parsingMacros)
        {
            string strategyName;
            string buttonLabel;
            
            if(ParseMacroLine(line, strategyName, buttonLabel))
            {
                if(ValidateMacroDefinition(strategyName, buttonLabel))
                {
                    CMacroDefinition* macro = new CMacroDefinition(strategyName, buttonLabel);
                    macros.Add(macro);
                    
                    Print("Added macro: Strategy=", strategyName, ", Label=", buttonLabel);
                }
                else
                {
                    Print("Invalid macro definition: ", line);
                }
            }
        }
    }
}

bool CMacroParser::IsMacroSection(const string& line) const
{
    return StringCompare(line, "Macros:", false) == 0;
}

bool CMacroParser::IsEndMacros(const string& line) const
{
    return StringCompare(line, "EndMacros", false) == 0;
}

bool CMacroParser::ParseMacroLine(const string& line, string& strategyName, string& buttonLabel) const
{
    string name;
    string params[];
    
    CParserHelper::ExtractNameAndParameters(line, name, params);
    
    if(name == "" || ArraySize(params) != 1)
        return false;
        
    strategyName = name;
    buttonLabel = params[0];
    return true;
}

bool CMacroParser::ValidateMacroDefinition(const string& strategyName, const string& buttonLabel) const
{
    // Strategie-Name darf nicht leer sein
    if(strategyName == "")
        return false;
        
    // Button-Label darf nicht leer sein
    if(buttonLabel == "")
        return false;
        
    // Button-Label sollte keine Sonderzeichen enthalten
    // (hier könnte man noch weitere Validierungen hinzufügen)
    if(StringFind(buttonLabel, "[") != -1 || 
       StringFind(buttonLabel, "]") != -1 ||
       StringFind(buttonLabel, "{") != -1 || 
       StringFind(buttonLabel, "}") != -1)
        return false;
        
    return true;
}

#endif


