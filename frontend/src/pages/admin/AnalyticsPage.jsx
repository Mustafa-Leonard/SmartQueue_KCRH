import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Table from '../../components/common/Table.jsx';
import * as analyticsApi from '../../api/analyticsApi.js';
import * as branchApi from '../../api/branchApi.js';
import { ActiveDotIcon, ClockIcon, DownloadIcon, CalendarIcon, TrendingUpIcon, TrendingDownIcon } from '../../components/common/Icons.jsx';
import { extractData, extractArray } from '../../utils/apiUtils.js';

const COLORS = ['hsl(226, 68%, 50%)', 'hsl(172, 66%, 40%)', 'hsl(38, 85%, 48%)', 'hsl(348, 75%, 50%)', 'hsl(152, 60%, 40%)'];

export default function AnalyticsPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [kpis, setKpis] = useState(null);
  const [ticketsToday, setTicketsToday] = useState([]);
  const [waitTimes, setWaitTimes] = useState([]);
  const [counterPerf, setCounterPerf] = useState([]);
  const [serviceDistribution, setServiceDistribution] = useState([]);
  const [dateRange, setDateRange] = useState('today');
  const [loading, setLoading] = useState(true);

  const loadBranches = async () => {
    try {
      const res = await branchApi.getBranches();
      const branchList = extractArray(res, 'branches');
      setBranches(branchList);
      if (branchList.length > 0) setSelectedBranch(branchList[0].id);
      else setLoading(false);
    } catch (err) {
      toast.error('Failed to load departments');
      setLoading(false);
    }
  };

  const loadAnalytics = async (branchId) => {
    setLoading(true);
    try {
      const days = dateRange === 'weekly' ? 7 : dateRange === 'monthly' ? 30 : 1;
      const [kpisRes, todayRes, waitRes, perfRes, distRes] = await Promise.all([
        analyticsApi.getOverviewKPIs(branchId),
        analyticsApi.getTicketsToday(branchId),
        analyticsApi.getWaitTimes(branchId, days),
        analyticsApi.getCounterPerf(branchId),
        analyticsApi.getServiceDistribution(branchId).catch(() => ({ data: { distribution: [] } }))
      ]);
      setKpis(extractData(kpisRes) || kpisRes);
      const todayPayload = extractData(todayRes);
      setTicketsToday(Array.isArray(todayPayload) ? todayPayload : (todayPayload?.breakdown || []));
      const waitPayload = extractData(waitRes);
      setWaitTimes(Array.isArray(waitPayload) ? waitPayload : (waitPayload?.trends || []));
      const perfPayload = extractData(perfRes);
      setCounterPerf(Array.isArray(perfPayload) ? perfPayload : (perfPayload?.performance || []));
      const distPayload = extractData(distRes);
      setServiceDistribution(Array.isArray(distPayload) ? distPayload : (distPayload?.distribution || []));
    } catch (err) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBranches(); }, []);
  useEffect(() => { if (selectedBranch) loadAnalytics(selectedBranch); }, [selectedBranch, dateRange]);

  const handleExportCSV = () => {
    if (counterPerf.length === 0) { toast.error('No data to export'); return; }
    const headers = 'Counter,Staff,Served,Avg Time\n';
    const rows = counterPerf.map(r => `${r.name},${r.staffName || 'Vacant'},${r.servedCount || 0},${r.avgServeMinutes || 0}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `analytics-${selectedBranch}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const columns = [
    { header: 'Counter', accessor: 'counterNumber', render: (val, row) => <strong>#{row.counterNumber} - {row.name}</strong> },
    { header: 'Staff', accessor: 'staff', render: (val, row) => <span>{row.staffName || 'Vacant'}</span> },
    { header: 'Served', accessor: 'servedCount', render: (val) => <Badge variant="success">{val} served</Badge> },
    { header: 'Avg Time', accessor: 'avgServeMinutes', render: (val) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><ClockIcon size={14} /> {val} min</span> }
  ];

  const selectStyle = { padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontFamily: 'var(--font-family)', fontSize: '0.875rem' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Analytics & KPI Reports</h1>
          <p>Real-time and historic reports tracking waiting times, service efficiency, and department performance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={selectStyle}>
            <option value="today">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
          </select>
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={selectStyle}>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
          <Button variant="secondary" size="sm" onClick={handleExportCSV} icon={<DownloadIcon size={14} />}>Export CSV</Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', padding: '5rem', justifyContent: 'center' }}><Spinner size="lg" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* KPIs */}
          {kpis && (
            <div className="stats-grid">
              <Card style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Registered</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{kpis.ticketsToday}</h3>
              </Card>
              <Card style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Completed</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>{kpis.completed || 0}</h3>
              </Card>
              <Card style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>No-Shows</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-error)', marginTop: '0.25rem' }}>{kpis.noShow || 0}</h3>
              </Card>
              <Card style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Avg Wait</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-info)', marginTop: '0.25rem' }}>{kpis.avgWaitMinutes} min</h3>
              </Card>
              <Card style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Skipped</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>{kpis.skipped || 0}</h3>
              </Card>
              <Card style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Open Counters</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{kpis.openCounters || 0}/{kpis.totalCounters || 0}</h3>
              </Card>
            </div>
          )}

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {/* Hourly volume */}
            <Card>
              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Hourly Registrations</h3>
                <div style={{ width: '100%', height: 300 }}>
                  {ticketsToday.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>No data today</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketsToday} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                        <XAxis dataKey="hour" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                        <Bar dataKey="tickets" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </Card>

            {/* Wait time trend */}
            <Card>
              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Wait Time Trend ({dateRange === 'today' ? 'Today' : dateRange === 'weekly' ? '7 Days' : '30 Days'})
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                  {waitTimes.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={waitTimes} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                        <XAxis dataKey="date" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                        <Line type="monotone" dataKey="avgWaitMinutes" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} name="Wait (min)" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </Card>

            {/* Service Distribution Pie */}
            {serviceDistribution.length > 0 && (
              <Card>
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Service Distribution</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={serviceDistribution} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {serviceDistribution.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            )}

            {/* Performance Summary */}
            {counterPerf.length > 0 && (
              <Card>
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Desk Performance</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={counterPerf} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                        <XAxis type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} width={80} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                        <Bar dataKey="servedCount" fill="var(--color-success)" radius={[0, 4, 4, 0]} name="Served" />
                        <Bar dataKey="avgServeMinutes" fill="var(--color-accent)" radius={[0, 4, 4, 0]} name="Avg Time (min)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Performance Table */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ActiveDotIcon size={10} color="var(--color-success)" /> Desk Performance Details
            </h2>
            <Card>
              <Table columns={columns} data={counterPerf} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
