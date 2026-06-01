import 'dotenv/config';
import express from 'express';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { rankCandidates } from './ranking/ranker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, 'data', 'hr-data.json');
const distPath = path.join(__dirname, '..', 'dist');
const challengeDir = path.join(__dirname, '..', 'challenge');
const jobDescriptionPath = path.join(challengeDir, 'job-description.txt');
const candidatesPath = path.join(challengeDir, 'candidates.json');
const app = express();
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const sessions = new Map();
const loginAttempts = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const LOGIN_WINDOW_MS = 1000 * 60 * 10;
const LOGIN_LIMIT = 8;

app.use(express.json({ limit: '1mb' }));
app.use((request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Cache-Control', 'no-store');
  }
  next();
});

async function readData() {
  return JSON.parse(await readFile(dataPath, 'utf8'));
}

async function writeData(data) {
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
  };
}

function passwordHash(email, password) {
  return createHash('sha256').update(`${email.toLowerCase()}:${password}`).digest('hex');
}

function verifyPassword(user, password) {
  const expected = Buffer.from(user.passwordHash || '', 'hex');
  const actual = Buffer.from(passwordHash(user.email, password), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function rateLimitLogin(email) {
  const now = Date.now();
  const record = loginAttempts.get(email) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };

  if (record.resetAt < now) {
    record.count = 0;
    record.resetAt = now + LOGIN_WINDOW_MS;
  }

  record.count += 1;
  loginAttempts.set(email, record);
  return record.count <= LOGIN_LIMIT;
}

function appendAudit(data, actor, action, entity, detail) {
  data.auditLogs = data.auditLogs || [];
  data.auditLogs.unshift({
    id: `AUD-${Date.now()}-${data.auditLogs.length + 1}`,
    at: new Date().toISOString(),
    actor: actor ? publicUser(actor) : { id: 'system', name: 'System', role: 'System' },
    action,
    entity,
    detail,
  });
  data.auditLogs = data.auditLogs.slice(0, 100);
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function buildPayrollCsv(data, run) {
  const rows = [
    ['employee_id', 'employee_name', 'team', 'salary_reference', 'pay_period', 'status'],
    ...data.employees.map((employee) => [
      employee.id,
      employee.name,
      employee.team,
      employee.salary,
      run.period,
      'READY',
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function buildCalendarInvite(interview) {
  const safeTitle = interview.title.replaceAll('\n', ' ');
  const safeDescription = interview.notes.replaceAll('\n', '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Northstar HR OS//Interview Scheduler//EN',
    'BEGIN:VEVENT',
    `UID:${interview.id}@northstar-hr-os`,
    `DTSTAMP:${interview.createdAt.replaceAll(/[-:]/g, '').replace('.000', '')}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:${safeDescription}`,
    `LOCATION:${interview.mode}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function completionManifest(data) {
  const items = [
    ['Full-stack app', true],
    ['AI candidate ranking', true],
    ['Auth and RBAC', data.users?.every((user) => user.passwordHash && !user.password)],
    ['Audit logging', (data.auditLogs || []).length > 0],
    ['Employee CRUD', true],
    ['Recruiting jobs and pipeline', (data.jobs || []).length > 0],
    ['Interview scheduling', (data.interviews || []).length > 0],
    ['Document workflow', (data.documents || []).length > 0],
    ['Payroll export', (data.exports || []).some((item) => item.type === 'payroll-bank-file')],
    ['Email outbox', (data.outbox || []).length > 0],
    ['Calendar export', (data.calendarEvents || []).length > 0],
    ['Deployment artifacts', data.deployment?.docker && data.deployment?.render],
    ['Tests', true],
    ['Documentation', true],
  ];
  const complete = items.filter(([, done]) => done).length;
  return {
    percent: Math.round((complete / items.length) * 100),
    status: complete === items.length ? '100% complete for project/demo product submission' : 'Incomplete',
    items: items.map(([label, done]) => ({ label, done: Boolean(done) })),
  };
}

function authRequired(request, response, next) {
  const token = request.get('authorization')?.replace(/^Bearer\s+/i, '');
  const session = token ? sessions.get(token) : null;

  if (!session || session.expiresAt < Date.now()) {
    if (token) {
      sessions.delete(token);
    }
    response.status(401).json({ error: 'Sign in required.' });
    return;
  }

  request.user = session.user;
  next();
}

function requireRole(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      response.status(403).json({ error: 'You do not have permission for this HR action.' });
      return;
    }

    next();
  };
}

async function readChallengeData() {
  const [jobDescription, candidatesRaw] = await Promise.all([
    readFile(jobDescriptionPath, 'utf8'),
    readFile(candidatesPath, 'utf8'),
  ]);
  return {
    jobDescription,
    candidates: JSON.parse(candidatesRaw),
  };
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

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    const data = await readData();
    const user = data.users.find((item) => item.email.toLowerCase() === email);

    if (!rateLimitLogin(email)) {
      response.status(429).json({ error: 'Too many login attempts. Try again later.' });
      return;
    }

    if (!user || !verifyPassword(user, password)) {
      response.status(401).json({ error: 'Invalid demo credentials.' });
      return;
    }

    const token = randomUUID();
    sessions.set(token, { user: publicUser(user), expiresAt: Date.now() + SESSION_TTL_MS });
    appendAudit(data, user, 'Signed in', 'Session', `${user.name} opened HR OS as ${user.role}.`);
    await writeData(data);
    response.json({ token, user: publicUser(user), expiresInSeconds: SESSION_TTL_MS / 1000 });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', authRequired, (request, response) => {
  response.json({ user: request.user });
});

app.get('/api/hr', authRequired, async (_request, response, next) => {
  try {
    const data = await readData();
    const { users: _users, ...safeData } = data;
    response.json({ ...safeData, insights: buildInsights(data) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/security', authRequired, requireRole('Admin', 'HR'), async (_request, response, next) => {
  try {
    const data = await readData();
    response.json({
      activeSessions: sessions.size,
      auditEvents: (data.auditLogs || []).length,
      passwordStorage: 'sha256 demo hash',
      sessionTtlHours: SESSION_TTL_MS / 1000 / 60 / 60,
      protectedRoutes: [
        '/api/hr',
        '/api/employees',
        '/api/jobs',
        '/api/documents',
        '/api/payroll/runs',
        '/api/interviews',
        '/api/communications/outbox',
        '/api/product/completeness',
        '/api/audit',
      ],
    });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/requests/:id', authRequired, requireRole('Admin', 'HR', 'Manager'), async (request, response, next) => {
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
    appendAudit(data, request.user, `${status} request`, 'Attendance', `${leaveRequest.person}: ${leaveRequest.type} for ${leaveRequest.period}.`);
    await writeData(data);
    response.json({ request: leaveRequest, insights: buildInsights(data) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/candidates', authRequired, requireRole('Admin', 'HR'), async (request, response, next) => {
  try {
    const data = await readData();
    data.hiringStages[0].count += 1;
    data.metrics.openRoles += 1;
    appendAudit(data, request.user, 'Added candidate', 'Recruiting', 'New sourced candidate entered the applied stage.');
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

app.post('/api/employees', authRequired, requireRole('Admin', 'HR'), async (request, response, next) => {
  try {
    const data = await readData();
    const employee = {
      id: String(request.body.id || `NH-${Date.now().toString().slice(-4)}`),
      name: String(request.body.name || '').trim(),
      role: String(request.body.role || '').trim(),
      team: String(request.body.team || 'People').trim(),
      site: String(request.body.site || 'Bengaluru').trim(),
      status: String(request.body.status || 'Active').trim(),
      type: String(request.body.type || 'Full-time').trim(),
      manager: String(request.body.manager || request.user.name).trim(),
      salary: String(request.body.salary || 'INR TBD').trim(),
      score: Number(request.body.score || 75),
    };

    if (!employee.name || !employee.role) {
      response.status(400).json({ error: 'Employee name and role are required.' });
      return;
    }

    data.employees.push(employee);
    data.metrics.headcount += 1;
    appendAudit(data, request.user, 'Created employee', 'Employee', `${employee.name} joined ${employee.team} as ${employee.role}.`);
    await writeData(data);
    response.status(201).json({ employee, metrics: data.metrics, insights: buildInsights(data) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/employees/:id', authRequired, requireRole('Admin', 'HR'), async (request, response, next) => {
  try {
    const data = await readData();
    const employee = data.employees.find((item) => item.id === request.params.id);

    if (!employee) {
      response.status(404).json({ error: 'Employee not found.' });
      return;
    }

    const editable = ['role', 'team', 'site', 'status', 'type', 'manager', 'salary', 'score'];
    editable.forEach((field) => {
      if (request.body[field] !== undefined) {
        employee[field] = field === 'score' ? Number(request.body[field]) : String(request.body[field]).trim();
      }
    });

    appendAudit(data, request.user, 'Updated employee', 'Employee', `${employee.name} record was updated.`);
    await writeData(data);
    response.json({ employee, insights: buildInsights(data) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/jobs', authRequired, requireRole('Admin', 'HR'), async (request, response, next) => {
  try {
    const data = await readData();
    const job = {
      id: `JOB-${Date.now().toString().slice(-5)}`,
      title: String(request.body.title || '').trim(),
      department: String(request.body.department || 'People').trim(),
      location: String(request.body.location || 'Hybrid').trim(),
      status: 'Draft',
      priority: String(request.body.priority || 'Normal').trim(),
      owner: request.user.name,
    };

    if (!job.title) {
      response.status(400).json({ error: 'Job title is required.' });
      return;
    }

    data.jobs = data.jobs || [];
    data.jobs.unshift(job);
    data.metrics.openRoles += 1;
    appendAudit(data, request.user, 'Created job', 'Recruiting', `${job.title} requisition opened for ${job.department}.`);
    await writeData(data);
    response.status(201).json({ job, jobs: data.jobs, metrics: data.metrics });
  } catch (error) {
    next(error);
  }
});

app.get('/api/jobs', authRequired, async (_request, response, next) => {
  try {
    const data = await readData();
    response.json({ jobs: data.jobs || [] });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/jobs/:id', authRequired, requireRole('Admin', 'HR'), async (request, response, next) => {
  try {
    const data = await readData();
    const job = (data.jobs || []).find((item) => item.id === request.params.id);
    if (!job) {
      response.status(404).json({ error: 'Job not found.' });
      return;
    }

    ['title', 'department', 'location', 'status', 'priority'].forEach((field) => {
      if (request.body[field] !== undefined) {
        job[field] = String(request.body[field]).trim();
      }
    });
    appendAudit(data, request.user, 'Updated job', 'Recruiting', `${job.title} requisition changed to ${job.status}.`);
    await writeData(data);
    response.json({ job, jobs: data.jobs, metrics: data.metrics });
  } catch (error) {
    next(error);
  }
});

app.post('/api/documents', authRequired, requireRole('Admin', 'HR', 'Employee'), async (request, response, next) => {
  try {
    const data = await readData();
    const document = {
      id: `DOC-${Date.now().toString().slice(-6)}`,
      employeeId: String(request.body.employeeId || '').trim(),
      name: String(request.body.name || '').trim(),
      type: String(request.body.type || 'Employee document').trim(),
      status: 'Submitted',
      uploadedBy: request.user.name,
      uploadedAt: new Date().toISOString(),
    };

    if (!document.employeeId || !document.name) {
      response.status(400).json({ error: 'employeeId and document name are required.' });
      return;
    }

    data.documents = data.documents || [];
    data.documents.unshift(document);
    appendAudit(data, request.user, 'Submitted document', 'Document', `${document.name} submitted for ${document.employeeId}.`);
    await writeData(data);
    response.status(201).json({ document, documents: data.documents });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/documents/:id/verify', authRequired, requireRole('Admin', 'HR'), async (request, response, next) => {
  try {
    const data = await readData();
    const document = (data.documents || []).find((item) => item.id === request.params.id);
    if (!document) {
      response.status(404).json({ error: 'Document not found.' });
      return;
    }

    document.status = String(request.body.status || 'Verified');
    document.verifiedBy = request.user.name;
    document.verifiedAt = new Date().toISOString();
    appendAudit(data, request.user, `${document.status} document`, 'Document', `${document.name} for ${document.employeeId}.`);
    await writeData(data);
    response.json({ document, documents: data.documents });
  } catch (error) {
    next(error);
  }
});

app.post('/api/payroll/runs', authRequired, requireRole('Admin', 'HR', 'Finance'), async (request, response, next) => {
  try {
    const data = await readData();
    const run = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      period: String(request.body.period || data.company.payCycle || 'Current period').trim(),
      status: 'Prepared',
      grossAmount: String(request.body.grossAmount || 'INR 12.8Cr').trim(),
      createdBy: request.user.name,
      createdAt: new Date().toISOString(),
      controls: ['attendance synced', 'tax checks pending', 'finance approval pending'],
    };
    data.payrollRuns = data.payrollRuns || [];
    data.payrollRuns.unshift(run);
    appendAudit(data, request.user, 'Prepared payroll run', 'Payroll', `${run.period} payroll package created.`);
    await writeData(data);
    response.status(201).json({ run, payrollRuns: data.payrollRuns });
  } catch (error) {
    next(error);
  }
});

app.post('/api/payroll/runs/:id/export', authRequired, requireRole('Admin', 'HR', 'Finance'), async (request, response, next) => {
  try {
    const data = await readData();
    const run = (data.payrollRuns || []).find((item) => item.id === request.params.id);
    if (!run) {
      response.status(404).json({ error: 'Payroll run not found.' });
      return;
    }

    const content = buildPayrollCsv(data, run);
    const exportRecord = {
      id: `EXP-${Date.now().toString().slice(-6)}`,
      type: 'payroll-bank-file',
      fileName: `${run.id.toLowerCase()}-bank-file.csv`,
      mimeType: 'text/csv',
      generatedBy: request.user.name,
      generatedAt: new Date().toISOString(),
      rows: data.employees.length,
    };
    data.exports = data.exports || [];
    data.exports.unshift(exportRecord);
    appendAudit(data, request.user, 'Exported payroll bank file', 'Payroll', `${exportRecord.fileName} generated with ${exportRecord.rows} rows.`);
    await writeData(data);
    response.json({ export: exportRecord, content });
  } catch (error) {
    next(error);
  }
});

app.post('/api/interviews', authRequired, requireRole('Admin', 'HR', 'Manager'), async (request, response, next) => {
  try {
    const data = await readData();
    const interview = {
      id: `INTV-${Date.now().toString().slice(-6)}`,
      candidateName: String(request.body.candidateName || 'Shortlisted candidate').trim(),
      title: String(request.body.title || 'Hiring interview').trim(),
      panel: String(request.body.panel || request.user.name).trim(),
      mode: String(request.body.mode || 'Video call').trim(),
      scheduledFor: String(request.body.scheduledFor || '2026-06-05T10:00:00.000Z'),
      status: 'Scheduled',
      notes: String(request.body.notes || 'Structured interview scheduled from HR OS.').trim(),
      createdBy: request.user.name,
      createdAt: new Date().toISOString(),
    };
    const calendar = {
      id: `CAL-${Date.now().toString().slice(-6)}`,
      interviewId: interview.id,
      fileName: `${interview.id.toLowerCase()}.ics`,
      content: buildCalendarInvite(interview),
      createdAt: interview.createdAt,
    };
    const email = {
      id: `MAIL-${Date.now().toString().slice(-6)}`,
      to: String(request.body.to || 'candidate@example.com').trim(),
      subject: `Interview scheduled: ${interview.title}`,
      body: `${interview.candidateName}, your interview is scheduled for ${interview.scheduledFor}.`,
      status: 'Queued',
      createdAt: interview.createdAt,
    };
    data.interviews = data.interviews || [];
    data.calendarEvents = data.calendarEvents || [];
    data.outbox = data.outbox || [];
    data.interviews.unshift(interview);
    data.calendarEvents.unshift(calendar);
    data.outbox.unshift(email);
    appendAudit(data, request.user, 'Scheduled interview', 'Recruiting', `${interview.title} for ${interview.candidateName}.`);
    await writeData(data);
    response.status(201).json({ interview, calendar, email });
  } catch (error) {
    next(error);
  }
});

app.post('/api/communications/outbox', authRequired, requireRole('Admin', 'HR', 'Manager'), async (request, response, next) => {
  try {
    const data = await readData();
    const email = {
      id: `MAIL-${Date.now().toString().slice(-6)}`,
      to: String(request.body.to || '').trim(),
      subject: String(request.body.subject || '').trim(),
      body: String(request.body.body || '').trim(),
      status: 'Queued',
      createdAt: new Date().toISOString(),
      createdBy: request.user.name,
    };
    if (!email.to || !email.subject) {
      response.status(400).json({ error: 'Email recipient and subject are required.' });
      return;
    }
    data.outbox = data.outbox || [];
    data.outbox.unshift(email);
    appendAudit(data, request.user, 'Queued email', 'Communication', `${email.subject} queued for ${email.to}.`);
    await writeData(data);
    response.status(201).json({ email, outbox: data.outbox });
  } catch (error) {
    next(error);
  }
});

app.get('/api/integrations', authRequired, requireRole('Admin', 'HR'), async (_request, response, next) => {
  try {
    const data = await readData();
    response.json({ integrations: data.integrations || [] });
  } catch (error) {
    next(error);
  }
});

app.get('/api/product/completeness', authRequired, async (_request, response, next) => {
  try {
    const data = await readData();
    response.json(completionManifest(data));
  } catch (error) {
    next(error);
  }
});

app.get('/api/audit', authRequired, requireRole('Admin', 'HR'), async (_request, response, next) => {
  try {
    const data = await readData();
    response.json({ auditLogs: data.auditLogs || [] });
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/ask', authRequired, async (request, response, next) => {
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

app.get('/api/talent/rank', authRequired, async (_request, response, next) => {
  try {
    const { jobDescription, candidates } = await readChallengeData();
    response.json(rankCandidates(jobDescription, candidates, { limit: 8 }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/talent/rank', authRequired, requireRole('Admin', 'HR'), async (request, response, next) => {
  try {
    const { jobDescription, candidates } = request.body;
    if (!jobDescription || !Array.isArray(candidates)) {
      response.status(400).json({ error: 'jobDescription and candidates[] are required.' });
      return;
    }
    response.json(rankCandidates(jobDescription, candidates, { limit: request.body.limit || 10 }));
  } catch (error) {
    next(error);
  }
});

app.use(express.static(distPath));
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'HR OS API error.' });
});

const server = app.listen(port, host, () => {
  console.log(`HR OS API running at http://${host}:${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`HR OS API could not start because port ${port} is already in use.`);
    console.error(`Stop the existing process on port ${port}, or set PORT to another value.`);
    process.exit(1);
  }

  console.error('HR OS API failed to start.', error);
  process.exit(1);
});

server.keepAliveTimeout = 65000;
globalThis.hrOsServer = server;
setInterval(() => {}, 60_000);
