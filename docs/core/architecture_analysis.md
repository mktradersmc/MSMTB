# Architektur-Analyse: MSMTB Trading Bot

Diese Dokumentation beschreibt die technische Architektur des untersuchten MQL5-Handelssystems. Das System zeichnet sich durch eine hochgradig modulare, ereignisgesteuerte Struktur aus, die auf Erweiterbarkeit und komplexe Intermarket-Analysen ausgelegt ist.

## 1. Kernkomponenten der Architektur

### A. Event-Driven Core (Ereignissteuerung)
Das System basiert auf einem zentralen **`CEventStore`**. Jede Marktveränderung oder Analyseergebnis wird als `CEvent`-Objekt gekapselt.
*   **Ablauf:** Features (Detektoren) beobachten den Markt und generieren bei Mustern (z.B. High/Low Bruch, Imbalance) ein Event.
*   **Kerzen-Fokus:** Im Gegensatz zu vielen Tick-Bots arbeitet dieses System primär mit **abgeschlossenen Kerzen**. Events werden erst generiert oder validiert, wenn eine Kerze geschlossen wurde, was die Rauschanfälligkeit reduziert und die Logik konsistenter macht.
*   **Entkopplung:** Die Strategie-Logik "weiß" nichts über die Berechnung der Indikatoren; sie reagiert lediglich auf das Eintreffen spezifischer Events im Store.
*   **Vorteil:** Asynchrone Verarbeitung und einfache Erweiterbarkeit um neue Event-Typen.

### B. Feature-System (Analyse-Module)
Technische Analysen sind in sogenannten **Features** (`CFeature`) isoliert. 
*   **Detektoren:** Jedes Feature (z.B. `CHighLowDetector`, `CImbalanceDetector`, `CMarketStructureDetector`) ist für eine spezifische Analyse zuständig.
*   **Optimierter EnvironmentManager:** Das System lädt nur Features, Timeframes und Symbole, die tatsächlich von den hinterlegten Handelsstrategien benötigt werden. Dies minimiert den Ressourcenverbrauch erheblich.
*   **FeatureFactory & Registry:** Der `CEnvironmentManager` nutzt eine Factory, um die benötigten Features für jedes Symbol und Timeframe zu instanziieren und zu verwalten.
*   **Modularität:** Neue technische Konzepte können als eigenständige Klassen implementiert werden, ohne den Kern des Bots zu beeinflussen.

### C. Chart-Abstraktion
Das System nutzt einen eigenen **`CChartManager`**, anstatt direkt auf MT5-Standardfunktionen zuzugreifen.
*   **BaseChart:** Eine abstrakte Basisklasse ermöglicht verschiedene Chart-Typen wie `CTimeframeChart` (Standard), `CTickChart`, `CRenkoChart` oder `CSecondBasedTimeframeChart`.
*   **Multi-Timeframe Handling:** Jedes Timeframe wird als eigenes Objekt verwaltet, was konsistente Zugriffe auf historische Daten über verschiedene Zeitebenen hinweg sicherstellt.

### D. Strategie-Sequenz-Logik (State Machine)
Die Handelsentscheidung basiert auf einer definierten Abfolge von Ereignissen:
*   **Strategie-Module:** Eine Strategie besteht aus Phasen (Setup, Entry, Invalidation).
*   **Steps:** Jede Phase enthält `CStrategyStep`-Objekte. Ein Trade wird erst ausgelöst, wenn die Events in der exakt definierten Reihenfolge eintreffen.
*   **Validierung:** Zusätzliche `CValidationCondition`-Objekte erlauben Filterungen (z.B. EMA-Trendfilter) vor der Trade-Ausführung.

### E. SMT Detector (Divergenz-Analyse)
Die SMT-Logik (Smart Money Tool) ist im **`CDivergenceDetector`** implementiert:
*   **Intermarket-Check:** Wenn auf einem Symbol ein Event (z.B. `EV_HIGH_BROKEN`) auftritt, prüft der Detektor sofort den Zustand des korrelierten Paares (z.B. EURUSD vs. GBPUSD).
*   **Divergenz-Event:** Wenn das korrelierte Paar das entsprechende Level *nicht* bricht (oder ein anderes Verhalten zeigt), wird ein `CDivergenceEvent` erzeugt. Dieses Event dient oft als Bestätigung (Setup-Step) in den Strategien.

---

## 2. Stärken der Umsetzung

1.  **Hervorragende Trennung von Belangen (Separation of Concerns):** Analyse (Features), Daten (Charts), Logik (Strategies) und Ausführung (TradeManager) sind strikt getrennt.
2.  **Effiziente Ressourcennutzung:** Durch das gezielte Laden nur benötigter Komponenten (Lazy Loading Prinzip) wird die Systemlast trotz komplexer Berechnungen optimiert.
3.  **Hohe Skalierbarkeit:** Das System kann problemlos für Dutzende Symbole und Strategien konfiguriert werden, da die Infrastruktur (Events/Store) geteilt wird.
4.  **Robustheit durch Kerzen-Schluss-Logik:** Die Verarbeitung auf Basis abgeschlossener Kerzen minimiert Fehler durch Fake-Ausbrüche (Whipsaws) innerhalb eines Ticks.
5.  **Präzise Intermarket-Analyse:** Die native Unterstützung für korrelierte Symbole im `EnvironmentManager` und `DivergenceDetector` ermöglicht institutionelle Handelsansätze (SMT).

## 3. Schwächen der Umsetzung

1.  **Hohe Komplexität:** Die Architektur ist für einfache Strategien "overengineered". Die Fehlersuche in einer ereignisgesteuerten Kette von Objekten ist deutlich schwieriger als in linearem Code.
2.  **Performance & Speicher:** Die massive Nutzung von dynamischen Objekten (`new`) und `CArrayObj` führt zu hohem Speicherbedarf und CPU-Last, besonders bei vielen Ticks. Memory Leaks sind ein hohes Risiko, falls die `SafeDelete`-Logik nicht lückenlos greift.
3.  **Latenz:** Die Kette von Event-Erzeugung -> Speicherung -> Strategie-Prüfung -> Ausführung erzeugt eine minimale Latenz, die für High-Frequency-Trading (HFT) zu hoch sein könnte (für normale Strategien jedoch unkritisch).
4.  **Abhängigkeit von Korrelationen:** Die SMT-Logik erfordert, dass Daten für beide Symbole absolut synchron und vollständig vorliegen. Verzögerungen beim Datenfeed eines Symbols können zu falschen Divergenz-Signalen führen.

---
*Erstellt am: 2026-01-07*
