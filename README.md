# Bitebase

Persönliche Web-App fürs iPhone: Kalorien zählen, Tagesbedarf berechnen, Training und Gewicht erfassen, Essen per Foto schätzen lassen.

## Funktionen

- **Heute:** Level, XP und Streak, Kalorien-Anzeige «gegessen / Ziel», Makros, Essensliste, Trainings, Tage vor- und zurückblättern
- **Food-Scanner:** Foto vom Essen → die KI (Claude) schätzt Kalorien und Makros pro Komponente → anpassen → speichern
- **Krafttraining:** Workout starten, Übungen mit Sätzen, Wiederholungen und Gewicht erfassen, «Letztes Mal»-Anzeige und persönliche Rekorde
- **Cardio & andere:** Aktivität und Dauer erfassen; die kcal werden aus MET-Werten und deinem Gewicht geschätzt. Dazu ein Gewichtsverlauf und eine 7-Tage-Übersicht.
- **Kcal-Rechner:** Grundumsatz (Mifflin-St Jeor), Gesamtumsatz und Tagesziel je nach Ziel, plus Makro-Ziele
- **Sicherung:** Export und Import als JSON-Datei

## Auf dem iPhone installieren

1. Die Seite in **Safari** öffnen.
2. **Teilen** → **Zum Home-Bildschirm**.

## Daten & Sicherheit

- Alle Einträge werden **nur auf dem Gerät** gespeichert (localStorage), nicht auf GitHub oder einem Server.
- Der Claude-API-Schlüssel für den Scanner wird ebenfalls nur auf dem Gerät gespeichert und ist nicht im Export enthalten.
- Fotos werden zur Analyse direkt an die Claude-API von Anthropic gesendet und nicht in der App gespeichert.

## Technik

Reines HTML, CSS und JavaScript ohne Build-Schritt, veröffentlicht über GitHub Pages.

- `index.html`, `styles.css`: Oberfläche
- `js/app.js`: App-Logik und Darstellung
- `js/store.js`: Speicherung
- `js/calc.js`: Berechnungen
- `js/scanner.js`: Food-Scanner (Claude-API)
- `js/vendor/anthropic-sdk.js`: offizielles Anthropic-SDK 1.3.0, gebündelt (Apache-2.0)
- `js/version.js`: Versionsliste (siehe auch `CHANGELOG.md`)
- `sw.js`: Offline-Unterstützung

## Neue Version veröffentlichen

1. Eintrag oben in `js/version.js` und `CHANGELOG.md` ergänzen.
2. `CACHE` in `sw.js` auf die neue Version setzen.
3. Commit mit der Version im Titel (z. B. `v1.2.0: …`), Tag setzen (`git tag v1.2.0`) und mit `git push --tags` hochladen.

Lokal testen:

```bash
python3 -m http.server 8000
```
