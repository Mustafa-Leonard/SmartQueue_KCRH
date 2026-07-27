import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Table from '../../components/common/Table.jsx';
import * as counterApi from '../../api/counterApi.js';
import * as branchApi from '../../api/branchApi.js';
import * as userApi from '../../api/userApi.js';
import * as ticketApi from '../../api/ticketApi.js';
import { EditIcon, TrashIcon, PlusIcon, UserIcon, PlayIcon, PauseIcon, StopIcon, ClockIcon, TicketIcon, SearchIcon, RefreshIcon } from '../../components/common/Icons.jsx';
import { extractData, extractArray } from '../../utils/apiUtils.js';

export default function CountersPage() {
  const [counters, setCounters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [ticketsByCounter, setTicketsByCounter] = useState({});
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('');
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const loadTicketsForBranch = useCallback(async (branchId) => {
    if (!branchId) {
      setTicketsByCounter({});
      return;
    }
    setTicketsLoading(true);
    try {
      const res = await ticketApi.getBranchTickets(branchId);
      const ticketsList = extractArray(res, 'tickets');
      const ticketsMap = {};
      ticketsList.forEach(t => {
        if (t.counterId) {
          if (!ticketsMap[t.counterId]) ticketsMap[t.counterId] = [];
          ticketsMap[t.counterId].push(t);
        }
      });
      setTicketsByCounter(ticketsMap);
    } catch (err) {
      setTicketsByCounter({});
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [countersData, branchesData, staffData] = await Promise.all([
        counterApi.getCounters(),
        branchApi.getBranches(),
        userApi.getStaff()
      ]);
      const countersList = extractArray(countersData, 'counters');
      
      setCounters(countersList);
      setBranches(extractArray(branchesData, 'branches'));
      setStaffList(extractArray(staffData, 'staff'));
    } catch (err) {
      toast.error('Failed to load counters data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Load tickets when branch filter changes
  useEffect(() => {
    loadTicketsForBranch(branchFilter);
  }, [branchFilter, loadTicketsForBranch]);

  const onAddSubmit = async (data) => {
    setSubmitting(true);
    try {
      await counterApi.createCounter({ ...data, number: parseInt(data.number, 10) });
      toast.success('Counter created successfully');
      setIsAddModalOpen(false);
      reset();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create counter');
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (data) => {
    setSubmitting(true);
    try {
      await counterApi.updateCounter(selectedCounter.id, { name: data.name, number: parseInt(data.number, 10), branchId: data.branchId });
      await counterApi.assignStaff(selectedCounter.id, data.staffId || null);
      toast.success('Counter updated successfully');
      setIsEditModalOpen(false);
      setSelectedCounter(null);
      reset();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update counter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (counterId, newStatus) => {
    try {
      await counterApi.updateStatus(counterId, newStatus);
      toast.success(`Counter status changed to ${newStatus}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update counter status');
    }
  };

  const openEditModal = (counter) => {
    setSelectedCounter(counter);
    setValue('name', counter.name);
    setValue('number', counter.number);
    setValue('branchId', counter.branchId);
    setValue('staffId', counter.staffId || '');
    setIsEditModalOpen(true);
  };

  const deleteCounter = async (id) => {
    if (!window.confirm('Are you sure you want to delete this counter?')) return;
    try {
      await counterApi.deleteCounter(id);
      toast.success('Counter deleted successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to delete counter');
    }
  };

  const filteredCounters = branchFilter ? counters.filter(c => c.branchId === branchFilter) : counters;

  const selectStyle = {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem'
  };

  const columns = [
    { header: '#', accessor: 'number', render: (val) => <strong style={{ fontSize: '1.1rem' }}>#{val}</strong> },
    { header: 'Counter Name', accessor: 'name', render: (val, row) => <span style={{ fontWeight: 600 }}>{row.name}</span> },
    { header: 'Department', accessor: 'branchId', render: (val, row) => <span>{row.branch?.name || 'Unassigned'}</span> },
    {
      header: 'Staff Officer',
      accessor: 'staffId',
      render: (val, row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {row.staff ? <><UserIcon size={14} /> {row.staff.name}</> : <em style={{ color: 'var(--color-text-muted)' }}>Vacant</em>}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val, row) => {
        const variants = { OPEN: 'success', CLOSED: 'default', PAUSED: 'warning' };
        return (
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <Badge variant={variants[val]}>{val}</Badge>
            <div style={{ display: 'flex', gap: '0.15rem', marginLeft: '0.25rem' }}>
              {val !== 'OPEN' && (
                <button onClick={() => handleStatusChange(row.id, 'OPEN')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)', padding: '2px' }} title="Open">
                  <PlayIcon size={14} />
                </button>
              )}
              {val !== 'PAUSED' && val === 'OPEN' && (
                <button onClick={() => handleStatusChange(row.id, 'PAUSED')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warning)', padding: '2px' }} title="Pause">
                  <PauseIcon size={14} />
                </button>
              )}
              {val !== 'CLOSED' && (
                <button onClick={() => handleStatusChange(row.id, 'CLOSED')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '2px' }} title="Close">
                  <StopIcon size={14} />
                </button>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Current Patient',
      accessor: 'id',
      render: (val) => {
        const counterTickets = ticketsByCounter[val] || [];
        const active = counterTickets.find(t => ['CALLED', 'SERVING'].includes(t.status));
        return active ? (
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{active.ticketNumber}</span>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
        );
      }
    },
    {
      header: 'Waiting',
      accessor: 'id',
      render: (val) => {
        const counterTickets = ticketsByCounter[val] || [];
        const waiting = counterTickets.filter(t => t.status === 'WAITING').length;
        return <span>{waiting}</span>;
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <EditIcon size={14} /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => deleteCounter(row.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrashIcon size={14} /> Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Serving Windows & Counters</h1>
          <p>Setup physical desks, assign staff, and manage counter status</p>
        </div>
        <Button variant="primary" onClick={() => { reset(); setIsAddModalOpen(true); }} icon={<PlusIcon size={16} />}>
          Add Counter
        </Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Counters</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{counters.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Open</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-success)' }}>{counters.filter(c => c.status === 'OPEN').length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Paused</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-warning)' }}>{counters.filter(c => c.status === 'PAUSED').length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Closed</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-error)' }}>{counters.filter(c => c.status === 'CLOSED').length}</h3>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Filter by Department:</span>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ ...selectStyle, padding: '0.5rem 1rem' }}>
            <option value="">All Departments</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Counters Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
        ) : (
          <Table columns={columns} data={filteredCounters} />
        )}
      </Card>

      {/* Add Counter Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Counter Desk">
        <form onSubmit={handleSubmit(onAddSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Input label="Counter Number" type="number" placeholder="e.g. 1, 2, 3" error={errors.number} {...register('number', { required: true, valueAsNumber: true })} />
          <Input label="Display Name" type="text" placeholder="e.g. Pharmacy Serving Desk A" error={errors.name} {...register('name', { required: 'Name is required' })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department</label>
            <select {...register('branchId', { required: 'Department is required' })} style={{ ...selectStyle, padding: '0.625rem 1rem' }}>
              <option value="">-- Choose Department --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Counter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Counter Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Counter Window Settings">
        <form onSubmit={handleSubmit(onEditSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Input label="Counter Number" type="number" error={errors.number} {...register('number', { required: true, valueAsNumber: true })} />
          <Input label="Display Name" type="text" error={errors.name} {...register('name', { required: 'Name is required' })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Department</label>
            <select {...register('branchId', { required: 'Department is required' })} style={{ ...selectStyle, padding: '0.625rem 1rem' }}>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Assign Staff Officer</label>
            <select {...register('staffId')} style={{ ...selectStyle, padding: '0.625rem 1rem' }}>
              <option value="">-- Vacant / Unassigned --</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => { setIsEditModalOpen(false); setSelectedCounter(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
