
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', headerRight }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col h-full ${className} card-print-container`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className="flex-grow">{children}</div>
    </div>
  );
};

export default Card;