'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface AccordionItemData {
  key: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

/** Single-open accordion with aria-expanded/aria-controls and an animated height reveal. */
export default function Accordion({ items, className = '' }: { items: AccordionItemData[]; className?: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className={className}>
      {items.map((item) => {
        const isOpen = openKey === item.key;
        return (
          <div key={item.key} className="border-b border-gray-200">
            <button
              onClick={() => setOpenKey(isOpen ? null : item.key)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.key}`}
              id={`accordion-header-${item.key}`}
              className="w-full flex items-center justify-between py-4 text-left text-gray-900 font-medium"
            >
              {item.title}
              <svg
                className={`w-4 h-4 shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`accordion-panel-${item.key}`}
                  role="region"
                  aria-labelledby={`accordion-header-${item.key}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 text-sm text-gray-600">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
