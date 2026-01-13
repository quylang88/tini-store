import React from 'react';

const OptionPills = ({
  options,
  activeId,
  onChange,
  containerClassName = '',
  buttonClassName = '',
  activeClassName = '',
  inactiveClassName = '',
  buttonType = 'button',
}) => (
  <div className={containerClassName}>
    {options.map(option => (
      <button
        key={option.id}
        type={buttonType}
        onClick={() => onChange(option.id)}
        className={`${buttonClassName} ${activeId === option.id ? activeClassName : inactiveClassName}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default OptionPills;
