import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  name, 
  type = 'text', 
  error = null, 
  placeholder = '', 
  className = '', 
  ...rest 
}, ref) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={name} className="form-label">{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        ref={ref}
        placeholder={placeholder}
        className={`form-input ${error ? 'form-input-error' : ''}`}
        style={error ? { borderColor: 'var(--color-error)' } : {}}
        {...rest}
      />
      {error && <span className="form-error">{error.message || error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
