//+------------------------------------------------------------------+
//|                                              TradeReplicator.mqh |
//|                                   Copyright 2023, Michael Müller |
//+------------------------------------------------------------------+
#ifndef TRADE_REPLICATOR_MQH
#define TRADE_REPLICATOR_MQH

#include <Expert\AppClient.mqh>
#include <Expert\TradeManager.mqh>
#include <Expert\EnvironmentManager.mqh>
#include <Expert\TradeConverter.mqh>

class CTradeReplicator
{
private:
    static CTradeReplicator* m_instance;
    CTradeReplicator() {}
    
public:
    static CTradeReplicator* GetInstance()
    {
        if(m_instance == NULL) m_instance = new CTradeReplicator();
        return m_instance;
    }
    
    void Poll()
    {
        CJAVal messages;
        int count = CAppClient::GetInstance().GetMessages(messages);
        
        if(count > 0)
        {
            for(int i = 0; i < count; i++)
            {
                CJAVal *msg = messages[i];
                if(msg == NULL) continue;
                
                string type = msg["type"].ToStr();
                if(type == "ReplicateTrade")
                {
                    CJAVal *content = msg.HasKey("content");
                    if(content != NULL)
                    {
                        // Add symbol from message to content for easier processing
                        CJAVal tradeContent = *content;
                        tradeContent["symbol"] = msg["symbol"].ToStr();
                        ProcessReplicateTrade(tradeContent);
                    }
                }
            }
        }
    }
    
    void ProcessReplicateTrade(CJAVal &content)
    {
        string normalizedSymbol = content["symbol"].ToStr();
        string brokerSymbol = CEnvironmentManager::GetInstance().GetBrokerSymbol(normalizedSymbol);
        
        if(brokerSymbol == "" || brokerSymbol == NULL)
        {
            Print("Error: Could not map symbol ", normalizedSymbol, " to broker symbol.");
            return;
        }
        
        string direction = content["direction"].ToStr();
        string orderTypeString = content["orderType"].ToStr();
        double riskPercent = content["risk_percent"].ToDouble();
        string strategy = content["strategy"].ToStr();
        int magic = (int)content["magic"].ToInt();
        
        CJAVal *levels = content.HasKey("levels");
        if(levels == NULL) return;
        
        CJAVal *entryLvl = levels.HasKey("entry");
        CJAVal *slLvl = levels.HasKey("sl");
        CJAVal *tpLvl = levels.HasKey("tp");
        
        if(entryLvl == NULL || slLvl == NULL || tpLvl == NULL) return;
        
        double entryPrice = 0;
        double slPrice = 0;
        double tpPrice = 0;
        double rrValue = 0;
        
        // Entry
        if(entryLvl["type"].ToStr() == "MARKET")
        {
            entryPrice = 0; // Market order
        }
        else
        {
            entryPrice = CTradeConverter::LogicalToPrice(brokerSymbol, (ENUM_TIMEFRAMES)entryLvl["tf"].ToInt(), 
                                                        (datetime)entryLvl["time"].ToInt(), 
                                                        (int)entryLvl["idx"].ToInt(), direction, "ENTRY");
        }
        
        // Stop Loss
        if(slLvl["type"].ToStr() == "DYNAMIC_RR")
        {
            rrValue = slLvl["value"].ToDouble();
            slPrice = 0; 
        }
        else
        {
            slPrice = CTradeConverter::LogicalToPrice(brokerSymbol, (ENUM_TIMEFRAMES)slLvl["tf"].ToInt(), 
                                                     (datetime)slLvl["time"].ToInt(), 
                                                     (int)slLvl["idx"].ToInt(), direction, "SL");
        }
        
        // Take Profit
        if(tpLvl["type"].ToStr() == "DYNAMIC_RR")
        {
            rrValue = tpLvl["value"].ToDouble();
            tpPrice = 0;
        }
        else
        {
            tpPrice = CTradeConverter::LogicalToPrice(brokerSymbol, (ENUM_TIMEFRAMES)tpLvl["tf"].ToInt(), 
                                                     (datetime)tpLvl["time"].ToInt(), 
                                                     (int)tpLvl["idx"].ToInt(), direction, "TP");
        }
        
        if((entryPrice <= 0 && orderTypeString != "MARKET") || (slPrice <= 0 && rrValue <= 0))
        {
            Print("Error: Could not calculate prices for replicated trade on ", brokerSymbol);
            return;
        }
        
        Print("Executing replicated trade: ", brokerSymbol, " ", direction, " ", orderTypeString, 
              " Entry: ", entryPrice, " SL: ", slPrice, " TP: ", tpPrice, " RR: ", rrValue);
              
        bool isBuy = (direction == "BUY");
        bool isMarket = (orderTypeString == "MARKET");
        
        // Temporär Risk anpassen für diesen Trade (TradeManager nutzt risk_percentage)
        // Aber unser refaktoriertes CreateOrder kann customRiskPercentage vom Entry nehmen.
        // Wir brauchen also ein CEntry Objekt.
        
        CEntry* entry = new CEntry();
        entry.m_symbol = brokerSymbol;
        entry.direction = isBuy ? 1 : -1;
        entry.entryPrice = entryPrice;
        entry.stopLossPrice = slPrice;
        entry.takeProfitPrice = tpPrice;
        entry.riskRewardTarget = rrValue;
        entry.customRiskPercentage = riskPercent;
        entry.strategyName = strategy;
        
        CTradeManager::GetInstance().CreateOrder(brokerSymbol, isBuy, isMarket, entryPrice, slPrice, tpPrice, 
                                               rrValue, EV_EMPTY, strategy, entry);
                                               
        delete entry;
    }
};

CTradeReplicator* CTradeReplicator::m_instance = NULL;

#endif


