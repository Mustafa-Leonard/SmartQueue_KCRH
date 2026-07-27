import React from 'react';

const Badge = ({ variant = 'primary', children, className = '', pill = false, dot = false }) => {
  return (
    <span className={`badge badge-${variant} ${pill ? 'badge-pill' : ''} ${dot ? 'badge-dot' : ''} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
