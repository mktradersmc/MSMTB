//+------------------------------------------------------------------+
//|                                                 UBCP_Structs.mqh |
//|                                                   Antigravity AI |
//|                                      Universal Binary Candle Protocol |
//+------------------------------------------------------------------+
#property copyright "Antigravity AI"
#property strict

struct UBCPHeader pack(1) {
   uchar    magic;      // 0xAF
   uchar    type;       // 1=Live, 2=History, 3=RawTick, 4=Control
   ushort   count;      // Number of blocks following header
   char     symbol[16]; // Null-terminated symbol name (v1.2: Extended to 16)
   uint     tf_sec;     // Timeframe in seconds (0 for Ticks)
   uint     request_id; // Added for Data Integrity (Task-0180)
};

struct UBCPControl pack(1) {
   uchar    action;     // 1=START_LIVE, 0=STOP_LIVE
   uchar    reserved[3]; // Padding
};

struct UBCPCandle pack(1) {
   long     time;       // Unix Timestamp in Seconds
   double   open;
   double   high;
   double   low;
   double   close;
   long     volume;     // int64 tick volume
};

struct UBCPLive pack(1) {
   double   bid;
   double   ask;
};

struct UBCPHistoryReq pack(1) {
   long     from_time;   // Start of Range (Unix Seconds)
   long     to_time;     // End of Range (Unix Seconds)
};

//+------------------------------------------------------------------+
