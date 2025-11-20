
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  noPadding?: boolean;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  description,
  noPadding = false,
  action 
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 ${className}`}>
      {title && (
        <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};
