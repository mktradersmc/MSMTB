# CONSTRAINTS.md - Suprema Lex (AgenticOS)
# LOCATION: /.agent/CONSTRAINTS.md

## 1. Gesetz der Unveränderlichkeit (Snapshot-First)
Bevor eine produktive Datei verändert wird, muss zwingend eine Sicherung erfolgen.
- **Prozess:** Kopiere das Original nach `/.agent/archive/task-XXXX/pre-state/`.
- **Immutable:** Wenn eine Datei bereits im `pre-state` existiert, bleibt sie unberührt. Das erste Backup eines Tasks ist die "Heilige Wahrheit" des Ausgangszustands für diesen Task.

## 2. Skill-Disziplin & Domänen-Grenzschutz
Jeder Agent handelt strikt nach seinem zugewiesenen **Skill** (definiert in `/.agent/skills/`).
- **Zuständigkeit:** Ein Skill definiert den exakten Handlungsrahmen. Änderungen an Dateien außerhalb der Domäne (z.B. Backend-Dev ändert MQL5-Files) sind untersagt.
- **Eskalation:** Überschneidungen müssen dem @tech-lead gemeldet werden. Erst nach expliziter Freigabe wird die Domäne erweitert.

## 3. Automatische Prozess-Integrität (One Chat = One Task)
Um Kontext-Verwässerung und "KI-Drift" zu vermeiden, gilt:
- **Ein Chat = Ein Task:** Jedes Feature oder jeder Bugfix erhält einen eigenen, sauberen Chat-Kontext.
- **Registry-Pflicht:** Der @tech-lead muss zu Beginn jedes Tasks die `/.agent/registry.md` aktualisieren (Status: IN_PROGRESS). Bitte immer Datum + Uhrzeit angeben.
- **Status-Hoheit:** - Ein ausführender Skill (z. B. @frontend-developer) darf den Status eines Tasks nach getaner Arbeit maximal auf `REVIEW` setzen.
    - Der Status `COMPLETED` darf EXKLUSIV vom @tech-lead gesetzt werden, nachdem der User (PM) die Abnahme offiziell bestätigt hat.
- **Sequentialität:** Es wird pro Kontext niemals an zwei Tasks gleichzeitig gearbeitet.

## 4. Dokumentations-Vorrang (Golden Truth)
Code ist vergänglich, Dokumentation ist das Gesetz.
- **Pflicht:** Vor jeder Code-Änderung MUSS die Dokumentation in `/docs/` (Core, Backend, Frontend oder Trading-Clients) gelesen werden.
- **Verbot:** Keine Vorschläge einreichen, die dem projektspezifischen Wissen (z.B. `/docs/core/system-context.md`) widersprechen.