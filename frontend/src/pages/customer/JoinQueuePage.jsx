import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import * as branchApi from '../../api/branchApi.js';
import * as serviceApi from '../../api/serviceApi.js';
import * as ticketApi from '../../api/ticketApi.js';
import * as appointmentApi from '../../api/appointmentApi.js';
import { 
  CheckIcon, 
  MapPinIcon, 
  ClockIcon, 
  WalkIcon, 
  CalendarIcon, 
  ArrowLeftIcon, 
  TicketIcon, 
  CheckCircleIcon,
  SearchIcon,
  UsersIcon,
  AlertIcon,
  QrCodeIcon,
  CrossIcon,
  ActiveDotIcon,
  MegaphoneIcon
} from '../../components/common/Icons.jsx';
import { extractData, extractArray } from '../../utils/apiUtils.js';
import { Accessibility, Apple, Baby, Bone, Brain, Building2, Ear, Eye, FlaskConical, HeartPulse, Hospital, Pill, PersonStanding, ScanLine, Siren, Stethoscope, UserRound } from 'lucide-react';

const DEPT_ICONS = {
  'Outpatient': Stethoscope,
  'Pharmacy': Pill,
  'Laboratory': FlaskConical,
  'Radiology': ScanLine,
  'Emergency': Siren,
  'Maternity': Baby,
  'Pediatrics': Baby,
  'Cardiology': HeartPulse,
  'Orthopedics': Bone,
  'Dental': Accessibility,
  'Eye': Eye,
  'ENT': Ear,
  'Dermatology': UserRound,
  'Psychiatry': Brain,
  'Nutrition': Apple,
  'Physiotherapy': PersonStanding,
  'General': Building2,
};

function getDepartmentIcon(name) {
  for (const [key, icon] of Object.entries(DEPT_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return Hospital;
}

function getDepartmentStatus(queue, waitingCount) {
  if (!queue?.isOpen) return { label: 'Closed', variant: 'error', color: 'var(--color-error)' };
  if (waitingCount > 20) return { label: 'Busy', variant: 'warning', color: 'var(--color-warning)' };
  if (waitingCount > 5) return { label: 'Moderate', variant: 'info', color: 'var(--color-info)' };
  return { label: 'Open', variant: 'success', color: 'var(--color-success)' };
}

function estimateWaitTime(waitingCount, avgServiceTime = 15) {
  return waitingCount * avgServiceTime;
}

export default function JoinQueuePage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [conflictDetected, setConflictDetected] = useState(false);
  const [branchQueueData, setBranchQueueData] = useState({});

  // Form selections
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedType, setSelectedType] = useState('WALK_IN');
  const [createdTicket, setCreatedTicket] = useState(null);
  const [estimatedCompletion, setEstimatedCompletion] = useState(null);

  const loadBranches = useCallback(async () => {
    try {
      const res = await branchApi.getBranches();
      const branchList = extractArray(res, 'branches');
      
      // Fetch live queue info for each branch
      const queuePromises = branchList.map(async (b) => {
        try {
          const queueRes = await ticketApi.getBranchQueueSummary(b.id);
          const data = extractData(queueRes);
          return { branchId: b.id, ...data };
        } catch {
          return { branchId: b.id, waitingCount: 0, servingTicket: null, isOpen: false };
        }
      });
      
      const queueResults = await Promise.all(queuePromises);
      const queueMap = {};
      queueResults.forEach(q => { queueMap[q.branchId] = q; });
      setBranchQueueData(queueMap);
      setBranches(branchList);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleSelectBranch = async (branch) => {
    setSelectedBranch(branch);
    setLoading(true);
    try {
      const res = await serviceApi.getBranchServices(branch.id);
      setServices(extractArray(res, 'services'));
      setStep(2);
    } catch (err) {
      toast.error('Failed to load clinic services for this department');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectService = async (service) => {
    setSelectedService(service);
    
    // Check for appointment conflicts
    if (user?.id) {
      try {
        const appRes = await appointmentApi.getAppointments();
        const apps = extractArray(appRes, 'appointments');
        const conflicting = apps.find(a => 
          ['PENDING', 'CONFIRMED'].includes(a.status) &&
          a.serviceId === service.id
        );
        setConflictDetected(!!conflicting);
      } catch {
        setConflictDetected(false);
      }
    }
    
    setStep(3);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleSubmitQueue = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const res = await ticketApi.joinQueue({
        branchId: selectedBranch.id,
        serviceId: selectedService.id,
        type: selectedType
      });
      const ticketPayload = extractData(res);
      const ticket = ticketPayload?.ticket || ticketPayload;
      setCreatedTicket(ticket);
      
      // Calculate estimated completion time
      const queueInfo = branchQueueData[selectedBranch.id];
      const waitMins = estimateWaitTime(queueInfo?.waitingCount || 0, selectedService.estimatedTime || 15);
      const completionTime = new Date(Date.now() + waitMins * 60000);
      setEstimatedCompletion(completionTime);
      
      toast.success('Successfully registered in the queue');
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join the queue. Please check if queue is closed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBranches = branches.filter(b =>
    !searchQuery || 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStepIndicator = () => {
    const steps = ['Select Department', 'Select Service', 'Queue Mode', 'Ticket Issued'];
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px',
          backgroundColor: 'var(--color-border)', zIndex: 1
        }} />
        <div style={{
          position: 'absolute', top: '15px', left: '10%',
          width: `${(step - 1) * 26.6}%`, height: '2px',
          backgroundColor: 'var(--color-primary)', zIndex: 1,
          transition: 'width 0.3s ease'
        }} />
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: isCompleted ? 'var(--color-primary)' : isActive ? 'var(--color-primary-light)' : 'var(--color-surface)',
                border: `2px solid ${isCompleted || isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: isCompleted || isActive ? '#fff' : 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.3s ease'
              }}>
                {isCompleted ? <CheckIcon size={16} /> : stepNum}
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                marginTop: '0.5rem', textAlign: 'center'
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {renderStepIndicator()}

      {loading ? (
        <div style={{ display: 'flex', padding: '5rem', justifyContent: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="animate-fade-in">
          
          {/* STEP 1: SELECT DEPARTMENT */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
                Choose Hospital Department / Wing
              </h2>
              
              {/* Search Bar */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                marginBottom: '1.5rem', padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)'
              }}>
                <SearchIcon size={18} color="var(--color-text-muted)" />
                <input
                  type="text"
                  placeholder="Search departments by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: '0.875rem', fontFamily: 'var(--font-family)',
                    backgroundColor: 'transparent', color: 'var(--color-text)'
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                    <CrossIcon size={14} />
                  </button>
                )}
              </div>

              {filteredBranches.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>No departments match your search.</p>
                </Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {filteredBranches.map(b => {
                    const queueInfo = branchQueueData[b.id] || {};
                    const waitingCount = queueInfo.waitingCount || 0;
                    const servingTicket = queueInfo.servingTicket;
                    const status = getDepartmentStatus(queueInfo, waitingCount);
                    const estWait = estimateWaitTime(waitingCount);
                    const DepartmentIcon = getDepartmentIcon(b.name);

                    return (
                      <Card 
                        key={b.id} 
                        variant="bordered"
                        interactive
                        condensed
                        onClick={() => handleSelectBranch(b)}
                        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                      >
                        {/* Status indicator bar */}
                        <div style={{
                          position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                          backgroundColor: status.color,
                          borderRadius: '0 2px 2px 0'
                        }} />
                        
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-primary-50)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, color: 'var(--color-primary)'
                          }}>
                            <DepartmentIcon size={22} strokeWidth={1.8} aria-hidden="true" />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.125rem' }}>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {b.name}
                              </h3>
                              <Badge variant={status.variant} size="sm">{status.label}</Badge>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                              {b.description || 'General ward services'}
                            </p>
                            
                            {/* Live Queue Info */}
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                                <UsersIcon size={10} color="var(--color-text-muted)" />
                                <span style={{ color: 'var(--color-text-muted)' }}>Waiting:</span>
                                <strong style={{ color: waitingCount > 10 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                  {waitingCount}
                                </strong>
                              </div>
                              {servingTicket && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                                  <ActiveDotIcon size={8} color="var(--color-accent)" />
                                  <span style={{ color: 'var(--color-text-muted)' }}>Serving:</span>
                                  <strong style={{ color: 'var(--color-accent)' }}>{servingTicket}</strong>
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                                <ClockIcon size={10} color="var(--color-text-muted)" />
                                <span style={{ color: 'var(--color-text-muted)' }}>Est. wait:</span>
                                <strong style={{ color: 'var(--color-primary-light)' }}>~{estWait} min</strong>
                              </div>
                            </div>

                            <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPinIcon size={10} /> {b.location || 'Main Campus'}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SELECT SERVICE */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <Button variant="ghost" onClick={() => setStep(1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ArrowLeftIcon size={16} /> Back
                </Button>
                <span style={{ fontSize: '0.875rem' }}>Department: <strong>{selectedBranch?.name}</strong></span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
                Select Required Clinic Service
              </h2>
              {services.length === 0 ? (
                <Card style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>No active services configured in this department right now.</p>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {services.map(s => (
                    <div 
                      key={s.id}
                      style={{
                        padding: '1.25rem', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleSelectService(s)}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
                    >
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{s.name}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{s.description}</p>
                      </div>
                      <strong style={{ color: 'var(--color-primary-light)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ClockIcon size={14} /> ~{s.estimatedTime} mins
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: QUEUE MODE */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <Button variant="ghost" onClick={() => setStep(2)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ArrowLeftIcon size={16} /> Back
                </Button>
                <span style={{ fontSize: '0.875rem' }}>Service: <strong>{selectedService?.name}</strong></span>
              </div>
              
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
                Confirm Queuing Details
              </h2>

              {/* Conflict Warning */}
              {conflictDetected && (
                <div style={{
                  padding: '1rem', marginBottom: '1.5rem',
                  borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-bg)',
                  border: '1px solid hsl(38, 80%, 80%)', display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                  <AlertIcon size={20} color="var(--color-warning)" />
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>Appointment Conflict Detected</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      You already have a pending appointment for this service. Please check your appointments page.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card 
                  style={{ 
                    padding: '1.5rem', cursor: 'pointer', textAlign: 'center',
                    border: selectedType === 'WALK_IN' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: selectedType === 'WALK_IN' ? 'var(--color-primary-50)' : 'var(--color-surface)'
                  }}
                  onClick={() => setSelectedType('WALK_IN')}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                    <WalkIcon size={24} />
                  </div>
                  <h3 style={{ fontWeight: 700 }}>Walk-In</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    Stand in the live hospital queue today.
                  </p>
                </Card>

                <Card 
                  style={{ 
                    padding: '1.5rem', cursor: 'pointer', textAlign: 'center',
                    border: selectedType === 'APPOINTMENT' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: selectedType === 'APPOINTMENT' ? 'var(--color-primary-50)' : 'var(--color-surface)'
                  }}
                  onClick={() => setSelectedType('APPOINTMENT')}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                    <CalendarIcon size={24} />
                  </div>
                  <h3 style={{ fontWeight: 700 }}>Appointment Booking</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    If you have booked a specific slot today.
                  </p>
                </Card>
              </div>

              {/* Queue Live Info */}
              {branchQueueData[selectedBranch?.id] && (
                <Card style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: 'var(--color-primary-50)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UsersIcon size={16} color="var(--color-primary)" />
                      <span style={{ fontSize: '0.85rem' }}>
                        <strong>{branchQueueData[selectedBranch.id].waitingCount || 0}</strong> patients ahead of you
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ClockIcon size={16} color="var(--color-primary-light)" />
                      <span style={{ fontSize: '0.85rem' }}>
                        Est. wait: <strong>~{estimateWaitTime(branchQueueData[selectedBranch.id].waitingCount || 0, selectedService?.estimatedTime || 15)} min</strong>
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Summary Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div>Department: <strong>{selectedBranch?.name}</strong></div>
                  <div>Room / Location: <strong>{selectedBranch?.location}</strong></div>
                  <div>Service Selected: <strong>{selectedService?.name}</strong></div>
                  <div>Average Consultation: <strong>{selectedService?.estimatedTime} mins</strong></div>
                  <div>Queue Type: <strong>{selectedType === 'WALK_IN' ? 'Walk-In' : 'Appointment'}</strong></div>
                </div>
              </Card>

              <Button 
                variant="primary" 
                size="lg" 
                fullWidth
                onClick={handleConfirmSubmit} 
                disabled={submitting} 
                icon={<TicketIcon size={18} />}
              >
                {submitting ? 'Registering Ticket...' : 'Register in Hospital Queue'}
              </Button>
            </div>
          )}

          {/* STEP 4: SUCCESS STATE / TICKET ISSUED */}
          {step === 4 && createdTicket && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
              }}>
                <CheckCircleIcon size={40} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ticket Issued Successfully</h1>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                You have been registered in the KCRH queuing database. An SMS confirmation will be sent shortly.
              </p>

              <Card style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {selectedBranch?.name}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0' }}>{selectedService?.name}</h3>
                
                <h2 style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--color-primary)', margin: '1rem 0', letterSpacing: '-1px' }}>
                  {createdTicket.ticketNumber}
                </h2>
                
                {/* Progress Bar - Position in Queue */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                    <span>Your Position</span>
                    <span>#{(createdTicket.position || 0) + 1} in line</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${Math.min(100, ((createdTicket.position || 0) + 1) * 10)}%`,
                      backgroundColor: 'var(--color-primary)', borderRadius: '99px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>

                {/* QR Code */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div style={{
                    padding: '0.75rem', backgroundColor: '#fff', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}>
                    <QRCodeCanvas 
                      value={`${window.location.origin}/track/${createdTicket.ticketNumber}`} 
                      size={120}
                      level="H"
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Scan QR code to track your queue position
                </p>

                {/* Estimated Completion */}
                {estimatedCompletion && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <ClockIcon size={14} color="var(--color-primary-light)" />
                      <span>Estimated completion: <strong>{estimatedCompletion.toLocaleTimeString()}</strong></span>
                    </div>
                  </div>
                )}
              </Card>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/customer/dashboard">
                  <Button variant="ghost">Return to Portal</Button>
                </Link>
                <Link to={`/track/${createdTicket.ticketNumber}`}>
                  <Button variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TicketIcon size={16} /> Track Live Turn
                  </Button>
                </Link>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Queue Registration">
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Please confirm your queue registration details:
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Department</span>
              <strong>{selectedBranch?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Service</span>
              <strong>{selectedService?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Type</span>
              <strong>{selectedType === 'WALK_IN' ? 'Walk-In' : 'Appointment'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Est. Wait Time</span>
              <strong style={{ color: 'var(--color-primary-light)' }}>
                ~{estimateWaitTime(branchQueueData[selectedBranch?.id]?.waitingCount || 0, selectedService?.estimatedTime || 15)} min
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmitQueue} disabled={submitting}>
              {submitting ? 'Registering...' : 'Confirm & Join Queue'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
