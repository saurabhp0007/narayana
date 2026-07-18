'use client';

import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';

interface CountdownTimerProps {
  endDate: string;
  label?: string;
}

function getTimeParts(endDate: string) {
  const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: diff === 0 };
}

const CARD =
  'relative w-[clamp(2.3rem,7vw,4.25rem)] h-[clamp(3.3rem,10vw,6.25rem)] rounded-lg md:rounded-xl text-[clamp(1.7rem,5vw,3.25rem)] font-bold text-gray-900 tabular-nums shadow-[0_3px_10px_rgba(0,0,0,0.14)] ring-1 ring-gray-200';

function DigitHalf({
  digit,
  pos,
  className = '',
  style,
  onAnimationEnd,
}: {
  digit: string;
  pos: 'top' | 'bottom';
  className?: string;
  style?: CSSProperties;
  onAnimationEnd?: () => void;
}) {
  return (
    <div
      className={`absolute left-0 right-0 h-1/2 overflow-hidden flex justify-center ${
        pos === 'top'
          ? 'top-0 items-start rounded-t-md md:rounded-t-lg'
          : 'bottom-0 items-end rounded-b-md md:rounded-b-lg'
      } ${className}`}
      style={style}
      onAnimationEnd={onAnimationEnd}
    >
      <span className="h-[200%] w-full flex items-center justify-center">{digit}</span>
    </div>
  );
}

function FlipDigit({ digit }: { digit: string }) {
  const [displayed, setDisplayed] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [animating, setAnimating] = useState(false);
  const [flipKey, setFlipKey] = useState(0);
  const displayedRef = useRef(digit);

  useEffect(() => {
    if (digit === displayedRef.current) return;
    setPrevious(displayedRef.current);
    displayedRef.current = digit;
    setDisplayed(digit);
    setFlipKey((k) => k + 1);
    setAnimating(true);
  }, [digit]);

  return (
    <div className={CARD} style={{ perspective: '420px' }}>
      {/* base faces: top always reflects the target digit (revealed as the top flap folds away).
          Bottom must hold the previous digit until the bottom flap actually unfolds over it,
          otherwise the two halves briefly show mismatched digits mid-flip. */}
      <DigitHalf digit={displayed} pos="top" className="bg-white" />
      <DigitHalf digit={animating ? previous : displayed} pos="bottom" className="bg-gray-50" />

      {/* seam */}
      <span className="absolute left-0 right-0 top-1/2 -translate-y-px h-px bg-gray-300 z-30" />
      <span className="absolute left-0 right-0 top-1/2 h-px bg-white z-30" />

      {animating && (
        <Fragment key={flipKey}>
          <DigitHalf
            digit={previous}
            pos="top"
            className="z-20 bg-white animate-flip-out shadow-[inset_0_-8px_10px_-6px_rgba(0,0,0,0.12)]"
            style={{ transformOrigin: 'bottom', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          />
          <DigitHalf
            digit={displayed}
            pos="bottom"
            className="z-20 bg-gray-50 animate-flip-in shadow-[inset_0_8px_10px_-6px_rgba(0,0,0,0.12)]"
            style={{ transformOrigin: 'top', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            onAnimationEnd={() => setAnimating(false)}
          />
        </Fragment>
      )}
    </div>
  );
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const digits = String(value).padStart(2, '0').split('');
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-1 md:gap-1.5">
        {digits.map((d, i) => (
          <FlipDigit key={i} digit={d} />
        ))}
      </div>
      <span className="mt-2.5 text-[10px] md:text-xs font-semibold tracking-[0.2em] text-gray-500">{label}</span>
    </div>
  );
}

export default function CountdownTimer({ endDate, label = 'Mega Sale' }: CountdownTimerProps) {
  const [time, setTime] = useState(() => getTimeParts(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeParts(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (time.expired) return null;

  const units = [
    { value: time.days, label: 'DAYS' },
    { value: time.hours, label: 'HOURS' },
    { value: time.minutes, label: 'MINS' },
    { value: time.seconds, label: 'SECS' },
  ];

  return (
    <section className="bg-gray-50 py-9 md:py-12 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <h3 className="text-sm md:text-base uppercase tracking-[0.25em] mb-5 md:mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
          <span className="font-bold text-gray-900">{label}</span>
          <span className="text-gray-500">Ending In</span>
        </h3>
        <div className="flex items-start justify-center gap-3 md:gap-5">
          {units.map((unit, i) => (
            <div key={unit.label} className="flex items-start gap-3 md:gap-5">
              <FlipUnit value={unit.value} label={unit.label} />
              {i < units.length - 1 && (
                <span className="text-xl md:text-3xl font-light text-gray-300 mt-[clamp(1.1rem,3.4vw,1.9rem)] animate-pulse-soft">
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
