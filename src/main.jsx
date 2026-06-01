import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const company = {
  name: 'Northstar Health',
  legalName: 'Northstar Health Systems Pvt. Ltd.',
  region: 'India Operations',
  headquarters: 'Bengaluru',
  payCycle: 'Monthly',
  fiscalYear: 'FY 2026',
  brandMark: 'NH',
};

const employees = [
  { id: 'NH-1024', name: 'Aarav Menon', role: 'Clinical Operations Lead', team: 'Operations', site: 'Bengaluru', status: 'Active', type: 'Full-time', manager: 'Mira Shah', salary: '₹28.4L', score: 94 },
  { id: 'NH-1041', name: 'Diya Nair', role: 'People Partner', team: 'People', site: 'Hyderabad', status: 'Active', type: 'Full-time', manager: 'Sameer Rao', salary: '₹21.2L', score: 91 },
  { id: 'NH-1058', name: 'Kabir Sethi', role: 'Revenue Analyst', team: 'Finance', site: 'Mumbai', status: 'On Leave', type: 'Full-time', manager: 'Anika Bose', salary: '₹18.6L', score: 88 },
  { id: 'NH-1063', name: 'Ishita Roy', role: 'Talent Sourcer', team: 'Recruiting', site: 'Remote', status: 'Active', type: 'Contract', manager: 'Diya Nair', salary: '₹11.8L', score: 86 },
  { id: 'NH-1077', name: 'Rohan Iyer', role: 'Security Engineer', team: 'Technology', site: 'Pune', status: 'Probation', type: 'Full-time', manager: 'Neel Verma', salary: '₹32.0L', score: 90 },
  { id: 'NH-1080', name: 'Meera Thomas', role: 'Compliance Officer', team: 'Legal', site: 'Bengaluru', status: 'Active', type: 'Full-time', manager: 'Mira Shah', salary: '₹24.7L', score: 96 },
];

const hiringStages = [
  { label: 'Applied', count: 42, delta: '+8 this week' },
  { label: 'Screen', count: 18, delta: '6 pending' },
  { label: 'Interview', count: 11, delta: '3 today' },
  { label: 'Offer', count: 5, delta: '2 approvals' },
  { label: 'Joining', count: 3, delta: 'Jun cohort' },
];

const initialRequests = [
  { id: 1, person: 'Kabir Sethi', type: 'Medical leave', days: '3 days', period: 'Jun 3-5', status: 'Pending' },
  { id: 2, person: 'Priya Kulkarni', type: 'Work from home', days: '2 days', period: 'Jun 6-7', status: 'Pending' },
  { id: 3, person: 'Rohan Iyer', type: 'Comp off', days: '1 day', period: 'Jun 10', status: 'Approved' },
];

const navItems = [
  'Command Center',
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
  Employees: 'M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c.3-4 2.7-6 5-6s4.7 2 5 6H2Zm11.5 0c.2-2.5 1.5-4.2 3.5-4.2 2.1 0 3.6 1.7 3.9 4.2h-7.4Z',
  Recruiting: 'M4 5h16v4H4V5Zm0 6h10v4H4v-4Zm0 6h16v2H4v-2Zm13-6 4 2-4 2v-4Z',
  Attendance: 'M5 3h14v18H5V3Zm3 4h8v2H8V7Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z',
  Payroll: 'M4 6h16v12H4V6Zm2 3a2 2 0 0 0 2-1h8a2 2 0 0 0 2 1v6a2 2 0 0 0-2 1H8a2 2 0 0 0-2-1V9Zm6 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  Performance: 'M4 18 9 9l4 4 7-9v14H4Z',
  Policies: 'M6 3h9l3 3v15H6V3Zm8 1v4h4M9 11h6v2H9v-2Zm0 4h6v2H9v-2Z',
  Assets: 'M4 7 12 3l8 4v10l-8 4-8-4V7Zm8 2 4-2-4-2-4 2 4 2Zm-6 .5v6l5 2.5v-6L6 9.5Zm12 0-5 2.5v6l5-2.5v-6Z',
};

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
  const [requests, setRequests] = useState(initialRequests);
  const [selectedPeriod, setSelectedPeriod] = useState('June 2026');
  const [pipelineBoost, setPipelineBoost] = useState(0);

  const teams = ['All', ...new Set(employees.map((employee) => employee.team))];
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesTeam = teamFilter === 'All' || employee.team === teamFilter;
      const haystack = `${employee.name} ${employee.role} ${employee.site} ${employee.status}`.toLowerCase();
      return matchesTeam && haystack.includes(search.toLowerCase());
    });
  }, [search, teamFilter]);

  const approveRequest = (id, status) => {
    setRequests((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
  };

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
          <span>Compliance health</span>
          <strong>98%</strong>
          <div className="meter"><i style={{ width: '98%' }} /></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{active}</h1>
            <p>{company.legalName} · {company.headquarters} · {company.fiscalYear}</p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button">Export</button>
            <button className="primary-button">Add employee</button>
          </div>
        </header>

        {active === 'Command Center' && (
          <CommandCenter
            requests={requests}
            approveRequest={approveRequest}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            pipelineBoost={pipelineBoost}
            setPipelineBoost={setPipelineBoost}
          />
        )}
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
        {active === 'Recruiting' && <RecruitingView pipelineBoost={pipelineBoost} setPipelineBoost={setPipelineBoost} />}
        {active === 'Attendance' && <AttendanceView requests={requests} approveRequest={approveRequest} />}
        {active === 'Payroll' && <PayrollView selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />}
        {active === 'Performance' && <PerformanceView />}
        {active === 'Policies' && <PoliciesView />}
        {active === 'Assets' && <AssetsView />}
      </section>
    </main>
  );
}

function CommandCenter({ requests, approveRequest, selectedPeriod, setSelectedPeriod, pipelineBoost, setPipelineBoost }) {
  return (
    <div className="screen-grid">
      <section className="hero-panel">
        <div>
          <h2>Workforce operating system for {company.name}</h2>
          <p>One control plane for employee records, hiring, attendance, payroll readiness, policy compliance, and performance cycles.</p>
        </div>
        <div className="hero-metrics" aria-label="Workforce metrics">
          <Metric label="Headcount" value="486" trend="+18 QoQ" />
          <Metric label="Open roles" value={String(47 + pipelineBoost)} trend="12 priority" />
          <Metric label="Payroll ready" value="97%" trend={selectedPeriod} />
        </div>
      </section>

      <section className="wide-panel">
        <SectionHeader title="Operating Snapshot" action="Today" />
        <div className="snapshot-grid">
          <Metric label="Time-in accuracy" value="96.8%" trend="+1.2%" />
          <Metric label="Offer acceptance" value="72%" trend="+4%" />
          <Metric label="Attrition risk" value="8.4%" trend="-1.1%" />
          <Metric label="Policy attestations" value="441/486" trend="45 due" />
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
        <SectionHeader title="Hiring Pipeline" action="Move requisitions" />
        <Pipeline pipelineBoost={pipelineBoost} setPipelineBoost={setPipelineBoost} />
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

function RecruitingView({ pipelineBoost, setPipelineBoost }) {
  return (
    <div className="stack">
      <section className="wide-panel">
        <SectionHeader title="Hiring Pipeline" action={`${47 + pipelineBoost} active candidates`} />
        <Pipeline pipelineBoost={pipelineBoost} setPipelineBoost={setPipelineBoost} />
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

function PayrollView({ selectedPeriod, setSelectedPeriod }) {
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
        <SectionHeader title="Cost Summary" action="₹12.8Cr" />
        <Metric label="Fixed pay" value="₹10.9Cr" trend="85%" />
        <Metric label="Variable pay" value="₹1.2Cr" trend="9%" />
        <Metric label="Benefits" value="₹0.7Cr" trend="6%" />
      </section>
    </div>
  );
}

function PerformanceView() {
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
        <SectionHeader title="High Potential Bench" action="24 people" />
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
            <span>{request.type} · {request.days} · {request.period}</span>
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

function Pipeline({ pipelineBoost, setPipelineBoost }) {
  return (
    <div className="pipeline">
      {hiringStages.map((stage, index) => (
        <article className="pipeline-stage" key={stage.label}>
          <span>{stage.label}</span>
          <strong>{stage.count + (index === 0 ? pipelineBoost : 0)}</strong>
          <small>{stage.delta}</small>
        </article>
      ))}
      <button className="primary-button" onClick={() => setPipelineBoost((count) => count + 1)}>
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
