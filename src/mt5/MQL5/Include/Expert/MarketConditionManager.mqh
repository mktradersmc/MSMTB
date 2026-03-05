//+------------------------------------------------------------------+
//|                                        MarketConditionManager.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef MARKET_CONDITION_MANAGER_MQH
#define MARKET_CONDITION_MQH

#include <Arrays/ArrayObj.mqh>
#include <Object.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\TrendDetector.mqh>
#include <Expert\DivergenceMonitor.mqh>
#include <Expert\EMAConditionProvider.mqh>
#include <Expert\IConditionProvider.mqh>

// Struktur für Provider-Registrierung
class CConditionRegistration : public CObject
{
public:
    string name;
    IConditionProvider* provider;
    
    CConditionRegistration(string conditionName, IConditionProvider* conditionProvider)
        : name(conditionName), provider(conditionProvider) {}
};

// Zentraler Condition Manager (Singleton)
class CMarketConditionManager
{
private:
    static CMarketConditionManager* s_instance;
    CArrayObj* m_registrations;
    
    CMarketConditionManager();
    
public:
    static CMarketConditionManager* GetInstance();
    ~CMarketConditionManager();
    
    void RegisterCondition(string name, IConditionProvider* provider);
    bool ValidateCondition(string condition, string paramString);
    string GetConditionDetails(string condition, string paramString);
    string GetConditionDescription(string condition, string paramString);
    void Init();
    
private:
    bool ParseParameters(string paramString, string& params[]);
    IConditionProvider* FindProvider(string conditionName);
};

// Implementierung CMarketConditionManager
CMarketConditionManager* CMarketConditionManager::s_instance = NULL;

CMarketConditionManager::CMarketConditionManager()
{
    m_registrations = new CArrayObj();
}

CMarketConditionManager::~CMarketConditionManager()
{
    if(m_registrations != NULL)
    {
        // Provider nicht löschen, da sie Singleton-Instanzen sind
        for(int i = 0; i < m_registrations.Total(); i++)
        {
            delete m_registrations.At(i);
        }
        delete m_registrations;
    }
}

CMarketConditionManager* CMarketConditionManager::GetInstance()
{
    if(s_instance == NULL)
        s_instance = new CMarketConditionManager();
    return s_instance;
}

void CMarketConditionManager::RegisterCondition(string name, IConditionProvider* provider)
{
    if(provider != NULL)
    {
        m_registrations.Add(new CConditionRegistration(name, provider));
    }
}

IConditionProvider* CMarketConditionManager::FindProvider(string conditionName)
{
    CLogManager::GetInstance().LogMessage("CMarketConditionManager::FindProvider",LL_DEBUG,"Look for ConditionProvider "+conditionName);
    for(int i = 0; i < m_registrations.Total(); i++)
    {
        CConditionRegistration* reg = m_registrations.At(i);
        if(reg.name == conditionName)
            return reg.provider;
    }
    return NULL;
}

bool CMarketConditionManager::ValidateCondition(string condition, string paramString)
{
    IConditionProvider* provider = FindProvider(condition);
    if(provider == NULL)
    {
        CLogManager::GetInstance().LogMessage("CMarketConditionManager::ValidateCondition",LL_DEBUG,"Warning: Unknown condition: "+ condition);
        return false;
    }
    
    string params[];
    if(!ParseParameters(paramString, params))
        return false;
        
    return provider.ValidateCondition(params);
}

string CMarketConditionManager::GetConditionDetails(string condition, string paramString)
{
    IConditionProvider* provider = FindProvider(condition);
    if(provider == NULL)
        return "Unknown condition";
        
    string params[];
    if(!ParseParameters(paramString, params))
        return "Invalid parameters";
        
    return provider.GetConditionDetails(params);
}


string CMarketConditionManager::GetConditionDescription(string condition, string paramString)
{
    IConditionProvider* provider = FindProvider(condition);
    if(provider == NULL)
        return "Unknown condition";
        
    string params[];
    if(!ParseParameters(paramString, params))
        return "Invalid parameters";
        
    return provider.GetConditionDescription(params);
}

void CMarketConditionManager::Init()
{
    // Die Provider sind bereits als Singleton implementiert
//    RegisterCondition("BIAS", CTrendDetector::GetInstance(_Symbol));
    RegisterCondition("DIVERGENCE", CDivergenceMonitor::GetInstance(_Symbol));
    RegisterCondition("EMA", CEMAConditionProvider::GetInstance(_Symbol));
}

bool CMarketConditionManager::ParseParameters(string paramString, string& params[])
{
    string parts[];
    StringSplit(paramString, ' ', parts);
    int paramCount = ArraySize(parts);
    
    if(paramCount == 0)
        return false;
    
    ArrayResize(params, paramCount);
    
    // Extrahiere die Werte aus den Parameter-Paaren
    for(int i = 0; i < paramCount; i++)
    {
        string paramParts[];
        if(StringSplit(parts[i], ':', paramParts) == 2)
        {
            params[i] = paramParts[1];
        }
        else
        {
            return false;
        }
    }
    
    return true;
}

#endif


