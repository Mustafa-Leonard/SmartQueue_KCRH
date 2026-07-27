import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { SocketContext } from '../../context/SocketContext.jsx';
import * as ticketApi from '../../api/ticketApi.js';
import * as appointmentApi from '../../api/appointmentApi.js';
import { CrossIcon } from '../../components/common/Icons.jsx';
import { formatDate, formatTime } from '../../utils/formatters.js';
import { extractData, extractArray } from '../../utils/apiUtils.js';
import { 
  WalkIcon, 
  CalendarIcon, 
  TicketIcon, 
  ClockIcon, 
  HistoryIcon, 
  MapPinIcon, 
  ArrowRightIcon,
  MegaphoneIcon,
  ActiveDotIcon,
  QrCodeIcon,
  UsersIcon,
  RefreshIcon,
  TransferIcon
} from '../../components/common/Icons.jsx';

function LiveCountdown({ targetMinutes, onComplete }) {
  const [seconds, setSeconds] = useState(targetMinutes * 60);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.();
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [targetMinutes, onComplete]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

function QueueProgressBar({ position, total }) {
  const percent = total > 0 ? ((total - position) / total) * 100 : 0;
  const progressPercent = Math.max(0, Math.min(100, 100 - percent));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
        <span>Queue Progress</span>
        <span>#{position} of {total}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progressPercent}%`,
          backgroundColor: progressPercent > 80 ? 'var(--color-success)' : progressPercent > 50 ? 'var(--color-primary)' : 'var(--color-warning)',
          borderRadius: '99px', transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  const { user } = useContext(AuthContext);
  const { socket, connected } = useContext(SocketContext);

  const [activeTickets, setActiveTickets] = useState([]);
  const [historyTickets, setHistoryTickets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTicket, setQrTicket] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [queueTotals, setQueueTotals] = useState({});

  const loadCustomerData = useCallback(async () => {
    try {
      const [activeRes, historyRes, appointmentsRes] = await Promise.all([
        ticketApi.getCustomerActiveTickets(),
        ticketApi.getCustomerHistoryTickets(),
        appointmentApi.getAppointments()
      ]);
      
      const activePayload = extractData(activeRes);
      setActiveTickets(activePayload?.tickets || []);
      
      const historyPayload = extractData(historyRes);
      setHistoryTickets(historyPayload?.tickets || []);
      
      const appPayload = extractData(appointmentsRes);
      const allApps = appPayload?.appointments || [];
      const patientApps = allApps
        .filter(a => ['PENDING', 'CONFIRMED'].includes(a.status))
        .slice(0, 3);
      setAppointments(patientApps);

      // Calculate queue totals for progress bars
      const totals = {};
      activePayload?.tickets?.forEach(t => {
        const branchId = t.queue?.branchId;
        if (branchId) {
          totals[branchId] = (totals[branchId] || 0) + 1;
        }
      });
      setQueueTotals(totals);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancelTicket = async () => {
    if (!cancelTarget) return;
    try {
      await ticketApi.cancelTicket(cancelTarget.id);
      toast.success(`Ticket ${cancelTarget.ticketNumber} cancelled successfully`);
      setShowCancelModal(false);
      setCancelTarget(null);
      loadCustomerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel ticket');
    }
  };

  const handleShowQr = (ticket) => {
    setQrTicket(ticket);
    setShowQrModal(true);
  };

  const handleCountdownComplete = useCallback(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  useEffect(() => {
    if (user?.id) {
      loadCustomerData();
    }
  }, [user, loadCustomerData]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket || !connected || activeTickets.length === 0) return;

    activeTickets.forEach(t => {
      socket.emit('join:branch', { branchId: t.queue?.branchId });
    });

    const handleUpdate = () => {
      loadCustomerData();
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('ticket:called', (data) => {
      const myCalledTicket = activeTickets.find(t => t.ticketNumber === data.ticketNumber);
      if (myCalledTicket) {
        toast.success(`YOUR TURN! Please proceed to ${data.counterName}`, { duration: 10000 });
        try {
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const osc = context.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, context.currentTime);
          osc.connect(context.destination);
          osc.start();
          osc.stop(context.currentTime + 0.3);
        } catch (_) {}
      }
      handleUpdate();
    });

    return () => {
      activeTickets.forEach(t => {
        socket.emit('leave:branch', { branchId: t.queue?.branchId });
      });
      socket.off('queue:updated', handleUpdate);
      socket.off('ticket:called');
    };
  }, [socket, connected, activeTickets, loadCustomerData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'var(--gradient-primary)',
        padding: 'var(--space-8)',
        borderRadius: 'var(--radius-2xl)',
        color: '#fff',
        marginBottom: 'var(--space-6)',
        boxShadow: '0 8px 30px hsla(226, 68%, 38%, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 10%, hsla(0,0%,100%,0.06) 0%, transparent 60%), radial-gradient(circle at 20% 90%, hsla(0,0%,100%,0.03) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.3px' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Patient'}
          </h1>
          <p style={{ opacity: 0.85, fontSize: '0.9375rem', maxWidth: '580px', lineHeight: 1.6 }}>
            Kilifi County Referral Hospital digital queuing dashboard.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}>
            <Link to="/customer/join">
              <Button variant="accent" icon={<WalkIcon size={18} />}>
                Join a Clinic Queue
              </Button>
            </Link>
            <Link to="/customer/appointments">
              <Button variant="outline" style={{ color: '#fff', borderColor: 'hsla(0,0%,100%,0.4)', background: 'hsla(0,0%,100%,0.1)' }}
                icon={<CalendarIcon size={18} />}>
                Book Clinic Appointment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Active Queue Tickets */}
          <Card title="Active Queue Tickets" condensed>
            {activeTickets.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                  You are not currently in any queue. Join a clinic queue to get a ticket number.
                </p>
                <Link to="/customer/join">
                  <Button variant="primary" size="sm">Join Clinic Queue Now</Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem' }}>
                {activeTickets.map(t => {
                  const estWaitMinutes = t.livePosition ? t.livePosition * (t.service?.estimatedTime || 15) : 15;
                  const totalInQueue = (t.livePosition || 1) + (t.waitingBefore || 0);
                  
                  return (
                    <div 
                      key={t.id}
                      className="card-bordered"
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Status bar marker */}
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                        backgroundColor: t.status === 'CALLED' ? 'var(--color-accent)' : 
                                        t.status === 'SERVING' ? 'var(--color-success)' : 'var(--color-primary)',
                        borderRadius: '0 2px 2px 0'
                      }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                              {t.queue?.branch?.name || 'Department'}
                            </span>
                            <Badge variant={
                              t.status === 'CALLED' ? 'warning' : 
                              t.status === 'SERVING' ? 'success' : 'info'
                            } size="sm" dot>
                              {t.status === 'CALLED' ? 'CALLED' : t.status === 'SERVING' ? 'SERVING' : 'WAITING'}
                            </Badge>
                          </div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0' }}>{t.service?.name || 'Service'}</h3>
                        </div>

                        {/* Ticket Number - Large */}
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
                            {t.ticketNumber}
                          </div>
                        </div>
                      </div>

                      {/* Called Alert */}
                      {t.status === 'CALLED' && (
                        <div style={{
                          marginTop: '0.75rem', padding: '0.75rem 1rem',
                          backgroundColor: 'var(--color-warning-bg)',
                          border: '1px solid hsl(38, 90%, 80%)',
                          borderRadius: 'var(--radius-md)',
                          animation: 'pulse 2s infinite',
                          textAlign: 'center', fontSize: '0.875rem'
                        }}>
                          <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MegaphoneIcon size={16} /> Proceed to: {t.counter?.name || `Desk #${t.counter?.number}`}
                          </strong>
                        </div>
                      )}

                      {/* Serving Status */}
                      {t.status === 'SERVING' && (
                        <div style={{
                          marginTop: '0.75rem', padding: '0.75rem 1rem',
                          backgroundColor: 'var(--color-success-bg)',
                          border: '1px solid hsl(142, 70%, 80%)',
                          borderRadius: 'var(--radius-md)',
                          textAlign: 'center', fontSize: '0.875rem'
                        }}>
                          <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                            <ActiveDotIcon size={12} color="var(--color-success)" /> Being attended at: {t.counter?.name || `Desk #${t.counter?.number}`}
                          </strong>
                        </div>
                      )}

                      {/* Waiting Status with Progress */}
                      {t.status === 'WAITING' && (
                        <>
                          {/* Queue Progress Bar */}
                          <div style={{ marginTop: '0.75rem' }}>
                            <QueueProgressBar position={t.livePosition || 1} total={totalInQueue} />
                          </div>

                          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Wait</span>
                              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                                <ClockIcon size={12} /> 
                                <LiveCountdown targetMinutes={estWaitMinutes} onComplete={handleCountdownComplete} />
                              </p>
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Position</span>
                              <p style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                                <UsersIcon size={12} /> {t.livePosition || 1} of {totalInQueue}
                              </p>
                            </div>
                          </div>

                          {/* QR Code Button */}
                          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleShowQr(t)}
                              icon={<QrCodeIcon size={14} />}
                              style={{ fontSize: '0.75rem' }}
                            >
                              Show QR Code
                            </Button>
                          </div>
                        </>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid var(--color-border)' }}>
                        {t.status === 'WAITING' && (
                          <Button variant="ghost" size="sm" 
                            style={{ color: 'var(--color-error)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} 
                            onClick={() => { setCancelTarget(t); setShowCancelModal(true); }}
                            icon={<CrossIcon size={12} />}
                          >
                            Cancel
                          </Button>
                        )}
                        {t.status !== 'WAITING' && <div />}
                        <Link to={`/track/${t.ticketNumber}`}>
                          <Button variant="ghost" size="sm" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                            Track <ArrowRightIcon size={12} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Patient Queue History */}
          <Card title="Past Queue Visits" subtitle="Recent visit history">
            {historyTickets.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                No past visits logged.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
                {historyTickets.slice(0, 5).map(t => {
                  const badges = { COMPLETED: 'success', SKIPPED: 'default', NO_SHOW: 'error', TRANSFERRED: 'info' };
                  return (
                    <div 
                      key={t.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--color-border)'
                      }}
                    >
                      <div>
                        <strong style={{ marginRight: '0.75rem', color: 'var(--color-primary)' }}>{t.ticketNumber}</strong>
                        <span>{t.service?.name}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {t.queue?.branch?.name} | {formatDate(t.createdAt)}
                        </div>
                      </div>
                      <Badge variant={badges[t.status]}>{t.status}</Badge>
                    </div>
                  );
                })}
                {historyTickets.length > 5 && (
                  <Link to="/customer/history" style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem' }}>
                    View All History
                  </Link>
                )}
              </div>
            )}
          </Card>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Card condensed style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>{activeTickets.length}</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Active Tickets</span>
            </Card>
            <Card condensed style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>{historyTickets.filter(t => t.status === 'COMPLETED').length}</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Completed</span>
            </Card>
          </div>
          
          {/* Upcoming Appointments */}
          <Card title="Upcoming Appointments">
            {appointments.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                  No future clinic bookings found.
                </p>
                <Link to="/customer/appointments">
                  <Button variant="ghost" size="sm">Schedule Clinic Slot</Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
                {appointments.map(a => (
                  <div 
                    key={a.id}
                    style={{
                      padding: '1rem', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-2)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <Badge variant={a.status === 'CONFIRMED' ? 'success' : 'warning'}>{a.status}</Badge>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-light)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ClockIcon size={12} /> {a.timeSlot}
                      </span>
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.service?.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <MapPinIcon size={12} /> {a.service?.branch?.name}
                    </p>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                      Date: <strong>{formatDate(a.date)}</strong>
                    </div>
                  </div>
                ))}
                <Link to="/customer/appointments" style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                  Manage Appointments
                </Link>
              </div>
            )}
          </Card>

        </div>

      </div>

      {/* QR Code Modal */}
      <Modal isOpen={showQrModal} onClose={() => { setShowQrModal(false); setQrTicket(null); }} title="Your Queue QR Code">
        {qrTicket && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Scan this QR code at the kiosk or share with hospital staff
            </p>
            <div style={{
              display: 'inline-block', padding: '1rem', backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <QRCodeCanvas 
                value={`${window.location.origin}/track/${qrTicket.ticketNumber}`}
                size={180}
                level="H"
                includeMargin
              />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', margin: '1rem 0' }}>
              {qrTicket.ticketNumber}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {qrTicket.service?.name} — {qrTicket.queue?.branch?.name}
            </p>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={showCancelModal} onClose={() => { setShowCancelModal(false); setCancelTarget(null); }} title="Cancel Ticket">
        {cancelTarget && (
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
              Are you sure you want to cancel ticket <strong>{cancelTarget.ticketNumber}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => { setShowCancelModal(false); setCancelTarget(null); }}>Keep Ticket</Button>
              <Button variant="danger" onClick={handleCancelTicket}>Yes, Cancel Ticket</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
