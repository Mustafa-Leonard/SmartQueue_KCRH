import React from 'react';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';

const CounterPanel = ({ counter, onToggleStatus }) => {
  const statusLabels = {
    OPEN: 'Active (Open)',
    CLOSED: 'Offline (Closed)',
    PAUSED: 'On Break (Paused)'
  };

  const badgeVariants = {
    OPEN: 'success',
    CLOSED: 'danger',
    PAUSED: 'warning'
  };

  return (
    <Card title={counter.name} subtitle={`Counter #${counter.number}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Status:</span>
          <Badge variant={badgeVariants[counter.status]}>
            {statusLabels[counter.status]}
          </Badge>
        </div>

        {/* Dynamic Service list links */}
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>
            Dispensing/Services Provided:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {counter.services?.map((s) => (
              <Badge key={s.id} variant="primary" style={{ fontSize: '0.7rem' }}>
                {s.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Change status controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
          {counter.status !== 'OPEN' && (
            <Button variant="primary" onClick={() => onToggleStatus('OPEN')}>
              Open Desk
            </Button>
          )}
          {counter.status === 'OPEN' && (
            <Button variant="warning" onClick={() => onToggleStatus('PAUSED')}>
              Pause
            </Button>
          )}
          {counter.status !== 'CLOSED' && (
            <Button variant="danger" onClick={() => onToggleStatus('CLOSED')}>
              Close Desk
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CounterPanel;
