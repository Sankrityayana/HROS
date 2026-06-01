# HR OS: AI Talent Ranking Engine

Proof of Concept for an AI-powered recruiter system that ranks candidates beyond keyword filters. The project includes a full-stack web app, backend APIs, deterministic ranking engine, sample challenge dataset, and generated shortlist output.

## Mission Coverage

- Deep Job Understanding: parses a nuanced job description into relevance features and required hiring-intelligence concepts.
- Contextual Relevance: expands terms with domain synonyms such as `semantic search`, `ranking models`, `candidate matching`, and `recruiter workflows`.
- Signal Integration: combines profile attributes, skills, role history, seniority, platform activity, response rate, and job-change intent.
- Ranked Output: produces an explainable ranked shortlist in JSON and CSV.

## Architecture

```text
React + Vite UI
  |
  | /api/hr, /api/ai/ask, /api/talent/rank
  v
Express API
  |
  |-- HR operations data: server/data/hr-data.json
  |-- Challenge data: challenge/job-description.txt + challenge/candidates.json
  |-- Ranking engine: server/ranking/ranker.js
  |-- Output generator: scripts/generate-ranked-output.js
```

## Ranking Methodology

The ranking engine is intentionally deterministic for a challenge POC, so every reviewer gets the same output. It can later be swapped for embeddings, LLM rerankers, or trained learning-to-rank models.

Score components:

- `contextual_relevance` - expanded token and synonym overlap with the job description.
- `skill_signal` - coverage of required concepts for predictive hiring systems.
- `seniority_fit` - experience years and career progression metadata.
- `behavioral_signal` - profile completeness, response rate, project activity, and job-change intent.
- `activity_recency` - recent candidate activity.
- `availability_intent` - open-to-work flag plus inferred intent.

Weighted final score:

```text
34% contextual relevance
21% skill signal
15% seniority fit
15% behavioral signal
 8% activity recency
 7% availability intent
```

Each candidate output includes rank, score, recommendation, component scores, matched signals, and an explanation.

## Dataset

Sample structured challenge inputs:

- `challenge/job-description.txt`
- `challenge/candidates.json`

The candidate schema supports:

- profile attributes: `headline`, `skills`, `current_role`, `industry`
- career metadata: companies, progression, activity recency, location, open-to-work
- behavioral signals: profile completeness, response rate, recent project activity, job-change intent

## Ranked Output

Generated files:

- `outputs/ranked_shortlist.json`
- `outputs/ranked_shortlist.csv`

Regenerate them with:

```powershell
npm run rank
```

## Run Locally

```powershell
npm install
npm run dev
```

Frontend:

```text
http://127.0.0.1:5173/
```

Backend:

```text
http://127.0.0.1:4173/api/health
```

Talent ranking API:

```text
GET http://127.0.0.1:4173/api/talent/rank
POST http://127.0.0.1:4173/api/talent/rank
```

POST body:

```json
{
  "jobDescription": "Job text here",
  "candidates": [],
  "limit": 10
}
```

## AI Copilot

The HR dashboard includes an AI copilot:

- Without `OPENAI_API_KEY`, it uses deterministic local recommendations from live HR data.
- With `OPENAI_API_KEY`, it calls OpenAI for natural-language HR analysis.

Set up OpenAI mode:

```powershell
copy .env.example .env
```

Then set:

```text
OPENAI_API_KEY=your_key_here
```

Restart:

```powershell
npm run dev
```

## Scripts

```powershell
npm run dev
npm run client
npm run server
npm run rank
npm run build
```

## Submission Checklist

- Code: full implementation in this repository.
- Blueprint: this README documents the method, architecture, and technical choices.
- Results: ranked shortlist files are included in `outputs/`.
