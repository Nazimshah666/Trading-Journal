import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onOpenTradeForm: () => void;
  onOpenPendingForm: () => void;
  isReadOnlyMode: boolean;
}

export const useKeyboardShortcuts = ({ 
  onOpenTradeForm, 
  onOpenPendingForm, 
  isReadOnlyMode 
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Additional safety check to prevent conflicts
      if (!event || !event.key) return;
      
      // Don't trigger shortcuts if user is typing in an input field
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true' ||
        activeElement.closest('[role="dialog"]') || // Inside modal
        activeElement.closest('.modal') // Inside modal class
      );

      // Don't trigger shortcuts in read-only mode
      if (isInputFocused || isReadOnlyMode) return;

      // Don't trigger if modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

      try {
        switch (event.key.toLowerCase()) {
          case 'c':
            event.preventDefault();
            onOpenTradeForm();
            // Show subtle feedback
            showShortcutFeedback('Add Trade opened');
            break;
          case 'v':
            event.preventDefault();
            onOpenPendingForm();
            // Show subtle feedback
            showShortcutFeedback('Pending Trade opened');
            break;
        }
      } catch (error) {
        console.error('Error in keyboard shortcut handler:', error);
      }
    };

    // Use capture phase to ensure we catch events before they bubble
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onOpenTradeForm, onOpenPendingForm, isReadOnlyMode]);
};

// Subtle toast feedback for shortcuts
const showShortcutFeedback = (message: string) => {
  // Create toast element
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'fixed top-4 right-4 bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100';
  
  document.body.appendChild(toast);
  
  // Animate out and remove
  setTimeout(() => {
    toast.style.transform = 'translateY(-10px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 1500);
};