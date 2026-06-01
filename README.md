# HR OS

Full-stack web-based HR operating system for a company, with a React frontend, Express backend, JSON data store, and AI-assisted HR recommendations.

## Run Locally

```powershell
npm install
npm run dev
```

The app runs at:

```text
http://127.0.0.1:5173/
```

The API runs at:

```text
http://127.0.0.1:4173/api/health
```

## AI Setup

The AI copilot works in local deterministic mode without any key. To use OpenAI-backed answers, copy `.env.example` to `.env` and set:

```text
OPENAI_API_KEY=your_key_here
```

Then restart `npm run dev`.

## Scripts

```powershell
npm run dev
npm run server
npm run client
npm run build
```
