import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Table from '../../components/common/Table.jsx';
import Modal from '../../components/common/Modal.jsx';
import * as appointmentApi from '../../api/appointmentApi.js';
import * as branchApi from '../../api/branchApi.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';
import { CheckIcon, CrossIcon, BanIcon, RefreshIcon, PhoneIcon, BranchIcon, CalendarIcon, ClockIcon, EyeIcon } from '../../components/common/Icons.jsx';
import { extractArray } from '../../utils/apiUtils.js';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const [data, branchData] = await Promise.all([
        appointmentApi.getAppointments(),
        branchApi.getBranches()
      ]);
      setAppointments(extractArray(data, 'appointments'));
      setBranches(extractArray(branchData, 'branches'));
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await appointmentApi.updateStatus(id, newStatus);
      toast.success(`Appointment marked as ${newStatus.toLowerCase()}`);
      loadAppointments();
    } catch (err) {
      toast.error('Failed to update appointment status');
    }
  };

  const viewDetails = (app) => {
    setSelectedAppointment(app);
    setIsDetailModalOpen(true);
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesStatus = statusFilter ? app.status === statusFilter : true;
    const matchesDate = dateFilter ? (app.date || '').startsWith(dateFilter) : true;
    const matchesBranch = branchFilter ? app.service?.branchId === branchFilter : true;
    return matchesStatus && matchesDate && matchesBranch;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayApps = appointments.filter(a => (a.date || '').startsWith(today));
  const pendingApps = appointments.filter(a => a.status === 'PENDING');

  const selectStyle = {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem'
  };

  const statusVariants = { PENDING: 'default', CONFIRMED: 'info', COMPLETED: 'success', CANCELLED: 'error', NO_SHOW: 'warning' };

  const columns = [
    {
      header: 'Patient',
      accessor: 'customer',
      render: (val, row) => {
        const patient = row.customer || row.user;
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{patient?.name || 'Unknown'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <PhoneIcon size={12} /> {patient?.phone || 'N/A'}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Service / Clinic',
      accessor: 'service',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.service?.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <BranchIcon size={12} /> {row.service?.branch?.name}
          </div>
        </div>
      )
    },
    {
      header: 'Date & Time',
      accessor: 'date',
      render: (val, row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CalendarIcon size={12} /> {formatDate(row.date)}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ClockIcon size={12} /> {row.timeSlot}
          </div>
        </div>
      )
    },
    { header: 'Status', accessor: 'status', render: (val) => <Badge variant={statusVariants[val]}>{val}</Badge> },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val, row) => (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => viewDetails(row)} icon={<EyeIcon size={12} />} style={{ padding: '0.25rem 0.5rem' }} />
          {row.status === 'PENDING' && (
            <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(row.id, 'CONFIRMED')} icon={<CheckIcon size={12} />} style={{ padding: '0.25rem 0.5rem' }}>
              Confirm
            </Button>
          )}
          {['PENDING', 'CONFIRMED'].includes(row.status) && (
            <>
              <Button variant="ghost" size="sm" style={{ color: 'var(--color-error)' }} onClick={() => handleUpdateStatus(row.id, 'CANCELLED')} icon={<CrossIcon size={12} />}>
                Cancel
              </Button>
              <Button variant="ghost" size="sm" style={{ color: 'var(--color-warning)' }} onClick={() => handleUpdateStatus(row.id, 'NO_SHOW')} icon={<BanIcon size={12} />}>
                No Show
              </Button>
            </>
          )}
          {row.status === 'CONFIRMED' && (
            <Button variant="ghost" size="sm" style={{ color: 'var(--color-success)' }} onClick={() => handleUpdateStatus(row.id, 'COMPLETED')} icon={<CheckIcon size={12} />}>
              Complete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Appointments Management</h1>
          <p>Manage, confirm, and track all patient clinic bookings</p>
        </div>
        <Button variant="secondary" onClick={loadAppointments} icon={<RefreshIcon size={16} />}>Refresh</Button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Booked</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{appointments.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Today</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{todayApps.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Pending</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>{pendingApps.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Confirmed</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
            {appointments.filter(a => a.status === 'CONFIRMED').length}
          </h3>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Status:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Department:</span>
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={selectStyle}>
              <option value="">All</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Date:</span>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={selectStyle} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}><Spinner size="md" /></div>
        ) : (
          <Table columns={columns} data={filteredAppointments} />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedAppointment(null); }} title="Appointment Details">
        {selectedAppointment && (
          <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Patient</span>
                <p style={{ fontWeight: 600, marginTop: '0.125rem' }}>{selectedAppointment.customer?.name || selectedAppointment.user?.name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedAppointment.customer?.phone || selectedAppointment.user?.phone}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                <div style={{ marginTop: '0.125rem' }}><Badge variant={statusVariants[selectedAppointment.status]}>{selectedAppointment.status}</Badge></div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Service Details</span>
              <p style={{ fontWeight: 600, marginTop: '0.25rem' }}>{selectedAppointment.service?.name}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Department: {selectedAppointment.service?.branch?.name}</p>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Schedule</span>
              <p style={{ fontWeight: 600, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarIcon size={14} /> {formatDate(selectedAppointment.date)} at <ClockIcon size={14} /> {selectedAppointment.timeSlot}
              </p>
            </div>
            {selectedAppointment.notes && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Notes</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', fontStyle: 'italic' }}>"{selectedAppointment.notes}"</p>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Booked: {formatDateTime(selectedAppointment.createdAt)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
