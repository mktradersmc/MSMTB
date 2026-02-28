//+------------------------------------------------------------------+
//|                                               ModuleTypes.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef MODULE_TYPES_MQH
#define MODULE_TYPES_MQH

#include <Arrays/ArrayString.mqh>

#define MODULE_TYPE_SETUP "Setup"
#define MODULE_TYPE_ENTRY "Entry"
#define MODULE_TYPE_INVALIDATION "Invalidation"

class CModuleTypes
{
private:
    static CArrayString* m_moduleTypes;
    static bool m_initialized;
    
    static void Initialize()
    {
        if(!m_initialized)
        {
            m_moduleTypes = new CArrayString();
            m_moduleTypes.Add(MODULE_TYPE_SETUP);
            m_moduleTypes.Add(MODULE_TYPE_ENTRY);
            m_moduleTypes.Add(MODULE_TYPE_INVALIDATION);
            m_initialized = true;
        }
    }

public:
    static string GetModuleType(const int index)
    {
        Initialize();
        if(index >= 0 && index < m_moduleTypes.Total())
            return m_moduleTypes.At(index);
        return "";
    }
    
    static int GetModuleTypeCount()
    {
        Initialize();
        return m_moduleTypes.Total();
    }
    
    static bool IsValidModuleType(const string type)
    {
        Initialize();
        for(int i = 0; i < m_moduleTypes.Total(); i++)
        {
            if(m_moduleTypes.At(i) == type)
                return true;
        }
        return false;
    }
    
    static void Cleanup()
    {
        if(m_moduleTypes != NULL)
        {
            delete m_moduleTypes;
            m_moduleTypes = NULL;
            m_initialized = false;
        }
    }
};

// Statische Member initialisieren
CArrayString* CModuleTypes::m_moduleTypes = NULL;
bool CModuleTypes::m_initialized = false;

#endif
