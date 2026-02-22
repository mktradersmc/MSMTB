# Funktionalitäts-Analyse: TradePanel (MSMTB GUI)

Das TradePanel ist eine fortschrittliche grafische Benutzeroberfläche (GUI), die speziell für die semi-automatisierte Handelsausführung und das präzise Risikomanagement im MQL5-Umfeld entwickelt wurde.

## 1. Kernfunktionen und Bedienkonzept

### A. Dynamische Risikoberechnung
Das Panel ermöglicht die Fixierung bestimmter Handelsparameter, während andere automatisch berechnet werden:
*   **Fix-Logik:** Über "Fix"-Buttons können Entry, Stop Loss (SL), Take Profit (TP) oder das Risk-Reward-Verhältnis (RR) gesperrt werden.
*   **Auto-Synchronisation:** 
    *   Ist RR und SL fixiert, verschiebt sich der TP automatisch bei Änderung des Entry-Preises.
    *   Ist der Entry und TP fixiert, wird der SL basierend auf dem gewünschten RR-Verhältnis angepasst.
*   **Lot-Size Kalkulation:** Die Positionsgröße wird in Echtzeit basierend auf dem Kontostand, dem prozentualen Risiko (Standard: 0.35%) und der SL-Distanz berechnet.

### B. Visuelle Interaktion (Chart-Integration)
Das Panel ist tief in den MT5-Chart integriert:
*   **Level-Auswahl:** Durch Aktivieren der Auswahl-Modi (Entry, SL, TP) kann der Nutzer direkt in den Chart klicken. Das System erkennt die Kerze und schaltet zyklisch durch (Low -> Body-Low -> Body-High -> High).
*   **Visual Mode:** Horizontale Linien im Chart stellen die geplanten Orders dar. Diese Linien sind farblich kodiert (z. B. Rot für SL, Grün für TP) und werden synchron zum Panel aktualisiert.
*   **Z-Order Management:** Eine spezielle Logik sorgt dafür, dass das Panel immer im Vordergrund bleibt, während die Preislinien im Hintergrund liegen, um die Bedienbarkeit nicht zu stören.

### C. Trade-Ausführung
Das Panel unterstützt zwei Haupt-Orderarten:
1.  **Limit Order:** Platziert eine Pending Order an dem im Panel definierten Entry-Preis.
2.  **Market Order:** Führt den Trade sofort zum aktuellen Marktpreis aus, übernimmt aber die berechneten SL/TP-Werte und die Lot-Size aus dem Panel.

## 2. Technische Umsetzung

### Architektur-Integration
*   **Modularität:** Die mathematische Logik ist strikt in die Hilfsklasse `CTradePanelCalculations` ausgelagert, was Code-Duplikate vermeidet und Unit-Testing ermöglicht.
*   **EntryManager-Schnittstelle:** Das Panel interagiert direkt mit dem `CEntryManager`. Vor einer Order werden die globalen Strategie-Einstellungen temporär durch die Panel-Werte überschrieben und nach der Ausführung wiederhergestellt.
*   **Event-Handling:** Nutzt das MQL5 `CAppDialog` Framework für die UI-Events und ergänzt dieses um `CHARTEVENT_CLICK` für die Preisinteraktion.

## 3. Stärken und Schwächen des TradePanels

### Stärken
*   **Präzision:** Die zyklische Preiswahl (Low/High/Body) an Kerzen ermöglicht extrem schnelles und exaktes Setzen von Levels ohne manuelles Tippen.
*   **Flexibilität:** Die Fix-Logik erlaubt es, Strategien sowohl über festes RR als auch über feste Preisziele (z. B. Liquiditätszonen) flexibel zu handeln.
*   **Benutzererfahrung:** Der visuelle Modus gibt sofortiges Feedback über das geplante Setup direkt im Marktumfeld.

### Schwächen
*   **Abhängigkeit von Marktdaten:** Bei hoher Volatilität können die Marktpreise für die Lot-Berechnung leicht variieren, bevor die Order final abgeschickt wird (Slippage-Risiko bei Market Orders).
*   **Komplexität für Einsteiger:** Die vielen Fix-Kombinationen erfordern eine gewisse Einarbeitungszeit, um Fehlberechnungen (z. B. falsche Richtung) zu vermeiden.
*   **Ressourcenverbrauch:** Die ständige Neuberechnung der Lot-Size und das Zeichnen der Linien in jedem Tick/Klick erfordern eine effiziente Implementierung, um MT5 nicht zu verlangsamen.

---
*Erstellt am: 2026-01-07*
