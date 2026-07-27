import React from 'react';
import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import { ActiveDotIcon, UsersIcon } from '../common/Icons.jsx';

const QueueDisplay = ({ queue }) => {
  if (!queue) {
    return (
      <Card style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>
          No active queue for this department today.
        </p>
      </Card>
    );
  }

  const waitingTickets = queue.tickets.filter((t) => t.status === 'WAITING');
  const servingTickets = queue.tickets.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      {/* Sidebar Metrics Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Card style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', opacity: 0.8 }}>Total Waiting</p>
          <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>{waitingTickets.length}</h2>
        </Card>
        <Card>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--color-text-secondary)' }}>Currently Serving</p>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-accent-dark)' }}>{servingTickets.length}</h2>
        </Card>
      </div>

      {/* Main Real-time Queues Detail List */}
      <Card title="Now Serving & Next Up">
        {servingTickets.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-success)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ActiveDotIcon size={10} color="var(--color-success)" /> Currently Serving
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {servingTickets.map((t) => (
                <div 
                  key={t.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-success-bg)',
                    border: '1px solid hsl(142, 60%, 80%)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}
                >
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{t.ticketNumber}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{t.counter?.name}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{t.service?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UsersIcon size={18} /> Waiting Line
          </h3>
          {waitingTickets.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No patients waiting in line.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {waitingTickets.map((t, index) => (
                <div 
                  key={t.id}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: index === 0 ? 'var(--color-primary-50)' : 'var(--color-surface-2)',
                    border: `1px solid ${index === 0 ? 'var(--color-primary-100)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{t.ticketNumber}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Pos: {index + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QueueDisplay;
