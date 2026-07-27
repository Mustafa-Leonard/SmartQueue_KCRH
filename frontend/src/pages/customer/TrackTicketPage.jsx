import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { SocketContext } from '../../context/SocketContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import * as ticketApi from '../../api/ticketApi.js';
import { 
  VolumeIcon, 
  VolumeXIcon, 
  ClockIcon, 
  MegaphoneIcon, 
  CheckCircleIcon, 
  TicketIcon, 
  KCRHLogo 
} from '../../components/common/Icons.jsx';
import { extractData } from '../../utils/apiUtils.js';

export default function TrackTicketPage() {
  const { ticketCode: urlTicketCode } = useParams();
  const { socket, connected } = useContext(SocketContext);

  const { isAuthenticated } = useContext(AuthContext);

  const [inputCode, setInputCode] = useState('');
  const [ticketCode, setTicketCode] = useState(urlTicketCode || '');
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Ref to prevent infinite re-render loops from socket callbacks
  const ticketDataRef = useRef(null);
  ticketDataRef.current = ticketData;

  const loadTicketData = async (code) => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await ticketApi.trackTicket(code);
      setTicketData(extractData(res));
    } catch (err) {
      toast.error('Ticket not found or expired');
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketCode) {
      loadTicketData(ticketCode);
    }
  }, [ticketCode]);

  // Socket updates
  useEffect(() => {
    if (!socket || !connected || !ticketData?.ticket) return;

    const branchId = ticketData.ticket.queue?.branchId;
    if (!branchId) return;

    socket.emit('join:branch', { branchId });

    const handleUpdate = () => {
      loadTicketData(ticketCode);
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('ticket:called', (data) => {
      if (ticketData?.ticket?.ticketNumber === data.ticketNumber) {
        toast.success(`GO TO COUNTER: Please proceed to ${data.counterName}!`, { duration: 15000 });
        if (audioEnabled) {
          try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Nice double chime sound
            const playTone = (freq, delay, duration) => {
              const osc = context.createOscillator();
              const gain = context.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, context.currentTime + delay);
              gain.gain.setValueAtTime(0.3, context.currentTime + delay);
              gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration);
              osc.connect(gain);
              gain.connect(context.destination);
              osc.start(context.currentTime + delay);
              osc.stop(context.currentTime + delay + duration);
            };

            playTone(523.25, 0, 0.4); // C5
            playTone(659.25, 0.15, 0.5); // E5
          } catch (e) {
            console.error('Audio chime error:', e);
          }
        }
      }
      handleUpdate();
    });

    socket.on('ticket:status_changed', handleUpdate);

    return () => {
      socket.emit('leave:branch', { branchId });
      socket.off('queue:updated', handleUpdate);
      socket.off('ticket:called');
      socket.off('ticket:status_changed', handleUpdate);
    };
  }, [socket, connected, ticketData, ticketCode, audioEnabled]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setTicketCode(inputCode.trim().toUpperCase());
    }
  };

  const getStatusStep = (status) => {
    const steps = ['WAITING', 'CALLED', 'SERVING', 'COMPLETED'];
    return steps.indexOf(status);
  };

  const currentStep = ticketData ? getStatusStep(ticketData.ticket.status) : -1;

  const content = (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      {/* Search Bar if not tracking or to switch ticket */}
      <Card style={{ padding: '1rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Enter Ticket Number (e.g. OP-001)..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{
              flex: 1,
              padding: '0.625rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              fontFamily: 'var(--font-family)',
              fontSize: '0.875rem'
            }}
          />
          <Button type="submit" variant="primary">Track Ticket</Button>
        </form>
      </Card>

      {loading && !ticketData && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size="lg" />
        </div>
      )}

      {ticketData ? (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Main Ticket Status Card */}
          <Card style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                {ticketData.ticket.queue?.branch?.name}
              </span>
              <button 
                onClick={() => setAudioEnabled(!audioEnabled)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)' }}
                title={audioEnabled ? 'Mute Chime' : 'Unmute Chime'}
              >
                {audioEnabled ? <VolumeIcon size={20} /> : <VolumeXIcon size={20} />}
              </button>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {ticketData.ticket.service?.name}
            </h3>

            <h1 style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--color-primary)', margin: '1rem 0', letterSpacing: '-2px' }}>
              {ticketData.ticket.ticketNumber}
            </h1>

            {/* Status alerts */}
            {ticketData.ticket.status === 'WAITING' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <Badge variant="info" style={{ fontSize: '0.9rem', padding: '0.5rem 1.5rem', margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ClockIcon size={16} /> Waiting in Line
                </Badge>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Queue Position</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {ticketData.livePosition === 1 ? 'Next Up' : `${ticketData.livePosition}th in line`}
                    </h3>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Est. Wait Time</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <ClockIcon size={18} /> ~{ticketData.estimatedWaitMinutes} mins
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {ticketData.ticket.status === 'CALLED' && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                backgroundColor: 'var(--color-warning-bg)',
                border: '2px solid var(--color-warning)',
                borderRadius: 'var(--radius-lg)',
                animation: 'pulse 1.5s infinite'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-accent-dark)', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MegaphoneIcon size={22} /> PROCEED TO COUNTER
                </h3>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text)' }}>
                  {ticketData.ticket.counter?.name || `Counter Desk #${ticketData.ticket.counter?.number}`}
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  Please proceed to your assigned window desk immediately.
                </p>
              </div>
            )}

            {ticketData.ticket.status === 'SERVING' && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid hsl(142, 60%, 80%)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircleIcon size={20} /> Currently Serving
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  You are now being attended to at desk: <strong>{ticketData.ticket.counter?.name}</strong>.
                </p>
              </div>
            )}

            {['COMPLETED', 'SKIPPED', 'NO_SHOW'].includes(ticketData.ticket.status) && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                backgroundColor: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircleIcon size={20} /> Visit Session Closed
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  This ticket session has been marked as <strong>{ticketData.ticket.status}</strong>. Thank you for visiting Kilifi County Referral Hospital.
                </p>
              </div>
            )}

          </Card>

          {/* Timeline indicator */}
          {currentStep >= 0 && (
            <Card style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                Session Roadmap
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  backgroundColor: 'var(--color-border)',
                  zIndex: 1
                }} />
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10%',
                  width: `${currentStep * 26.6}%`,
                  height: '2px',
                  backgroundColor: 'var(--color-primary)',
                  zIndex: 1
                }} />
                
                {['Joined Line', 'Called', 'In Consultation', 'Completed'].map((label, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: isDone ? 'var(--color-primary)' : 'var(--color-surface)',
                        border: `2px solid ${isDone ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        boxShadow: isCurrent ? '0 0 8px var(--color-primary-light)' : 'none'
                      }} />
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        marginTop: '0.5rem',
                        textAlign: 'center'
                      }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>
      ) : (
        !loading && (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
              <TicketIcon size={32} />
            </div>
            <h2>Hospital Ticket Tracker</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
              Please enter your ticket reference code (from your SMS receipt or kiosk ticket) to track your position in line.
            </p>
          </Card>
        )
      )}

    </div>
  );

  // If customer is logged in, show in full app layout; if public tracking page, show centered portal wrapper
  if (isAuthenticated) {
    return (
      <div className="layout__content">
        {content}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <KCRHLogo size={36} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.75rem' }}>
          KCRH SmartQueue
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Kilifi County Referral Hospital — Live Tracker</p>
      </div>
      {content}
    </div>
  );
}

