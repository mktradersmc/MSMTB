//+------------------------------------------------------------------+
//|                                             FeatureFactory.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef FEATURE_FACTORY_MQH
#define FEATURE_FACTORY_MQH

#include <Expert\Feature.mqh>
#include <Expert\HighLowDetector.mqh>
#include <Expert\ImbalanceDetector.mqh>
#include <Expert\MarketReversalDetector.mqh>
#include <Expert\MarketCipherManager.mqh>
#include <Expert\PriceLevelManager.mqh>
#include <Expert\DivergenceDetector.mqh>
#include <Expert\TrendDetector.mqh>
#include <Expert\MarketStructureDetector.mqh>
#include <Expert\PriceActionDetector.mqh>
#include <Expert\SupportResistanceDetector.mqh>
#include <Expert\HTFReversalDetector.mqh>

class CFeatureFactory
{
public:
    static CFeature* CreateFeature(const string featureName);
};

CFeature* CFeatureFactory::CreateFeature(const string featureName)
{
    CFeature* feature = NULL;
    
    if(featureName == "HighLowDetector")
        feature = new CHighLowDetector();
    else if(featureName == "ImbalanceDetector") 
        feature = new CImbalanceDetector();
    else if(featureName == "MarketReversalDetector")
        feature = new CMarketReversalDetector();
    else if(featureName == "MarketCipherManager")
        feature = new CMarketCipherManager();
    else if(featureName == "PriceLevelManager")
        feature = new CPriceLevelManager();
    else if(featureName == "DivergenceDetector")
        feature = new CDivergenceDetector();
    else if(featureName == "TrendDetector")
        feature = new CTrendDetector();
    else if(featureName == "MarketStructureDetector")
        feature = new CMarketStructureDetector();
    else if(featureName == "PriceActionDetector")  // Neue Bedingung
        feature = new CPriceActionDetector();
    else if(featureName == "SupportResistanceDetector")
        feature = new CSupportResistanceDetector();
    else if(featureName == "HTFReversalDetector")
        feature = new CHTFReversalDetector();
        
    if (feature == NULL)
    {
         CLogManager::GetInstance().LogMessage("CFeatureFactory::CreateFeature",LL_ERROR,featureName+" nicht in CFeatureFactory::CreateFeature hinterlegt");
    }
        
    return feature;
}

#endif

