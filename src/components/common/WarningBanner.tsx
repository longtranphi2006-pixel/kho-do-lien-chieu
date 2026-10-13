import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface WarningBannerProps {
  title?: string;
  message: string;
  type?: 'warning' | 'info';
  className?: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  title = 'Lưu ý an toàn trao đổi',
  message,
  type = 'warning',
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border p-4 shadow-xs flex items-start gap-3 ${
        type === 'warning'
          ? 'bg-[#FEF9C3] border-[#CA8A04] text-[#854D0E]'
          : 'bg-[#EAF7F2] border-[#A7E2CB] text-[#0F5B4B]'
      } ${className}`}
    >
      <div className="shrink-0 mt-0.5">
        {type === 'warning' ? (
          <AlertTriangle className="w-5 h-5 text-[#CA8A04]" />
        ) : (
          <Info className="w-5 h-5 text-[#0F5B4B]" />
        )}
      </div>
      <div className="text-sm space-y-1">
        {title && <h4 className="font-semibold">{title}</h4>}
        <p className="leading-relaxed opacity-95">{message}</p>
      </div>
    </div>
  );
};
