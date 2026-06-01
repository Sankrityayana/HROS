import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const navItems = [
  'Command Center',
  'Talent AI',
  'Employees',
  'Recruiting',
  'Attendance',
  'Payroll',
  'Performance',
  'Policies',
  'Assets',
];

const iconPaths = {
  'Command Center': 'M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z',
  'Talent AI': 'M12 3 14.6 8.6 21 9.3 16.2 13.7 17.6 20 12 16.8 6.4 20 7.8 13.7 3 9.3 9.4 8.6 12 3Z',
  Employees: 'M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c.3-4 2.7-6 5-6s4.7 2 5 6H2Zm11.5 0c.2-2.5 1.5-4.2 3.5-4.2 2.1 0 3.6 1.7 3.9 4.2h-7.4Z',
  Recruiting: 'M4 5h16v4H4V5Zm0 6h10v4H4v-4Zm0 6h16v2H4v-2Zm13-6 4 2-4 2v-4Z',
  Attendance: 'M5 3h14v18H5V3Zm3 4h8v2H8V7Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z',
  Payroll: 'M4 6h16v12H4V6Zm2 3a2 2 0 0 0 2-1h8a2 2 0 0 0 2 1v6a2 2 0 0 0-2 1H8a2 2 0 0 0-2-1V9Zm6 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  Performance: 'M4 18 9 9l4 4 7-9v14H4Z',
  Policies: 'M6 3h9l3 3v15H6V3Zm8 1v4h4M9 11h6v2H9v-2Zm0 4h6v2H9v-2Z',
  Assets: 'M4 7 12 3l8 4v10l-8 4-8-4V7Zm8 2 4-2-4-2-4 2 4 2Zm-6 .5v6l5 2.5v-6L6 9.5Zm12 0-5 2.5v6l5-2.5v-6Z',
};

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
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'API request failed.');
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

  const { company, employees, requests, hiringStages, metrics, insights } = data;

  useEffect(() => {
    loadHrData();
    loadRanking();
  }, []);

  async function loadHrData() {
    try {
      const hrData = await api('/api/hr');
      setData(hrData);
      setStatus('Connected to HR OS API');
    } catch (error) {
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
          {navItems.map((item) => (
            <button
              key={item}
              className={active === item ? 'nav-item active' : 'nav-item'}
              onClick={() => setActive(item)}
            >
              <Icon name={item} />
              <span>{item}</span>
            </button>
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
            <p>{company.legalName} | {company.headquarters} | {company.fiscalYear}</p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={loadHrData}>Refresh</button>
            <button className="primary-button">Add employee</button>
          </div>
        </header>

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
        {active === 'Attendance' && <AttendanceView requests={requests} approveRequest={approveRequest} />}
        {active === 'Payroll' && <PayrollView company={company} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />}
        {active === 'Performance' && <PerformanceView employees={employees} />}
        {active === 'Policies' && <PoliciesView />}
        {active === 'Assets' && <AssetsView />}
      </section>
    </main>
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
    <div className="two-column">
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
    </div>
  );
}

function PoliciesView() {
  return (
    <div className="stack">
      <section className="wide-panel">
        <SectionHeader title="Policy Attestation" action="45 due" />
        <div className="policy-grid">
          {['Code of Conduct', 'Information Security', 'POSH Training', 'Leave Policy'].map((policy, index) => (
            <article className="policy-item" key={policy}>
              <strong>{policy}</strong>
              <span>{[96, 91, 88, 94][index]}% complete</span>
              <div className="meter"><i style={{ width: `${[96, 91, 88, 94][index]}%` }} /></div>
            </article>
          ))}
        </div>
      </section>
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
