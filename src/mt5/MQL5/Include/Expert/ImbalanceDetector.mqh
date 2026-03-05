#ifndef IMBALANCE_DETECTOR_MQH
#define IMBALANCE_DETECTOR_MQH

#include <Expert\ImbalanceCreatedEvent.mqh>
#include <Expert\ImbalanceStatusEvent.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\Imbalance.mqh>
#include <Expert\Candle.mqh>
#include <Expert\RBTree.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\Feature.mqh>

input group "Imbalance Detection"
input bool imbalance_active_inversions = true; /* Erkennung von Invertierungen aktivieren */
input bool imbalance_require_inversion_confirmation = true; /* 2-Kerzen-Bestätigung für Imbalance-Invertierung */
input int imbalance_inversion_confirmation_candles = 2; /* Anzahl Bestätigungskerzen für Invertierung */
input bool imbalance_disrespected_candle_outside = false; /* Imbalance missachtet erst wenn Kerze komplett außerhalb (aktuell fehlerhaft) */
input int imbalance_respect_offset = 2; /* Offset in Points für Imbalance Respektierung */

// CImbalanceTimeframeData Class Definition
class CImbalanceTimeframeData : public CObject
{
public:
    CRBTree* upperImbalanceTree;  // Enthält bearish Imbalances (oberhalb des Marktpreises)
    CRBTree* lowerImbalanceTree;  // Enthält bullish Imbalances (unterhalb des Marktpreises)
    CArrayObj* inactiveImbalances;

    CImbalanceTimeframeData();
    ~CImbalanceTimeframeData();
};

// CImbalanceDetector Class Definition
class CImbalanceDetector : public CFeature
{
private:
    CArrayObj* timeframeDataArray;
    int timeframes[];
    datetime m_currentDay;

    CImbalanceTimeframeData* GetOrCreateTimeframeData(int timeframe);
    CImbalanceTimeframeData* GetTimeframeData(int timeframe);
    void CheckForNewImbalance(CCandle* currentCandle, CImbalanceTimeframeData* data);
    void UpdateExistingImbalances(CCandle* currentCandle, CImbalanceTimeframeData* data);
    CArrayObj* FindAffectedImbalances(CCandle* candle, CImbalanceTimeframeData* data);
    void UpdateImbalanceState(CImbalance* imb, CCandle* current);
    CImbalance* addImbalance(int timeframe, CCandle* candle, double high, double low, ImbalanceType type);
    void DeactivateImbalance(CImbalance* imb, CImbalanceTimeframeData* data);
    void CheckNewDay(datetime date);
    void ProcessPotentialInversion(CImbalance* imb, CCandle* current, bool hasHitUnmitigatedLevel);
    void InvertImbalance(CImbalance* imb, CCandle* current, bool hasHitUnmitigatedLevel);

public:
    CImbalanceDetector();
    ~CImbalanceDetector();
    
    virtual void Update(CCandle* candle) override;
    virtual void ProcessEvents() override;
    virtual string GetName() override;
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredTimeframes(int& timeframes[]) override;
    virtual void Initialize() override;
    virtual void Deinitialize() override;

    CImbalance* GetNextHigherImbalance(CCandle* candle, int timeframe);
    CImbalance* GetNextLowerImbalance(CCandle* candle, int timeframe);
    CCandle* FindFirstBalancedCandle(CCandle* candle);    
    CArrayObj* GetInactiveImbalances(int timeframe);
    void LimitInactiveImbalances(int timeframe, int maxInactiveCount);
};

// CImbalanceTimeframeData Class Implementation
CImbalanceTimeframeData::CImbalanceTimeframeData()
{
    upperImbalanceTree = new CRBTree("imbalance_upper");
    lowerImbalanceTree = new CRBTree("imbalance_lower");
    inactiveImbalances = new CArrayObj();
}

CImbalanceTimeframeData::~CImbalanceTimeframeData()
{
    delete upperImbalanceTree;
    delete lowerImbalanceTree;
    delete inactiveImbalances;
}

// CImbalanceDetector Class Implementation
CImbalanceDetector::CImbalanceDetector()
{
    timeframeDataArray = new CArrayObj();
}

CImbalanceDetector::~CImbalanceDetector()
{
    for(int i = 0; i < timeframeDataArray.Total(); i++)
    {
        CImbalanceTimeframeData* data = timeframeDataArray.At(i);
        if(data != NULL)
        {
            delete data;
        }
    }
    delete timeframeDataArray;
}

void CImbalanceDetector::CheckNewDay(datetime date)
{
   if (m_currentDay != CHelper::NormalizeDate(date))
   {
       //Print(CHelper::TimeToString(CHelper::NormalizeDate(date)) + " Cleanup Imbalances from M1-M5");
       m_currentDay = CHelper::NormalizeDate(date);
       for (int i = 0; i < timeframeDataArray.Total(); i++)
       {
            CImbalanceTimeframeData* tfdata = timeframeDataArray.At(i);

            if (timeframes[i] <= PERIOD_M5)
            {
                delete tfdata.lowerImbalanceTree;
                tfdata.lowerImbalanceTree = new CRBTree("imbalance_lower");
                delete tfdata.upperImbalanceTree;
                tfdata.upperImbalanceTree = new CRBTree("imbalance_upper");
            }
       }
   }
}

string CImbalanceDetector::GetName() override {
   return "ImbalanceDetector";
}

void CImbalanceDetector::ProcessEvents() override
{
}

void CImbalanceDetector::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 12);
   eventTypes[0] = EV_IMBALANCE_CREATED;
   eventTypes[1] = EV_IMBALANCE_ENTERED;
   eventTypes[2] = EV_IMBALANCE_DEACTIVATED;
   eventTypes[3] = EV_IMBALANCE_LEFT;
   eventTypes[4] = EV_IMBALANCE_INVERTED;
   eventTypes[5] = EV_IMBALANCE_MITIGATED;
   eventTypes[6] = EV_INVERTED_IMBALANCE_ENTERED;
   eventTypes[7] = EV_INVERTED_IMBALANCE_LEFT;
   eventTypes[8] = EV_INVERTED_IMBALANCE_MITIGATED;
   eventTypes[9] = EV_IMBALANCE_DISRESPECTED;
   eventTypes[10] = EV_UNMITIGATED_IMBALANCE_ENTERED;
   eventTypes[11] = EV_UNMITIGATED_INVERTED_IMBALANCE_ENTERED;
}

void CImbalanceDetector::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CImbalanceDetector::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CImbalanceDetector::GetRequiredTimeframes(int& timeframes[]) override {
  ArrayResize(timeframes, 0);
}

void CImbalanceDetector::Initialize() override {
  // Initialisierung wird bereits im Konstruktor durchgeführt
}
  
void CImbalanceDetector::Deinitialize() override {
  // Cleanup wird bereits im Destruktor durchgeführt
}
    
void CImbalanceDetector::Update(CCandle* candle) override
{
    if (candle == NULL) return;
    
    uint startTime = GetTickCount();
    CheckNewDay(candle.openTime);
    uint checkNewDayTime = GetTickCount() - startTime;

    startTime = GetTickCount();
    CImbalanceTimeframeData* data = GetOrCreateTimeframeData(candle.timeframe);
    uint getDataTime = GetTickCount() - startTime;
    
    startTime = GetTickCount();
    CheckForNewImbalance(candle, data);
    uint checkNewImbalanceTime = GetTickCount() - startTime;

    startTime = GetTickCount();
    for (int i = 0; i < ArraySize(timeframes); i++)
    {    
        CImbalanceTimeframeData* tfData = GetTimeframeData(timeframes[i]);
        // Optimierung nur gegen dasselbe oder höhere Timeframes testen
        if (tfData != NULL && timeframes[i] >= candle.timeframe)
        {
            UpdateExistingImbalances(candle, tfData);
        }
    }
    uint updateExistingTime = GetTickCount() - startTime;
}

CImbalance* CImbalanceDetector::GetNextHigherImbalance(CCandle* candle, int timeframe)
{
    CImbalanceTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) return NULL;
    
    return (CImbalance*)data.upperImbalanceTree.FindNextHigher(candle.open);
}

CImbalance* CImbalanceDetector::GetNextLowerImbalance(CCandle* candle, int timeframe)
{
    CImbalanceTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) return NULL;
    
    return (CImbalance*)data.lowerImbalanceTree.FindNextLower(candle.open);
}

CCandle* CImbalanceDetector::FindFirstBalancedCandle(CCandle* candle)
{
    CBaseChart* chart = CChartManager::GetInstance().GetChart(candle.symbol, candle.timeframe);
    if (chart == NULL)
        return NULL;
        
    bool bullish = chart.getCandleById(candle.id - 1).isUpCandle();
    bool balanced = false;
    string message;
    
    message = "Imbalanced Candle: "+candle.toString();
    CLogManager::GetInstance().LogMessage("CImbalanceDetector::FindFirstBalancedCandle",LL_DEBUG,message);
    if (candle == NULL || candle.id < 3)
        return NULL;
        
    // Wir suchen rückwärts, beginnend von der aktuellen Kerze
    for (int i = candle.id - 1; i >= 2; i--)
    {
        CCandle* previousCandle = chart.getCandleById(i - 1);
        CCandle* nextCandle = chart.getCandleById(i + 1);
        
        message = "Previous Candle: "+previousCandle.toString();
        CLogManager::GetInstance().LogMessage("CImbalanceDetector::FindFirstBalancedCandle",LL_DEBUG,message);
        message = "Next Candle: "+nextCandle.toString();
        CLogManager::GetInstance().LogMessage("CImbalanceDetector::FindFirstBalancedCandle",LL_DEBUG,message);
        
        if (previousCandle == NULL || nextCandle == NULL)
            continue;
            
        // Prüfe auf Aufwärtsbewegung (bullish balance)
        if (bullish)           
            balanced = previousCandle.high >= nextCandle.low;
        else
            balanced = previousCandle.low <= nextCandle.high;
            
        // Wenn eine der Bedingungen erfüllt ist, haben wir eine balanced candle gefunden
        if (balanced)
        {
            CCandle* balancedCandle = chart.getCandleById(i);
            message = "Balanced Candle found: "+balancedCandle.toString();
            CLogManager::GetInstance().LogMessage("CImbalanceDetector::FindFirstBalancedCandle",LL_DEBUG,message);

            return balancedCandle;
        }
    }

    message = "Balanced Candle not found";
    CLogManager::GetInstance().LogMessage("CImbalanceDetector::FindFirstBalancedCandle",LL_DEBUG,message);

    return NULL;
}
CImbalanceTimeframeData* CImbalanceDetector::GetOrCreateTimeframeData(int timeframe)
{
    CImbalanceTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL)
    {
        data = new CImbalanceTimeframeData();
        timeframeDataArray.Add(data);
        ArrayResize(timeframes, ArraySize(timeframes) + 1);
        timeframes[ArraySize(timeframes) - 1] = timeframe;
    }
    return data;
}

CImbalanceTimeframeData* CImbalanceDetector::GetTimeframeData(int timeframe)
{
    for(int i = 0; i < ArraySize(timeframes); i++)
    {
        if(timeframes[i] == timeframe)
        {
            return timeframeDataArray.At(i);
        }
    }
    return NULL;
}

void CImbalanceDetector::CheckForNewImbalance(CCandle* currentCandle, CImbalanceTimeframeData* data)
{
    CBaseChart* chart = CChartManager::GetInstance().GetChart(currentCandle.symbol,currentCandle.timeframe);
    CCandle* following = currentCandle;
    CCandle* previous = NULL;
    CCandle* current = NULL;
    if (following.id > 2)
    {
        previous = chart.getCandleById(following.id - 2);
        current = chart.getCandleById(following.id - 1);
    }
    
    if (previous != NULL && current != NULL)
    {
        bool hasBullishGap = (following.low - previous.high) > (_Point*2);
        bool hasBearishGap = (previous.low - following.high) > (_Point*2);
        
        if (hasBullishGap)
        {
            CImbalance* newImbalance = addImbalance(current.timeframe, current, following.low-_Point, previous.high+_Point, BULLISH);
            CEvent* createEvent = new CImbalanceCreatedEvent(currentCandle.symbol, newImbalance);
            CEventStore::GetInstance(currentCandle.symbol).AddEvent(createEvent);
        }
        else if (hasBearishGap)
        {
            CImbalance* newImbalance = addImbalance(current.timeframe, current, previous.low-_Point, following.high+_Point, BEARISH);
            CEvent* createEvent = new CImbalanceCreatedEvent(currentCandle.symbol, newImbalance);
            CEventStore::GetInstance(currentCandle.symbol).AddEvent(createEvent);
        }
    }
}

void CImbalanceDetector::UpdateExistingImbalances(CCandle* currentCandle, CImbalanceTimeframeData* data)
{
    CArrayObj* affectedImbalances = FindAffectedImbalances(currentCandle, data);
    for(int i = 0; i < affectedImbalances.Total(); i++)
    {
        CImbalance* imb = affectedImbalances.At(i);
        UpdateImbalanceState(imb, currentCandle);
    }

    // Detach all objects before deleting the array
    while(affectedImbalances.Total() > 0)
    {
        affectedImbalances.Detach(affectedImbalances.Total() - 1);
    }
    delete affectedImbalances;
}

CArrayObj* CImbalanceDetector::FindAffectedImbalances(CCandle* candle, CImbalanceTimeframeData* data)
{
    CArrayObj* affectedImbalances = new CArrayObj();
    
    // Suche in lowerImbalanceTree
    ITreeNode* currentNode = data.lowerImbalanceTree.FindNextLower(candle.high);
    while(currentNode != NULL)
    {
        CImbalance* imb = dynamic_cast<CImbalance*>(currentNode);
        if(imb == NULL || imb.originalGapHigh < candle.low)
            break;
        
        affectedImbalances.Add(imb);
        currentNode = data.lowerImbalanceTree.FindNextLower(imb.GetTreeValue());
    }
    
    // Suche in upperImbalanceTree
    currentNode = data.upperImbalanceTree.FindNextHigher(candle.low);
    while(currentNode != NULL)
    {
        CImbalance* imb = dynamic_cast<CImbalance*>(currentNode);
        if(imb == NULL || imb.originalGapLow > candle.high)
            break;
        
        affectedImbalances.Add(imb);
        currentNode = data.upperImbalanceTree.FindNextHigher(imb.GetTreeValue());
    }
    
    return affectedImbalances;
}

void CImbalanceDetector::UpdateImbalanceState(CImbalance* imb, CCandle* current)
{
   // Da die Historie nicht so aufgebaut wird wie das normale Chart muss hier überprüfung rein
   if (imb.associatedCandle.closeTime >= current.openTime)
       return;

   // Prüfe auf unmitigated entry vor der Mitigation-Level-Aktualisierung
   bool isUnmitigatedEntry = false;
   if(imb.type == BULLISH)
   {
       // Bei bullischer Imbalance: Close muss zwischen aktuellem Mitigation Level und originalGapLow liegen
       isUnmitigatedEntry = (current.close < imb.GetMitigationLevel(current.timeframe) && 
                           current.close > imb.originalGapLow);
   }
   else
   {
       // Bei bearischer Imbalance: Close muss zwischen aktuellem Mitigation Level und originalGapHigh liegen
       isUnmitigatedEntry = (current.close > imb.GetMitigationLevel(current.timeframe) && 
                           current.close < imb.originalGapHigh);
   }

   bool hasHitUnmitigatedLevel = imb.UpdateMitigatedLevel(current.low, current.high, current.timeframe);
   
   bool isPartiallyInImbalance = (current.high > imb.originalGapLow && current.high < imb.originalGapHigh) ||
                                (current.low > imb.originalGapLow && current.low < imb.originalGapHigh) ||
                                (current.low <= imb.originalGapLow && current.high >= imb.originalGapHigh);

   bool isCloseInImbalance = (current.close > imb.originalGapLow && current.close < imb.originalGapHigh);
   bool isValidLeft = (imb.type == BULLISH && current.close > imb.originalGapHigh && current.open < imb.originalGapHigh) ||
                     (imb.type == BEARISH && current.close < imb.originalGapLow && current.open > imb.originalGapLow);
           
   if (isPartiallyInImbalance)
   {
       ENUM_EVENT_TYPE event;
       
       if (isCloseInImbalance)
       {
           if(isUnmitigatedEntry)
           {
               event = imb.state == INVERTED ? EV_UNMITIGATED_INVERTED_IMBALANCE_ENTERED : EV_UNMITIGATED_IMBALANCE_ENTERED;
           }
           else
           {
               event = imb.state == INVERTED ? EV_INVERTED_IMBALANCE_ENTERED : EV_IMBALANCE_ENTERED;
           }
       }
       else if (isValidLeft)
       {
           event = imb.state == INVERTED ? EV_INVERTED_IMBALANCE_LEFT : EV_IMBALANCE_LEFT;
       }
       else
       {
           event = imb.state == INVERTED ? EV_INVERTED_IMBALANCE_MITIGATED : EV_IMBALANCE_MITIGATED;
       }
       
       CImbalanceStatusEvent* imbalanceEvent = new CImbalanceStatusEvent(current.symbol, event, imb, current, hasHitUnmitigatedLevel);
       CEventStore::GetInstance(current.symbol).AddEvent(imbalanceEvent);          
   }
   
   // Prüfe auf Disrespect - wenn die Kerze außerhalb der Imbalance + Offset schließt
   double offset = _Point * imbalance_respect_offset;
   bool isDisrespected = false;
   
   if(imb.type == BULLISH)
   {
       if (imbalance_disrespected_candle_outside)
           isDisrespected = current.close < imb.originalGapLow && isPartiallyInImbalance == false;
       else
           isDisrespected = current.close < (imb.originalGapLow - offset);
   }
   else
   {
       if (imbalance_disrespected_candle_outside)
           isDisrespected = current.close > imb.originalGapHigh && isPartiallyInImbalance == false;
       else
           isDisrespected = current.close > (imb.originalGapHigh + offset);
   }
   
   if(isDisrespected)
   {
       CEvent* disrespectedEvent = new CImbalanceStatusEvent(current.symbol, EV_IMBALANCE_DISRESPECTED, imb, current, hasHitUnmitigatedLevel);
       CEventStore::GetInstance(current.symbol).AddEvent(disrespectedEvent);
   }

   if(current.timeframe == imb.timeframe)
   {
       if((imb.type == BULLISH && current.close < imb.originalGapLow) ||
          (imb.type == BEARISH && current.close > imb.originalGapHigh))
       {
           if(imb.state == INVERTED || !imbalance_active_inversions)
           {
               DeactivateImbalance(imb, GetTimeframeData(imb.timeframe));
               CEvent* deactivatedEvent = new CImbalanceStatusEvent(current.symbol, EV_IMBALANCE_DEACTIVATED, imb, current, hasHitUnmitigatedLevel);
               CEventStore::GetInstance(current.symbol).AddEvent(deactivatedEvent);
           }
           else
           {
               ProcessPotentialInversion(imb, current, hasHitUnmitigatedLevel);
           }
       }
       else if(imb.state == PENDING_INVERSION)
       {
           // Kerze schließt wieder innerhalb - Reset Bestätigung
           imb.ResetInversionConfirmation();
       }
   }
}

CImbalance* CImbalanceDetector::addImbalance(int timeframe, CCandle* candle, double high, double low, ImbalanceType type)
{
    CImbalanceTimeframeData* data = GetOrCreateTimeframeData(timeframe);
    CImbalance* newImbalance = new CImbalance(timeframe, candle, high, low, type);
      
    if(type == BULLISH)
    {
        data.lowerImbalanceTree.Insert(newImbalance);
    }
    else
    {
        data.upperImbalanceTree.Insert(newImbalance);
    }
    return newImbalance;
}

void CImbalanceDetector::DeactivateImbalance(CImbalance* imb, CImbalanceTimeframeData* data)
{
    if(imb.type == BULLISH)
    {
        data.lowerImbalanceTree.Remove(imb);
    }
    else
    {
        data.upperImbalanceTree.Remove(imb);
    }
    data.inactiveImbalances.Add(imb);
}

CArrayObj* CImbalanceDetector::GetInactiveImbalances(int timeframe)
{
    CImbalanceTimeframeData* data = GetTimeframeData(timeframe);
    if(data != NULL)
    {
        return data.inactiveImbalances;
    }
    return NULL;
}

void CImbalanceDetector::LimitInactiveImbalances(int timeframe, int maxInactiveCount)
{
    CImbalanceTimeframeData* data = GetTimeframeData(timeframe);
    if(data != NULL)
    {
        while (data.inactiveImbalances.Total() > maxInactiveCount)
        {
            data.inactiveImbalances.Delete(0);
        }
    }
}

void CImbalanceDetector::ProcessPotentialInversion(CImbalance* imb, CCandle* current, bool hasHitUnmitigatedLevel)
{
    if(!imbalance_require_inversion_confirmation) {
        // Alte Logik: Sofortige Invertierung
        InvertImbalance(imb, current, hasHitUnmitigatedLevel);
        return;
    }
    
    if(imb.state == ACTIVE || imb.state == MITIGATED) {
        // Erste Kerze außerhalb - starte Bestätigungsprozess
        imb.StartInversionConfirmation(current.close, current.closeTime);
        
    } else if(imb.state == PENDING_INVERSION) {
        // Weitere Kerzen prüfen
        bool isConfirmed = imb.AddInversionConfirmation(current);
        if(isConfirmed && imb.IsConfirmed(imbalance_inversion_confirmation_candles)) {
            // Bestätigung erreicht - Invertierung durchführen
            InvertImbalance(imb, current, hasHitUnmitigatedLevel);
            
            // Event für bestätigte Invertierung
            CEvent* confirmedEvent = new CImbalanceStatusEvent(current.symbol, EV_IMBALANCE_INVERSION_CONFIRMED, imb, current, hasHitUnmitigatedLevel);
            CEventStore::GetInstance(current.symbol).AddEvent(confirmedEvent);
        }
    }
}

void CImbalanceDetector::InvertImbalance(CImbalance* imb, CCandle* current, bool hasHitUnmitigatedLevel)
{
    CEvent* invertedEvent = new CImbalanceStatusEvent(current.symbol, EV_IMBALANCE_INVERTED, imb, current, hasHitUnmitigatedLevel);
    CEventStore::GetInstance(current.symbol).AddEvent(invertedEvent);

    CImbalanceTimeframeData* data = GetTimeframeData(imb.timeframe);
    if(data != NULL)
    {
        // Entferne die Imbalance aus dem ursprünglichen Baum
        if(imb.type == BULLISH)
        {
            data.lowerImbalanceTree.Remove(imb);
        }
        else
        {
            data.upperImbalanceTree.Remove(imb);
        }

        // Invertiere die Imbalance
        imb.state = INVERTED;
        imb.invertType();

        // Füge die invertierte Imbalance in den gegenüberliegenden Baum ein
        if(imb.type == BULLISH)
        {
            data.lowerImbalanceTree.Insert(imb);
        }
        else
        {
            data.upperImbalanceTree.Insert(imb);
        }
    }
}

#endif // IMBALANCE_DETECTOR_MQH

