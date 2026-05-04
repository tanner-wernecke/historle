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

// Target tomorrow's date so it's ready before the day starts
function getTomorrowDateString() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

const dateStr = getTomorrowDateString();

const PROMPT = `You are generating a daily puzzle for Historle, a world history game with three rounds.
Today's target date: ${dateStr}

Generate a JSON object (ONLY raw JSON — no markdown, no backticks, no explanation) with this exact structure:

{
  "date": "${dateStr}",
  "chronicle": {
    "events": [
      {"id": 1, "text": "Short event description (max 12 words)", "year": -221},
      {"id": 2, "text": "Short event description (max 12 words)", "year": 80},
      {"id": 3, "text": "Short event description (max 12 words)", "year": 1206},
      {"id": 4, "text": "Short event description (max 12 words)", "year": 1455},
      {"id": 5, "text": "Short event description (max 12 words)", "year": 1776}
    ]
  },
  "eracle": {
    "clues": [
      "Vague clue about the event",
      "More specific clue",
      "Most specific clue — still not a giveaway"
    ],
    "answer_year": 1969,
    "event_name": "Name of the event",
    "explanation": "One sentence explanation of the event and its significance."
  },
  "borderle": {
    "empire_name": "Name of Empire or Kingdom",
    "time_period": "e.g. at its peak in 117 AD",
    "clues": [
      "Vague geographic clue",
      "More specific geographic clue",
      "Cultural or religious clue",
      "Specific historical clue",
      "Near-giveaway clue"
    ],
    "fun_fact": "An interesting one-sentence fact about this empire.",
    "options": ["Correct empire name", "Wrong 2", "Wrong 3", "Wrong 4", "Wrong 5", "Wrong 6"]
  }
}

Rules:
- Chronicle: 5 events from DIFFERENT eras and regions, spanning at least 500 years. Events must be already sorted by year in the JSON (the game shuffles them). Negative years = BCE.
- Eracle: A specific historical event with a precise year. Clues go from vague to specific but the last clue should still require knowledge.
- Borderle: A historical empire, kingdom, or civilization. The options array must contain the correct empire + 5 plausible wrong answers from the same general era or region. Include the correct answer somewhere in the middle of the options array, not always first.
- Cover ALL world history — rotate regions: Asia, Africa, Americas, Middle East, Europe, South/Southeast Asia. Do NOT default to Western events.
- Mix difficulty: one or two obscure events alongside well-known ones.
- ONLY return the raw JSON object. Nothing else.`;

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
      max_tokens: 2000,
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

  // Basic validation
  if (
    !puzzle.chronicle?.events?.length === 5 ||
    !puzzle.eracle?.clues ||
    !puzzle.borderle?.options
  ) {
    throw new Error('Puzzle JSON is missing required fields');
  }

  // Ensure date field is set
  puzzle.date = dateStr;

  // Write to public/puzzles/YYYY-MM-DD.json
  const outDir = path.join(__dirname, '..', 'public', 'puzzles');
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `${dateStr}.json`);
  fs.writeFileSync(outPath, JSON.stringify(puzzle, null, 2));
  console.log(`✓ Puzzle written to public/puzzles/${dateStr}.json`);
}

generatePuzzle().catch(err => {
  console.error('Puzzle generation failed:', err);
  process.exit(1);
});
