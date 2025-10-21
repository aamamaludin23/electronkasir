import React from 'react';
import { ICONS } from '../constants';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ show, onClose, title, size = 'md', children }) => {
  if (!show) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-secondary rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col transform transition-transform duration-200 scale-100`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-default">
          {title && <h2 id="modal-title" className="text-lg font-semibold text-primary">{title}</h2>}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 focus:outline-none text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto text-primary">{children}</div>
      </div>
    </div>
  );
};