import React from 'react';

const Card = ({ children, title = null, subtitle = null, interactive = false, variant = 'default', condensed = false, className = '', ...props }) => {
  const variantClass = variant === 'glass' ? 'card-glass' : variant === 'bordered' ? 'card-bordered' : variant === 'flat' ? 'card-flat' : '';
  const condensedClass = condensed ? 'card--condensed' : '';
  return (
    <div 
      className={`${variant === 'default' ? 'card' : ''} ${variantClass} ${interactive ? 'card-interactive' : ''} ${condensedClass} ${className}`}
      {...props}
      style={variant !== 'default' && !props.style?.background ? { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: condensed ? 'var(--space-4)' : 'var(--space-6)', boxShadow: 'var(--shadow-xs)', ...props.style } : props.style}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {title && <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.2px' }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
