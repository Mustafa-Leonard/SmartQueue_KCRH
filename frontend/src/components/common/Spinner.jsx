import React from 'react';

const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeMap = {
    sm: '20px',
    md: '40px',
    lg: '60px'
  };

  return (
    <div 
      className={`animate-spin ${className}`}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        border: '3px solid rgba(11, 90, 96, 0.1)',
        borderTop: `3px solid var(--color-${color})`,
        borderRadius: '50%',
        display: 'inline-block'
      }}
      role="status"
      aria-label="loading"
    />
  );
};

export default Spinner;
