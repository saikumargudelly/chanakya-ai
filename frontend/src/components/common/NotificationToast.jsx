import React from 'react';

export default function NotificationToast({ message, type = 'info', onClose }) {
  if (!message) return null;
  let color = 'bg-blue-500';
  if (type === 'success') color = 'bg-green-500';
  if (type === 'error') color = 'bg-red-500';
  if (type === 'warning') color = 'bg-yellow-500';

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-base flex items-center gap-3 animate-slide-in ${color}`}
      style={{ minWidth: 250 }}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-3 text-white/80 hover:text-white text-lg">&times;</button>
    </div>
  );
}
