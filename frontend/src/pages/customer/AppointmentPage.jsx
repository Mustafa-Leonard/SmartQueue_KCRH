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
import * as appointmentApi from '../../api/appointmentApi.js';
import * as branchApi from '../../api/branchApi.js';
import * as serviceApi from '../../api/serviceApi.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';
import { 
  BranchIcon, 
  CalendarIcon, 
  ClockIcon, 
  CrossIcon, 
  PlusIcon,
  RefreshIcon,
  CheckIcon,
  EditIcon,
  HistoryIcon,
  BellIcon,
  AlertIcon
} from '../../components/common/Icons.jsx';
import { extractData, extractArray } from '../../utils/apiUtils.js';

export default function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' | 'history'

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Form states
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadAppointmentsAndBranches = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, branchRes] = await Promise.all([
        appointmentApi.getAppointments(),
        branchApi.getBranches()
      ]);
      setAppointments(extractArray(appRes, 'appointments'));
      setBranches(extractArray(branchRes, 'branches'));
    } catch (err) {
      toast.error('Failed to load appointments data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointmentsAndBranches();
  }, [loadAppointmentsAndBranches]);

  // Load services when branch changes
  useEffect(() => {
    if (!selectedBranchId) {
      setServices([]);
      return;
    }
    const loadServices = async () => {
      try {
        const res = await serviceApi.getBranchServices(selectedBranchId);
        setServices(extractArray(res, 'services'));
      } catch (err) {
        toast.error('Failed to load department services');
      }
    };
    loadServices();
  }, [selectedBranchId]);

  // Load slots for booking
  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    const loadSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await appointmentApi.getAvailableSlots(selectedServiceId, selectedDate);
        const slotsPayload = extractData(res);
        setAvailableSlots(slotsPayload?.slots || []);
        setSelectedSlot('');
      } catch (err) {
        toast.error('Failed to check available slot times');
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [selectedServiceId, selectedDate]);

  // Load reschedule slots
  useEffect(() => {
    if (!selectedAppointment || !rescheduleDate) {
      setRescheduleSlots([]);
      return;
    }
    const loadRescheduleSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await appointmentApi.getAvailableSlots(selectedAppointment.serviceId, rescheduleDate);
        const slotsPayload = extractData(res);
        setRescheduleSlots(slotsPayload?.slots || []);
        setRescheduleSlot('');
      } catch (err) {
        toast.error('Failed to check available slots');
      } finally {
        setSlotsLoading(false);
      }
    };
    loadRescheduleSlots();
  }, [selectedAppointment, rescheduleDate]);

  const handleBookSubmit = async (data) => {
    if (!selectedSlot) {
      toast.error('Please choose a time slot');
      return;
    }
    setSubmitting(true);
    try {
      await appointmentApi.bookAppointment({
        serviceId: selectedServiceId,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes: data.notes
      });
      toast.success('Clinic appointment booked successfully');
      setIsBookModalOpen(false);
      reset();
      setSelectedBranchId('');
      setSelectedServiceId('');
      setSelectedDate('');
      setSelectedSlot('');
      loadAppointmentsAndBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    setSubmitting(true);
    try {
      await appointmentApi.updateStatus(selectedAppointment.id, 'CANCELLED');
      toast.success('Appointment cancelled');
      setIsCancelModalOpen(false);
      setSelectedAppointment(null);
      loadAppointmentsAndBranches();
    } catch (err) {
      toast.error('Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleSlot || !selectedAppointment) {
      toast.error('Please select a new date and time slot');
      return;
    }
    setSubmitting(true);
    try {
      await appointmentApi.rescheduleAppointment(selectedAppointment.id, {
        date: rescheduleDate,
        timeSlot: rescheduleSlot
      });
      toast.success('Appointment rescheduled successfully');
      setIsRescheduleModalOpen(false);
      setSelectedAppointment(null);
      setRescheduleDate('');
      setRescheduleSlot('');
      loadAppointmentsAndBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const upcomingApps = appointments.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status));
  const historyApps = appointments.filter(a => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));

  const statusVariants = {
    PENDING: 'default',
    CONFIRMED: 'info',
    COMPLETED: 'success',
    CANCELLED: 'error',
    NO_SHOW: 'warning'
  };

  const selectStyle = {
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontFamily: 'var(--font-family)',
    fontSize: '0.875rem',
    width: '100%'
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Bookings & Appointments</h1>
          <p>Schedule, reschedule, and manage your clinic visits</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="primary" onClick={() => { reset(); setIsBookModalOpen(true); }} icon={<PlusIcon size={16} />}>
            Request Appointment
          </Button>
          <Button variant="secondary" onClick={loadAppointmentsAndBranches} icon={<RefreshIcon size={16} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Upcoming</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{upcomingApps.length}</h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Confirmed</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
            {upcomingApps.filter(a => a.status === 'CONFIRMED').length}
          </h3>
        </Card>
        <Card condensed>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total All Time</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>{appointments.length}</h3>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <Button 
          variant={viewMode === 'upcoming' ? 'primary' : 'ghost'} 
          size="sm"
          onClick={() => setViewMode('upcoming')}
        >
          Upcoming ({upcomingApps.length})
        </Button>
        <Button 
          variant={viewMode === 'history' ? 'primary' : 'ghost'} 
          size="sm"
          onClick={() => setViewMode('history')}
        >
          History ({historyApps.length})
        </Button>
      </div>

      <Card>
        {loading ? (
          <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}>
            <Spinner size="md" />
          </div>
        ) : (
          <>
            {/* Upcoming Appointments */}
            {viewMode === 'upcoming' && (
              upcomingApps.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No upcoming appointments.</p>
                  <Button variant="primary" size="sm" onClick={() => { reset(); setIsBookModalOpen(true); }}>Book an Appointment</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
                  {upcomingApps.map(a => (
                    <div key={a.id} style={{
                      padding: '1.25rem', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                        backgroundColor: a.status === 'CONFIRMED' ? 'var(--color-success)' : 'var(--color-warning)',
                        borderRadius: '0 2px 2px 0'
                      }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <Badge variant={statusVariants[a.status]}>{a.status}</Badge>
                            {a.service?.branch?.name && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                <BranchIcon size={12} /> {a.service.branch.name}
                              </span>
                            )}
                          </div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{a.service?.name}</h3>
                          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CalendarIcon size={14} /> {formatDate(a.date)}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--color-primary-light)' }}>
                              <ClockIcon size={14} /> {a.timeSlot}
                            </span>
                          </div>
                          {a.notes && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                              Note: {a.notes}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <Button variant="ghost" size="sm" 
                            onClick={() => { setSelectedAppointment(a); setIsRescheduleModalOpen(true); }}
                            icon={<EditIcon size={14} />}
                            title="Reschedule"
                          />
                          <Button variant="ghost" size="sm" 
                            style={{ color: 'var(--color-error)' }}
                            onClick={() => { setSelectedAppointment(a); setIsCancelModalOpen(true); }}
                            icon={<CrossIcon size={14} />}
                            title="Cancel Appointment"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* History View */}
            {viewMode === 'history' && (
              historyApps.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>No appointment history.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
                  {historyApps.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem', borderBottom: '1px solid var(--color-border)'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ color: 'var(--color-primary)' }}>{a.service?.name}</strong>
                          <Badge variant={statusVariants[a.status]}>{a.status}</Badge>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                          <CalendarIcon size={12} /> {formatDate(a.date)} at {a.timeSlot}
                          {a.service?.branch?.name && <span> — {a.service.branch.name}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </Card>

      {/* Book Appointment Modal */}
      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title="Schedule Clinic Appointment">
        <form onSubmit={handleSubmit(handleBookSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Hospital Department</label>
            <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} style={selectStyle}>
              <option value="">-- Select Department --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Clinic Service</label>
            <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}
              disabled={!selectedBranchId} style={selectStyle}>
              <option value="">-- Choose Service --</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} (~{s.estimatedTime} min)</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Preferred Date</label>
            <input type="date" min={getTomorrowString()} value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)} disabled={!selectedServiceId}
              style={selectStyle} />
          </div>
          {selectedDate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Select Time Slot</label>
              {slotsLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}><Spinner size="sm" /></div>
              ) : availableSlots.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-error)' }}>No free slots for this date. Try another.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                  {availableSlots.map(s => (
                    <div key={s} onClick={() => setSelectedSlot(s)}
                      style={{
                        padding: '0.5rem', border: `1px solid ${selectedSlot === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        backgroundColor: selectedSlot === s ? 'var(--color-primary-50)' : 'var(--color-surface)',
                        borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600
                      }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Notes / Chief Complaint</label>
            <textarea {...register('notes')} placeholder="e.g. Booking for follow-up..."
              style={{ ...selectStyle, minHeight: '60px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="ghost" onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting || !selectedSlot}>
              {submitting ? 'Booking...' : 'Book Appointment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={isRescheduleModalOpen} onClose={() => { setIsRescheduleModalOpen(false); setSelectedAppointment(null); }}
        title="Reschedule Appointment">
        {selectedAppointment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Current Appointment:</p>
              <strong>{selectedAppointment.service?.name}</strong> — {formatDate(selectedAppointment.date)} at {selectedAppointment.timeSlot}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>New Date</label>
              <input type="date" min={getTomorrowString()} value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)} style={selectStyle} />
            </div>
            {rescheduleDate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>New Time Slot</label>
                {slotsLoading ? <Spinner size="sm" /> : rescheduleSlots.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-error)' }}>No slots available.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                    {rescheduleSlots.map(s => (
                      <div key={s} onClick={() => setRescheduleSlot(s)}
                        style={{
                          padding: '0.5rem', border: `1px solid ${rescheduleSlot === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          backgroundColor: rescheduleSlot === s ? 'var(--color-primary-50)' : 'var(--color-surface)',
                          borderRadius: 'var(--radius-sm)', textAlign: 'center', cursor: 'pointer',
                          fontSize: '0.8rem', fontWeight: 600
                        }}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => { setIsRescheduleModalOpen(false); setSelectedAppointment(null); }}>Cancel</Button>
              <Button variant="primary" onClick={handleRescheduleSubmit} disabled={submitting || !rescheduleSlot}>
                {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={isCancelModalOpen} onClose={() => { setIsCancelModalOpen(false); setSelectedAppointment(null); }}
        title="Cancel Appointment">
        {selectedAppointment && (
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Are you sure you want to cancel your <strong>{selectedAppointment.service?.name}</strong> appointment on{' '}
              {formatDate(selectedAppointment.date)} at {selectedAppointment.timeSlot}?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => { setIsCancelModalOpen(false); setSelectedAppointment(null); }}>Keep Appointment</Button>
              <Button variant="danger" onClick={handleCancelAppointment} disabled={submitting}>
                {submitting ? 'Cancelling...' : 'Yes, Cancel'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
