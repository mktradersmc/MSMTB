//+------------------------------------------------------------------+
//|                                                   CEventStore.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef EVENT_STORE_MQH
#define EVENT_STORE_MQH

#include <Expert\Event.mqh>
#include <Object.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Expert\LogManager.mqh>

// CEventStore Class Definition
class CEventStore : public CObject {
private:
    class CInstanceData : public CObject
    {
    public:
       string symbol;
       CEventStore* instance;
      
       CInstanceData(string s, CEventStore* i) : symbol(s), instance(i) {}
    };

    static CArrayObj s_instances;
    string m_symbol;
    CArrayObj events;
    ulong nextId;
    CEventStore(string symbol);
    static CEventStore* FindInstance(string symbol);
    
public:
    static CEventStore* GetInstance(string symbol);
    void AddEvent(CEvent* event);
    int GetLastEventId();
    int GetNewEvents(ulong lastKnownId, CEvent*& newEvents[]);
    int GetNewEventsByType(ulong lastKnownId, int eventType, CEvent*& newEvents[]);
    ulong GetLastEventIdByType(int eventType);
    ~CEventStore();
    static void Cleanup();
};

// Initialize static member
CArrayObj CEventStore::s_instances;

CEventStore::CEventStore(string symbol) : m_symbol(symbol),nextId(1) {}

// Implementation of GetInstance method
CEventStore* CEventStore::GetInstance(string symbol)
{
   CEventStore* instance = FindInstance(symbol);
   if (instance == NULL)
   {
      instance = new CEventStore(symbol);
      CInstanceData* data = new CInstanceData(symbol, instance);
      s_instances.Add(data);
   }
   return instance;
}

// Implementation of FindInstance method
CEventStore* CEventStore::FindInstance(string symbol)
{
   for(int i = 0; i < s_instances.Total(); i++)
   {
      CInstanceData* data = s_instances.At(i);
      if(data.symbol == symbol)
         return data.instance;
   }
   return NULL;
}

void CEventStore::AddEvent(CEvent* event) {
    event.id = nextId++;
    events.Add(event);
    CLogManager::GetInstance().LogMessage("CEventStore::AddEvent",LL_DEBUG,"Event added: "+event.toString());
}

int CEventStore::GetLastEventId() {
  return events.Total();
}

int CEventStore::GetNewEvents(ulong lastKnownId, CEvent*& newEvents[]) {
    int count = 0;
    for(int i = lastKnownId; i < events.Total(); i++) {
      CEvent* event = events.At(i);
      ArrayResize(newEvents, count + 1);
      newEvents[count] = event;
      count++;
    }
    return count;
}

int CEventStore::GetNewEventsByType(ulong lastKnownId, int eventType, CEvent*& newEvents[]) {
    int count = 0;
    for(int i = lastKnownId; i < events.Total(); i++) {
      CEvent* event = events.At(i);
      if(event.type == eventType) {
         ArrayResize(newEvents, count + 1);
         newEvents[count] = event;
         count++;
      }
    }
    return count;
}

ulong CEventStore::GetLastEventIdByType(int eventType) {
    for(int i = events.Total() - 1; i >= 0; i--) {
        CEvent* event = events.At(i);
        if(event.type == eventType) {
            return event.id;
        }
    }
    return 0; // Return 0 if no event of the specified type was found
}

CEventStore::~CEventStore() {
    // Free memory for events if necessary
    for(int i = 0; i < events.Total(); i++) {
        delete events.At(i);
    }
}

void CEventStore::Cleanup() {
    while (s_instances.Total()>0)
    {
        CEventStore* instance = s_instances.At(0);
        delete instance;
    }
}

#endif


