'use client';

import { useId, useState } from 'react';
import { INDIAN_STATES } from '@/lib/indiaAddress';

interface StateAutocompleteProps {
  id: string;
  value: string;
  onChange: (state: string) => void;
}

const matchState = (text: string) =>
  INDIAN_STATES.find((s) => s.toLowerCase() === text.trim().toLowerCase());

export default function StateAutocomplete({ id, value, onChange }: StateAutocompleteProps) {
  const listId = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const text = query ?? value;
  const isOpen = query !== null;
  const needle = text.trim().toLowerCase();
  const suggestions = INDIAN_STATES.filter((s) => s.toLowerCase().includes(needle)).sort(
    (a, b) => Number(!a.toLowerCase().startsWith(needle)) - Number(!b.toLowerCase().startsWith(needle)),
  );

  const select = (state: string) => {
    onChange(state);
    setQuery(null);
  };

  const close = () => {
    if (query === null) return;
    const match = matchState(query);
    onChange(match ?? (query.trim() ? query : ''));
    setQuery(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setQuery(text);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + suggestions.length) % Math.max(suggestions.length, 1));
    } else if (e.key === 'Enter' && isOpen && suggestions[activeIndex]) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setQuery(null);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        id={id}
        name="state"
        value={text}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onFocus={() => setQuery(value)}
        onBlur={close}
        onKeyDown={handleKeyDown}
        required
        autoComplete="address-level1"
        placeholder="Start typing your state"
        role="combobox"
        aria-expanded={isOpen && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
      {isOpen && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg"
        >
          {suggestions.map((state, i) => (
            <li
              key={state}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                select(state);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-3 py-2 ${i === activeIndex ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
            >
              {state}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
