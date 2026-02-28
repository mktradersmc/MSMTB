//+------------------------------------------------------------------+
//|                                                TimeZoneCalendar.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TIMEZONE_CALENDAR_MQH
#define TIMEZONE_CALENDAR_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\Helper.mqh>
#include <Expert\LogManager.mqh>

// Struktur für einen Zeitzonen-Eintrag
class CTimeZoneEntry : public CObject
{
private:
    datetime m_startDate;  // Ab wann gilt diese Definition (inkl.)
    int      m_utcOffset;  // UTC Offset in Stunden

public:
    CTimeZoneEntry(datetime startDate, int utcOffset) 
        : m_startDate(startDate), m_utcOffset(utcOffset) {}
    
    datetime GetStartDate() const { return m_startDate; }
    int GetUTCOffset() const { return m_utcOffset; }
    
    virtual int Compare(const CObject* node, const int mode=0) const
    {
        const CTimeZoneEntry* other = (const CTimeZoneEntry*)node;
        if(m_startDate < other.GetStartDate()) return -1;
        if(m_startDate > other.GetStartDate()) return 1;
        return 0;
    }
};

// Klasse für die Verwaltung der Zeitzonen-Einträge pro Identifier
class CTimeZoneIdentifier : public CObject
{
private:
    string m_identifier;
    CArrayObj* m_entries;

public:
    CTimeZoneIdentifier(const string& identifier)
        : m_identifier(identifier)
    {
        m_entries = new CArrayObj();
    }
    
    ~CTimeZoneIdentifier()
    {
        if(m_entries != NULL)
        {
            delete m_entries;
        }
    }
    
    string GetIdentifier() const { return m_identifier; }
    
    void AddEntry(CTimeZoneEntry* entry)
    {
        m_entries.Add(entry);
        m_entries.Sort(); // Sortiere nach Datum
    }
    
    int GetUTCOffset(const datetime date) const
    {
        CTimeZoneEntry* lastValidEntry = NULL;
        
        for(int i = 0; i < m_entries.Total(); i++)
        {
            CTimeZoneEntry* entry = m_entries.At(i);
            if(entry.GetStartDate() <= date)
            {
                lastValidEntry = entry;
            }
            else
            {
                break;  // Da sortiert, können wir hier abbrechen
            }
        }
        
        if(lastValidEntry == NULL)
        {
            CLogManager::GetInstance().LogMessage("CTimeZoneIdentifier::GetUTCOffset", LL_ERROR,
                StringFormat("No timezone definition found for date: %s using identifier: %s", 
                    TimeToString(date), m_identifier));
            return 0;  // Fallback auf UTC
        }
        
        return lastValidEntry.GetUTCOffset();
    }
    
    virtual int Compare(const CObject* node, const int mode=0) const
    {
        const CTimeZoneIdentifier* other = (const CTimeZoneIdentifier*)node;
        return StringCompare(m_identifier, other.GetIdentifier());
    }
};

// Hauptklasse für die Kalenderverwaltung
class CTimeZoneCalendar : public CObject
{
private:
    CArrayObj* m_timezoneIdentifiers;  // Array von CTimeZoneIdentifier

public:
    CTimeZoneCalendar()
    {
        m_timezoneIdentifiers = new CArrayObj();
    }
    
    ~CTimeZoneCalendar()
    {
        if(m_timezoneIdentifiers != NULL)
        {
            delete m_timezoneIdentifiers;
        }
    }
    
    // Fügt einen neuen Zeitzonen-Eintrag hinzu
    void AddDefinition(const string& identifier, const datetime startDate, const int utcOffset)
    {
        CTimeZoneIdentifier* tzIdentifier = FindOrCreateIdentifier(identifier);
        CTimeZoneEntry* entry = new CTimeZoneEntry(startDate, utcOffset);
        tzIdentifier.AddEntry(entry);
    }
    
    // Gibt den UTC Offset für ein bestimmtes Datum zurück
    int GetUTCOffset(const string& identifier, const datetime date) const
    {
        CTimeZoneIdentifier* tzIdentifier = FindIdentifier(identifier);
        if(tzIdentifier == NULL)
        {
            CLogManager::GetInstance().LogMessage("CTimeZoneCalendar::GetUTCOffset", LL_ERROR,
                StringFormat("No timezone definitions found for identifier: %s", identifier));
            return 0;  // Fallback auf UTC
        }
        
        return tzIdentifier.GetUTCOffset(date);
    }
    
    // Parst einen Zeitzonen-String im Format "2024.03.10,UTC-4"
    bool ParseTimeZoneDefinition(const string& definition, datetime& outStartDate, int& outOffset) const
    {
        string parts[];
        if(StringSplit(definition, ',', parts) != 2)
        {
            CLogManager::GetInstance().LogMessage("CTimeZoneCalendar::ParseTimeZoneDefinition", LL_ERROR,
                StringFormat("Invalid timezone definition format: %s", definition));
            return false;
        }
        
        // Parse das Datum
        outStartDate = StringToTime(parts[0]);
        if(outStartDate == 0)
        {
            CLogManager::GetInstance().LogMessage("CTimeZoneCalendar::ParseTimeZoneDefinition", LL_ERROR,
                StringFormat("Invalid date format in timezone definition: %s", parts[0]));
            return false;
        }
        
        // Parse den UTC Offset
        string utcPart = parts[1];
        if(StringFind(utcPart, "UTC") != 0)
        {
            CLogManager::GetInstance().LogMessage("CTimeZoneCalendar::ParseTimeZoneDefinition", LL_ERROR,
                StringFormat("Invalid UTC format in timezone definition: %s", utcPart));
            return false;
        }
        
        string offsetStr = StringSubstr(utcPart, 3);
        outOffset = (int)StringToInteger(offsetStr);
        
        return true;
    }
    
    // Fügt mehrere Definitionen aus einem String hinzu (Format: "2024.03.10,UTC-4;2024.11.03,UTC-5")
    void AddDefinitions(const string& identifier, const string& definitions)
    {
        string entries[];
        int count = StringSplit(definitions, ';', entries);
        
        for(int i = 0; i < count; i++)
        {
            datetime startDate;
            int offset;
            
            if(ParseTimeZoneDefinition(entries[i], startDate, offset))
            {
                AddDefinition(identifier, startDate, offset);
            }
        }
    }

private:
    CTimeZoneIdentifier* FindIdentifier(const string& identifier) const
    {
        for(int i = 0; i < m_timezoneIdentifiers.Total(); i++)
        {
            CTimeZoneIdentifier* tzIdentifier = m_timezoneIdentifiers.At(i);
            if(tzIdentifier.GetIdentifier() == identifier)
            {
                return tzIdentifier;
            }
        }
        return NULL;
    }
    
    CTimeZoneIdentifier* FindOrCreateIdentifier(const string& identifier)
    {
        CTimeZoneIdentifier* tzIdentifier = FindIdentifier(identifier);
        if(tzIdentifier == NULL)
        {
            tzIdentifier = new CTimeZoneIdentifier(identifier);
            m_timezoneIdentifiers.Add(tzIdentifier);
            m_timezoneIdentifiers.Sort();  // Sortiere für schnellere Suche
        }
        return tzIdentifier;
    }
};

#endif


