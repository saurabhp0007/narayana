'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useConfirmStore } from '@/store/confirmStore';

export default function ConfirmDialog() {
  const { isOpen, title, description, confirmLabel, cancelLabel, danger, handleConfirm, handleCancel } =
    useConfirmStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative bg-white rounded-lg shadow-2xl w-full max-w-sm p-6"
          >
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900 mb-2">
              {title}
            </h2>
            {description && <p className="text-sm text-gray-600 mb-6">{description}</p>}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                autoFocus
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  danger ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
