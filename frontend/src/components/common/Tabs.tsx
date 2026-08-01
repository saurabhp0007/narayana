'use client';

import { useRef } from 'react';

export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
  idPrefix?: string;
}

/**
 * Accessible tab header row (role="tablist"/"tab", aria-selected, left/right arrow
 * navigation). Callers own the tab panel content themselves — pair each panel with
 * `id={`${idPrefix}-panel-${key}`}` and `role="tabpanel"` `aria-labelledby={`${idPrefix}-tab-${key}`}`.
 */
export default function Tabs({
  tabs,
  activeKey,
  onChange,
  className = 'flex items-center justify-center gap-6 md:gap-10 border-b border-gray-200 mb-6 overflow-x-auto',
  idPrefix = 'tabs',
}: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const nextIndex = e.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    onChange(nextTab.key);
    refs.current[nextTab.key]?.focus();
  };

  return (
    <div role="tablist" className={className}>
      {tabs.map((tab, index) => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[tab.key] = el;
            }}
            role="tab"
            id={`${idPrefix}-tab-${tab.key}`}
            aria-controls={`${idPrefix}-panel-${tab.key}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`pb-3 text-xs md:text-sm font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
              isActive ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
