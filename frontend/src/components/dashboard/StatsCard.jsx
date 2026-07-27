import React from 'react';
import Card from '../common/Card.jsx';

const StatsCard = ({ title, value, icon, variant = 'primary' }) => {
  const variantColors = {
    primary: 'var(--color-primary)',
    accent: 'var(--color-accent-dark)',
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-info)'
  };

  const bgColors = {
    primary: 'var(--color-primary-50)',
    accent: 'var(--color-warning-bg)',
    success: 'var(--color-success-bg)',
    error: 'var(--color-error-bg)',
    info: 'var(--color-info-bg)'
  };

  return (
    <Card className="metric-card">
      <div 
        className="metric-icon"
        style={{
          backgroundColor: bgColors[variant],
          color: variantColors[variant]
        }}
      >
        {icon}
      </div>
      <div className="metric-info">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
    </Card>
  );
};

export default StatsCard;
