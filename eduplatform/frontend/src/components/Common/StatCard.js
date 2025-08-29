import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary', 
  change, 
  changeType,
  subtitle 
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className={`stat-card-icon ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{title}</div>
      
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
      
      {change && (
        <div className={`stat-card-change ${changeType}`}>
          {changeType === 'positive' ? '↗' : '↘'} {change}
        </div>
      )}
    </div>
  );
};

export default StatCard;