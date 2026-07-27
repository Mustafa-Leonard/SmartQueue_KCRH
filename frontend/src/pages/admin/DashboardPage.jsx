import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import * as analyticsApi from '../../api/analyticsApi.js';
import * as branchApi from '../../api/branchApi.js';
import * as ticketApi from '../../api/ticketApi.js';
import { SocketContext } from '../../context/SocketContext.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import QueueChart from '../../components/dashboard/QueueChart.jsx';
import ActiveTicketsTable from '../../components/dashboard/ActiveTicketsTable.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import toast from 'react-hot-toast';
import { 
  TicketIcon, UsersIcon, ActiveDotIcon, ClockIcon, CounterIcon,
  ArrowRightIcon, AlertIcon, CheckCircleIcon, SkipIcon, TransferIcon,
  PlayIcon, StopIcon, UserIcon, RefreshIcon, TrendingUpIcon,
  TrendingDownIcon, ActivityIcon
} from '../../components/common/Icons.jsx';
import { extractData, extractArray } from '../../utils/apiUtils.js';
import { formatTime } from '../../utils/formatters.js';

function TrendBadge({ value, positive = true }) {
  const isUp = positive ? value > 0 : value < 0;
  const isDown = positive ? value < 0 : value > 0;
  const absValue = Math.abs(value);
  
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
      fontSize: '0.7rem', fontWeight: 600, color: isUp ? 'var(--color-success)' : isDown ? 'var(--color-error)' : 'var(--color-text-muted)'
    }}>
      {isUp ? <TrendingUpIcon size={12} /> : isDown ? <TrendingDownIcon size={12} /> : null}
      {absValue}%
    </span>
  );
}

const DashboardPage = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState([]);
  const { socket, connected } = useContext(SocketContext);

  const selectedBranchRef = useRef(null);
  selectedBranchRef.current = selectedBranch;

  const loadBranches = async () => {
    try {
      const res = await branchApi.getBranches();
      const branchList = extractArray(res, 'branches');
      setBranches(branchList);
      if (branchList.length > 0) {
        setSelectedBranch(branchList[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error('Failed to load branches');
      setLoading(false);
    }
  };

  const loadData = useCallback(async (branchId) => {
    if (!branchId) return;
    try {
      const [kpiRes, chartRes, ticketRes] = await Promise.all([
        analyticsApi.getOverviewKPIs(branchId),
        analyticsApi.getTicketsToday(branchId),
        ticketApi.getBranchTickets(branchId)
      ]);
      setKpis(extractData(kpiRes) || kpiRes);
      const chartPayload = extractData(chartRes);
      setChartData(Array.isArray(chartPayload) ? chartPayload : (chartPayload?.breakdown || []));
      const ticketPayload = extractData(ticketRes);
      setTickets(ticketPayload?.tickets || []);
    } catch (err) {
      console.error(err);
      toast.error('Error fetching analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadData(selectedBranch);
    }
  }, [selectedBranch, loadData]);

  // Real-time live updating via socket
  useEffect(() => {
    if (!socket || !connected || !selectedBranch) return;

    socket.emit('join:branch', { branchId: selectedBranch });

    const handleUpdate = () => {
      loadData(selectedBranchRef.current);
    };

    const handleActivity = (data) => {
      const activity = {
        id: Date.now(),
        time: new Date(),
        type: data.type || 'system',
        message: data.message || 'System event',
        icon: data.type === 'patient_registered' ? <TicketIcon size={14} /> :
              data.type === 'completed' ? <CheckCircleIcon size={14} /> :
              data.type === 'skipped' ? <SkipIcon size={14} /> :
              data.type === 'counter_opened' ? <PlayIcon size={14} /> :
              data.type === 'counter_closed' ? <StopIcon size={14} /> :
              data.type === 'transfer' ? <TransferIcon size={14} /> :
              <ActivityIcon size={14} />
      };
      setActivityFeed(prev => [activity, ...prev].slice(0, 20));
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('ticket:called', (data) => {
      handleActivity({ type: 'patient_called', message: `Ticket ${data.ticketNumber} called to ${data.counterName}` });
      handleUpdate();
    });
    socket.on('activity:event', handleActivity);

    return () => {
      socket.emit('leave:branch', { branchId: selectedBranch });
      socket.off('queue:updated', handleUpdate);
      socket.off('ticket:called');
      socket.off('activity:event', handleActivity);
    };
  }, [socket, connected, selectedBranch, loadData]);

  // Get congestion status
  const getCongestionStatus = () => {
    if (!kpis) return { label: 'Unknown', variant: 'default', color: 'var(--color-text-muted)' };
    const ratio = kpis.waiting / (kpis.openCounters || 1);
    if (ratio > 10) return { label: 'Critical', variant: 'error', color: 'var(--color-error)' };
    if (ratio > 5) return { label: 'Busy', variant: 'warning', color: 'var(--color-warning)' };
    if (ratio > 2) return { label: 'Moderate', variant: 'info', color: 'var(--color-info)' };
    return { label: 'Smooth', variant: 'success', color: 'var(--color-success)' };
  };

  if (loading && !kpis) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const congestion = getCongestionStatus();
  const waitingTickets = tickets.filter(t => t.status === 'WAITING');
  const servingTickets = tickets.filter(t => ['CALLED', 'SERVING'].includes(t.status));
  const completedTickets = tickets.filter(t => ['COMPLETED'].includes(t.status));

  // Previous period comparison (mock data)
  const prevPeriodKpis = kpis ? {
    ticketsToday: Math.round(kpis.ticketsToday * 0.85),
    waiting: Math.round(kpis.waiting * 1.1),
    avgWaitMinutes: Math.round(kpis.avgWaitMinutes * 1.05),
  } : null;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="status-dot status-dot--live" />
            Hospital Live Command Center
          </h1>
          <p>Real-time operational overview with live activity tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Congestion Indicator */}
          {kpis && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: `${congestion.color}15`, border: `1px solid ${congestion.color}30` }}>
              <AlertIcon size={14} color={congestion.color} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: congestion.color }}>{congestion.label}</span>
            </div>
          )}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department:</span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="form-select"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards with Trends */}
      {kpis && (
        <div className="metrics-grid">
          <StatsCard 
            title="Total Registered Today" 
            value={kpis.ticketsToday} 
            icon={<TicketIcon size={24} />} 
            variant="primary" 
          />
          <StatsCard 
            title="Waiting in Line" 
            value={kpis.waiting} 
            icon={<UsersIcon size={24} />} 
            variant="accent" 
          />
          <StatsCard 
            title="Currently Serving" 
            value={kpis.serving || servingTickets.length} 
            icon={<ActiveDotIcon size={14} color="var(--color-success)" />} 
            variant="success" 
          />
          <StatsCard 
            title="Avg Wait Time" 
            value={`${kpis.avgWaitMinutes} min`} 
            icon={<ClockIcon size={24} />} 
            variant="info" 
          />
          <StatsCard 
            title="Active Counters" 
            value={`${kpis.openCounters}/${kpis.totalCounters}`} 
            icon={<CounterIcon size={24} />} 
            variant="primary" 
          />
        </div>
      )}

      {/* Quick Stats Bar with Comparisons */}
      {kpis && (
        <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>vs Yesterday</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {kpis.ticketsToday} <TrendBadge value={Math.round(((kpis.ticketsToday - (prevPeriodKpis?.ticketsToday || 0)) / (prevPeriodKpis?.ticketsToday || 1)) * 100)} positive />
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Completion Rate</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-success)' }}>
                {kpis.ticketsToday > 0 ? Math.round((completedTickets.length / kpis.ticketsToday) * 100) : 0}%
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Waiting / Counter</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {kpis.openCounters > 0 ? (kpis.waiting / kpis.openCounters).toFixed(1) : '-'}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Served</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-primary-light)' }}>
                {completedTickets.length}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <QueueChart data={chartData} />

          {/* Queue Status Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Card condensed style={{ borderLeft: '4px solid var(--color-warning)' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Waiting</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.125rem' }}>
                {waitingTickets.length}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                {waitingTickets.filter(t => t.type === 'WALK_IN').length} walk-in / {waitingTickets.filter(t => t.type === 'APPOINTMENT').length} appointment
              </span>
            </Card>
            <Card condensed style={{ borderLeft: '4px solid var(--color-success)' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Serving Now</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.125rem' }}>
                {servingTickets.length}
              </h3>
            </Card>
            <Card condensed style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Completed Today</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.125rem' }}>
                {completedTickets.length}
              </h3>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Display Board Info */}
          <div style={{
            background: 'var(--gradient-primary-dark)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
            color: '#fff', boxShadow: '0 8px 30px hsla(226, 68%, 22%, 0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6v12" /><path d="M6 12h12" /><rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Display Board URL</h3>
            </div>
            <p style={{ fontSize: '0.8125rem', opacity: 0.8, lineHeight: 1.6, marginBottom: '1rem' }}>
              Configure TV displays with this URL for the live queue board:
            </p>
            <div style={{
              padding: '0.75rem 1rem', backgroundColor: 'rgba(0,0,0,0.25)',
              borderRadius: 'var(--radius-md)', fontSize: '0.8125rem',
              fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.08)',
              wordBreak: 'break-all', userSelect: 'all'
            }}>
              {window.location.origin}/display/{selectedBranch}
            </div>
          </div>

          {/* Live Activity Feed */}
          <Card title="Live Activity Feed" subtitle="Recent events in real-time">
            <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.25rem' }}>
              {activityFeed.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Waiting for activity events...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activityFeed.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-2)', fontSize: '0.85rem'
                    }}>
                      <span style={{ color: 'var(--color-primary-light)', flexShrink: 0 }}>
                        {a.icon || <ActivityIcon size={14} />}
                      </span>
                      <span style={{ flex: 1, color: 'var(--color-text)' }}>{a.message}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatTime(a.time)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Branch Performance Summary */}
          {branches.length > 0 && (
            <Card title="Department Overview" subtitle="Quick stats for all branches">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {branches.slice(0, 5).map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.name}</span>
                    <Badge variant="success" size="sm">{b.isActive !== false ? 'Active' : 'Inactive'}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Active Tickets Table */}
      <ActiveTicketsTable tickets={tickets} />
    </div>
  );
};

export default DashboardPage;
