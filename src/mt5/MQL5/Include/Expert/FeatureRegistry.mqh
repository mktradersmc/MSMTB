//+------------------------------------------------------------------+
//|                                             FeatureRegistry.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef FEATURE_REGISTRY_MQH
#define FEATURE_REGISTRY_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\Feature.mqh>
#include <Expert\LogManager.mqh>

class CFeatureRegistry 
{
private:
    static CFeatureRegistry* s_instance;
    CArrayObj* m_featureTypes;  // Prototypen für Event-Mapping
    
    CFeatureRegistry() {
        m_featureTypes = new CArrayObj();
    }
    
public:
    static CFeatureRegistry* GetInstance();
    static void DeleteInstance();
    void RegisterFeatureType(CFeature* prototype);
    string FindFeatureNameForEvent(string eventName);
    void GetRequiredEvents(const string featureName, ENUM_EVENT_TYPE& events[]);
    void GetCorrelatedEvents(const string featureName, ENUM_EVENT_TYPE& events[]);
};

CFeatureRegistry* CFeatureRegistry::s_instance = NULL;

CFeatureRegistry* CFeatureRegistry::GetInstance() {
    if(s_instance == NULL)
        s_instance = new CFeatureRegistry();
    return s_instance;
}

void CFeatureRegistry::DeleteInstance() {
    if(CheckPointer(s_instance) == POINTER_DYNAMIC) {
        delete s_instance;
        s_instance = NULL;
    }
}

void CFeatureRegistry::RegisterFeatureType(CFeature* prototype) {
    if(prototype != NULL)
        m_featureTypes.Add(prototype);
}

string CFeatureRegistry::FindFeatureNameForEvent(string eventName) {
    for(int i = 0; i < m_featureTypes.Total(); i++) {
        CFeature* prototype = m_featureTypes.At(i);
        ENUM_EVENT_TYPE supportedTypes[];
        prototype.GetSupportedEventTypes(supportedTypes);
        
        for(int j = 0; j < ArraySize(supportedTypes); j++) {
            if(EnumToString(supportedTypes[j]) == eventName)
                return prototype.GetName();
        }
    }
    return "";
}

void CFeatureRegistry::GetRequiredEvents(const string featureName, ENUM_EVENT_TYPE& events[]) {
    for(int i = 0; i < m_featureTypes.Total(); i++) {
        CFeature* prototype = m_featureTypes.At(i);
        if(prototype.GetName() == featureName) {
            prototype.GetRequiredEventTypes(events);
            break;
        }
    }
}

void CFeatureRegistry::GetCorrelatedEvents(const string featureName, ENUM_EVENT_TYPE& events[]) {
    for(int i = 0; i < m_featureTypes.Total(); i++) {
        CFeature* prototype = m_featureTypes.At(i);
        if(prototype.GetName() == featureName) {
            prototype.GetRequiredCorrelatedEventTypes(events);
            break;
        }
    }
}
#endif


