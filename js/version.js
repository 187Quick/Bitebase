// Versionsliste der App. Neueste Version zuoberst.
// Bei jeder Veröffentlichung: neuen Eintrag hinzufügen, CACHE in sw.js anpassen,
// CHANGELOG.md ergänzen und den Git-Tag (z. B. v1.2.0) setzen.
export const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-11-07',
    title: 'Level Up',
    changes: [
      'Neues Gaming-Design mit Neon-Look',
      'Level, XP und Streak',
      'Krafttraining mit Übungen, Sätzen, Gewicht und persönlichen Rekorden',
      'Kalorien-Anzeige «gegessen / Ziel»',
      'Eine gemeinsame Essensliste statt Mahlzeiten',
      'Versionsliste in der App',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-06',
    title: 'Erste Version',
    changes: [
      'Kalorienzähler mit Makros',
      'Kcal-Rechner (Grundumsatz, Tagesziel)',
      'Training und Gewichtsverlauf',
      'KI-Food-Scanner',
      'Export und Import der Daten',
    ],
  },
];

export const VERSION = CHANGELOG[0].version;
