//+------------------------------------------------------------------+
//|                                                   TestParsing.mq5|
//|                        Copyright 2026, MetaQuotes Software Corp. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, MetaQuotes Software Corp."
#property link      "https://www.mql5.com"
#property version   "1.00"

#include <JAson.mqh>

//+------------------------------------------------------------------+
//| Script program start function                                    |
//+------------------------------------------------------------------+
void OnStart()
{
   Print("--- TEST START ---");
   
   // CASE 1: Normal JSON Object
   string msg1 = "{\"type\":\"CMD_PING\",\"botId\":\"123\"}";
   Print("MSG 1: ", msg1);
   
   CJAVal json1;
   if(json1.Deserialize(msg1)) {
       string type = json1["type"].ToStr();
       Print("MSG 1 Type: '", type, "'");
       if (type == "") Print("MSG 1 Type is EMPTY!");
   } else {
       Print("MSG 1 Deserialize Failed");
   }
   
   // CASE 2: JSON String (Double Serialized)
   string msg2 = "\"{\\\"type\\\":\\\"CMD_PING\\\",\\\"botId\\\":\\\"123\\\"}\"";
   Print("MSG 2: ", msg2);
   
   CJAVal json2;
   if(json2.Deserialize(msg2)) {
       string type = json2["type"].ToStr();
       Print("MSG 2 Type: '", type, "'");
       if (type == "") {
           Print("MSG 2 Type is EMPTY! Dump: ", json2.Serialize());
           
           // It's a string. Attempt recursive deserialize.
           string inner = json2.ToStr();
            Print("MSG 2 Inner Content: ", inner);
            
            CJAVal jsonInner;
            if (jsonInner.Deserialize(inner)) {
                 Print("MSG 2 Inner Type: '", jsonInner["type"].ToStr(), "'");
            }
       }
   } else {
       Print("MSG 2 Deserialize Failed");
   }
   
   Print("--- TEST END ---");
}
