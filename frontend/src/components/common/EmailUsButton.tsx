'use client';

const SUPPORT_EMAIL = 'ordersnarayanenterprises@gmail.com';

/**
 * Persistent floating action button, present on every page, that opens the
 * visitor's email client with a compose window addressed to support.
 */
export default function EmailUsButton() {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="fixed bottom-6 left-4 z-50 flex items-center gap-2 pl-3 pr-4 py-2.5 bg-white rounded-full shadow-lg border border-gray-200 text-sm font-medium text-gray-900 hover:shadow-xl hover:scale-105 transition-all duration-200"
      aria-label={`Email us at ${SUPPORT_EMAIL}`}
    >
      <svg className="w-5 h-5 flex-shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      Email Us
    </a>
  );
}
