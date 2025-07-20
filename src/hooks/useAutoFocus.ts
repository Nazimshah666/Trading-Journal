import { useEffect, useRef } from 'react';

export const useAutoFocus = (isVisible: boolean) => {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && firstInputRef.current) {
      // Use setTimeout to ensure the element is rendered and visible
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return firstInputRef;
};