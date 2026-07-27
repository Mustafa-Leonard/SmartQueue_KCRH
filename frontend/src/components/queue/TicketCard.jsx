import React from 'react';
import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import { formatTime } from '../../utils/formatters.js';
import { VolumeIcon, ServiceIcon } from '../common/Icons.jsx';

const TicketCard = ({ ticket, position, waitingBefore, estimatedWaitMinutes }) => {
  const statusLabels = {
    WAITING: 'Waiting in line',
    CALLED: 'Proceed to Counter!',
    SERVING: 'Now being served',
    COMPLETED: 'Service completed',
    SKIPPED: 'Skipped (Missed Call)',
    NO_SHOW: 'No Show',
    TRANSFERRED: 'Transferred'
  };

  const statusVariants = {
    WAITING: 'primary',
    CALLED: 'warning',
    SERVING: 'success',
    COMPLETED: 'info',
    SKIPPED: 'danger',
    NO_SHOW: 'danger',
    TRANSFERRED: 'warning'
  };

  return (
    <Card 
      className={`animate-fade-in ${ticket.status === 'CALLED' ? 'animate-glow' : ''}`}
      style={{
        maxWidth: '450px',
        margin: '0 auto',
        borderTop: `6px solid var(--color-${statusVariants[ticket.status]})`
      }}
    >
      {/* Header info */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '1px' }}>
          {ticket.service?.branch?.name || 'KCRH Department'}
        </span>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', margin: '0.25rem 0' }}>
          {ticket.service?.name}
        </h2>
        <Badge variant={statusVariants[ticket.status]}>
          {statusLabels[ticket.status]}
        </Badge>
      </div>

      {/* Ticket sequence code panel */}
      <div 
        style={{
          backgroundColor: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          textAlign: 'center',
          border: '1px dashed var(--color-border)',
          marginBottom: '1.5rem'
        }}
      >
        <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.25rem' }}>
          Your Ticket Number
        </p>
        <p style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
          {ticket.ticketNumber}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
          Code: {ticket.ticketCode.substring(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Dynamic Queue Metrics */}
      {ticket.status === 'WAITING' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
          <div style={{ borderRight: '1px solid var(--color-border)', padding: '0.5rem 0' }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-accent-dark)' }}>{position}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Position in Queue</p>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-accent-dark)' }}>{waitingBefore}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Patients Ahead</p>
          </div>
        </div>
      )}

      {ticket.status === 'CALLED' && ticket.counter && (
        <div 
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '1.125rem',
            border: '1px solid hsl(38, 90%, 85%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <VolumeIcon size={20} /> Proceed to {ticket.counter.name}
        </div>
      )}

      {ticket.status === 'SERVING' && (
        <div 
          style={{
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '1.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <ServiceIcon size={20} /> Currently being served
        </div>
      )}

      {/* Meta Footer */}
      <div 
        style={{
          borderTop: '1px solid var(--color-border)',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)'
        }}
      >
        <span>Registered: {formatTime(ticket.createdAt)}</span>
        {ticket.status === 'WAITING' && (
          <span>Est. Wait: ~{estimatedWaitMinutes} min</span>
        )}
      </div>
    </Card>
  );
};

export default TicketCard;
