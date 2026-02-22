# 1. Aktueller Projektstatus (High Level)
- **Status**: Die App wurde erfolgreich von `awesome_app` (Monolith) nach `mobile_app` migriert und refactored.
- **Tech Stack**: Flutter (Android), Provider, Http.
- **Features**: 
    - **Auth**: Bot-ID Login (Persistent).
    - **Signals**: Polling-basierter Empfang von Trading-Signalen & Setups.
    - **Charts**: TradingView Webview Integration.
    - **Tools**: Einfache Kommandos (Start/Stop Trading).

# 2. Architektur-Entscheidungen (ADRs)
- **Clean Architecture**: Aufteilung in `core` (Shared) und `features` (Auth, Signals, Dashboard).
    - *Grund*: Bessere Skalierbarkeit und Testbarkeit als der alte Monolith.
    - *Regel*: Keine direkte Abhängigkeit zwischen Features. Kommunikation über Provider/Services.
- **State Management**: `Provider` Pattern.
    - *Grund*: Leichtgewichtig und ausreichend für die aktuelle Komplexität.
- **Dependency Cleanup**: Entfernung von unused `firebase` und `audioplayers` Libs.
    - *Grund*: Reduzierung der App-Größe und Build-Zeit.
- **Android Desugaring**: Aktiviert (`isCoreLibraryDesugaringEnabled = true`).
    - *Grund*: `flutter_local_notifications` benötigt neuere Java-Features auf älteren Android-Versionen.

# 3. Technische Spezifikationen & Datenmodelle
- **Message Model** (`lib/features/signals/data/message_model.dart`):
    - Zentrales Datenobjekt.
    - Felder: `id`, `type` (NewTradeSignal/TradingSetup), `content` (Map), `botId`, `isActive`.
    - **Wichtig**: Import muss oft als `import ... as model` aliased werden, da Konflikt mit `flutter_local_notifications` Message Klasse besteht.
- **API**:
    - Polling alle 1s auf `/getMessages`.
    - `MessageService` ist die *Source of Truth* für Signale.
- **Konstanten**: `ApiConstants` in `lib/core/constants/api_constants.dart`.

# 4. Offene Punkte & Tech Debt
- **Polling vs. Push**:
    - *Aktuell*: Aggressives Polling (1s).
    - *Tech Debt*: Hoher Akkuverbrauch möglich. Sollte später auf WebSocket oder FCM (wieder) umgestellt werden, wenn Backend dies unterstützt.
- **Charts**:
    - *Aktuell*: Reine Webview.
    - *Offen*: Native Chart-Integration für bessere Performance/Interaktion.
- **Styling**:
    - *Aktuell*: Basis Material Theme (`AppTheme`). UI ist funktional, aber "basic".
- **Refactoring**:
    - `SignalCard` ist derzeit in `dashboard/` hardcoded, könnte als shared widget in `core/ui` wandern.
