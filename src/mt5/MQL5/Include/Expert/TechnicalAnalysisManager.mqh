//+------------------------------------------------------------------+
//|                                          MarketCipherManager.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TECHNICAL_ANALYSIS_MANAGER_MQH
#define TECHNICAL_ANALYSIS_MANAGER_MQH

#include <Arrays/ArrayObj.mqh>
#include <Expert\ImbalanceDetector.mqh>
#include <Expert\HighLowDetector.mqh>
#include <Expert\Profiler.mqh>
#include <Expert\DivergenceMonitor.mqh>
#include <Expert\EnvironmentManager.mqh>
#include <Expert\ChartHelper.mqh>
#include <Expert\LogManager.mqh>

class CHighLowDetector;
class CPriceLevelManager;
class CImbalanceDetector;
class CMarketCipherManager;
class CDivergenceDetector;
class CTrendDetector;
class CMarketReversalDetector;

// CTechnicalAnalysisManager Class Definition
class CTechnicalAnalysisManager : public CObject
{
private:
   // Internal class to hold instance data
   class CInstanceData : public CObject
   {
   public:
      string symbol;
      CTechnicalAnalysisManager* instance;
      
      CInstanceData(string s, CTechnicalAnalysisManager* i) : symbol(s), instance(i) {}
   };

   static CArrayObj s_instances;
   string m_symbol;
   CMarketCipherManager* marketCipherManager;
   CHighLowDetector* highLowDetector;
   CImbalanceDetector* imbalanceDetector;
   CPriceLevelManager* priceLevelManager;
   CDivergenceDetector* divergenceDetector;
   CTrendDetector* trendDetector;
   CMarketReversalDetector* marketReversalDetector;
   
   // Private constructor
   CTechnicalAnalysisManager(string symbol);
   
   // Private method to find instance
   static CTechnicalAnalysisManager* FindInstance(string symbol);
   
public:
   ~CTechnicalAnalysisManager();
   
   // Static method to get or create an instance
   static CTechnicalAnalysisManager* GetInstance(string symbol);
   
   void OnInit();
   void OnNewDay();
   void OnNewChart(int timeframe);
   void Update(CCandle* candle);
   void ProcessEvents();
   CHighLow* GetNextHigherHigh(CCandle* candle, int timeframe);
   CHighLow* GetNextLowerLow(CCandle* candle, int timeframe);
   CImbalance* GetNextHigherImbalance(CCandle* candle, int timeframe);
   CImbalance* GetNextLowerImbalance(CCandle* candle, int timeframe);   
   CArrayObj* ImportCandleData();
};

// Initialize static member
CArrayObj CTechnicalAnalysisManager::s_instances;

// Implementation of GetInstance method
CTechnicalAnalysisManager* CTechnicalAnalysisManager::GetInstance(string symbol)
{
   CTechnicalAnalysisManager* instance = FindInstance(symbol);
   if (instance == NULL)
   {
      instance = new CTechnicalAnalysisManager(symbol);
      CInstanceData* data = new CInstanceData(symbol, instance);
      s_instances.Add(data);
      instance.OnInit();
   }
   return instance;
}

// Implementation of FindInstance method
CTechnicalAnalysisManager* CTechnicalAnalysisManager::FindInstance(string symbol)
{
   for(int i = 0; i < s_instances.Total(); i++)
   {
      CInstanceData* data = s_instances.At(i);
      if(data.symbol == symbol)
         return data.instance;
   }
   return NULL;
}

// Private constructor implementation
CTechnicalAnalysisManager::CTechnicalAnalysisManager(string symbol)
{
   m_symbol = symbol;
}

// Destructor implementation
CTechnicalAnalysisManager::~CTechnicalAnalysisManager() 
{  
}

void CTechnicalAnalysisManager::OnNewDay()
{
   if (m_symbol == _Symbol)
   {
      CDivergenceMonitor::GetInstance(m_symbol).ResetDivergences();
   }
}

void CTechnicalAnalysisManager::OnInit()
{
}

void CTechnicalAnalysisManager::OnNewChart(int timeframe)
{
   // Implementation here
}

void CTechnicalAnalysisManager::Update(CCandle* candle) {
   CArrayObj* features = CEnvironmentManager::GetInstance().GetFeaturesForSymbol(m_symbol);
   if(features != NULL) {
      for(int i = 0; i < features.Total(); i++) {
         CFeature* feature = features.At(i);
         if(feature.GetName() == "HTFReversalDetector")
         {
            CLogManager::GetInstance().LogMessage("CTechnicalAnalysisManager", LL_DEBUG, "Update() ruft HTFReversalDetector.Update() auf für " + CChartHelper::GetTimeframeName(candle.timeframe) + " Kerze: ID=" + IntegerToString(candle.id) + ", Time=" + TimeToString(candle.openTime));
         }
         feature.Update(candle);
      }
   }
   else
   {
      if(candle.timeframe == PERIOD_H1)
      {
         CLogManager::GetInstance().LogMessage("CTechnicalAnalysisManager", LL_INFO, "Update() für H1-Kerze (ID=" + IntegerToString(candle.id) + ") aber keine Features für Symbol " + m_symbol + " gefunden!");
      }
   }
}

void CTechnicalAnalysisManager::ProcessEvents()
{  
   CArrayObj* features = CEnvironmentManager::GetInstance().GetFeaturesForSymbol(m_symbol);
   if(features != NULL) {
       for(int i = 0; i < features.Total(); i++) {
           CFeature* feature = features.At(i);
           feature.ProcessEvents();
       }
   }
}

CHighLow* CTechnicalAnalysisManager::GetNextHigherHigh(CCandle* candle, int timeframe)
{
   CHighLowDetector* highLowDetector = (CHighLowDetector*)CEnvironmentManager::GetInstance().GetFeatureForSymbol(candle.symbol,"HighLowDetector");

   return highLowDetector.GetNextHigherHigh(candle, timeframe);
}

CHighLow* CTechnicalAnalysisManager::GetNextLowerLow(CCandle* candle, int timeframe)
{
   CHighLowDetector* highLowDetector = (CHighLowDetector*)CEnvironmentManager::GetInstance().GetFeatureForSymbol(candle.symbol,"HighLowDetector");

   return highLowDetector.GetNextLowerLow(candle, timeframe);
}

CImbalance* CTechnicalAnalysisManager::GetNextHigherImbalance(CCandle* candle, int timeframe)
{
   CImbalanceDetector* imbalanceDetector = (CImbalanceDetector*)CEnvironmentManager::GetInstance().GetFeatureForSymbol(candle.symbol,"ImbalanceDetector");

   return imbalanceDetector.GetNextHigherImbalance(candle, timeframe);
}

CImbalance* CTechnicalAnalysisManager::GetNextLowerImbalance(CCandle* candle, int timeframe)
{
   CImbalanceDetector* imbalanceDetector = (CImbalanceDetector*)CEnvironmentManager::GetInstance().GetFeatureForSymbol(candle.symbol,"ImbalanceDetector");

   return imbalanceDetector.GetNextLowerImbalance(candle, timeframe);
}

CArrayObj* CTechnicalAnalysisManager::ImportCandleData()
{
   CArrayObj* candles = new CArrayObj;
   int id = 0;
   string fileName = "NAS_M15.csv";  // File path to CSV file
   int fileHandle = FileOpen(fileName, FILE_CSV | FILE_READ, '\n');
   int lines = 0;
   if (fileHandle == INVALID_HANDLE)
   {
      Print("Error opening file: ", GetLastError());
      return NULL;
   }

   string line;
   while (!FileIsEnding(fileHandle))
   {
      line = FileReadString(fileHandle);

      if (lines > 0)
      {
         if (StringLen(line) > 0 && StringSubstr(line, 0, 1) != "#") // Skip comments and empty lines
         {
            string fields[];
            StringSplit(line, ';', fields);
                           
            if (ArraySize(fields) == 5)
            {
               datetime time = (datetime)StringToInteger(fields[0]);
                     
               double open = StringToDouble(fields[1]);
               double high = StringToDouble(fields[2]);
               double low = StringToDouble(fields[3]);
               double close = StringToDouble(fields[4]);
               
               CCandle* candle = new CCandle();
               candle.id = id++;
               candle.openTime = time;
               candle.open = open;
               candle.high = high;
               candle.low = low;
               candle.close = close;
               
               candles.Add(candle);
            }
         }         
      }
      lines++;
   }

   Print((lines-1) + " lines of News Events read from file " + fileName);
   FileClose(fileHandle);

   return candles;
}

#endif


