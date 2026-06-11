import { useState, useEffect, useCallback } from 'react';

// Create a custom event for localStorage updates (since storage event only works across tabs)
const STORAGE_UPDATE_EVENT = 'fepms:storage-update';

// Custom dispatch for storage updates
export function dispatchStorageUpdate(key: string) {
  const event = new CustomEvent(STORAGE_UPDATE_EVENT, { detail: { key } });
  window.dispatchEvent(event);
}

export function useStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Set value
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(`Tried setting localStorage key “${key}” in non-browser environment`);
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStoredValue(newValue);
        dispatchStorageUpdate(key);
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
  );

  // Listen for changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      if ('key' in event && event.key !== key) return;
      
      if ('detail' in event && event.detail && event.detail.key !== key) return;
      
      setStoredValue(readValue());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(STORAGE_UPDATE_EVENT, handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(STORAGE_UPDATE_EVENT, handleStorageChange as EventListener);
    };
  }, [key, readValue]);

  return [storedValue, setValue];
}
