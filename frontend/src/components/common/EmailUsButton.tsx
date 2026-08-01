'use client';

import { motion, useReducedMotion } from 'framer-motion';

const SUPPORT_EMAIL = 'ordersnarayanenterprises@gmail.com';

/**
 * Persistent floating action button, present on every page, that opens the
 * visitor's email client with a compose window addressed to support. Arrives
 * with a short entrance beat after the page settles, then gently bobs with a
 * soft pulsing ring behind the icon to draw the eye without being distracting.
 */
export default function EmailUsButton() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.a
      href={`mailto:${SUPPORT_EMAIL}`}
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={
        shouldReduceMotion
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 1, y: [0, -6, 0], scale: 1 }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.4, delay: 0.6 }
          : {
              opacity: { duration: 0.4, delay: 0.6 },
              scale: { duration: 0.4, delay: 0.6, type: 'spring', stiffness: 260, damping: 20 },
              y: { duration: 2.6, delay: 1, repeat: Infinity, ease: 'easeInOut' },
            }
      }
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 left-4 z-50 flex items-center gap-2.5 pl-2 pr-4 py-2 bg-white rounded-full shadow-lg border border-gray-200 text-sm font-medium text-gray-900 hover:shadow-xl transition-shadow duration-200"
      aria-label={`Email us at ${SUPPORT_EMAIL}`}
    >
      <span className="relative flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
        {!shouldReduceMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-accent-500/60"
            animate={{ scale: [1, 2], opacity: [0.7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1, ease: 'easeOut' }}
          />
        )}
        <svg className="relative w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </span>
      <span className="hidden sm:inline">Email Us</span>
    </motion.a>
  );
}
