//+------------------------------------------------------------------+
//|                                                 ConfigLoader.mqh |
//|                                  Antigravity Agentic Integration |
//+------------------------------------------------------------------+
#property copyright "Antigravity Agentic Integration"
#property strict

#include <Files\FileTxt.mqh>

struct BotConfig
{
   string botId;
   string wsUrl;
   string apiKey;
   string commMode;
   int    pollInterval;
   
   BotConfig() {
      botId = "";
      wsUrl = "ws://localhost:3000";
      apiKey = "";
      commMode = "PIPE";
      pollInterval = 1;
   }
};

class CConfigLoader
{
public:
   static bool LoadConfig(string fileName, BotConfig &config)
   {
      int handle = FileOpen(fileName, FILE_READ|FILE_TXT|FILE_ANSI);
      if (handle == INVALID_HANDLE) return false;
      
      while(!FileIsEnding(handle)) {
         string line = FileReadString(handle);
         ParseLine(line, config);
      }
      FileClose(handle);
      return true;
   }
   
private:
   static void ParseLine(string line, BotConfig &config)
   {
      int eq = StringFind(line, "=");
      if (eq > 0) {
         string key = StringSubstr(line, 0, eq);
         string val = StringSubstr(line, eq + 1);
         
         StringTrimLeft(key); StringTrimRight(key);
         StringTrimLeft(val); StringTrimRight(val);
         
         if (key == "botId") config.botId = val;
         else if (key == "ws_url") config.wsUrl = val;
         else if (key == "apiKey") config.apiKey = val;
         else if (key == "communicationMode") config.commMode = val;
         else if (key == "pollInterval") config.pollInterval = (int)StringToInteger(val);
      }
   }
};
