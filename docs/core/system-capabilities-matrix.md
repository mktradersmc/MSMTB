# System Capabilities Matrix (Source of Truth)

**Version:** 1.0
**Scope:** Datafeed Pipeline (MQL5 <-> Core <-> Frontend)
**Status Legend:** ✅ Implemented | ⚠️ Partial / Needs Refinement | ❌ Missing

---

## 1. Incremental History Backfill ("Deep Load")
**Beschreibung:** Gezieltes Nachladen historischer Kerzen (z.B. 100er Pakete) *vor* einem bestimmten Zeitpunkt (`anchorTime`). Ermöglicht "Infinite Scroll" ohne Download der gesamten Historie.

- **Trigger:**
  - **Intern:** `ingestHistory` erkennt, dass weniger als N Kerzen vorhanden sind (Auto-Backfill).
  - **Frontend (Geplant):** User scrollt im Chart zurück (`GET /history?to=...`).
- **Nachrichten-Protokoll:**
  - **Backend -> Bot:** `CMD_FETCH_HISTORY`
    ```json
    {
      "symbol": "EURUSD",
      "timeframe": "M1",
      "count": 100,
      "anchorTime": 1709251200000 
    }
    ```
    *(Hinweis: `anchorTime` ist Milliseconds UTC. MQL5 konvertiert dies intern für `iBarShift`.)*
  
  - **Bot -> Backend:** `HISTORY_DATA`
    ```json
    {
      "symbol": "EURUSD",
      "timeframe": "M1",
      "anchorTime": 1709251200000,
      "candles": [{ "time": 1709251140, "open": 1.05... }, ...] 
    }
    ```
- **Queue-Einstufung:** **Lane B (Deep History, Priority >= 10)**
- **Status:** ✅ Implemented (MQL5 Logic Verified: Uses `iBarShift` with `anchorTime`).

---

## 2. Realtime Tick Streaming ("Fast Lane")
**Beschreibung:** Hochfrequente Übertragung von Marktdaten (Ticks) vom Bot zum Backend. Unterstützt Batching zur Performance-Optimierung.

- **Trigger:**
  - **MQL5 Event:** `OnChartEvent` (Custom ID 11001) von `TickSpy`-Indikator (Interrupt-Driven).
- **Nachrichten-Protokoll:**
  - **Backend -> Bot:** `CMD_SUBSCRIBE_TICKS`
    ```json
    {
      "type": "CMD_SUBSCRIBE_TICKS",
      "content": {
        "symbols": [ "EURUSD" ] 
         // or legacy: "EURUSD:M1"
      }
    }
    ```
  - **Bot -> Backend:** `TICKS_BATCH`
    ```json
    {
      "type": "TICKS_BATCH",
      "content": [
        { "s": "EURUSD", "t": 1709251205, "b": 1.0501, "a": 1.0502, "v": 10 }
      ]
    }
    ```
- **Queue-Einstufung:** **N/A (Stream Pipe)**. Wird im Backend sofort verarbeitet (`syncManager.processLiveTick`).
- **Status:** ✅ Implemented (MQL5 uses `OnAutoTick` logic).

---

## 3. Symbol Discovery & Partitioning
**Beschreibung:** Automatische Erkennung verfügbarer Symbole beim Broker und deren Partitionierung auf verschiedene Bots (Datafeed vs. Trading Bots).

- **Trigger:**
  - **Init:** Bot sendet `REGISTER` beim Start.
  - **Frontend:** User öffnet Symbolauswahl (`socket.emit('get_all_symbols')`).
  - **Backend:** `requestAvailableSymbols()` (Broadcast an alle Bots).
- **Nachrichten-Protokoll:**
  - **Backend -> Bot:** `CMD_GET_SYMBOLS`
    ```json
    { "type": "CMD_GET_SYMBOLS" }
    ```
  - **Bot -> Backend:** `SYMBOLS_LIST`
    ```json
    {
      "type": "SYMBOLS_LIST",
      "content": [
        { "name": "EURUSD", "path": "Forex\\Majors", "digits": 5, "desc": "Euro vs US Dollar" },
        ...
      ]
    }
    ```
- **Queue-Einstufung:** **Lane B (Low Priority)**. Wird seltener ausgeführt.
- **Status:** ✅ Implemented (MQL5 iteriert über `SymbolsTotal` und sendet Metadaten).

---

## 4. Gap Detection & Self-Healing
**Beschreibung:** Das Backend überwacht kontinuierlich die "Sauberkeit" der Zeitreihen. Lücken (Gaps) durch Verbindungsabbrüche werden erkannt und repariert.

- **Trigger:**
  - **Scheduler:** `SyncManager` prüft minütlich (`runConsistencyCheck('RECENT')`) und stündlich (`'HOURLY'`).
  - **Logik:** Wenn `LastTime < ExpectedPreviousBar`, wird eine Lücke erkannt.
- **Nachrichten-Protokoll:**
  - **Aktion:** Generiert `CMD_FETCH_HISTORY` (Typ: `REPAIR`) mit `fromTime` (Forward Fetch) oder `anchorTime`.
- **Queue-Einstufung:** **Lane A (Priority 5-8)**. Reparaturen haben Vorrang vor Deep Load, aber Nachrang vor Live-Subskriptionen.
- **Status:** ✅ Implemented (`SyncManager.js` Logic verified).

---

## 5. Priority Orchestration
**Beschreibung:** Intelligentes Management der Anfragen, um "UI-Lag" zu vermeiden. User-Interaktionen blockieren Hintergrund-Updates nicht.

- **Logik:**
  - **Priority Queue (Level 0-9):** User Subscriptions (`subscribe`), Einzelne History-Checks. Werden *sofort* abgearbeitet.
  - **Deep Queue (Level >= 10):** Massive Backfills, Initial Syncs. Werden nur verarbeitet, wenn Priority Queue leer ist.
- **Status:** ✅ Implemented (`SyncManager.processQueue` implements draining logic).

---

## 6. Northbound Pagination (Infinite Scroll)
**Beschreibung:** Schnittstelle für das Frontend, um explizit ältere Daten anzufordern (Scrolling).

- **Nachrichten-Protokoll (Frontend -> Backend):**
  - **Status:** ❌ Missing.
  - **Soll-Zustand:** `GET /history?symbol=EURUSD&to=<timestamp>` oder Socket Event.
- **Backend-Logik:** Muss `ensureFreshHistory` umgehen und direkt eine Deep-Queue-Task (`anchorTime`) erstellen.
- **Status:** ❌ Missing (Muss implementiert werden).
