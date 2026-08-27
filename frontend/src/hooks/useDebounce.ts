import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates
 * after `delay` milliseconds of no changes.
 *
 * Use this to avoid running expensive operations (filtering,
 * Supabase queries) on every single keystroke or slider tick.
 *
 * @example
 *   const debouncedPrice = useDebounce(priceRange, 300);
 *   // useMemo / useEffect will only re-run after 300ms idle
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Cancel the timer if value changes before delay elapses
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
