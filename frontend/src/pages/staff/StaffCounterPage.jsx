import React, { useState, useEffect, useContext, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import * as counterApi from '../../api/counterApi.js';
import * as ticketApi from '../../api/ticketApi.js';
import { 
  UserIcon, 
  AlertIcon, 
  ArrowRightIcon 
} from '../../components/common/Icons.jsx';
import { extractData, extractArray } from '../../utils/apiUtils.js';

export default function StaffCounterPage() {
  const { user } = useContext(AuthContext);

  const [counter, setCounter] = useState(null);
  const [allCounters, setAllCounters] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [targetCounterId, setTargetCounterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const countersRes = await counterApi.getCounters();
      const countersList = extractArray(countersRes, 'counters');
      setAllCounters(countersList);

      const myCounter = countersList.find(c => c.staffId === user?.id);
      if (!myCounter) {
        setCounter(null);
        setLoading(false);
        return;
      }
      setCounter(myCounter);

      // Fetch active tickets for this department
      const ticketsRes = await ticketApi.getBranchTickets(myCounter.branchId);
      const ticketPayload = extractData(ticketsRes);
      const active = (ticketPayload?.tickets || []).find(t => 
        t.counterId === myCounter.id && 
        ['CALLED', 'SERVING'].includes(t.status)
      );
      setActiveTicket(active || null);

    } catch (err) {
      toast.error('Failed to load counter setup details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!activeTicket) {
      toast.error('You do not have an active patient session to transfer');
      return;
    }
    if (!targetCounterId) {
      toast.error('Please select a destination counter desk');
      return;
    }

    setSubmitting(true);
    try {
      await ticketApi.transferTicket(activeTicket.id, targetCounterId);
      toast.success(`Patient ${activeTicket.ticketNumber} successfully transferred`);
      setTargetCounterId('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer session failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!counter) {
    return (
      <div style={{ padding: '1.75rem' }}>
        <Card style={{ padding: '2rem', textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
          <h2>Desk Unassigned</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: '1rem 0' }}>
            You are currently not assigned to any physical serving desk or counter.
          </p>
        </Card>
      </div>
    );
  }

  // Filter other counters in the same department
  const transferOptions = allCounters.filter(c => 
    c.branchId === counter.branchId && 
    c.id !== counter.id && 
    c.status === 'OPEN'
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Desk Configuration</h1>
          <p>Physical Desk: <strong>#{counter.number} - {counter.name}</strong></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Desk Details Card */}
        <Card title="Desk Properties">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Counter Desk ID</span>
              <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}><code>{counter.id}</code></p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Wing / Department</span>
              <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', fontWeight: 600 }}>{counter.branch?.name}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Officer In Charge</span>
              <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <UserIcon size={16} /> {user?.name}
              </p>
            </div>
          </div>
        </Card>

        {/* Transfer Ticket Form */}
        <Card title="Transfer Current Session" subtitle="Route active patient to another serving counter">
          {activeTicket ? (
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-100)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Active Session Patient:</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.2rem 0' }}>{activeTicket.ticketNumber}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Name: {activeTicket.customer?.name || 'Walk-In'}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Destination Counter (Active Desks Only)</label>
                <select
                  value={targetCounterId}
                  onChange={(e) => setTargetCounterId(e.target.value)}
                  style={{
                    padding: '0.625rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    fontFamily: 'var(--font-family)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">-- Choose Counter Desk --</option>
                  {transferOptions.map(c => (
                    <option key={c.id} value={c.id}>Desk #{c.number} - {c.name} ({c.staff?.name || 'Vacant'})</option>
                  ))}
                </select>
                {transferOptions.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <AlertIcon size={14} /> No other active desks are open in your department right now.
                  </span>
                )}
              </div>

              <Button type="submit" variant="primary" disabled={submitting || transferOptions.length === 0} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <ArrowRightIcon size={16} /> {submitting ? 'Transferring...' : 'Confirm Patient Transfer'}
              </Button>
            </form>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              You must have a patient active or called in your desk console to transfer them.
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}


