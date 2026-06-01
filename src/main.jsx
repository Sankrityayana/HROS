import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const navItems = [
  'Command Center',
  'Talent AI',
  'Recruiting',
  'Onboarding',
  'Employees',
  'Attendance',
  'Payroll',
  'Performance',
  'Relations',
  'Compliance',
  'Learning',
  'Analytics',
  'Assets',
  'Audit',
];

const navGroups = [
  { label: 'Control', items: ['Command Center', 'Talent AI'] },
  { label: 'People Ops', items: ['Recruiting', 'Onboarding', 'Employees', 'Attendance', 'Payroll'] },
  { label: 'Culture', items: ['Performance', 'Relations', 'Learning'] },
  { label: 'Governance', items: ['Compliance', 'Analytics', 'Assets', 'Audit'] },
];

const pageMeta = {
  'Command Center': 'Executive overview of HR operations, AI insights, approvals, payroll readiness, and hiring flow.',
  'Talent AI': 'Predictive ranking workspace for intelligent candidate shortlisting.',
  Recruiting: 'End-to-end hiring operations from job intake to candidate hire.',
  Onboarding: 'Document collection, verification, employee records, tasks, and orientation.',
  Employees: 'Employee database, profile updates, records, transfers, and promotions.',
  Attendance: 'Attendance health, leave approvals, absenteeism signals, and exceptions.',
  Payroll: 'Salary readiness, reimbursements, tax documents, benefits, and payroll controls.',
  Performance: 'Goals, reviews, feedback, performance tracking, and high-potential bench.',
  Relations: 'Grievances, conflict resolution, engagement, and wellbeing support.',
  Compliance: 'Policies, labor compliance, contracts, and audit readiness.',
  Learning: 'Skill gaps, training assignments, certifications, and career plans.',
  Analytics: 'Hiring metrics, attrition analysis, workforce planning, and HR reports.',
  Assets: 'Assigned assets, access tokens, warranty risks, and exit recovery.',
  Audit: 'Role-based activity history for approvals, hiring, employee updates, and admin actions.',
};

const iconPaths = {
  'Command Center': 'M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z',
  'Talent AI': 'M12 3 14.6 8.6 21 9.3 16.2 13.7 17.6 20 12 16.8 6.4 20 7.8 13.7 3 9.3 9.4 8.6 12 3Z',
  Recruiting: 'M4 5h16v4H4V5Zm0 6h10v4H4v-4Zm0 6h16v2H4v-2Zm13-6 4 2-4 2v-4Z',
  Onboarding: 'M5 4h10l4 4v12H5V4Zm9 1v4h4M8 12h8v2H8v-2Zm0 4h6v2H8v-2Z',
  Employees: 'M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c.3-4 2.7-6 5-6s4.7 2 5 6H2Zm11.5 0c.2-2.5 1.5-4.2 3.5-4.2 2.1 0 3.6 1.7 3.9 4.2h-7.4Z',
  Attendance: 'M5 3h14v18H5V3Zm3 4h8v2H8V7Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z',
  Payroll: 'M4 6h16v12H4V6Zm2 3a2 2 0 0 0 2-1h8a2 2 0 0 0 2 1v6a2 2 0 0 0-2 1H8a2 2 0 0 0-2-1V9Zm6 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  Performance: 'M4 18 9 9l4 4 7-9v14H4Z',
  Relations: 'M4 6h16v9H8l-4 4V6Zm5 3h6v2H9V9Zm0 4h8v2H9v-2Z',
  Compliance: 'M6 3h9l3 3v15H6V3Zm8 1v4h4M9 11h6v2H9v-2Zm0 4h6v2H9v-2Z',
  Learning: 'M4 5 12 2l8 3v10l-8 3-8-3V5Zm4 13h8v3H8v-3Z',
  Analytics: 'M4 19V5h2v14H4Zm5 0v-8h2v8H9Zm5 0V8h2v11h-2Zm5 0V3h2v16h-2Z',
  Assets: 'M4 7 12 3l8 4v10l-8 4-8-4V7Zm8 2 4-2-4-2-4 2 4 2Zm-6 .5v6l5 2.5v-6L6 9.5Zm12 0-5 2.5v6l5-2.5v-6Z',
  Audit: 'M5 3h14v18H5V3Zm3 4h8v2H8V7Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Zm8 1 2 2 4-5-1.5-1.2-2.6 3.2-1.1-1.1L16 16Z',
};

const hiringWorkflow = [
  { title: 'Create job description', owner: 'Talent Partner', status: 'Ready', detail: 'AI-assisted JD generated from role intake.' },
  { title: 'Post jobs', owner: 'Recruiting Ops', status: 'Live', detail: 'LinkedIn, careers page, and referral portal.' },
  { title: 'Source candidates', owner: 'Sourcing', status: 'Running', detail: 'Talent AI ranks inbound and sourced profiles.' },
  { title: 'Screen resumes', owner: 'Recruiter', status: 'In review', detail: 'Semantic fit and signal-based resume screen.' },
  { title: 'Shortlist candidates', owner: 'Hiring Manager', status: '5 shortlisted', detail: 'Shortlist generated from ranking engine.' },
  { title: 'Schedule interviews', owner: 'Coordinator', status: 'Today', detail: 'Panel slots reserved across time zones.' },
  { title: 'Coordinate interviews', owner: 'Coordinator', status: 'On track', detail: 'Calendar, reminders, and panel briefs.' },
  { title: 'Collect feedback', owner: 'Interview Panel', status: '3 pending', detail: 'Structured scorecards due within 24 hours.' },
  { title: 'Select candidates', owner: 'Hiring Manager', status: 'Decision', detail: 'Calibration compares skills, signal, and fit.' },
  { title: 'Generate offer letters', owner: 'HR Ops', status: 'Draft', detail: 'Offer packet and compensation template ready.' },
  { title: 'Negotiate offers', owner: 'Recruiter', status: 'Open', detail: 'Approval guardrails and counter-offer notes.' },
  { title: 'Hire candidates', owner: 'People Ops', status: '2 joining', detail: 'Move accepted offers into onboarding.' },
];

const onboardingTasks = [
  { title: 'Collect documents', status: '12 pending', owner: 'New hires', detail: 'Identity, address, education, bank, and tax forms.' },
  { title: 'Verify documents', status: '6 in review', owner: 'People Ops', detail: 'Background and statutory verification queue.' },
  { title: 'Create employee records', status: '3 ready', owner: 'HRIS Admin', detail: 'Employee IDs, reporting lines, pay groups.' },
  { title: 'Assign onboarding tasks', status: 'Live', owner: 'Buddy + IT', detail: 'Laptop, accounts, seating, induction checklist.' },
  { title: 'Conduct orientation', status: 'Fri 10:00', owner: 'People Team', detail: 'Culture, compliance, benefits, and team intro.' },
];

const employeeOps = [
  { title: 'Maintain employee database', status: '486 records', owner: 'HRIS', detail: 'Single source of truth for employee lifecycle data.' },
  { title: 'Manage employee records', status: '21 updates', owner: 'People Ops', detail: 'Contracts, compensation, manager, role and location history.' },
  { title: 'Update employee information', status: '8 requests', owner: 'Employees', detail: 'Self-service updates with HR approval.' },
  { title: 'Handle transfers/promotion', status: '5 active', owner: 'HRBP', detail: 'Transfer letters, org changes, grade updates.' },
];

const payrollBenefits = [
  { title: 'Process salaries', status: '97% ready', owner: 'Payroll', detail: 'Inputs locked, attendance synced, tax checks pending.' },
  { title: 'Manage reimbursements', status: '34 claims', owner: 'Finance', detail: 'Travel, wellness, internet, and business expenses.' },
  { title: 'Handle tax documents', status: '5 pending', owner: 'Employees', detail: 'Declarations, proofs, Form 16, and exemptions.' },
  { title: 'Manage benefits and insurance', status: '441 enrolled', owner: 'Benefits', detail: 'Medical, life, wellness, and dependent coverage.' },
];

const performanceOps = [
  { title: 'Set goals', status: '82%', owner: 'Managers', detail: 'OKRs and role goals aligned to teams.' },
  { title: 'Conduct review', status: '61%', owner: 'Managers', detail: 'Mid-year review cycle in progress.' },
  { title: 'Gather feedback', status: '34%', owner: 'Peers', detail: '360 feedback and panel comments.' },
  { title: 'Track performance', status: 'Live', owner: 'HRBP', detail: 'Performance trends, high-potential bench, and risk flags.' },
];

const relationsOps = [
  { title: 'Resolve conflicts', status: '2 open', owner: 'HRBP', detail: 'Mediation plans and manager action logs.' },
  { title: 'Handle grievances', status: '1 urgent', owner: 'Employee Relations', detail: 'Confidential case management with SLA tracking.' },
  { title: 'Conduct engagement activities', status: '4 planned', owner: 'Culture Team', detail: 'Pulse surveys, town halls, team rituals.' },
  { title: 'Support employee wellbeing', status: 'Active', owner: 'Wellbeing Lead', detail: 'Counselling, wellness reimbursements, burnout signals.' },
];

const complianceOps = [
  { title: 'Maintain HR policies', status: '4 due', owner: 'Policy Owner', detail: 'Code of conduct, leave, POSH, information security.' },
  { title: 'Ensure labor law compliance', status: '98%', owner: 'Legal', detail: 'State rules, working hours, statutory registers.' },
  { title: 'Manage contracts', status: '17 renewals', owner: 'Legal Ops', detail: 'Employment, contractor, vendor, and offer contracts.' },
  { title: 'Conduct audits', status: 'Q2 audit', owner: 'Compliance', detail: 'Payroll, access, documents, policy attestation.' },
];

const learningOps = [
  { title: 'Identify skill gaps', status: '39 gaps', owner: 'L&D', detail: 'Role matrix compared with performance and project needs.' },
  { title: 'Assign training', status: '126 assigned', owner: 'Managers', detail: 'Compliance, leadership, technical, and product modules.' },
  { title: 'Track certifications', status: '72 valid', owner: 'L&D Admin', detail: 'Expiry alerts and certification evidence.' },
  { title: 'Career development planning', status: '24 plans', owner: 'HRBP', detail: 'Internal mobility, mentoring, succession readiness.' },
];

const analyticsReports = [
  { title: 'Hiring metrics', status: '47 open roles', owner: 'Talent Ops', detail: 'Source quality, time-to-hire, offer acceptance, funnel conversion.' },
  { title: 'Attrition analysis', status: '8.4% risk', owner: 'People Analytics', detail: 'Risk by team, tenure, manager, engagement and performance.' },
  { title: 'Workforce planning', status: 'FY 2026', owner: 'Leadership', detail: 'Headcount plan, capacity forecast, critical roles.' },
  { title: 'HR reports', status: '12 reports', owner: 'HR Ops', detail: 'Board pack, compliance report, payroll summary, DEI snapshot.' },
];

const defaultData = {
  company: {
    name: 'HR OS',
    legalName: 'Company HR Operations',
    region: 'Global',
    headquarters: 'HQ',
    payCycle: 'Monthly',
    fiscalYear: 'FY 2026',
    brandMark: 'HR',
  },
  employees: [],
  requests: [],
  hiringStages: [],
  jobs: [],
  auditLogs: [],
  insights: [],
  metrics: {
    headcount: 0,
    openRoles: 0,
    payrollReady: 0,
    timeAccuracy: 0,
    offerAcceptance: 0,
    attritionRisk: 0,
    policyAttested: 0,
    policyTotal: 0,
  },
};

async function api(path, options) {
  const token = localStorage.getItem('hr_os_token');
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || 'API request failed.');
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path d={iconPaths[name] || iconPaths['Command Center']} />
    </svg>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('hr_os_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [active, setActive] = useState('Command Center');
  const [teamFilter, setTeamFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('June 2026');
  const [data, setData] = useState(defaultData);
  const [status, setStatus] = useState('Loading HR data...');
  const [aiQuestion, setAiQuestion] = useState('What should HR prioritize today?');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiMode, setAiMode] = useState('local');
  const [aiLoading, setAiLoading] = useState(false);
  const [ranking, setRanking] = useState(null);
  const [rankingStatus, setRankingStatus] = useState('Loading ranking engine...');
  const [employeeDraft, setEmployeeDraft] = useState(null);
  const [actionStatus, setActionStatus] = useState('');

  const { company, employees, requests, hiringStages, metrics, insights, auditLogs } = data;

  useEffect(() => {
    if (session) {
      loadHrData();
      loadRanking();
    }
  }, [session]);

  async function login(credentials) {
    const result = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('hr_os_token', result.token);
    localStorage.setItem('hr_os_session', JSON.stringify(result.user));
    setSession(result.user);
    setStatus('Connected to HR OS API');
  }

  function logout() {
    localStorage.removeItem('hr_os_token');
    localStorage.removeItem('hr_os_session');
    setSession(null);
    setData(defaultData);
    setRanking(null);
    setActive('Command Center');
  }

  if (!session) {
    return <LoginScreen login={login} status={status} />;
  }

  async function loadHrData() {
    try {
      const hrData = await api('/api/hr');
      setData(hrData);
      setStatus('Connected to HR OS API');
    } catch (error) {
      if (error.status === 401) {
        logout();
        return;
      }
      setStatus(error.message);
    }
  }

  async function approveRequest(id, requestStatus) {
    const updated = await api(`/api/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: requestStatus }),
    });

    setData((current) => ({
      ...current,
      requests: current.requests.map((request) => (request.id === id ? updated.request : request)),
      insights: updated.insights,
    }));
  }

  async function addCandidate() {
    const updated = await api('/api/candidates', { method: 'POST' });
    setData((current) => ({
      ...current,
      hiringStages: updated.hiringStages,
      metrics: updated.metrics,
      insights: updated.insights,
    }));
  }

  async function createEmployee(event) {
    event.preventDefault();
    setActionStatus('Creating employee...');
    try {
      const created = await api('/api/employees', {
        method: 'POST',
        body: JSON.stringify(employeeDraft),
      });
      setData((current) => ({
        ...current,
        employees: [...current.employees, created.employee],
        metrics: created.metrics,
        insights: created.insights,
      }));
      setEmployeeDraft(null);
      setActionStatus(`Created ${created.employee.name}`);
    } catch (error) {
      setActionStatus(error.message);
    }
  }

  async function askAi(event) {
    event.preventDefault();
    setAiLoading(true);
    try {
      const result = await api('/api/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ question: aiQuestion }),
      });
      setAiAnswer(result.answer);
      setAiMode(result.mode);
    } catch (error) {
      setAiAnswer(error.message);
      setAiMode('error');
    } finally {
      setAiLoading(false);
    }
  }

  async function loadRanking() {
    try {
      const result = await api('/api/talent/rank');
      setRanking(result);
      setRankingStatus('Ranking engine ready');
    } catch (error) {
      setRankingStatus(error.message);
    }
  }

  const teams = ['All', ...new Set(employees.map((employee) => employee.team))];
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesTeam = teamFilter === 'All' || employee.team === teamFilter;
      const haystack = `${employee.name} ${employee.role} ${employee.site} ${employee.status}`.toLowerCase();
      return matchesTeam && haystack.includes(search.toLowerCase());
    });
  }, [employees, search, teamFilter]);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">{company.brandMark}</div>
          <div>
            <strong>{company.name}</strong>
            <span>{company.region}</span>
          </div>
        </div>
        <nav>
          {navGroups.map((group) => (
            <section className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item}
                  className={active === item ? 'nav-item active' : 'nav-item'}
                  onClick={() => setActive(item)}
                >
                  <Icon name={item} />
                  <span>{item}</span>
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>API status</span>
          <strong>{status.startsWith('Connected') ? 'Live' : 'Check'}</strong>
          <small>{status}</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{active}</h1>
            <p>{pageMeta[active]}</p>
          </div>
          <div className="topbar-actions">
            <div className="context-pill">{company.headquarters} | {company.fiscalYear}</div>
            <div className="user-pill">{session.name}<span>{session.role}</span></div>
            <button className="ghost-button" onClick={loadHrData}>Refresh</button>
            <button className="primary-button" onClick={() => setEmployeeDraft({
              name: '',
              role: '',
              team: 'People',
              site: company.headquarters,
              status: 'Active',
              type: 'Full-time',
              manager: session.name,
              salary: 'INR TBD',
              score: 78,
            })}>Add employee</button>
            <button className="ghost-button" onClick={logout}>Logout</button>
          </div>
        </header>
        {actionStatus && <div className="notice-bar">{actionStatus}</div>}
        {employeeDraft && (
          <EmployeeModal
            draft={employeeDraft}
            setDraft={setEmployeeDraft}
            createEmployee={createEmployee}
            close={() => setEmployeeDraft(null)}
          />
        )}

        {active === 'Command Center' && (
          <CommandCenter
            company={company}
            metrics={metrics}
            requests={requests}
            hiringStages={hiringStages}
            insights={insights}
            approveRequest={approveRequest}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            addCandidate={addCandidate}
            aiQuestion={aiQuestion}
            setAiQuestion={setAiQuestion}
            aiAnswer={aiAnswer}
            aiMode={aiMode}
            aiLoading={aiLoading}
            askAi={askAi}
          />
        )}
        {active === 'Talent AI' && <TalentAiView ranking={ranking} rankingStatus={rankingStatus} loadRanking={loadRanking} />}
        {active === 'Employees' && (
          <EmployeesView
            teams={teams}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            search={search}
            setSearch={setSearch}
            filteredEmployees={filteredEmployees}
          />
        )}
        {active === 'Recruiting' && <RecruitingView hiringStages={hiringStages} addCandidate={addCandidate} />}
        {active === 'Onboarding' && <LifecycleView title="Onboarding" intro="Move accepted candidates into productive employees with document, verification, HRIS, task, and orientation controls." items={onboardingTasks} />}
        {active === 'Attendance' && <AttendanceView requests={requests} approveRequest={approveRequest} />}
        {active === 'Payroll' && <PayrollView company={company} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />}
        {active === 'Performance' && <PerformanceView employees={employees} />}
        {active === 'Relations' && <LifecycleView title="Employee Relations" intro="Track conflict resolution, grievances, engagement activity, and wellbeing support in one confidential operating queue." items={relationsOps} />}
        {active === 'Compliance' && <LifecycleView title="Compliance & Policies" intro="Maintain policies, contracts, labor law controls, and audit readiness across the organization." items={complianceOps} />}
        {active === 'Learning' && <LifecycleView title="Learning & Development" intro="Identify skill gaps, assign training, track certifications, and plan career development." items={learningOps} />}
        {active === 'Analytics' && <LifecycleView title="Analytics & Reporting" intro="Monitor hiring metrics, attrition analysis, workforce planning, and executive HR reports." items={analyticsReports} />}
        {active === 'Assets' && <AssetsView />}
        {active === 'Audit' && <AuditView auditLogs={auditLogs} />}
      </section>
    </main>
  );
}

function LoginScreen({ login, status }) {
  const [credentials, setCredentials] = useState({ email: 'admin@northstar.example', password: 'admin123' });
  const [message, setMessage] = useState(status);
  const demoUsers = [
    ['Admin', 'admin@northstar.example', 'admin123'],
    ['HR', 'hr@northstar.example', 'hr123'],
    ['Manager', 'manager@northstar.example', 'manager123'],
  ];

  async function submit(event) {
    event.preventDefault();
    setMessage('Signing in...');
    try {
      await login(credentials);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-copy">
          <div className="brand-mark">NH</div>
          <h1>Northstar HR OS</h1>
          <p>Product-grade HR operations workspace with role access, AI hiring intelligence, employee records, approvals, payroll readiness, and audit history.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <h2>Sign in</h2>
          <label>
            <span>Email</span>
            <input value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />
          </label>
          <button className="primary-button">Enter HR OS</button>
          <div className="demo-logins">
            {demoUsers.map(([role, email, password]) => (
              <button
                type="button"
                key={role}
                onClick={() => setCredentials({ email, password })}
              >
                {role}
              </button>
            ))}
          </div>
          <span className="login-status">{message}</span>
        </form>
      </section>
    </main>
  );
}

function EmployeeModal({ draft, setDraft, createEmployee, close }) {
  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create employee">
      <form className="employee-modal" onSubmit={createEmployee}>
        <SectionHeader title="Create Employee Record" action="HR/Admin" />
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input required value={draft.name} onChange={(event) => update('name', event.target.value)} />
          </label>
          <label>
            <span>Role</span>
            <input required value={draft.role} onChange={(event) => update('role', event.target.value)} />
          </label>
          <label>
            <span>Team</span>
            <input value={draft.team} onChange={(event) => update('team', event.target.value)} />
          </label>
          <label>
            <span>Site</span>
            <input value={draft.site} onChange={(event) => update('site', event.target.value)} />
          </label>
          <label>
            <span>Manager</span>
            <input value={draft.manager} onChange={(event) => update('manager', event.target.value)} />
          </label>
          <label>
            <span>Salary</span>
            <input value={draft.salary} onChange={(event) => update('salary', event.target.value)} />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={close}>Cancel</button>
          <button className="primary-button">Create record</button>
        </div>
      </form>
    </div>
  );
}

function AuditView({ auditLogs }) {
  return (
    <div className="stack">
      <section className="hero-panel module-hero">
        <div>
          <h2>Audit-ready HR operations</h2>
          <p>Every sensitive HR workflow records actor, role, action, entity, and timestamp so the project behaves like a real governed HR platform.</p>
        </div>
        <div className="hero-metrics">
          <Metric label="Events" value={String(auditLogs.length)} trend="Latest 100 retained" />
          <Metric label="Protected writes" value="6" trend="Role checked" />
          <Metric label="Access model" value="RBAC" trend="Demo sessions" />
        </div>
      </section>
      <section className="wide-panel">
        <SectionHeader title="Activity History" action="Admin and HR only" />
        <div className="audit-list">
          {auditLogs.map((entry) => (
            <article className="audit-row" key={entry.id}>
              <div>
                <strong>{entry.action}</strong>
                <span>{entry.detail}</span>
              </div>
              <div>
                <strong>{entry.actor.name}</strong>
                <span>{entry.actor.role} | {entry.entity} | {new Date(entry.at).toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function LifecycleView({ title, intro, items }) {
  return (
    <div className="stack">
      <section className="hero-panel module-hero">
        <div>
          <h2>{title}</h2>
          <p>{intro}</p>
        </div>
        <div className="hero-metrics">
          <Metric label="Workflows" value={String(items.length)} trend="Configured" />
          <Metric label="Open items" value={String(items.filter((item) => !item.status.toLowerCase().includes('ready')).length)} trend="Needs action" />
          <Metric label="Owners" value={String(new Set(items.map((item) => item.owner)).size)} trend="Accountable" />
        </div>
      </section>
      <WorkflowGrid items={items} />
    </div>
  );
}

function TalentAiView({ ranking, rankingStatus, loadRanking }) {
  const candidates = ranking?.ranked_candidates || [];

  return (
    <div className="stack">
      <section className="hero-panel talent-hero">
        <div>
          <h2>Predictive candidate ranking engine</h2>
          <p>Deep job understanding, contextual relevance, career metadata, and behavioral signals are fused into an explainable shortlist.</p>
        </div>
        <div className="hero-metrics">
          <Metric label="Candidates ranked" value={String(candidates.length)} trend={rankingStatus} />
          <Metric label="Top score" value={candidates[0] ? String(candidates[0].score) : '0'} trend={candidates[0]?.recommendation || 'Waiting'} />
          <Metric label="Output file" value="JSON" trend="outputs/ranked_shortlist.json" />
        </div>
      </section>

      <section className="wide-panel">
        <SectionHeader title="Ranked Shortlist" action={ranking?.job_id || 'Challenge POC'} />
        <div className="ranking-actions">
          <button className="primary-button" onClick={loadRanking}>Run ranking</button>
          <span>{rankingStatus}</span>
        </div>
        <div className="ranking-list">
          {candidates.map((candidate) => (
            <article className="ranking-card" key={candidate.candidate_id}>
              <div className="rank-badge">#{candidate.rank}</div>
              <div className="rank-main">
                <div className="rank-title">
                  <div>
                    <strong>{candidate.name}</strong>
                    <span>{candidate.profile_snapshot.headline}</span>
                  </div>
                  <div className="score-pill">{candidate.score}</div>
                </div>
                <p>{candidate.rationale}</p>
                <div className="signal-row">
                  {candidate.matched_signals.slice(0, 6).map((signal) => <span key={signal}>{signal}</span>)}
                </div>
                <div className="score-grid">
                  {Object.entries(candidate.component_scores).map(([label, value]) => (
                    <label key={label}>
                      <span>{label.replaceAll('_', ' ')}</span>
                      <div className="bar"><i style={{ width: `${value}%` }} /></div>
                      <strong>{value}</strong>
                    </label>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wide-panel">
        <SectionHeader title="Methodology Blueprint" action="Explainable scoring" />
        <div className="method-grid">
          {ranking && Object.entries(ranking.methodology).map(([name, description]) => (
            <article key={name}>
              <strong>{name.replaceAll('_', ' ')}</strong>
              <span>{description}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CommandCenter(props) {
  const {
    company,
    metrics,
    requests,
    hiringStages,
    insights,
    approveRequest,
    selectedPeriod,
    setSelectedPeriod,
    addCandidate,
    aiQuestion,
    setAiQuestion,
    aiAnswer,
    aiMode,
    aiLoading,
    askAi,
  } = props;

  return (
    <div className="screen-grid">
      <section className="hero-panel">
        <div>
          <h2>Full-stack HR operating system for {company.name}</h2>
          <p>Employee records, recruiting, attendance, payroll readiness, policy compliance, and AI-assisted HR decisions in one connected workspace.</p>
        </div>
        <div className="hero-metrics" aria-label="Workforce metrics">
          <Metric label="Headcount" value={String(metrics.headcount)} trend="+18 QoQ" />
          <Metric label="Open roles" value={String(metrics.openRoles)} trend="12 priority" />
          <Metric label="Payroll ready" value={`${metrics.payrollReady}%`} trend={selectedPeriod} />
        </div>
      </section>

      <section className="wide-panel">
        <SectionHeader title="AI HR Copilot" action={aiMode === 'openai' ? 'OpenAI' : 'Local mode'} />
        <form className="ai-console" onSubmit={askAi}>
          <input value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder="Ask about payroll, hiring, leave, risk, or policy status" />
          <button className="primary-button" disabled={aiLoading}>{aiLoading ? 'Thinking...' : 'Ask AI'}</button>
        </form>
        <div className="ai-answer">
          {aiAnswer || 'Ask a question to generate an HR recommendation from live company data.'}
        </div>
      </section>

      <section className="wide-panel">
        <SectionHeader title="Operating Snapshot" action="Live API data" />
        <div className="snapshot-grid">
          <Metric label="Time-in accuracy" value={`${metrics.timeAccuracy}%`} trend="+1.2%" />
          <Metric label="Offer acceptance" value={`${metrics.offerAcceptance}%`} trend="+4%" />
          <Metric label="Attrition risk" value={`${metrics.attritionRisk}%`} trend="-1.1%" />
          <Metric label="Policy attestations" value={`${metrics.policyAttested}/${metrics.policyTotal}`} trend="45 due" />
        </div>
      </section>

      <section className="panel">
        <SectionHeader title="AI Insights" action={`${insights.length} signals`} />
        <div className="insight-list">
          {insights.map((insight) => <p key={insight}>{insight}</p>)}
        </div>
      </section>

      <section className="panel">
        <SectionHeader title="Leave Desk" action={`${requests.filter((r) => r.status === 'Pending').length} pending`} />
        <RequestList requests={requests} approveRequest={approveRequest} compact />
      </section>

      <section className="panel">
        <SectionHeader title="Payroll Control" action={selectedPeriod} />
        <PayrollControl selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
      </section>

      <section className="wide-panel">
        <SectionHeader title="Hiring Pipeline" action="Database backed" />
        <Pipeline hiringStages={hiringStages} addCandidate={addCandidate} />
      </section>
    </div>
  );
}

function EmployeesView({ teams, teamFilter, setTeamFilter, search, setSearch, filteredEmployees }) {
  return (
    <div className="stack">
      <section className="wide-panel">
        <SectionHeader title="Employee Management Operations" action="Database, records, updates, movement" />
        <WorkflowGrid items={employeeOps} compact />
      </section>
      <section className="toolbar-band">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees, roles, locations" />
        <div className="segmented" role="group" aria-label="Filter by team">
          {teams.map((team) => (
            <button key={team} className={teamFilter === team ? 'selected' : ''} onClick={() => setTeamFilter(team)}>
              {team}
            </button>
          ))}
        </div>
      </section>
      <EmployeeTable employees={filteredEmployees} />
    </div>
  );
}

function RecruitingView({ hiringStages, addCandidate }) {
  return (
    <div className="stack">
      <section className="hero-panel recruiting-hero">
        <div>
          <h2>Recruitment & Hiring</h2>
          <p>Create jobs, post roles, source talent, screen resumes, shortlist candidates, coordinate interviews, collect feedback, select finalists, generate offers, negotiate, and hire.</p>
        </div>
        <div className="hero-metrics">
          <Metric label="Hiring steps" value={String(hiringWorkflow.length)} trend="End to end" />
          <Metric label="Open roles" value="47" trend="12 priority" />
          <Metric label="Offer acceptance" value="72%" trend="+4%" />
        </div>
      </section>
      <WorkflowGrid items={hiringWorkflow} />
      <section className="wide-panel">
        <SectionHeader title="Hiring Pipeline" action={`${hiringStages.reduce((total, stage) => total + stage.count, 0)} active candidates`} />
        <Pipeline hiringStages={hiringStages} addCandidate={addCandidate} />
      </section>
      <section className="two-column">
        <div className="panel">
          <SectionHeader title="Priority Requisitions" action="Owners" />
          {['Senior Product Manager', 'Payroll Specialist', 'Security Engineer', 'Regional HRBP'].map((role, index) => (
            <div className="row" key={role}>
              <span>{role}</span>
              <strong>{['Mira', 'Diya', 'Neel', 'Sameer'][index]}</strong>
            </div>
          ))}
        </div>
        <div className="panel">
          <SectionHeader title="Candidate Experience" action="Last 30 days" />
          <div className="score-ring"><span>84</span><small>NPS</small></div>
          <p className="muted">Interview feedback SLA is at 91%. Two panels need calibration before the next hiring review.</p>
        </div>
      </section>
    </div>
  );
}

function AttendanceView({ requests, approveRequest }) {
  return (
    <div className="two-column">
      <section className="panel">
        <SectionHeader title="Leave And WFH Requests" action="Action queue" />
        <RequestList requests={requests} approveRequest={approveRequest} />
      </section>
      <section className="panel">
        <SectionHeader title="Attendance Health" action="June" />
        <div className="attendance-bars">
          {[
            ['Bengaluru', 97],
            ['Hyderabad', 95],
            ['Mumbai', 92],
            ['Pune', 98],
            ['Remote', 89],
          ].map(([site, score]) => (
            <label key={site}>
              <span>{site}</span>
              <div className="bar"><i style={{ width: `${score}%` }} /></div>
              <strong>{score}%</strong>
            </label>
          ))}
        </div>
      </section>
      <section className="wide-panel">
        <SectionHeader title="Absenteeism Monitor" action="Exceptions and trend" />
        <div className="absence-grid">
          {[
            ['Unplanned absence', '11 cases', 56],
            ['Late arrivals', '24 events', 72],
            ['No punch records', '7 records', 38],
            ['Leave balance risk', '18 people', 64],
          ].map(([label, value, score]) => (
            <article key={label}>
              <strong>{label}</strong>
              <span>{value}</span>
              <div className="bar"><i style={{ width: `${score}%` }} /></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PayrollView({ company, selectedPeriod, setSelectedPeriod }) {
  return (
    <div className="screen-grid">
      <section className="wide-panel">
        <SectionHeader title="Payroll Run" action={company.payCycle} />
        <PayrollControl selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
      </section>
      <section className="wide-panel">
        <SectionHeader title="Payroll & Benefits Operations" action="Salary, tax, claims, insurance" />
        <WorkflowGrid items={payrollBenefits} compact />
      </section>
      <section className="panel">
        <SectionHeader title="Exception Queue" action="Resolve" />
        {['3 bank detail mismatches', '2 variable pay approvals', '1 exit settlement', '5 tax declarations pending'].map((item) => (
          <div className="row" key={item}><span>{item}</span><button className="text-button">Open</button></div>
        ))}
      </section>
      <section className="panel">
        <SectionHeader title="Cost Summary" action="INR 12.8Cr" />
        <Metric label="Fixed pay" value="INR 10.9Cr" trend="85%" />
        <Metric label="Variable pay" value="INR 1.2Cr" trend="9%" />
        <Metric label="Benefits" value="INR 0.7Cr" trend="6%" />
      </section>
    </div>
  );
}

function PerformanceView({ employees }) {
  return (
    <div className="stack">
      <section className="wide-panel">
        <SectionHeader title="Performance Management Operations" action="Goals, reviews, feedback, tracking" />
        <WorkflowGrid items={performanceOps} compact />
      </section>
      <section className="two-column">
      <section className="panel">
        <SectionHeader title="Review Cycle" action="Mid-year" />
        {['Self reviews', 'Manager reviews', 'Calibration', 'Letters'].map((stage, index) => (
          <div className="stage-row" key={stage}>
            <span>{stage}</span>
            <div className="bar"><i style={{ width: `${[82, 61, 34, 8][index]}%` }} /></div>
            <strong>{[82, 61, 34, 8][index]}%</strong>
          </div>
        ))}
      </section>
      <section className="panel">
        <SectionHeader title="High Potential Bench" action={`${employees.filter((employee) => employee.score >= 90).length} people`} />
        <EmployeeTable employees={employees.filter((employee) => employee.score >= 90)} compact />
      </section>
      </section>
    </div>
  );
}

function WorkflowGrid({ items, compact = false }) {
  return (
    <div className={compact ? 'workflow-grid compact' : 'workflow-grid'}>
      {items.map((item) => (
        <article className="workflow-card" key={item.title}>
          <div className="workflow-top">
            <strong>{item.title}</strong>
            <span>{item.status}</span>
          </div>
          <p>{item.detail}</p>
          <div className="workflow-footer">
            <span>{item.owner}</span>
            <button className="text-button">Open</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function AssetsView() {
  return (
    <div className="two-column">
      <section className="panel">
        <SectionHeader title="Assigned Assets" action="1,184 active" />
        {['Laptops', 'ID cards', 'Medical devices', 'Access tokens'].map((asset, index) => (
          <div className="row" key={asset}>
            <span>{asset}</span>
            <strong>{[512, 486, 132, 54][index]}</strong>
          </div>
        ))}
      </section>
      <section className="panel">
        <SectionHeader title="Asset Exceptions" action="Audit" />
        {['9 devices past warranty', '4 unreturned exit assets', '14 pending access reviews'].map((exception) => (
          <div className="row" key={exception}><span>{exception}</span><button className="text-button">Review</button></div>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value, trend }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </article>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      <span>{action}</span>
    </div>
  );
}

function RequestList({ requests, approveRequest, compact = false }) {
  return (
    <div className={compact ? 'request-list compact' : 'request-list'}>
      {requests.map((request) => (
        <article className="request-row" key={request.id}>
          <div>
            <strong>{request.person}</strong>
            <span>{request.type} | {request.days} | {request.period}</span>
          </div>
          {request.status === 'Pending' ? (
            <div className="request-actions">
              <button onClick={() => approveRequest(request.id, 'Approved')}>Approve</button>
              <button onClick={() => approveRequest(request.id, 'Denied')}>Deny</button>
            </div>
          ) : (
            <span className={`status ${request.status.toLowerCase()}`}>{request.status}</span>
          )}
        </article>
      ))}
    </div>
  );
}

function Pipeline({ hiringStages, addCandidate }) {
  return (
    <div className="pipeline">
      {hiringStages.map((stage) => (
        <article className="pipeline-stage" key={stage.label}>
          <span>{stage.label}</span>
          <strong>{stage.count}</strong>
          <small>{stage.delta}</small>
        </article>
      ))}
      <button className="primary-button" onClick={addCandidate}>
        Add candidate
      </button>
    </div>
  );
}

function PayrollControl({ selectedPeriod, setSelectedPeriod }) {
  return (
    <div className="payroll-control">
      <div className="period-switcher">
        {['April 2026', 'May 2026', 'June 2026'].map((period) => (
          <button key={period} className={selectedPeriod === period ? 'selected' : ''} onClick={() => setSelectedPeriod(period)}>
            {period}
          </button>
        ))}
      </div>
      <div className="payroll-steps">
        {['Inputs locked', 'Attendance synced', 'Tax checked', 'Finance approval', 'Bank file'].map((step, index) => (
          <div className={index < 3 ? 'step done' : 'step'} key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeeTable({ employees: rows, compact = false }) {
  return (
    <section className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            {!compact && <th>Role</th>}
            <th>Team</th>
            {!compact && <th>Site</th>}
            <th>Status</th>
            {!compact && <th>Manager</th>}
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((employee) => (
            <tr key={employee.id}>
              <td><strong>{employee.name}</strong><span>{employee.id}</span></td>
              {!compact && <td>{employee.role}</td>}
              <td>{employee.team}</td>
              {!compact && <td>{employee.site}</td>}
              <td><span className={`status ${employee.status.toLowerCase().replace(' ', '-')}`}>{employee.status}</span></td>
              {!compact && <td>{employee.manager}</td>}
              <td>{employee.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
