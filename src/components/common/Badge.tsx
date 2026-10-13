import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'mint' | 'warning' | 'teal' | 'gray' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'mint',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    mint: 'bg-[#EAF7F2] text-[#0F5B4B] border border-[#A7E2CB]',
    warning: 'bg-[#FEF9C3] text-[#854D0E] border border-[#CA8A04]/40',
    teal: 'bg-[#0F5B4B] text-white border border-[#0F5B4B]',
    gray: 'bg-slate-100 text-slate-700 border border-slate-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-full font-medium gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 rounded-full font-medium gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center tracking-tight transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
