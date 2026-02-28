#ifndef SESSION_PARSER_MQH
#define SESSION_PARSER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\SessionDefinition.mqh>
#include <Expert\ParserHelper.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\EnvironmentManager.mqh>

class CSessionParser : public CObject
{
private:
    static bool IsValidGMTUTCFormat(const string timezone, int& offset);
    static bool IsValidTimeZoneIdentifier(const string identifier);
    static int TimeStringToMinutes(const string timeStr);
    static ENUM_SESSION_TYPE ParseSessionType(const string typeStr);
    static void ValidateAndAddSession(CSessionDefinition* session, CArrayObj* sessions);
    static bool ValidateSession(const CSessionDefinition* session);

public:
    void Parse(const string content, CArrayObj* sessions);
};

void CSessionParser::Parse(const string content, CArrayObj* sessions)
{
    string lines[];
    CParserHelper::SplitLines(content, lines);
    
    CSessionDefinition* currentSession = NULL;
    
    for(int i = 0; i < ArraySize(lines); i++)
    {
        string line = CParserHelper::TrimString(lines[i]);
        if(line == "" || line == "EndSession") 
        {
            if(currentSession != NULL)
            {
                ValidateAndAddSession(currentSession, sessions);
                currentSession = NULL;
            }
            continue;
        }
        
        if(StringFind(line, "Session:") == 0)
        {
            if(currentSession != NULL)
            {
                ValidateAndAddSession(currentSession, sessions);
            }
            
            string name;
            string params[];
            CParserHelper::ExtractNameAndParameters(line, name, params);
            
            currentSession = new CSessionDefinition();
            currentSession.SetId(name);
            
            // Parse timezone parameter
            if(ArraySize(params) > 0)
            {
                currentSession.SetTimezone(params[0]);  // Übernehme den Timezone-String direkt
            }
        }
        else if(currentSession != NULL)
        {
            if(StringFind(line, "Name:") == 0)
            {
                string params[];
                CParserHelper::ExtractParameters(line, params);
                if(ArraySize(params) > 0)
                {
                    currentSession.SetName(params[0]);
                }
            }
            else if(StringFind(line, "Start:") == 0)
            {
                string params[];
                CParserHelper::ExtractParameters(line, params);
                if(ArraySize(params) > 0)
                {
                    currentSession.SetStartTime(TimeStringToMinutes(params[0]));
                }
            }
            else if(StringFind(line, "End:") == 0)
            {
                string params[];
                CParserHelper::ExtractParameters(line, params);
                if(ArraySize(params) > 0)
                {
                    currentSession.SetEndTime(TimeStringToMinutes(params[0]));
                }
            }
            else if(StringFind(line, "Type:") == 0)
            {
                string params[];
                CParserHelper::ExtractParameters(line, params);
                if(ArraySize(params) > 0)
                {
                    currentSession.SetType(ParseSessionType(params[0]));
                }
            }
        }
    }
    
    // Verarbeite die letzte Session
    if(currentSession != NULL)
    {
        ValidateAndAddSession(currentSession, sessions);
    }
}

bool CSessionParser::IsValidGMTUTCFormat(const string timezone, int& offset)
{
    // Prüft Format: "GMT+X", "GMT-X", "UTC+X" oder "UTC-X"
    if(StringLen(timezone) < 4) return false;
    
    string prefix = StringSubstr(timezone, 0, 3);
    if(prefix != "GMT" && prefix != "UTC") return false;
    
    string offsetStr = StringSubstr(timezone, 3);
    offset = (int)StringToInteger(offsetStr);
    
    // Prüfe ob Offset im gültigen Bereich liegt
    return (offset >= -12 && offset <= 14);
}

bool CSessionParser::IsValidTimeZoneIdentifier(const string identifier)
{
    // Prüft ob die TimeZone ID in der Environment-Konfiguration existiert
    // Dies machen wir, indem wir versuchen für das aktuelle Datum einen Offset zu bekommen
    int offset = CEnvironmentManager::GetInstance().GetUTCOffset(identifier, TimeCurrent());
    return (offset >= -12 && offset <= 14); // Wenn der Offset im gültigen Bereich liegt, existiert die ID
}

int CSessionParser::TimeStringToMinutes(const string timeStr)
{
    string parts[];
    StringSplit(timeStr, ':', parts);
    
    if(ArraySize(parts) == 2)
    {
        int hours = (int)StringToInteger(parts[0]);
        int minutes = (int)StringToInteger(parts[1]);
        return hours * 60 + minutes;
    }
    
    return 0;
}

ENUM_SESSION_TYPE CSessionParser::ParseSessionType(const string typeStr)
{
    if(typeStr == "TRADING") return SESSION_TYPE_TRADING;
    if(typeStr == "LIQUIDITY") return SESSION_TYPE_LIQUIDITY;
    
    return SESSION_TYPE_TRADING;  // Default
}

void CSessionParser::ValidateAndAddSession(CSessionDefinition* session, CArrayObj* sessions)
{
    if(ValidateSession(session))
    {
        CLogManager::GetInstance().LogMessage("CSessionParser::ValidateAndAddSession", LL_INFO,
            StringFormat("Loaded Session-Definition: %s", session.ToString()));
        sessions.Add(session);
    }
    else
    {
        CLogManager::GetInstance().LogMessage("CSessionParser::ValidateAndAddSession", LL_ERROR,
            StringFormat("Invalid session configuration: %s", session.ToString()));
        delete session;
    }
}

bool CSessionParser::ValidateSession(const CSessionDefinition* session)
{
    if(session == NULL) return false;
    
    // Überprüfe grundlegende Anforderungen
    if(session.GetId() == "") 
    {
        CLogManager::GetInstance().LogMessage("CSessionParser::ValidateSession",LL_DEBUG,"ID ist leer");
        return false;
    }
    
    // Prüfe Start- und Endzeit
    if(session.GetStartTime() < 0 || session.GetStartTime() >= 1440)
    {
        CLogManager::GetInstance().LogMessage("CSessionParser::ValidateSession",LL_DEBUG,
            StringFormat("Ungültige Startzeit: %d", session.GetStartTime()));
        return false;
    }
    
    if(session.GetEndTime() < 0 || session.GetEndTime() > 1440)
    {
        CLogManager::GetInstance().LogMessage("CSessionParser::ValidateSession",LL_DEBUG,
            StringFormat("Ungültige Endzeit: %d", session.GetEndTime()));
        return false;
    }
    
    // Prüfe Timezone
    string timezone = session.GetTimezone();
    int offset = 0;
    
    if(timezone == "")
    {
        CLogManager::GetInstance().LogMessage("CSessionParser::ValidateSession",LL_DEBUG,"Keine Zeitzone angegeben");
        return false;
    }
    
    // Prüfe ob es sich um eine UTC/GMT Angabe handelt
    if(!IsValidGMTUTCFormat(timezone, offset))
    {
        // Wenn nicht UTC/GMT, dann prüfe ob es ein gültiger Identifier ist
        if(!IsValidTimeZoneIdentifier(timezone))
        {
            CLogManager::GetInstance().LogMessage("CSessionParser::ValidateSession",LL_DEBUG,
                StringFormat("Ungültige Zeitzone: %s - Weder UTC/GMT Format noch gültiger Identifier", timezone));
            return false;
        }
    }
    
    return true;
}

#endif


