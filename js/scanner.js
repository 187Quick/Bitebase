// Food-Scanner: schickt ein Foto an die Claude-API und erhält eine Nährwert-Schätzung.
// Der API-Schlüssel liegt nur im Browser dieses Geräts.

// Offizielles Anthropic-SDK (Version 1.3.0, Apache-2.0), lokal gebündelt.
const SDK_URL = './vendor/anthropic-sdk.js';
const MODEL = 'claude-opus-5-5';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['is_food', 'items', 'confidence', 'note'],
  properties: {
    is_food: { type: 'boolean', description: 'false, wenn auf dem Foto kein Essen/Getränk zu sehen ist' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'portion', 'kcal', 'protein_g', 'carbs_g', 'fat_g'],
        properties: {
          name: { type: 'string', description: 'Name des Lebensmittels auf Deutsch' },
          portion: { type: 'string', description: 'Geschätzte Menge, z. B. "ca. 150 g" oder "1 Stück"' },
          kcal: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
        },
      },
    },
    confidence: { type: 'string', enum: ['hoch', 'mittel', 'tief'] },
    note: { type: 'string', description: 'Kurzer Hinweis auf Deutsch, z. B. was schwer zu erkennen war' },
  },
};

const SYSTEM = `Du bist ein Ernährungsexperte. Du schätzt anhand eines Fotos die Nährwerte der sichtbaren Mahlzeit.
- Erkenne jede einzelne Komponente (z. B. Reis, Poulet, Sauce, Salat) als eigenen Eintrag.
- Schätze die Portionsgrösse anhand von Teller, Besteck und Verpackung so realistisch wie möglich.
- Berücksichtige versteckte Kalorien wie Öl, Butter, Saucen und Dressings.
- Verwende typische Nährwerte aus Schweizer und europäischen Nährwertdatenbanken.
- Gib Werte für die gesamte sichtbare Portion an, gerundet auf ganze Zahlen.
- Wenn kein Essen zu sehen ist: is_food = false und items leer.`;

let clientPromise = null;
let clientKey = null;

async function getClient(apiKey) {
  if (!clientPromise || clientKey !== apiKey) {
    clientKey = apiKey;
    clientPromise = import(SDK_URL).then(mod => {
      const Anthropic = mod.default;
      // Der Schlüssel gehört dem Benutzer selbst und bleibt auf seinem Gerät.
      return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    });
  }
  return clientPromise;
}

/** Verkleinert das Foto auf max. 1280 px und gibt base64-JPEG zurück. */
export async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { dataUrl, base64: dataUrl.split(',')[1] };
}

export async function analyzeFood({ apiKey, base64, hint }) {
  const client = await getClient(apiKey);
  const text = hint
    ? `Schätze die Nährwerte dieser Mahlzeit. Hinweis des Benutzers: ${hint}`
    : 'Schätze die Nährwerte dieser Mahlzeit.';

  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text },
        ],
      }],
    });
  } catch (err) {
    throw new Error(describeError(err));
  }

  if (response.stop_reason === 'refusal') {
    throw new Error('Die KI konnte dieses Foto nicht auswerten. Bitte versuche ein anderes Foto.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Die Antwort war unvollständig. Bitte versuche es nochmals.');
  }
  const block = response.content.find(b => b.type === 'text');
  if (!block) throw new Error('Keine Antwort erhalten.');
  try {
    return JSON.parse(block.text);
  } catch {
    throw new Error('Die Antwort konnte nicht gelesen werden. Bitte versuche es nochmals.');
  }
}

function describeError(err) {
  const status = err?.status;
  if (status === 401) return 'Der API-Schlüssel ist ungültig. Bitte prüfe ihn im Profil.';
  if (status === 403) return 'Der API-Schlüssel hat keine Berechtigung für diese Anfrage.';
  if (status === 402 || /credit|billing/i.test(err?.message || '')) return 'Dein Anthropic-Guthaben ist aufgebraucht. Lade es auf platform.claude.com auf.';
  if (status === 429) return 'Zu viele Anfragen. Bitte warte kurz und versuche es nochmals.';
  if (status >= 500) return 'Der KI-Dienst ist gerade nicht erreichbar. Bitte später nochmals versuchen.';
  if (!navigator.onLine) return 'Keine Internetverbindung.';
  return 'Analyse fehlgeschlagen: ' + (err?.message || 'unbekannter Fehler');
}
