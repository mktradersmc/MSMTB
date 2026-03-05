//+------------------------------------------------------------------+
//| PROCESS MESSAGE (Command Pattern)                                |
//+------------------------------------------------------------------+
void CTradingExpert::ProcessSingleMessage(CJAVal &msg, CJAVal &outputArray)
{
    string response = m_cmdManager.Dispatch(msg);
    
    // Parse response to check for "status"
    CJAVal respJson;
    if(respJson.Deserialize(response)) {
        string type = respJson["header"]["command"].ToStr(); 
        string payload = respJson["payload"].Serialize();
        m_wsClient.Send(type, payload);
    }
}
