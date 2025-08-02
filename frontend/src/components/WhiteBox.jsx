// src/components/WhiteBox.jsx
import React from 'react';
import './WhiteBox.css';

function WhiteBox({ children, className = '' }) {
  return <div className={`white-rounded-box ${className}`}>{children}</div>;
}

export default WhiteBox;
