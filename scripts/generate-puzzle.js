// scripts/generate-puzzle.js
// Generates tomorrow's puzzle and writes it to public/puzzles/YYYY-MM-DD.json
// Run by the GitHub Action nightly.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

function getTomorrowDateString() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

const dateStr = getTomorrowDateString();

const PROMPT = `You are generating a daily puzzle for Historle, a world history game with five rounds.
Target date: ${dateStr}

Return ONLY a raw JSON object — no markdown, no backticks, no explanation.

{
  "date": "${dateStr}",
  "chronicle": {
    "events": [
      {"id": 1, "text": "Short event description max 12 words", "year": -221},
      {"id": 2, "text": "Short event description max 12 words", "year": 80},
      {"id": 3, "text": "Short event description max 12 words", "year": 1206},
      {"id": 4, "text": "Short event description max 12 words", "year": 1455},
      {"id": 5, "text": "Short event description max 12 words", "year": 1776}
    ]
  },
  "eracle": {
    "clues": ["Vague clue", "More specific clue", "Most specific clue"],
    "answer_year": 1969,
    "event_name": "Name of the event",
    "explanation": "One sentence explanation."
  },
  "borderle": {
    "empire_name": "Ottoman Empire",
    "time_period": "at its peak in 1683",
    "year_label": "1683 AD",
    "fun_fact": "One interesting sentence about this empire.",
    "geojson": {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[28.9, 41.0], [36.8, 37.1], [44.3, 33.5], [28.9, 41.0]]]
      }
    },
    "options": ["Correct empire name", "Wrong 2", "Wrong 3", "Wrong 4", "Wrong 5", "Wrong 6"]
  },
  "figurle": {
    "name": "Full name of historical figure",
    "birth_year": 1452,
    "death_year": 1519,
    "clues": [
      "Vague clue — era or region only, no name",
      "More specific clue — field or achievement",
      "Most specific clue — still requires knowledge to confirm"
    ],
    "fun_fact": "One interesting sentence about this person.",
    "options": ["Correct name", "Wrong 2", "Wrong 3", "Wrong 4", "Wrong 5", "Wrong 6"]
  },
  "duelle": {
    "pairs": [
      {"id": 1, "a": {"text": "Event description", "year": 1066}, "b": {"text": "Event description", "year": 1215}},
      {"id": 2, "a": {"text": "Event description", "year": -44},  "b": {"text": "Event description", "year": 632}},
      {"id": 3, "a": {"text": "Event description", "year": 1776}, "b": {"text": "Event description", "year": 1789}},
      {"id": 4, "a": {"text": "Event description", "year": 1347}, "b": {"text": "Event description", "year": 1453}},
      {"id": 5, "a": {"text": "Event description", "year": 1905}, "b": {"text": "Event description", "year": 1945}}
    ]
  }
}

RULES — follow exactly:

Chronicle:
- 5 events from different eras and regions, spanning 500+ years
- Sorted by year ascending in the JSON (game shuffles them for the player)
- Negative years are BCE

Eracle:
- One specific historical event with a precise single year
- 3 clues going from vague to specific — last clue still requires real knowledge

Borderle GeoJSON:
- Draw the approximate outer border of the empire at the stated time period
- Coordinates are [longitude, latitude] (GeoJSON standard — longitude FIRST)
- Provide 50-80 points around the full perimeter for a recognisable shape
- Prioritise overall outline accuracy — players need to recognise the shape on a world map
- For non-contiguous empires use MultiPolygon geometry type
- options: correct empire + 5 plausible wrong answers from the same era/region, shuffled

Figurle:
- Choose a notable historical figure from any era, any region — not just Western figures
- 3 clues: first clue is vague (era + region only), second is a major achievement or role, third is specific but not a name giveaway
- Do NOT mention the person's name in any clue
- options: correct name + 5 plausible wrong answers from the same era or field, shuffled

Duelle:
- 5 pairs of historical events the player must sort by which came first
- Make some pairs obvious (centuries apart) and some tricky (decades or just years apart)
- Events should be from varied regions and eras — no two pairs from the same region
- Keep each event description under 10 words
- Years can be negative (BCE)
- The "a" and "b" positions should be randomised — do not always put the earlier event in "a"

General:
- Rotate world regions across all five rounds: Asia, Africa, Americas, Middle East, Europe, South/Southeast Asia
- Mix famous and obscure
- Return ONLY the JSON. Nothing before or after it.`;

async function generatePuzzle() {
  console.log(`Generating puzzle for ${dateStr}...`);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 5000,
      messages: [{ role: 'user', content: PROMPT }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.content?.find(b => b.type === 'text')?.text ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();

  let puzzle;
  try {
    puzzle = JSON.parse(clean);
  } catch (e) {
    console.error('Failed to parse puzzle JSON:\n', clean);
    throw e;
  }

  if (!puzzle.chronicle?.events || !puzzle.eracle?.clues || !puzzle.borderle?.geojson || !puzzle.figurle?.clues || !puzzle.duelle?.pairs) {
    throw new Error('Puzzle JSON is missing required fields');
  }

  puzzle.date = dateStr;

  const outDir = path.join(__dirname, '..', 'public', 'puzzles');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${dateStr}.json`);
  fs.writeFileSync(outPath, JSON.stringify(puzzle, null, 2));
  console.log(`Puzzle written to public/puzzles/${dateStr}.json`);
}

generatePuzzle().catch(err => {
  console.error('Puzzle generation failed:', err);
  process.exit(1);
});
