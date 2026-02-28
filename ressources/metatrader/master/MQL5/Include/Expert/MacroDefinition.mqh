//+------------------------------------------------------------------+
//|                                              MacroDefinition.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef MACRO_DEFINITION_MQH
#define MACRO_DEFINITION_MQH

#include <Object.mqh>

class CMacroDefinition : public CObject
{
private:
    string m_strategyName;  // Name der Strategie, die als Makro verfügbar sein soll
    string m_buttonLabel;   // Label für den UI-Button
    
public:
    CMacroDefinition(const string& strategyName, const string& buttonLabel)
        : m_strategyName(strategyName), m_buttonLabel(buttonLabel) {}
    
    string GetStrategyName() const { return m_strategyName; }
    string GetButtonLabel() const { return m_buttonLabel; }
    
    string ToString() const
    {
        return StringFormat("Macro: Strategy=%s, Label=%s", 
            m_strategyName, m_buttonLabel);
    }
};

#endif
