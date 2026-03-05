//+------------------------------------------------------------------+
//|                                                 CBaseCommand.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#ifndef CBASE_COMMAND_MQH
#define CBASE_COMMAND_MQH

#include <Object.mqh>
#include <JAson.mqh>

class CBaseCommand : public CObject
{
protected:
   CJAVal            *m_payload;
   CJAVal            m_response;
   string            m_error;

public:
                     CBaseCommand() : m_payload(NULL) {}
                    ~CBaseCommand() {}

   virtual string    Name() = 0;
   
   virtual bool      Execute(CJAVal *payload, CJAVal &responsePayload) = 0;

   // Helper: Validate required fields
   bool Validate(string field, CJAVal *data)
   {
      if(data == NULL || !data.HasKey(field))
      {
         m_error = "Missing field: " + field;
         return false;
      }
      return true;
   }
   
   string GetError() { return m_error; }
   
   // Helpers for safely extracting data
   double GetDouble(CJAVal *data, string key, double def=0.0)
   {
      if(!data.HasKey(key)) return def;
      return data[key].ToDbl();
   }
   
   long GetLong(CJAVal *data, string key, long def=0)
   {
      if(!data.HasKey(key)) return def;
      return data[key].ToInt();
   }
   
   string GetString(CJAVal *data, string key, string def="")
   {
      if(!data.HasKey(key)) return def;
      return data[key].ToStr();
   }
};

#endif
