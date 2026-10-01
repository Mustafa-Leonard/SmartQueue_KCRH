import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { SocketContext } from '../../context/SocketContext.jsx';
import * as counterApi from '../../api/counterApi.js';
import * as ticketApi from '../../api/ticketApi.js';
import { formatTime } from '../../utils/formatters.js';
import { extractData, extractArray } from '../../utils/apiUtils.js';
import { 
  CounterIcon, RefreshIcon, MegaphoneIcon, CheckCircleIcon, 
  BanIcon, SkipIcon, PlayIcon, ActiveDotIcon, ClockIcon,
  UserIcon, HistoryIcon, TrendingUpIcon, StarIcon
} from '../../components/common/Icons.jsx';

export default function StaffDashboardPage() {
  const { user } = useContext(AuthContext);
  const { socket, connected } = useContext(SocketContext);

  const [counter, setCounter] = useState(null);
  const [waitingTickets, setWaitingTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ totalServed: 0, skipped: 0, noShow: 0 });

  const counterRef = useRef(null);
  counterRef.current = counter;

  const loadStaffCounterAndQueue = useCallback(async () => {
    try {
      const countersRes = await counterApi.getCounters();
      const countersList = extractArray(countersRes, 'counters');
      const myCounter = countersList.find(c => c.staffId === user?.id);
      
      if (!myCounter) {
        setCounter(null);
        setLoading(false);
        return;
      }
      
      setCounter(myCounter);

      const ticketsRes = await ticketApi.getBranchTickets(myCounter.branchId);
      const ticketPayload = extractData(ticketsRes);
      const allTickets = ticketPayload?.tickets || [];
      
      const waiting = allTickets.filter(t => t.status === 'WAITING');
      setWaitingTickets(waiting);

      const active = allTickets.find(t => 
        t.counterId === myCounter.id && 
        ['CALLED', 'SERVING'].includes(t.status)
      );
      setActiveTicket(active || null);

      const past = allTickets.filter(t => 
        t.counterId === myCounter.id
      );
      setRecentTickets(past);
      setStats({
        totalServed: past.filter(t => t.status === 'COMPLETED').length,
        skipped: past.filter(t => t.status === 'SKIPPED').length,
        noShow: past.filter(t => t.status === 'NO_SHOW').length,
      });

    } catch (err) {
      toast.error('Failed to load queue dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) loadStaffCounterAndQueue();
  }, [user, loadStaffCounterAndQueue]);

  useEffect(() => {
    if (!socket || !connected || !counter) return;
    socket.emit('join:branch', { branchId: counter.branchId });
    const handleUpdate = () => loadStaffCounterAndQueue();
    socket.on('queue:updated', handleUpdate);
    socket.on('ticket:called', handleUpdate);
    socket.on('ticket:status_changed', handleUpdate);
    return () => {
      socket.emit('leave:branch', { branchId: counter.branchId });
      socket.off('queue:updated', handleUpdate);
      socket.off('ticket:called', handleUpdate);
      socket.off('ticket:status_changed', handleUpdate);
    };
  }, [socket, connected, counter, loadStaffCounterAndQueue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (activeTicket?.status === 'CALLED') handleStartServe();
        else if (activeTicket?.status === 'SERVING') handleComplete();
        else if (waitingTickets.length > 0 && !activeTicket) handleCallNext();
      }
      if (e.key === 's' || e.key === 'S') { e.preventDefault(); handleSkip(); }
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); handleNoShow(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTicket, waitingTickets]);

  const handleCallNext = async () => {
    if (waitingTickets.length === 0) { toast.error('No patients waiting'); return; }
    if (activeTicket) { toast.error('Complete current patient first'); return; }
    if (counter.status !== 'OPEN') { toast.error('Set counter to OPEN first'); return; }
    setActionLoading(true);
    try {
      await ticketApi.callTicket(waitingTickets[0].id, counter.id);
      toast.success(`Called ${waitingTickets[0].ticketNumber}`);
      loadStaffCounterAndQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to call patient');
    } finally { setActionLoading(false); }
  };

  const handleStartServe = async () => {
    if (!activeTicket) return;
    setActionLoading(true);
    try {
      await ticketApi.serveTicket(activeTicket.id);
      toast.success(`Serving ${activeTicket.ticketNumber}`);
      loadStaffCounterAndQueue();
    } catch (err) { toast.error('Failed to update'); } finally { setActionLoading(false); }
  };

  const handleComplete = async () => {
    if (!activeTicket) return;
    setActionLoading(true);
    try {
      await ticketApi.completeTicket(activeTicket.id);
      toast.success(`Completed ${activeTicket.ticketNumber}`);
      loadStaffCounterAndQueue();
    } catch (err) { toast.error('Failed to complete'); } finally { setActionLoading(false); }
  };

  const handleSkip = async () => {
    if (!activeTicket) return;
    setActionLoading(true);
    try {
      await ticketApi.skipTicket(activeTicket.id);
      toast.success(`Skipped ${activeTicket.ticketNumber}`);
      loadStaffCounterAndQueue();
    } catch (err) { toast.error('Failed to skip'); } finally { setActionLoading(false); }
  };

  const handleNoShow = async () => {
    if (!activeTicket) return;
    setActionLoading(true);
    try {
      await ticketApi.noShowTicket(activeTicket.id);
      toast.success(`No Show: ${activeTicket.ticketNumber}`);
      loadStaffCounterAndQueue();
    } catch (err) { toast.error('Failed to mark'); } finally { setActionLoading(false); }
  };

  const handleToggleStatus = async (newStatus) => {
    if (!counter) return;
    try {
      await counterApi.updateStatus(counter.id, newStatus);
      toast.success(`Desk ${newStatus}`);
      loadStaffCounterAndQueue();
    } catch (err) { toast.error('Failed to update'); }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Spinner size="lg" /></div>;
  }

  if (!counter) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Card style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
          <CounterIcon size={32} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0' }}>Desk Assignment Required</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>You are not assigned to any counter. Contact an administrator.</p>
          <Button variant="primary" onClick={loadStaffCounterAndQueue} icon={<RefreshIcon size={16} />}>Refresh</Button>
        </Card>
      </div>
    );
  }

  const badgeVariants = { OPEN: 'success', CLOSED: 'default', PAUSED: 'warning' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CounterIcon size={24} color="var(--color-primary)" />
            {counter.name}
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              #{counter.number} — {counter.branch?.name}
            </span>
          </h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserIcon size={14} /> {user?.name}
            <span style={{ color: 'var(--color-text-muted)' }}>|</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Space=Call/Complete | S=Skip | N=No Show
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Badge variant={badgeVariants[counter.status]}>{counter.status}</Badge>
          <select value={counter.status} onChange={(e) => handleToggleStatus(e.target.value)} className="form-select" style={{ padding: '0.4rem 0.75rem' }}>
            <option value="OPEN">Open</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <Card condensed>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircleIcon size={20} color="var(--color-success)" />
            <div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Served Today</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.125rem' }}>{stats.totalServed}</h3>
            </div>
          </div>
        </Card>
        <Card condensed>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <SkipIcon size={20} color="var(--color-warning)" />
            <div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Skipped</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.125rem' }}>{stats.skipped}</h3>
            </div>
          </div>
        </Card>
        <Card condensed>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BanIcon size={20} color="var(--color-error)" />
            <div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>No Shows</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-error)', marginTop: '0.125rem' }}>{stats.noShow}</h3>
            </div>
          </div>
        </Card>
        <Card condensed>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ClockIcon size={20} color="var(--color-primary)" />
            <div>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Waiting</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.125rem' }}>{waitingTickets.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', marginTop: '1.5rem' }}>
        {/* Left: Active Patient */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card style={{ padding: '2rem', border: activeTicket ? '2px solid var(--color-primary-100)' : '1px solid var(--color-border)' }}>
            {activeTicket ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <Badge variant={activeTicket.status === 'CALLED' ? 'warning' : 'success'}>
                    {activeTicket.status === 'CALLED' ? 'CALLED' : 'SERVING'}
                  </Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Registered: {formatTime(activeTicket.createdAt)}
                  </span>
                </div>
                <h2 style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--color-primary)', margin: '1rem 0', letterSpacing: '-2px' }}>
                  {activeTicket.ticketNumber}
                </h2>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {activeTicket.customer?.name || 'Walk-In'}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Service: <strong>{activeTicket.service?.name}</strong>
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {activeTicket.status === 'CALLED' ? (
                    <Button variant="primary" size="lg" disabled={actionLoading} onClick={handleStartServe} style={{ minWidth: '160px' }}>
                      <PlayIcon size={18} /> Begin Serving
                    </Button>
                  ) : (
                    <Button variant="primary" size="lg" disabled={actionLoading} onClick={handleComplete} style={{ minWidth: '160px' }}>
                      <CheckCircleIcon size={18} /> Complete
                    </Button>
                  )}
                  <Button variant="ghost" size="lg" disabled={actionLoading} onClick={handleNoShow} style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}>
                    <BanIcon size={18} /> No Show
                  </Button>
                  <Button variant="danger" size="lg" disabled={actionLoading} onClick={handleSkip}>
                    <SkipIcon size={18} /> Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <CounterIcon size={32} color="var(--color-text-secondary)" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', margin: '1rem 0' }}>No Active Patient</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                  {waitingTickets.length > 0 
                    ? `${waitingTickets.length} patient(s) waiting. Click below or press Space to call next.`
                    : 'No patients waiting in queue.'}
                </p>
                <Button variant="primary" size="lg" disabled={actionLoading || waitingTickets.length === 0} onClick={handleCallNext} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                  <MegaphoneIcon size={20} /> Call Next ({waitingTickets.length})
                </Button>
              </div>
            )}
          </Card>

          {/* Waiting Queue */}
          <Card title={`Waiting (${waitingTickets.length})`}>
            {waitingTickets.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No patients waiting.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
                {waitingTickets.map((t, idx) => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: idx === 0 && !activeTicket ? 'var(--color-primary-50)' : 'var(--color-surface-2)',
                    border: `1px solid ${idx === 0 && !activeTicket ? 'var(--color-primary-100)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{t.ticketNumber}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.customer?.name || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.service?.name}</div>
                      </div>
                    </div>
                    <Badge variant={idx === 0 && !activeTicket ? 'primary' : 'default'}>
                      {idx === 0 && !activeTicket ? 'Next' : `#${idx + 1}`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Stats & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card title="Today's Performance">
            <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Served</span>
                <strong>{stats.totalServed}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Skipped</span>
                <strong style={{ color: 'var(--color-warning)' }}>{stats.skipped}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>No Shows</span>
                <strong style={{ color: 'var(--color-error)' }}>{stats.noShow}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Completion Rate</span>
                <strong style={{ color: 'var(--color-success)' }}>
                  {stats.totalServed + stats.skipped + stats.noShow > 0
                    ? Math.round((stats.totalServed / (stats.totalServed + stats.skipped + stats.noShow)) * 100)
                    : 0}%
                </strong>
              </div>
            </div>
          </Card>

          <Card title="Recent Activity" subtitle="Last patients served">
            {recentTickets.length === 0 ? (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No activity yet today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
                {recentTickets.slice(-5).reverse().map(t => {
                  const statusColors = { COMPLETED: 'success', SKIPPED: 'default', NO_SHOW: 'error', CALLED: 'warning', SERVING: 'info' };
                  return (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                      <div>
                        <strong style={{ marginRight: '0.5rem' }}>{t.ticketNumber}</strong>
                        <span style={{ fontSize: '0.85rem' }}>{t.customer?.name || 'Walk-in'}</span>
                      </div>
                      <Badge variant={statusColors[t.status]} size="sm">{t.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
