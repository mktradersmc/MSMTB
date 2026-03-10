//+------------------------------------------------------------------+
//|                                                 ChartCleanup.mqh |
//|                                        Copyright 2026, MSMTB     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, MSMTB"
#property strict

//+------------------------------------------------------------------+
//| Closes all charts that have NO Expert Advisor AND NO Indicators  |
//| attached. Prevents memory leaks and clutter from unused charts.  |
//+------------------------------------------------------------------+
void CleanupUnusedCharts()
{
   Print("[ChartCleanup] Starting cleanup of unused charts...");
   int closedCount = 0;
   
   long currChart = ChartFirst();
   while(currChart >= 0)
   {
      long nextChart = ChartNext(currChart);
      bool keepChart = false;
      
      // 1. Check for Expert Advisor
      string expertName = ChartGetString(currChart, CHART_EXPERT_NAME);
      if(expertName != "") 
      {
         keepChart = true;
      }
      else
      {
         // 2. Check for Indicators in all subwindows
         long subWindows = ChartGetInteger(currChart, CHART_WINDOWS_TOTAL);
         for(int w = 0; w < (int)subWindows; w++)
         {
            int indTotal = ChartIndicatorsTotal(currChart, w);
            if(indTotal > 0)
            {
               keepChart = true;
               break;
            }
         }
      }
      
      if(!keepChart)
      {
         Print("[ChartCleanup] Closing chart ID: ", currChart, " Symbol: ", ChartSymbol(currChart), " Period: ", EnumToString((ENUM_TIMEFRAMES)ChartPeriod(currChart)), " (No EA, No Indicators)");
         ChartClose(currChart);
         closedCount++;
      }
      
      currChart = nextChart;
   }
   
   Print("[ChartCleanup] Cleanup finished. Closed ", closedCount, " unused charts.");
}
