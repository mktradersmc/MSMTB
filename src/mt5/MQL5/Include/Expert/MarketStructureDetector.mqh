//+------------------------------------------------------------------+
//|                                   MarketStructureDetector.mqh    |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MARKET_STRUCTURE_DETECTOR_MQH
#define MARKET_STRUCTURE_DETECTOR_MQH

#include <Expert\Feature.mqh>
#include <Expert\Event.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\MarketStructureEvent.mqh>
#include <Expert\HighLowBrokenEvent.mqh>
#include <Expert\EnvironmentManager.mqh>
#include <Expert\Globals.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Arrays\ArrayString.mqh>

input bool ShowMarketStructure = false; // Zeichnen der BOS und Chochs
class CMarketStructureDetector : public CFeature {
private:
   int m_operationalState;  // 1 = bullish, -1 = bearish, 0 = initial
   int m_lastProcessedEventId;
   int m_lastProcessedCorrelatedEventId;
   
   CArrayString* m_visibleLines;  // Speichert die gezeichneten Linien
   
   void ProcessHighLowBreakEvent(CHighLowBrokenEvent* event);
   void ProcessSymbolEvents(string symbol, string otherSymbol, int& lastProcessedId);
   void DrawStructureBreak(CHighLow* highLow, CCandle* breakCandle, ENUM_MARKET_DIRECTION direction);
   string CreateLineName(CHighLow* highLow, CCandle* breakCandle, int timeframe);
   void ClearChartObjects();
   void ManageChartObjects();

public:
   CMarketStructureDetector();
   ~CMarketStructureDetector();
   
   virtual void Update(CCandle* candle) override;
   virtual void ProcessEvents() override;
   virtual string GetName() override;
   virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
   virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
   virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
   virtual void GetRequiredTimeframes(int& timeframes[]) override;
   virtual void Initialize() override;
   virtual void Deinitialize() override;
};

CMarketStructureDetector::CMarketStructureDetector() 
   : m_operationalState(0), m_lastProcessedEventId(0), m_lastProcessedCorrelatedEventId(0) {
   m_visibleLines = new CArrayString();
}

CMarketStructureDetector::~CMarketStructureDetector() {
   delete m_visibleLines;
   ClearChartObjects();
}

string CMarketStructureDetector::CreateLineName(CHighLow* highLow, CCandle* breakCandle, int timeframe) {
   return StringFormat("MS_%d_%d_%d_%d", timeframe, highLow.getId(), breakCandle.id, breakCandle.timeframe);
}

void CMarketStructureDetector::DrawStructureBreak(CHighLow* highLow, CCandle* breakCandle, ENUM_MARKET_DIRECTION direction) {
   if(!ShowMarketStructure) return;

   // Nur zeichnen, wenn das Timeframe des Events mit dem Chart-Timeframe übereinstimmt
   if(highLow.getSwingCandle().timeframe != Period()) return;
   if(breakCandle.timeframe != Period()) return;

   color lineColor = (direction == MARKET_DIRECTION_BULLISH) ? clrGreen : clrRed;
   double price = highLow.isHigh() ? highLow.getSwingCandle().high : highLow.getSwingCandle().low;
   
   string lineName = CreateLineName(highLow, breakCandle, Period());
   
   if(ObjectFind(0, lineName) >= 0) {
       ObjectDelete(0, lineName);
   }
   
   if(!ObjectCreate(0, lineName, OBJ_TREND, 0,
       highLow.getSwingCandle().openTime, price,
       breakCandle.openTime, price)) {
       Print("Failed to create object: ", GetLastError());
       return;
   }
       
   ObjectSetInteger(0, lineName, OBJPROP_COLOR, lineColor);
   ObjectSetInteger(0, lineName, OBJPROP_STYLE, highLow.IsStructural()?STYLE_SOLID:STYLE_DASH);
   ObjectSetInteger(0, lineName, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, lineName, OBJPROP_RAY_RIGHT, false);
   ObjectSetInteger(0, lineName, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, lineName, OBJPROP_HIDDEN, true);
   ObjectSetInteger(0, lineName, OBJPROP_BACK, false);
   
   m_visibleLines.Add(lineName);
   ChartRedraw(0);
}

void CMarketStructureDetector::ClearChartObjects() {
   int timeframes[];
   CEnvironmentManager::GetInstance().GetActiveTimeframes(timeframes);

   for(int i = 0; i < ArraySize(timeframes); i++) {
       int obj_total = ObjectsTotal(0, -1, timeframes[i]);
       for(int j = obj_total - 1; j >= 0; j--) {
           string name = ObjectName(0, j, -1, timeframes[i]);
           if(StringFind(name, "MS_") == 0) {
               ObjectDelete(0, name);
           }
       }
   }
   ChartRedraw(0);
}

void CMarketStructureDetector::ManageChartObjects() {
   int timeframes[];
   CEnvironmentManager::GetInstance().GetActiveTimeframes(timeframes);
   
   for(int i = m_visibleLines.Total() - 1; i >= 0; i--) {
       string lineName = m_visibleLines.At(i);
       bool found = false;
       
       for(int tf = 0; tf < ArraySize(timeframes) && !found; tf++) {
           if(ObjectFind(0, lineName) >= 0) {
               found = true;
           }
       }
       
       if(!found) {
           m_visibleLines.Delete(i);
       }
   }
}

void CMarketStructureDetector::ProcessEvents() {
   ProcessSymbolEvents(_Symbol, CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol), m_lastProcessedEventId);

   if(ShowMarketStructure) {
       ManageChartObjects();
   }
}

void CMarketStructureDetector::ProcessHighLowBreakEvent(CHighLowBrokenEvent* event) {
   CHighLow* brokenLevel = event.GetHighLow();
   ENUM_EVENT_TYPE structureEventType;
   ENUM_MARKET_DIRECTION direction;
   
   // Strukturbrüche sind nur dann valide, wenn der Bruch auf demselben Timeframe wie das HighLow stattfindet
   if (event.GetBreakerCandle().timeframe != brokenLevel.getSwingCandle().timeframe)
       return;
       
   if(brokenLevel.isHigh()) {
       direction = MARKET_DIRECTION_BULLISH;
       structureEventType = (m_operationalState < 0) ? 
           EV_MARKET_STRUCTURE_CHOCH : EV_MARKET_STRUCTURE_BOS;
       m_operationalState = 1;
   }
   else {
       direction = MARKET_DIRECTION_BEARISH;
       structureEventType = (m_operationalState > 0) ? 
           EV_MARKET_STRUCTURE_CHOCH : EV_MARKET_STRUCTURE_BOS;
       m_operationalState = -1;
   }
   
   CMarketStructureEvent* msEvent = new CMarketStructureEvent(
       event.getSymbol(),
       structureEventType,
       brokenLevel,
       event.GetBreakerCandle(),
       direction);
       
   CEventStore::GetInstance(event.getSymbol()).AddEvent(msEvent);
   
   DrawStructureBreak(brokenLevel, event.GetBreakerCandle(), direction);
}

void CMarketStructureDetector::Update(CCandle* candle) {}

void CMarketStructureDetector::ProcessSymbolEvents(string symbol, string otherSymbol, int& lastProcessedId) {
   CEvent* newEvents[];
   int count = CEventStore::GetInstance(symbol).GetNewEvents(lastProcessedId, newEvents);
      
   for(int i = 0; i < count; i++) {
       CEvent* event = newEvents[i];
       
       if(event.getEventType() == EV_HIGH_BROKEN || 
          event.getEventType() == EV_LOW_BROKEN) {
           ProcessHighLowBreakEvent((CHighLowBrokenEvent*)event);
       }
       
       lastProcessedId = newEvents[i].id;
   }
}

string CMarketStructureDetector::GetName() {
   return "MarketStructureDetector";
}

void CMarketStructureDetector::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
   ArrayResize(eventTypes, 2);
   eventTypes[0] = EV_MARKET_STRUCTURE_BOS;
   eventTypes[1] = EV_MARKET_STRUCTURE_CHOCH;
}

void CMarketStructureDetector::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
   ArrayResize(eventTypes, 2);
   eventTypes[0] = EV_HIGH_BROKEN;
   eventTypes[1] = EV_LOW_BROKEN;
}

void CMarketStructureDetector::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
  ArrayResize(eventTypes, 0);
}

void CMarketStructureDetector::GetRequiredTimeframes(int& timeframes[]) {
  ArrayResize(timeframes, 0);
}

void CMarketStructureDetector::Initialize() {
   m_operationalState = 0;
   if(ShowMarketStructure) {
       ClearChartObjects();
   }
}

void CMarketStructureDetector::Deinitialize() {
   if(ShowMarketStructure) {
       ClearChartObjects();
   }
}

#endif


