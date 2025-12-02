/**
 * Toast Notification Component
 * Displays temporary success/info/error messages
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      color: '#30D158',
      backgroundColor: 'rgba(48, 209, 88, 0.1)',
    },
    error: {
      icon: AlertCircle,
      color: '#FF3B30',
      backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    info: {
      icon: Info,
      color: '#0077B5',
      backgroundColor: 'rgba(0, 119, 181, 0.1)',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        backgroundColor: '#FFFFFF',
        border: `1px solid ${config.color}30`,
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        minWidth: '300px',
        maxWidth: '400px',
        animation: isExiting ? 'toastSlideOut 300ms ease-out forwards' : 'toastSlideIn 300ms ease-out',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: config.backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={config.color} strokeWidth={2.5} />
      </div>

      {/* Message */}
      <div style={{ flex: 1, fontSize: '14px', color: '#1d1d1f', fontWeight: '500', lineHeight: '1.4' }}>
        {message}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        style={{
          width: '28px',
          height: '28px',
          border: 'none',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 150ms',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={16} color="#6e6e73" />
      </button>

      {/* Animations */}
      <style>
        {`
          @keyframes toastSlideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes toastSlideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}

/**
 * Toast Manager Hook
 * Use this to show toasts from any component
 */
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${20 + index * 80}px`,
            right: '20px',
            zIndex: 10000 + index,
          }}
        >
          <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </>
  );

  return { showToast, ToastContainer };
}
