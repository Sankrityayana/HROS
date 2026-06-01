import 'dotenv/config';
import express from 'express';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, 'data', 'hr-data.json');
const app = express();
const port = Number(process.env.PORT || 4173);

app.use(express.json({ limit: '1mb' }));

async function readData() {
  return JSON.parse(await readFile(dataPath, 'utf8'));
}

async function writeData(data) {
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function buildInsights(data) {
  const pendingRequests = data.requests.filter((request) => request.status === 'Pending').length;
  const highPerformers = data.employees.filter((employee) => employee.score >= 90).length;
  const probation = data.employees.filter((employee) => employee.status === 'Probation').length;
  const remoteWorkers = data.employees.filter((employee) => employee.site === 'Remote').length;

  return [
    `${pendingRequests} leave or WFH requests are waiting for approval.`,
    `${highPerformers} people are in the high-performance bench and should be reviewed for retention planning.`,
    `${probation} employee is in probation and needs manager check-ins before confirmation.`,
    `${remoteWorkers} remote employee should be included in attendance and asset compliance reviews.`,
  ];
}

function fallbackAiAnswer(question, data) {
  const lower = question.toLowerCase();
  const insights = buildInsights(data);

  if (lower.includes('payroll')) {
    return `Payroll is ${data.metrics.payrollReady}% ready. Prioritize attendance sync, tax checks, and finance approval before creating the bank file.`;
  }

  if (lower.includes('leave') || lower.includes('attendance')) {
    return `${insights[0]} Attendance accuracy is ${data.metrics.timeAccuracy}%, so the immediate action is clearing pending approvals before payroll lock.`;
  }

  if (lower.includes('hiring') || lower.includes('recruit')) {
    const activeCandidates = data.hiringStages.reduce((total, stage) => total + stage.count, 0);
    return `The hiring pipeline has ${activeCandidates} candidates across ${data.hiringStages.length} stages. Screen and offer stages need the closest follow-up because they directly affect joining velocity.`;
  }

  return `For ${data.company.name}, the strongest HR priorities are: ${insights.join(' ')}`;
}

async function aiAnswer(question, data) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      mode: 'local',
      answer: fallbackAiAnswer(question, data),
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: [
      {
        role: 'system',
        content: 'You are an HR operations analyst. Give concise, practical answers based only on the supplied company HR data. Do not invent employee records.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          question,
          company: data.company,
          metrics: data.metrics,
          employees: data.employees,
          requests: data.requests,
          hiringStages: data.hiringStages,
        }),
      },
    ],
  });

  return {
    mode: 'openai',
    answer: response.output_text,
  };
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'hr-os-api' });
});

app.get('/api/hr', async (_request, response, next) => {
  try {
    const data = await readData();
    response.json({ ...data, insights: buildInsights(data) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/requests/:id', async (request, response, next) => {
  try {
    const data = await readData();
    const id = Number(request.params.id);
    const status = String(request.body.status || '');
    const allowed = new Set(['Pending', 'Approved', 'Denied']);

    if (!allowed.has(status)) {
      response.status(400).json({ error: 'Unsupported request status.' });
      return;
    }

    const leaveRequest = data.requests.find((item) => item.id === id);
    if (!leaveRequest) {
      response.status(404).json({ error: 'Request not found.' });
      return;
    }

    leaveRequest.status = status;
    await writeData(data);
    response.json({ request: leaveRequest, insights: buildInsights(data) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/candidates', async (_request, response, next) => {
  try {
    const data = await readData();
    data.hiringStages[0].count += 1;
    data.metrics.openRoles += 1;
    await writeData(data);
    response.status(201).json({
      hiringStages: data.hiringStages,
      metrics: data.metrics,
      insights: buildInsights(data),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/ask', async (request, response, next) => {
  try {
    const question = String(request.body.question || '').trim();
    if (!question) {
      response.status(400).json({ error: 'Question is required.' });
      return;
    }

    const data = await readData();
    response.json(await aiAnswer(question, data));
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'HR OS API error.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`HR OS API running at http://127.0.0.1:${port}`);
});
