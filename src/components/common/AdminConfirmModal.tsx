'use client';

import React from 'react';
import { AlertTriangle, Trash2, Lock, Unlock, HelpCircle, X, Loader2 } from 'lucide-react';

export interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  iconType?: 'trash' | 'lock' | 'unlock' | 'warning' | 'info';
  isLoading?: boolean;
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  subMessage,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  iconType,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    const finalIcon = iconType || (variant === 'danger' ? 'trash' : variant === 'warning' ? 'warning' : 'info');
    switch (finalIcon) {
      case 'trash':
        return <Trash2 className="w-5 h-5 text-rose-600" />;
      case 'lock':
        return <Lock className="w-5 h-5 text-rose-600" />;
      case 'unlock':
        return <Unlock className="w-5 h-5 text-emerald-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getAccentBar = () => {
    switch (variant) {
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600';
      case 'success':
      case 'primary':
      default:
        return 'bg-gradient-to-r from-[#0F5B4B] to-emerald-600';
    }
  };

  const getConfirmBtnClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20';
      case 'success':
      case 'primary':
      default:
        return 'bg-[#0F5B4B] hover:bg-[#0c4a3d] text-white shadow-emerald-900/20';
    }
  };

  const getIconWrapperClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 border-rose-200 text-rose-600';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-600';
      case 'success':
      case 'primary':
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Accent Bar */}
        <div className={`h-2 ${getAccentBar()}`} />

        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${getIconWrapperClasses()}`}>
              {renderIcon()}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-3 space-y-2">
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            {message}
          </p>
          {subMessage && (
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              {subMessage}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 mt-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-white text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await onConfirm();
              } finally {
                onClose();
              }
            }}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${getConfirmBtnClasses()}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
