import React, { useState, useEffect, useContext, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { SocketContext } from '../../context/SocketContext.jsx';
import * as branchApi from '../../api/branchApi.js';
import * as queueApi from '../../api/queueApi.js';
import * as ticketApi from '../../api/ticketApi.js';
import { RefreshIcon, PlayIcon, StopIcon, MegaphoneIcon, SearchIcon } from '../../components/common/Icons.jsx';
import { extractData, extractArray } from '../../utils/apiUtils.js';

export default function QueueManagementPage() {
  const { socket, connected } = useContext(SocketContext);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [queue, setQueue] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBranches = async () => {
    try {
      const res = await branchApi.getBranches();
      const list = extractArray(res, 'branches');
      setBranches(list);
      if (list.length > 0) setSelectedBranch(list[0].id);
      else setLoading(false);
    } catch (err) {
      toast.error('Failed to load departments');
      setLoading(false);
    }
  };

  const loadQueue = async (branchId) => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [queueRes, ticketsRes] = await Promise.all([
        queueApi.getTodayQueue(branchId),
        ticketApi.getBranchTickets(branchId)
      ]);
      const queuePayload = extractData(queueRes);
      setQueue(queuePayload?.queue || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBranches(); }, []);
  useEffect(() => { if (selectedBranch) loadQueue(selectedBranch); }, [selectedBranch]);

  useEffect(() => {
    if (!socket || !connected || !selectedBranch) return;
    socket.emit('join:branch', { branchId: selectedBranch });
    const handleUpdate = () => loadQueue(selectedBranch);
    socket.on('queue:updated', handleUpdate);
    socket.on('ticket:called', handleUpdate);
    return () => {
      socket.emit('leave:branch', { branchId: selectedBranch });
      socket.off('queue:updated', handleUpdate);
      socket.off('ticket:called', handleUpdate);
    };
  }, [socket, connected, selectedBranch]);

  const handleToggleQueue = async (open) => {
    try {
      if (open) {
        await queueApi.openQueue(selectedBranch);
        toast.success('Queue opened for today');
      } else if (queue?.id) {
        await queueApi.closeQueue(queue.id);
        toast.success('Queue closed for today');
      }
      loadQueue(selectedBranch);
    } catch (err) {
      toast.error('Failed to toggle queue status');
    }
  };

  const waitingTickets = queue?.tickets?.filter(t => t.status === 'WAITING') || [];
  const servingTickets = queue?.tickets?.filter(t => ['CALLED', 'SERVING'].includes(t.status)) || [];
  const completedTickets = queue?.tickets?.filter(t => ['COMPLETED', 'SKIPPED', 'NO_SHOW'].includes(t.status)) || [];

  const filteredWaiting = waitingTickets.filter(t =>
    !search || t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectStyle = {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem'
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Queue Management Console</h1>
          <p>Real-time oversight of all active queues across departments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={selectStyle}>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => loadQueue(selectedBranch)} icon={<RefreshIcon size={16} />}>Refresh</Button>
        </div>
      </div>

      {/* Queue Controls */}
      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 600 }}>Queue Status:</span>
            <Badge variant={queue?.isOpen ? 'success' : 'error'}>
              {queue?.isOpen ? 'OPEN' : 'CLOSED'}
            </Badge>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Date: {queue?.date ? new Date(queue.date).toLocaleDateString() : 'Today'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="success" onClick={() => handleToggleQueue(true)} disabled={queue?.isOpen} icon={<PlayIcon size={16} />}>
              Open Queue
            </Button>
            <Button variant="danger" onClick={() => handleToggleQueue(false)} disabled={!queue?.isOpen} icon={<StopIcon size={16} />}>
              Close Queue
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Waiting</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>{waitingTickets.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Serving Now</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-info)', marginTop: '0.25rem' }}>{servingTickets.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Completed Today</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>{completedTickets.length}</h3>
        </Card>
      </div>

      {loading ? (
        <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Waiting List */}
          <Card title={`Waiting in Line (${waitingTickets.length})`}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search by ticket or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...selectStyle, width: '100%' }}
              />
            </div>
            {filteredWaiting.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No patients waiting.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredWaiting.map((t, idx) => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem', backgroundColor: idx === 0 ? 'var(--color-primary-50)' : 'var(--color-surface-2)',
                    borderRadius: 'var(--radius-md)', border: `1px solid ${idx === 0 ? 'var(--color-primary-100)' : 'var(--color-border)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{t.ticketNumber}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{t.customer?.name || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.service?.name}</div>
                      </div>
                    </div>
                    <Badge variant={idx === 0 ? 'primary' : 'default'}>Pos {idx + 1}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Currently Serving */}
          <Card title="Currently Serving">
            {servingTickets.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No active sessions.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {servingTickets.map(t => (
                  <div key={t.id} style={{
                    padding: '1.25rem', borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-success)', backgroundColor: 'var(--color-success-bg)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{t.ticketNumber}</h3>
                        <p style={{ fontSize: '0.85rem' }}>{t.customer?.name} — {t.service?.name}</p>
                      </div>
                      <Badge variant="success">{t.status}</Badge>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      Counter: <strong>{t.counter?.name}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
