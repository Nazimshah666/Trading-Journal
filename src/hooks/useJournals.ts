import { useState, useEffect, useCallback } from 'react';
import { Journal, Trade, PendingTrade, AppSettings, PairSettings } from '../types';
import { getPipSize, getPipValuePerStandardLot, STRATEGIES, SETUP_TAGS } from '../constants';
import localforage from 'localforage';

const DEFAULT_SETTINGS: AppSettings = {
  startingCapital: 10000,
  currency: 'USD',
  enableAPlusTracking: true,
  enablePsychologyTracking: true,
  enableScreenshotUpload: true,
  timezone: 'UTC',
  dataExportFormat: 'CSV',
  pairSettings: {},
  customStrategies: [],
  customSetupTags: []
};

// Configure localforage
localforage.config({
  name: 'TradingJournalPro',
  storeName: 'journals'
});

export const useJournals = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [activeJournalId, setActiveJournalId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const activeJournal = journals.find(j => j.id === activeJournalId);

  // Load journals from local storage
  useEffect(() => {
    const loadJournals = async () => {
      if (!isInitialized) {        
        await loadFromLocal();
        setIsInitialized(true);
      }
    };

    loadJournals();
  }, [isInitialized]);

  // Load journals from local storage
  const loadFromLocal = async () => {
    try {
      // Try localforage first, then localStorage
      let savedJournals = await localforage.getItem<Journal[]>('journals');
      let savedActiveId = await localforage.getItem<string>('active-journal-id');

      if (!savedJournals) {
        // Fallback to localStorage for migration
        const localStorageJournals = localStorage.getItem('trading-journals');
        const localStorageActiveId = localStorage.getItem('active-journal-id');
        
        if (localStorageJournals) {
          savedJournals = JSON.parse(localStorageJournals);
          savedActiveId = localStorageActiveId;
          
          // Migrate to localforage
          if (savedJournals) {
            await localforage.setItem('journals', savedJournals);
            await localforage.setItem('active-journal-id', savedActiveId);
          }
        }
      }

      if (savedJournals && savedJournals.length > 0) {
        const migratedJournals = savedJournals.map(journal => ({
          ...journal,
          settings: {
            ...DEFAULT_SETTINGS,
            ...journal.settings,
            pairSettings: migratePairSettings(journal.settings?.pairSettings || {}),
            customStrategies: migrateStrategiesAndTags(journal.settings?.customStrategies || [], STRATEGIES.map(s => s.name)),
            customSetupTags: migrateStrategiesAndTags(journal.settings?.customSetupTags || [], SETUP_TAGS.map(t => t.name))
          },
          trades: journal.trades?.map(trade => ({
            ...trade,
            created_at: trade.created_at || trade.date,
            updated_at: trade.updated_at || trade.created_at || trade.date,
            pipSize: trade.pipSize || getPipSize(trade.pair) || 1,
            pipValuePerStandardLot: trade.pipValuePerStandardLot || getPipValuePerStandardLot(trade.pair) || 10
          })) || [],
          pendingTrades: journal.pendingTrades?.map(pendingTrade => ({
            ...pendingTrade,
            created_at: pendingTrade.created_at || pendingTrade.date,
            updated_at: pendingTrade.updated_at || pendingTrade.created_at || pendingTrade.date,
            pipSize: pendingTrade.pipSize || getPipSize(pendingTrade.pair) || 1,
            pipValuePerStandardLot: pendingTrade.pipValuePerStandardLot || getPipValuePerStandardLot(pendingTrade.pair) || 10
          })) || []
        }));

        setJournals(migratedJournals);
        
        if (savedActiveId && migratedJournals.find(j => j.id === savedActiveId)) {
          setActiveJournalId(savedActiveId);
        } else if (migratedJournals.length > 0) {
          setActiveJournalId(migratedJournals[0].id);
        }
      } else {
        // Create default journal
        const defaultJournal = createDefaultJournal();
        setJournals([defaultJournal]);
        setActiveJournalId(defaultJournal.id);
        await saveJournalsLocal([defaultJournal]);
      }

    } catch (error) {
      console.error('Error loading from local:', error);
      // Create default journal as fallback
      const defaultJournal = createDefaultJournal();
      setJournals([defaultJournal]);
      setActiveJournalId(defaultJournal.id);
    }
  };

  // Save journals locally
  const saveJournalsLocal = async (newJournals: Journal[]) => {
    try {
      await localforage.setItem('journals', newJournals);
      setJournals(newJournals);
    } catch (error) {
      console.error('Error saving journals to local storage:', error);
      // Fallback to localStorage if localforage fails
      try {
        localStorage.setItem('trading-journals', JSON.stringify(newJournals));
        setJournals(newJournals);
      } catch (fallbackError) {
        console.error('Error saving to localStorage fallback:', fallbackError);
        // Still update state even if storage fails
        setJournals(newJournals);
      }
    }
  };

  // Save journals (simplified - no sync)
  const saveJournals = async (newJournals: Journal[]) => {
    try {
      await saveJournalsLocal(newJournals);
    } catch (error) {
      console.error('Error in saveJournals:', error);
      // Continue execution even if save fails
    }
  };

  // Helper functions
  const migratePairSettings = (oldPairSettings: any): Record<string, PairSettings> => {
    const newPairSettings: Record<string, PairSettings> = {};
    
    Object.entries(oldPairSettings).forEach(([pair, settings]: [string, any]) => {
      newPairSettings[pair] = {
        customPipSize: settings?.customPipSize,
        customPipValuePerStandardLot: settings?.customPipValuePerStandardLot
      };
    });
    
    return newPairSettings;
  };

  const migrateStrategiesAndTags = (existing: string[], defaults: string[]): string[] => {
    const combined = [...new Set([...defaults, ...existing])];
    return combined;
  };

  const createDefaultJournal = (): Journal => ({
    id: crypto.randomUUID(),
    name: 'My Trading Journal',
    type: 'Mixed',
    createdAt: new Date().toISOString(),
    trades: [],
    pendingTrades: [],
    settings: { 
      ...DEFAULT_SETTINGS,
      customStrategies: STRATEGIES.map(s => s.name),
      customSetupTags: SETUP_TAGS.map(t => t.name)
    }
  });

  // Save active journal ID
  useEffect(() => {
    if (activeJournalId) {
      localStorage.setItem('active-journal-id', activeJournalId);
      localforage.setItem('active-journal-id', activeJournalId);
    }
  }, [activeJournalId]);

  // Public API functions
  const createJournal = async (name: string, type: Journal['type']) => {
    const newJournal: Journal = {
      id: crypto.randomUUID(),
      name,
      type,
      createdAt: new Date().toISOString(),
      trades: [],
      pendingTrades: [],
      settings: { 
        ...DEFAULT_SETTINGS,
        customStrategies: STRATEGIES.map(s => s.name),
        customSetupTags: SETUP_TAGS.map(t => t.name)
      }
    };
    
    const updatedJournals = [...journals, newJournal];
    await saveJournals(updatedJournals);
    setActiveJournalId(newJournal.id);
  };

  const renameJournal = async (journalId: string, newName: string) => {
    const updatedJournals = journals.map(journal => 
      journal.id === journalId 
        ? { ...journal, name: newName }
        : journal
    );
    
    await saveJournals(updatedJournals);
  };

  const deleteJournal = async (journalId: string) => {
    if (journals.length <= 1) return;
    
    const updatedJournals = journals.filter(journal => journal.id !== journalId);
    await saveJournals(updatedJournals);
    
    if (activeJournalId === journalId) {
      setActiveJournalId(updatedJournals[0]?.id || '');
    }
  };

  const resetJournal = async (journalId: string) => {
    const updatedJournals = journals.map(journal => 
      journal.id === journalId 
        ? { ...journal, trades: [], pendingTrades: [] }
        : journal
    );
    
    await saveJournals(updatedJournals);
  };

  const updateJournalTrades = async (journalId: string, trades: Trade[]) => {
    const updatedJournals = journals.map(journal => 
      journal.id === journalId 
        ? { 
            ...journal, 
            trades: trades.map(trade => ({
              ...trade,
              created_at: trade.created_at || trade.date,
              updated_at: new Date().toISOString()
            }))
          }
        : journal
    );
    
    await saveJournals(updatedJournals);
  };

  const updateJournalPendingTrades = async (journalId: string, pendingTrades: PendingTrade[]) => {
    const updatedJournals = journals.map(journal => 
      journal.id === journalId 
        ? { 
            ...journal, 
            pendingTrades: pendingTrades.map(trade => ({
              ...trade,
              created_at: trade.created_at || trade.date,
              updated_at: new Date().toISOString()
            }))
          }
        : journal
    );
    
    await saveJournals(updatedJournals);
  };

  const updateJournalSettings = async (journalId: string, settings: AppSettings) => {
    const updatedJournals = journals.map(journal => 
      journal.id === journalId 
        ? { ...journal, settings }
        : journal
    );
    
    // CRITICAL: Update React state immediately to prevent reversion
    setJournals(updatedJournals);
    
    await saveJournals(updatedJournals);
  };

  const updatePairSettings = async (journalId: string, pair: string, pairSettings: PairSettings) => {
    const updatedJournals = journals.map(journal => 
      journal.id === journalId 
        ? { 
            ...journal, 
            settings: {
              ...journal.settings,
              pairSettings: {
                ...journal.settings.pairSettings,
                [pair]: pairSettings
              }
            }
          }
        : journal
    );
    
    await saveJournals(updatedJournals);
  };

  const completePendingTrade = async (journalId: string, completedTrade: Trade, pendingTradeId: string) => {
    const updatedJournals = journals.map(journal => 
      journal.id === journalId 
        ? { 
            ...journal, 
            trades: [...journal.trades, {
              ...completedTrade,
              created_at: completedTrade.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            }],
            pendingTrades: journal.pendingTrades.filter(t => t.id !== pendingTradeId)
          }
        : journal
    );
    
    await saveJournals(updatedJournals);
  };

  const exportJournal = (journalId: string) => {
    const journal = journals.find(j => j.id === journalId);
    if (!journal) return;

    const dataStr = JSON.stringify(journal, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${journal.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importJournal = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedJournal = JSON.parse(e.target?.result as string) as Journal;
        
        const newJournal: Journal = {
          ...importedJournal,
          id: crypto.randomUUID(),
          name: `${importedJournal.name} (Imported)`,
          createdAt: new Date().toISOString(),
          pendingTrades: importedJournal.pendingTrades || [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...importedJournal.settings,
            pairSettings: migratePairSettings(importedJournal.settings?.pairSettings || {}),
            customStrategies: migrateStrategiesAndTags(importedJournal.settings?.customStrategies || [], STRATEGIES.map(s => s.name)),
            customSetupTags: migrateStrategiesAndTags(importedJournal.settings?.customSetupTags || [], SETUP_TAGS.map(t => t.name))
          },
          trades: importedJournal.trades?.map(trade => ({
            ...trade,
            created_at: trade.created_at || trade.date,
            updated_at: trade.updated_at || trade.created_at || trade.date,
            pipSize: trade.pipSize || getPipSize(trade.pair) || 1,
            pipValuePerStandardLot: trade.pipValuePerStandardLot || getPipValuePerStandardLot(trade.pair) || 10
          })) || [],
          pendingTrades: importedJournal.pendingTrades?.map(pendingTrade => ({
            ...pendingTrade,
            created_at: pendingTrade.created_at || pendingTrade.date,
            updated_at: pendingTrade.updated_at || pendingTrade.created_at || pendingTrade.date,
            pipSize: pendingTrade.pipSize || getPipSize(pendingTrade.pair) || 1,
            pipValuePerStandardLot: pendingTrade.pipValuePerStandardLot || getPipValuePerStandardLot(pendingTrade.pair) || 10
          })) || []
        };
        
        const updatedJournals = [...journals, newJournal];
        await saveJournals(updatedJournals);
        setActiveJournalId(newJournal.id);
      } catch (error) {
        console.error('Error importing journal:', error);
        alert('Error importing journal. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const getActiveJournal = () => {
    return journals.find(j => j.id === activeJournalId);
  };

  return {
    journals,
    activeJournalId,
    activeJournal,
    setActiveJournalId,
    createJournal,
    renameJournal,
    deleteJournal,
    resetJournal,
    updateJournalTrades,
    updateJournalPendingTrades,
    updateJournalSettings,
    updatePairSettings,
    completePendingTrade,
    exportJournal,
    importJournal,
    isInitialized
  };
};