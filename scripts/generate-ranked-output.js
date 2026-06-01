import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rankCandidates } from '../server/ranking/ranker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const jobPath = path.join(root, 'challenge', 'job-description.txt');
const candidatesPath = path.join(root, 'challenge', 'candidates.json');
const outputDir = path.join(root, 'outputs');
const jsonOutputPath = path.join(outputDir, 'ranked_shortlist.json');
const csvOutputPath = path.join(outputDir, 'ranked_shortlist.csv');

const jobDescription = await readFile(jobPath, 'utf8');
const candidates = JSON.parse(await readFile(candidatesPath, 'utf8'));
const ranking = rankCandidates(jobDescription, candidates, { limit: 8 });

await mkdir(outputDir, { recursive: true });
await writeFile(jsonOutputPath, `${JSON.stringify(ranking, null, 2)}\n`, 'utf8');
await writeFile(csvOutputPath, toCsv(ranking.ranked_candidates), 'utf8');

console.log(`Wrote ${jsonOutputPath}`);
console.log(`Wrote ${csvOutputPath}`);

function toCsv(rows) {
  const headers = ['rank', 'candidate_id', 'name', 'score', 'recommendation', 'matched_signals', 'rationale'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(Array.isArray(row[header]) ? row[header].join('; ') : row[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}
