import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner.jsx';
import Badge from '../../components/common/Badge.jsx';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../utils/constants.js';
import * as branchApi from '../../api/branchApi.js';
import * as queueApi from '../../api/queueApi.js';
import * as counterApi from '../../api/counterApi.js';
import { extractData, extractArray } from '../../utils/apiUtils.js';
import { 
  ClockIcon, 
  MegaphoneIcon, 
  CounterIcon 
} from '../../components/common/Icons.jsx';

// ── Health Tips (Bilingual) ──────────────────────────────────────────
const HEALTH_TIPS = [
  'Wash your hands regularly with soap and clean water — Osha mikono yako mara kwa mara kwa sabuni na maji safi.',
  'Maintain at least 1 meter distance from others — Weka umbali wa angalau mita 1 kutoka kwa wengine.',
  'Cover your mouth and nose when coughing or sneezing — Funika mdomo wako unapokohoa au kupiga chafya.',
  'Drink at least 8 glasses of water per day — Kunywa angalau glasi 8 za maji kwa siku.',
  'Get vaccinated to protect yourself and others — Pata chanjo ili kujilinda wewe na wengine.',
  'Eat a balanced diet with fruits and vegetables — Kula mlo kamili wenye matunda na mboga.',
  'Exercise for at least 30 minutes daily — Fanya mazoezi kwa angalau dakika 30 kila siku.',
  'Visit the hospital for regular check-ups — Tembelea hospitali kwa ukaguzi wa mara kwa mara.',
  'Take all medications as prescribed by your doctor — Kwa dawa zote kama alivyoagiza daktari wako.',
  'Rest when you feel unwell — Pumzika unapojisikia mgonjwa.',
];

// ── Bilingual Labels ─────────────────────────────────────────────────
const LANG = {
  nowServing: 'Now Serving / Sasa Hivi',
  nextUp: 'Next Up / Wanaofuata',
  goToDesk: 'Go to Desk / Nenda Dirisha',
  allIdle: 'All Serving Desks are Idle',
  pleaseWait: 'Please wait here for your ticket number to be called.',
  queueClear: 'Queue is clear / Foleni iko wazi',
  next: 'Next / Ifuatayo',
  position: 'Pos',
  hospitalBulletin: 'HOSPITAL BULLETIN / TANGAZO LA HOSPITALI',
  nowCalling: 'NOW CALLING / ANATANGAZWA',
  department: 'Department / Idara',
  waitingCount: 'Waiting / Wanasubiri',
  announcement: 'Announcement / Tangazo',
  healthTip: 'Health Tip / Kidokezo cha Afya',
};

export default function DisplayBoardPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [queue, setQueue] = useState(null);
  const [counters, setCounters] = useState([]);
  const [calledNotice, setCalledNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'multi'
  const [socketConnected, setSocketConnected] = useState(false);

  const calledTimeoutRef = useRef(null);
  const tipIntervalRef = useRef(null);
  const displaySocketRef = useRef(null);
  const lastAnnouncedRef = useRef('');

  // ── Speech Synthesis ───────────────────────────────────────────────
  const speak = useCallback((text, lang = 'en') => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'sw' ? 'sw-KE' : 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith(lang === 'sw' ? 'sw' : 'en'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Announce a called ticket bilingually
  const announceTicketCalled = useCallback((ticketNumber, counterName, serviceName) => {
    const key = `${ticketNumber}-${counterName}`;
    if (lastAnnouncedRef.current === key) return;
    lastAnnouncedRef.current = key;

    // English
    speak(`Ticket number ${ticketNumber}, please go to ${counterName}, ${serviceName}`, 'en');
    // Swahili (after a short delay)
    setTimeout(() => {
      speak(`Namba ${ticketNumber}, tafadhali nenda ${counterName}, ${serviceName}`, 'sw');
    }, 2500);
  }, [speak]);

  // ── Clock ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Health Tips Rotation ───────────────────────────────────────────
  useEffect(() => {
    tipIntervalRef.current = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % HEALTH_TIPS.length);
    }, 10000);
    return () => clearInterval(tipIntervalRef.current);
  }, []);

  // ── Data Loading ───────────────────────────────────────────────────
  const loadBranches = async () => {
    try {
      const res = await branchApi.getBranches();
      const list = extractArray(res, 'branches');
      setBranches(list);
      if (list.length > 0) {
        setSelectedBranchId(list[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error('Failed to load branches');
      setLoading(false);
    }
  };

  const loadDisplayDetails = async (branchId) => {
    if (!branchId) return;
    try {
      const [queueRes, countersRes] = await Promise.all([
        queueApi.getTodayQueue(branchId).catch(() => ({ data: { queue: null } })),
        counterApi.getBranchCounters(branchId).catch(() => ({ data: { counters: [] } }))
      ]);
      const queuePayload = extractData(queueRes);
      setQueue(queuePayload?.queue || null);
      const countersPayload = extractData(countersRes);
      setCounters(countersPayload?.counters || []);
    } catch (err) {
      console.error('Failed to refresh display board data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Socket Connection (Public Display Namespace) ───────────────────
  useEffect(() => {
    // Connect to the public display namespace
    const socket = io(`${SOCKET_URL}/display`, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.info('Display Board socket connected.');
      setSocketConnected(true);
      // Join the selected branch room
      if (selectedBranchId) {
        socket.emit('join:display', { branchId: selectedBranchId });
      }
    });

    socket.on('disconnect', () => {
      console.info('Display Board socket disconnected.');
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Display Board socket error:', err.message);
      setSocketConnected(false);
    });

    socket.on('display:refresh', (data) => {
      if (data.branchId === selectedBranchId) {
        // Update queue data from socket
        const updatedQueue = {
          tickets: [
            ...(data.serving || []).map(s => ({
              ticketNumber: s.number,
              status: 'SERVING',
              counter: { name: s.counter },
              service: { name: s.service }
            })),
            ...(data.waiting || []).map(w => ({
              ticketNumber: w.number,
              status: 'WAITING',
              service: { name: w.service }
            }))
          ]
        };
        setQueue(prev => ({ ...prev, ...updatedQueue, tickets: updatedQueue.tickets }));
      }
    });

    socket.on('ticket:called', (data) => {
      if (data && data.ticketNumber && data.counterName) {
        // Show flash overlay
        setCalledNotice({
          ticketNumber: data.ticketNumber,
          counterName: data.counterName,
          serviceName: data.serviceName || ''
        });
        // Clear after 8 seconds
        if (calledTimeoutRef.current) clearTimeout(calledTimeoutRef.current);
        calledTimeoutRef.current = setTimeout(() => {
          setCalledNotice(null);
        }, 8000);

        // Voice announcement
        announceTicketCalled(data.ticketNumber, data.counterName, data.serviceName || '');
      }
    });

    displaySocketRef.current = socket;

    return () => {
      if (calledTimeoutRef.current) clearTimeout(calledTimeoutRef.current);
      socket.disconnect();
      displaySocketRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rejoin room when branch changes ────────────────────────────────
  useEffect(() => {
    const socket = displaySocketRef.current;
    if (socket && socket.connected) {
      if (selectedBranchId) {
        socket.emit('join:display', { branchId: selectedBranchId });
      }
    }
  }, [selectedBranchId]);

  // ── Initial load and branch change ─────────────────────────────────
  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadDisplayDetails(selectedBranchId);
    }
  }, [selectedBranchId]);

  // ── Polling fallback when socket is disconnected ───────────────────
  useEffect(() => {
    if (!selectedBranchId || socketConnected) return;
    const pollInterval = setInterval(() => {
      loadDisplayDetails(selectedBranchId);
    }, 8000);
    return () => clearInterval(pollInterval);
  }, [selectedBranchId, socketConnected]);

  // ── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="skeleton-page-loader">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Derived Data ───────────────────────────────────────────────────
  const servingTickets = queue?.tickets?.filter(t => ['CALLED', 'SERVING'].includes(t.status)) || [];
  const waitingTickets = queue?.tickets?.filter(t => t.status === 'WAITING').slice(0, 8) || [];
  const currentTip = HEALTH_TIPS[currentTipIndex];

  // ── Single Branch View ─────────────────────────────────────────────
  const renderSingleView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2rem', flexGrow: 1, overflow: 'hidden' }}>
      {/* Left Column: Now Serving */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h2 style={{
          fontSize: '1.1rem',
          textTransform: 'uppercase',
          color: 'var(--color-success)',
          letterSpacing: '1.5px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: 'var(--color-success)',
            animation: 'pulse 1.5s infinite'
          }} />
          {LANG.nowServing}
          {socketConnected && (
            <span className="voice-badge" title="Live updates active">
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-success)', marginRight: 4 }} />
              LIVE
            </span>
          )}
        </h2>

        {servingTickets.length === 0 ? (
          <div style={{
            flexGrow: 1,
            backgroundColor: '#111726',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(185, 20%, 60%)',
            padding: '3rem'
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '1.5rem'
            }}>
              <CounterIcon size={32} color="hsl(185, 20%, 60%)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{LANG.allIdle}</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{LANG.pleaseWait}</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignContent: 'start',
            overflowY: 'auto',
            flexGrow: 1
          }}>
            {servingTickets.map((t) => (
              <div
                key={t.id || t.ticketNumber}
                style={{
                  backgroundColor: '#111726',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                  position: 'relative',
                  animation: 'card-glow 3s infinite',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success)',
                  boxShadow: '0 0 10px var(--color-success)',
                  animation: 'pulse-dot 1.5s infinite'
                }} />
                <span style={{
                  fontSize: '0.75rem', textTransform: 'uppercase',
                  color: 'hsl(185, 40%, 65%)', fontWeight: 600, letterSpacing: '0.5px'
                }}>
                  {t.service?.name}
                </span>
                <h2 style={{
                  fontSize: '4.5rem',
                  fontWeight: 900,
                  margin: '0.5rem 0',
                  fontFamily: 'monospace',
                  color: '#fff',
                  letterSpacing: '-2px',
                  textShadow: '0 0 20px rgba(255,255,255,0.2)'
                }}>
                  {t.ticketNumber}
                </h2>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  marginTop: '1rem',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(185, 20%, 60%)', textTransform: 'uppercase' }}>
                    {LANG.goToDesk}
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '0.2rem' }}>
                    {t.counter?.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Next Up */}
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.1rem', textTransform: 'uppercase',
          color: 'hsl(185, 40%, 75%)', letterSpacing: '1.5px', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          {LANG.nextUp}
          {waitingTickets.length > 0 && (
            <span className="display-countdown">
              <ClockIcon size={14} /> {waitingTickets.length} {LANG.waitingCount.toLowerCase()}
            </span>
          )}
        </h2>

        <div style={{
          flexGrow: 1,
          backgroundColor: '#111726',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          overflowY: 'auto'
        }}>
          {waitingTickets.length === 0 ? (
            <div style={{
              flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(185, 20%, 55%)', fontStyle: 'italic', fontSize: '0.9rem'
            }}>
              {LANG.queueClear}
            </div>
          ) : (
            waitingTickets.map((t, idx) => (
              <div
                key={t.id || t.ticketNumber}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: idx === 0 ? 'rgba(23, 162, 184, 0.1)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${idx === 0 ? 'rgba(23, 162, 184, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.3s'
                }}
              >
                <div>
                  <h3 style={{
                    fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace',
                    color: idx === 0 ? 'var(--color-primary-light)' : '#fff'
                  }}>
                    {t.ticketNumber}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(185, 20%, 65%)', marginTop: '0.2rem' }}>
                    {t.service?.name}
                  </p>
                </div>
                <Badge variant={idx === 0 ? 'primary' : 'default'}>
                  {idx === 0 ? LANG.next : `${LANG.position} #${idx + 1}`}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ── Multi-Department View ──────────────────────────────────────────
  const renderMultiView = () => (
    <div className="display-multi-department">
      {branches.filter(b => b.id === selectedBranchId || !selectedBranchId).map(branch => {
        // For simplicity, just show the selected branch's serving tickets
        const branchServing = servingTickets;
        const branchWaiting = waitingTickets;
        return (
          <div key={branch.id} className="display-department-panel">
            <h3>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
              {branch.name}
            </h3>
            {branchServing.length === 0 ? (
              <div style={{ color: 'hsl(185, 20%, 55%)', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
                {LANG.allIdle}
              </div>
            ) : (
              branchServing.map(t => (
                <div key={t.id || t.ticketNumber} style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.05)',
                  animation: 'card-glow 4s infinite',
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(185, 40%, 65%)' }}>{t.service?.name}</span>
                  <h2 style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'monospace', color: '#fff', margin: '0.25rem 0' }}>
                    {t.ticketNumber}
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>{LANG.goToDesk}: {t.counter?.name}</span>
                </div>
              ))
            )}
            {branchWaiting.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'hsl(185, 20%, 60%)' }}>
                  {branchWaiting.length} {LANG.waitingCount.toLowerCase()}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1d',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '1.5rem'
    }}>
      
      {/* ═══ 1. Header Banner — KCRH Branding ═══ */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '1rem',
        marginBottom: '1.5rem',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Hospital icon */}
          <div style={{
            width: 48, height: 48, borderRadius: '12px',
            background: 'linear-gradient(135deg, hsl(226,68%,38%) 0%, hsl(172,66%,36%) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 4px 16px hsla(226,68%,38%,0.4)',
          }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6v12M6 12h12" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.3px', color: '#fff', lineHeight: 1.1 }}>
              Hospital Queue Management System
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'hsl(185, 40%, 70%)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Live Queue Display Board
              </span>
              {voiceEnabled && (
                <span className="voice-badge" style={{ fontSize: '0.65rem' }}>
                  <MegaphoneIcon size={10} /> Voice / Sauti
                </span>
              )}
              {socketConnected && (
                <span className="voice-badge" style={{ fontSize: '0.65rem', animation: 'none', borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                  Live
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('single')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: viewMode === 'single' ? 'var(--color-accent)' : 'transparent',
                color: '#fff',
                fontFamily: 'var(--font-family)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Single / Moja
            </button>
            <button
              onClick={() => setViewMode('multi')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: viewMode === 'multi' ? 'var(--color-accent)' : 'transparent',
                color: '#fff',
                fontFamily: 'var(--font-family)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Multi / Nyingi
            </button>
          </div>
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: voiceEnabled ? 'rgba(23, 162, 184, 0.15)' : 'transparent',
              color: voiceEnabled ? 'var(--color-accent-light)' : 'hsl(185, 20%, 60%)',
              fontFamily: 'var(--font-family)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <MegaphoneIcon size={12} />
            {voiceEnabled ? 'Sound ON / Sauti Washa' : 'Sound OFF / Sauti Zima'}
          </button>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: '#111726',
              color: '#fff',
              fontFamily: 'var(--font-family)',
              fontSize: '0.9rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px' }}>
              {currentTime.toLocaleTimeString()}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'hsl(185, 20%, 60%)' }}>
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      {/* ═══ 2. Health Tip Bar ═══ */}
      <div className="display-health-tip" style={{ marginBottom: '1.5rem', flexShrink: 0, animation: 'tip-fade 10s infinite' }}>
        <MegaphoneIcon size={16} color="var(--color-accent-light)" />
        <span><strong>{LANG.healthTip}:</strong> {currentTip}</span>
      </div>

      {/* ═══ 3. Main Content Area ═══ */}
      {viewMode === 'single' ? renderSingleView() : renderMultiView()}

      {/* ═══ 4. Bottom Marquee Footer ═══ */}
      <footer style={{
        height: '40px',
        backgroundColor: '#111726',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        marginTop: '1.5rem',
        flexShrink: 0
      }}>
        <div style={{
          backgroundColor: 'hsl(185, 80%, 20%)',
          color: '#fff',
          padding: '0 1.25rem',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: '0.85rem',
          whiteSpace: 'nowrap',
          zIndex: 2,
          boxShadow: '5px 0 15px rgba(0,0,0,0.3)',
          gap: '0.5rem'
        }}>
          <MegaphoneIcon size={16} /> {LANG.hospitalBulletin}
        </div>
        <div style={{
          flexGrow: 1,
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <div style={{
            whiteSpace: 'nowrap',
            animation: 'marquee-scroll 25s linear infinite',
            color: 'hsl(185, 20%, 75%)',
            fontSize: '0.9rem',
            fontWeight: 500,
            paddingLeft: '2rem'
          }}>
            Karibu Kilifi County Referral Hospital — Please register at the kiosk reception or on your smartphone to join the queue — Wait here until your ticket ID is displayed and called to your desk window — Habari yako, fuata utaratibu wa foleni — For emergencies, dial 112 or visit the Emergency Department immediately — Kwa dharura, piga 112 au nenda Idara ya Dharura mara moja.
          </div>
        </div>
      </footer>

      {/* ═══ 5. Fullscreen Flash Overlay when called ═══ */}
      {calledNotice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0a0f1d',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'flash-alert 0.8s infinite alternate',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <MegaphoneIcon size={36} color="var(--color-accent)" />
            <span style={{
              fontSize: 'clamp(1.5rem, 4vw, 3rem)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '4px'
            }}>
              {LANG.nowCalling}
            </span>
          </div>
          <h1 className="display-flash-ticket-number" style={{
            fontWeight: 900,
            color: '#fff',
            margin: '1rem 0',
            textShadow: '0 0 50px rgba(255,255,255,0.4)',
            fontFamily: 'monospace'
          }}>
            {calledNotice.ticketNumber}
          </h1>
          <span style={{ fontSize: 'clamp(1rem, 2.5vw, 2.5rem)', color: 'hsl(185, 20%, 70%)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {LANG.goToDesk}
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 4.5rem)',
            fontWeight: 800,
            color: 'var(--color-accent)',
            marginTop: '1rem'
          }}>
            {calledNotice.counterName}
          </h2>
          {calledNotice.serviceName && (
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', color: 'hsl(185, 20%, 60%)', marginTop: '1.5rem' }}>
              ({calledNotice.serviceName})
            </p>
          )}
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-success)', animation: 'pulse-dot 1s infinite' }} />
            <span style={{ color: 'hsl(185, 20%, 65%)', fontSize: '1rem' }}>Please proceed immediately / Tafadhali enda mara moja</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flash-alert {
          0% { background-color: #0a0f1d; }
          100% { background-color: #111e38; }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.85; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-dot {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes card-glow {
          0% { border-color: rgba(255,255,255,0.05); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
          50% { border-color: hsla(172, 66%, 36%, 0.3); box-shadow: 0 8px 40px rgba(23, 162, 184, 0.15); }
          100% { border-color: rgba(255,255,255,0.05); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        @keyframes tip-fade {
          0% { opacity: 0; transform: translateY(4px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}} />

    </div>
  );
}

