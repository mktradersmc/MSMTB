//+------------------------------------------------------------------+
//|                                           ValidationCondition.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef VALIDATION_CONDITION_MQH
#define VALIDATION_CONDITION_MQH

#include <Object.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\MarketConditionManager.mqh>

// Klasse für die Speicherung und Verwaltung einer Validierungsbedingung
class CValidationCondition : public CObject
{
private:
    string m_name;
    CArrayString* m_parameterNames;
    CArrayString* m_parameterValues;
    
public:
    CValidationCondition(const string& name);
    ~CValidationCondition();
    
    string GetName() const;
    void AddParameter(const string name, const string value);
    string GetParameter(const string name, const string defaultValue = "") const;
    void GetParameters(string& params[]) const;
    bool HasParameter(const string& name) const;
    bool Validate() const;
    string GetDetails() const;
    string GetDescription() const;
    string GetParameterString() const;
    CValidationCondition* Clone() const;
};

CValidationCondition::CValidationCondition(const string& name)
    : m_name(name)
{
    m_parameterNames = new CArrayString();
    m_parameterValues = new CArrayString();
}

CValidationCondition::~CValidationCondition()
{
    delete m_parameterNames;
    delete m_parameterValues;
}

string CValidationCondition::GetName() const 
{ 
    return m_name; 
}

void CValidationCondition::AddParameter(const string name, const string value)
{
    m_parameterNames.Add(name);
    m_parameterValues.Add(value);
}

string CValidationCondition::GetParameter(const string name, const string defaultValue = "") const
{
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        if(m_parameterNames.At(i) == name)
            return m_parameterValues.At(i);
    }
    return defaultValue;
}

void CValidationCondition::GetParameters(string& params[]) const
{
    int size = m_parameterNames.Total();
    ArrayResize(params, size);
    
    for(int i = 0; i < size; i++)
    {
        params[i] = m_parameterNames.At(i);
    }
}

bool CValidationCondition::HasParameter(const string& name) const
{
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        if(m_parameterNames.At(i) == name)
            return true;
    }
    return false;
}

bool CValidationCondition::Validate() const
{
    return CMarketConditionManager::GetInstance().ValidateCondition(m_name, GetParameterString());
}

string CValidationCondition::GetDetails() const
{
    return CMarketConditionManager::GetInstance().GetConditionDetails(m_name, GetParameterString());
}

string CValidationCondition::GetDescription() const
{
    return CMarketConditionManager::GetInstance().GetConditionDescription(m_name, GetParameterString());
}

string CValidationCondition::GetParameterString() const
{
    string result = "";
    
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        if(i > 0) result += " ";
        result += m_parameterNames.At(i) + ":" + m_parameterValues.At(i);
    }
    
    return result;
}

CValidationCondition* CValidationCondition::Clone() const
{
    CValidationCondition* clone = new CValidationCondition(m_name);
    
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        clone.AddParameter(m_parameterNames.At(i), m_parameterValues.At(i));
    }
    
    return clone;
}

#endif


