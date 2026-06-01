# HR OS: AI Talent Ranking Engine

Proof of Concept for an AI-powered recruiter system that ranks candidates beyond keyword filters. The project includes a full-stack web app, backend APIs, deterministic ranking engine, sample challenge dataset, and generated shortlist output.

## Mission Coverage

- Deep Job Understanding: parses a nuanced job description into relevance features and required hiring-intelligence concepts.
- Contextual Relevance: expands terms with domain synonyms such as `semantic search`, `ranking models`, `candidate matching`, and `recruiter workflows`.
- Signal Integration: combines profile attributes, skills, role history, seniority, platform activity, response rate, and job-change intent.
- Ranked Output: produces an explainable ranked shortlist in JSON and CSV.

## HR OS Project Scope

This project is framed as an HR OS project, not a production replacement for an HR department. It demonstrates how one web system can centralize and partially automate repetitive HR workflows.

Covered modules:

- Recruitment & Hiring: create job description, post jobs, source candidates, screen resumes, shortlist candidates, schedule interviews, coordinate interviews, collect feedback, select candidates, generate offer letters, negotiate offers, and hire candidates.
- Onboarding: collect documents, verify documents, create employee records, assign onboarding tasks, and conduct orientation.
- Employee Management: maintain employee database, manage employee records, update employee information, and handle transfers/promotions.
- Attendance & Leave: track attendance, manage leave requests, approve/reject leave, and monitor absenteeism.
- Payroll & Benefits: process salaries, manage reimbursements, handle tax documents, and manage benefits/insurance.
- Performance Management: set goals, conduct reviews, gather feedback, and track performance.
- Employee Relations: resolve conflicts, handle grievances, conduct engagement activities, and support employee wellbeing.
- Compliance & Policies: maintain HR policies, ensure labor law compliance, manage contracts, and conduct audits.
- Learning & Development: identify skill gaps, assign training, track certifications, and support career development planning.
- Analytics & Reporting: hiring metrics, attrition analysis, workforce planning, and HR reports.

Project positioning:

- This is a complete academic/demo project for an AI-powered HR OS concept.
- It is not marketed as a production HRMS.
- It shows how AI and workflow automation can reduce repetitive HR workload and support HR decision-making.

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

The committed output generator uses a fixed timestamp so repeated verification does not create noisy file changes.

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

If the page loads but API calls fail with `ECONNREFUSED 127.0.0.1:4173`, the backend process is not running. Stop the terminal with `Ctrl+C` and run `npm run dev` again. The dev script auto-restarts the API process and keeps the frontend fixed to port `5173`; if that port is already in use, stop the old Vite process before restarting.

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

- Code: full-stack implementation in this repository.
- Blueprint: this README documents the HR OS scope, AI methodology, architecture, and technical choices.
- Results: ranked shortlist files are included in `outputs/`.
- Verification: `npm run build` and `npm run rank` pass.
