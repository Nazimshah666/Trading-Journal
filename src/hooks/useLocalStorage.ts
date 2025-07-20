import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Enhanced hook for managing complex timeframe state with better type safety
export function useTimeframeStorage<T extends Record<string, any>>(
  key: string, 
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, (subKey: keyof T, subValue: T[keyof T]) => void] {
  const [storedValue, setStoredValue] = useLocalStorage(key, initialValue);

  const updateSubValue = (subKey: keyof T, subValue: T[keyof T]) => {
    setStoredValue(prev => ({
      ...prev,
      [subKey]: subValue
    }));
  };

  return [storedValue, setStoredValue, updateSubValue];
}

export function useToggleVisibility(storageKey: string, defaultVisibility: Record<string, boolean>) {
  const [visibility, setVisibility] = useLocalStorage(storageKey, defaultVisibility);

  const toggleVisibility = (key: string) => {
    setVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetVisibility = () => {
    setVisibility(defaultVisibility);
  };

  return { visibility, toggleVisibility, resetVisibility };
}