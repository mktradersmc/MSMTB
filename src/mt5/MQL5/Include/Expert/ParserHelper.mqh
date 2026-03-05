//+------------------------------------------------------------------+
//|                                                 ParserHelper.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef PARSER_HELPER_MQH
#define PARSER_HELPER_MQH

#include <Object.mqh>

class CParserHelper
{
public:
    // String-Splitting und Trimming
    static void SplitLines(const string& content, string &lines[]);
    static void Split(const string& content, const string& delimiter, string &parts[]);
    static string TrimString(const string& str);
    
    // Parameter-Extraktion
    static void ExtractNameAndParameters(const string& line, string& name, string& params[]);
    static string ExtractName(const string& line);
    static void ExtractParameters(const string& line, string& params[]);
    
    // Parameter-Validierung
    static bool ValidateParameterSyntax(const string& param);
    static bool HasParameters(const string& line);
    
    // Parameter-Platzhalter
    static string CreateParameterReference(const string& paramName);
    static bool IsParameterReference(const string& text);
    static string ExtractParameterName(const string& reference);
};

void CParserHelper::SplitLines(const string& content, string &lines[])
{
    Split(content, "\n", lines);
    
    // Trimme jede Zeile und entferne leere Zeilen
    int validLines = 0;
    for(int i = 0; i < ArraySize(lines); i++)
    {
        lines[i] = TrimString(lines[i]);
        if(lines[i] != "")
            validLines++;
    }
    
    // Entferne leere Zeilen
    if(validLines < ArraySize(lines))
    {
        string tempLines[];
        ArrayResize(tempLines, validLines);
        int j = 0;
        
        for(int i = 0; i < ArraySize(lines); i++)
        {
            if(lines[i] != "")
            {
                tempLines[j] = lines[i];
                j++;
            }
        }
        
        ArrayFree(lines);
        ArrayCopy(lines, tempLines);
    }
}

void CParserHelper::Split(const string& content, const string& delimiter, string &parts[])
{
    int start = 0;
    int end = StringFind(content, delimiter);
    
    while(end != -1)
    {
        ArrayResize(parts, ArraySize(parts) + 1);
        parts[ArraySize(parts) - 1] = StringSubstr(content, start, end - start);
        start = end + StringLen(delimiter);
        end = StringFind(content, delimiter, start);
    }
    
    // Füge den letzten Teil hinzu
    ArrayResize(parts, ArraySize(parts) + 1);
    parts[ArraySize(parts) - 1] = StringSubstr(content, start);
}

string CParserHelper::TrimString(const string& str)
{
    if(str == "") return "";
    
    int start = 0;
    int end = StringLen(str) - 1;
    
    // Finde Start (erstes Nicht-Whitespace-Zeichen)
    while(start <= end && StringGetCharacter(str, start) <= 32)
        start++;
        
    // Finde Ende (letztes Nicht-Whitespace-Zeichen)
    while(end >= start && StringGetCharacter(str, end) <= 32)
        end--;
        
    if(start > end) return "";
    
    return StringSubstr(str, start, end - start + 1);
}

void CParserHelper::ExtractNameAndParameters(const string& line, string& name, string& params[])
{
    name = ExtractName(line);
    ExtractParameters(line, params);
}

string CParserHelper::ExtractName(const string& line)
{
    int colonPos = StringFind(line, ":");
    int bracketPos = StringFind(line, "[");
    
    if(colonPos != -1)
    {
        string nameSection = StringSubstr(line, colonPos + 1);
        if(bracketPos != -1)
            nameSection = StringSubstr(nameSection, 0, bracketPos - colonPos - 1);
            
        return TrimString(nameSection);
    }
    
    return "";
}

void CParserHelper::ExtractParameters(const string& line,string& params[])
{
    int pos = 0;
    
    while(true)
    {
        int startPos = StringFind(line, "[", pos);
        if(startPos == -1) break;
        
        int endPos = StringFind(line, "]", startPos);
        if(endPos == -1) break;
        
        string param = TrimString(StringSubstr(line, startPos + 1, endPos - startPos - 1));
        if(ValidateParameterSyntax(param))
        {
            ArrayResize(params, ArraySize(params) + 1);
            params[ArraySize(params) - 1] = param;
        }
        
        pos = endPos + 1;
    }
}

bool CParserHelper::ValidateParameterSyntax(const string& param)
{
    if(param == "") return false;
    
    // Parameter sollte keine eckigen Klammern enthalten
    if(StringFind(param, "[") != -1 || StringFind(param, "]") != -1)
        return false;
        
    return true;
}

bool CParserHelper::HasParameters(const string& line)
{
    return StringFind(line, "[") != -1 && StringFind(line, "]") != -1;
}

string CParserHelper::CreateParameterReference(const string& paramName)
{
    return "${" + paramName + "}";
}

bool CParserHelper::IsParameterReference(const string& text)
{
    return StringFind(text, "${") != -1 && StringFind(text, "}") != -1;
}

string CParserHelper::ExtractParameterName(const string& reference)
{
    int startPos = StringFind(reference, "${");
    int endPos = StringFind(reference, "}");
    
    if(startPos != -1 && endPos != -1)
        return StringSubstr(reference, startPos + 2, endPos - startPos - 2);
        
    return "";
}

#endif
