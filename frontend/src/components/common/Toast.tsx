'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore, ToastType } from '@/store/toastStore';

const AUTO_DISMISS_MS = 3200;

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function ToastRow({ id, message, type }: { id: string; message: string; type: ToastType }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      role="status"
      className="flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 min-w-[260px] max-w-sm"
    >
      {ICONS[type]}
      <p className="text-sm font-medium text-gray-900 flex-1">{message}</p>
      <button
        onClick={() => dismiss(id)}
        aria-label="Dismiss notification"
        className="text-gray-400 hover:text-gray-700 shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 items-end pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastRow {...t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
