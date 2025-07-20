import React, { useState, useMemo } from 'react';
import { Plus, Settings as SettingsIcon, BarChart3, List, TrendingUp, Brain, Activity, Clock, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import { Trade, PendingTrade } from './types';
import { TradeForm } from './components/TradeForm';
import { PendingTradeForm } from './components/PendingTradeForm';
import { CompletePendingTradeForm } from './components/CompletePendingTradeForm';
import { DateNavigatorModal } from './components/DateNavigatorModal';
import { Summary } from './components/Summary';
import { SmartSummary } from './components/SmartSummary';
import { PerformanceAnalysis } from './components/PerformanceAnalysis';
import { UltimateMetrics } from './components/UltimateMetrics';
import { PnLChart } from './components/charts/PnLChart';
import { WinLossChart } from './components/charts/WinLossChart';
import { RiskRewardInsightsCard } from './components/RiskRewardInsightsCard';
import { TradingEdgeTimeline } from './components/TradingEdgeTimeline';
import { TradesList } from './components/TradesList';
import { OpenTradesList } from './components/OpenTradesList';
import { Settings } from './components/Settings';
import { JournalSelector } from './components/JournalSelector';
import { useJournals } from './hooks/useJournals';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { calculateTrade, calculateSummary } from './utils/calculations';
import { format, parseISO, isToday, isSameDay } from 'date-fns';
import { isBefore, isAfter, addDays } from 'date-fns';

function App() {
  const {
    journals,
    activeJournalId,
    activeJournal,
    isInitialized,
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
    importJournal
  } = useJournals();

  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showPendingTradeForm, setShowPendingTradeForm] = useState(false);
  const [showCompletePendingForm, setShowCompletePendingForm] = useState(false);
  const [selectedPendingTrade, setSelectedPendingTrade] = useState<PendingTrade | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditCapitalModal, setShowEditCapitalModal] = useState(false);
  const [showDateNavigator, setShowDateNavigator] = useState(false);
  const [selectedHistoricalDate, setSelectedHistoricalDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'performance' | 'ai-summary' | 'trades'>('dashboard');
  const [activeTradesSubTab, setActiveTradesSubTab] = useState<'open' | 'completed'>('open');
  const [showUltimateMetrics, setShowUltimateMetrics] = useState(false);

  // Derived state for read-only mode
  const isReadOnlyMode = selectedHistoricalDate !== null;

  // Filter trades and pending trades based on selected historical date
  const allTrades = activeJournal?.trades || [];
  const allPendingTrades = activeJournal?.pendingTrades || [];

  const trades = useMemo(() => {
    if (!selectedHistoricalDate) return allTrades;
    
    const selectedDate = parseISO(selectedHistoricalDate);
    const endOfSelectedDate = addDays(selectedDate, 1); // Include the entire selected day
    
    return allTrades.filter(trade => {
      const tradeCreatedAt = trade.created_at ? parseISO(trade.created_at) : parseISO(trade.date);
      return isBefore(tradeCreatedAt, endOfSelectedDate) || isSameDay(tradeCreatedAt, selectedDate);
    });
  }, [allTrades, selectedHistoricalDate]);

  const pendingTrades = useMemo(() => {
    if (!selectedHistoricalDate) return allPendingTrades;
    
    const selectedDate = parseISO(selectedHistoricalDate);
    const endOfSelectedDate = addDays(selectedDate, 1); // Include the entire selected day
    
    return allPendingTrades.filter(trade => {
      const tradeCreatedAt = trade.created_at ? parseISO(trade.created_at) : parseISO(trade.date);
      return isBefore(tradeCreatedAt, endOfSelectedDate) || isSameDay(tradeCreatedAt, selectedDate);
    });
  }, [allPendingTrades, selectedHistoricalDate]);

  // Calculate activity date range for date navigator
  const { firstActivityDate, lastActivityDate, dailyActivity } = useMemo(() => {
    const allDates = [
      ...allTrades.map(t => t.created_at || t.date),
      ...allPendingTrades.map(t => t.created_at || t.date)
    ].filter(Boolean).sort();

    // Calculate daily activity for date picker indicators
    const dailyActivity: Record<string, { trades: number; pendingTrades: number }> = {};
    
    allTrades.forEach(trade => {
      const dateKey = (trade.created_at || trade.date).split('T')[0];
      if (!dailyActivity[dateKey]) {
        dailyActivity[dateKey] = { trades: 0, pendingTrades: 0 };
      }
      dailyActivity[dateKey].trades++;
    });
    
    allPendingTrades.forEach(trade => {
      const dateKey = (trade.created_at || trade.date).split('T')[0];
      if (!dailyActivity[dateKey]) {
        dailyActivity[dateKey] = { trades: 0, pendingTrades: 0 };
      }
      dailyActivity[dateKey].pendingTrades++;
    });
    return {
      firstActivityDate: allDates.length > 0 ? allDates[0].split('T')[0] : null,
      lastActivityDate: allDates.length > 0 ? allDates[allDates.length - 1].split('T')[0] : null,
      dailyActivity
    };
  }, [allTrades, allPendingTrades]);

  const settings = activeJournal?.settings || {
    startingCapital: 10000,
    currency: 'USD',
    enableAPlusTracking: true,
    enablePsychologyTracking: true,
    enableScreenshotUpload: true,
    timezone: 'UTC',
    dataExportFormat: 'CSV' as const,
    pairSettings: {},
    customStrategies: [],
    customSetupTags: []
  };

  const summary = useMemo(() => calculateSummary(trades, settings), [trades, settings]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onOpenTradeForm: () => setShowTradeForm(true),
    onOpenPendingForm: () => setShowPendingTradeForm(true),
    isReadOnlyMode
  });

  const handleAddTrade = async (tradeData: Partial<Trade>) => {
    if (!activeJournal) return;

    try {
      const previousEquity = trades.length > 0 
        ? trades[trades.length - 1].equity 
        : settings.startingCapital;
      
      const newTrade = calculateTrade(tradeData, settings, previousEquity);
      const updatedTrades = [...trades, newTrade];
      await updateJournalTrades(activeJournal.id, [...allTrades, newTrade]);
      setShowTradeForm(false);
    } catch (error) {
      console.error('Error adding trade:', error);
      // Don't close the form if there's an error, let user retry
    }
  };

  const handleAddPendingTrade = async (pendingTradeData: Partial<PendingTrade>) => {
    if (!activeJournal) return;

    try {
      const newPendingTrade: PendingTrade = {
        id: crypto.randomUUID(),
        ...pendingTradeData as PendingTrade
      };
      
      const updatedPendingTrades = [...pendingTrades, newPendingTrade];
      await updateJournalPendingTrades(activeJournal.id, [...allPendingTrades, newPendingTrade]);
      setShowPendingTradeForm(false);
    } catch (error) {
      console.error('Error adding pending trade:', error);
      // Don't close the form if there's an error, let user retry
    }
  };

  const handleCompletePendingTrade = (pendingTrade: PendingTrade) => {
    setSelectedPendingTrade(pendingTrade);
    setShowCompletePendingForm(true);
  };

  const handlePendingTradeCompletion = async (completedTradeData: Partial<Trade>) => {
    if (!activeJournal || !selectedPendingTrade) return;

    try {
      // Calculate the completed trade
      const previousEquity = trades.length > 0 
        ? trades[trades.length - 1].equity 
        : settings.startingCapital;
      
      const completedTrade = calculateTrade(completedTradeData, settings, previousEquity);
      
      // Atomically complete the pending trade (add to completed, remove from pending)
      await completePendingTrade(activeJournal.id, completedTrade, selectedPendingTrade.id);
      
      // CRITICAL FIX: If in read-only mode (viewing historical data), switch back to live view
      // so the newly completed trade appears immediately in the completed trades list
      if (isReadOnlyMode) {
        setSelectedHistoricalDate(null);
      }
      
      // Reset state
      setSelectedPendingTrade(null);
      setShowCompletePendingForm(false);
      
      // Switch to completed trades tab to show the newly completed trade
      setActiveTab('trades');
      setActiveTradesSubTab('completed');
    } catch (error) {
      console.error('Error completing pending trade:', error);
      // Don't close the form if there's an error, let user retry
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!activeJournal) return;

    // Remove the trade
    const updatedTrades = allTrades.filter(t => t.id !== tradeId);
    
    // Recalculate equity for all remaining trades
    const recalculatedTrades = updatedTrades.reduce((acc, trade, index) => {
      const previousEquity = index === 0 
        ? settings.startingCapital 
        : acc[index - 1].equity;
      
      const recalculatedTrade = calculateTrade(trade, settings, previousEquity);
      acc.push(recalculatedTrade);
      return acc;
    }, [] as Trade[]);
    
    await updateJournalTrades(activeJournal.id, recalculatedTrades);
  };

  const handleSettingsSave = async (newSettings: typeof settings) => {
    if (!activeJournal) return;

    await updateJournalSettings(activeJournal.id, newSettings);
    
    // Recalculate all trades with new settings
    if (allTrades.length > 0) {
      const recalculatedTrades = allTrades.reduce((acc, trade, index) => {
        const previousEquity = index === 0 
          ? newSettings.startingCapital 
          : acc[index - 1].equity;
        
        const recalculatedTrade = calculateTrade(trade, newSettings, previousEquity);
        acc.push(recalculatedTrade);
        return acc;
      }, [] as Trade[]);
      
      await updateJournalTrades(activeJournal.id, recalculatedTrades);
    }
  };

  const handleEditStartingCapital = () => {
    setShowEditCapitalModal(true);
  };

  const handleStartingCapitalSave = async (newCapital: number) => {
    if (!activeJournal) return;

    // Update settings with new starting capital
    const newSettings = {
      ...settings,
      startingCapital: newCapital
    };

    // Reset the journal completely (clear all trades and pending trades)
    await resetJournal(activeJournal.id);
    
    // Update settings
    await updateJournalSettings(activeJournal.id, newSettings);
    
    setShowEditCapitalModal(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'ai-summary', label: 'AI Summary', icon: Brain },
    { id: 'trades', label: 'Trades', icon: List }
  ];

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp size={64} className="mx-auto text-blue-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Loading Trading Journal...</h1>
          <p className="text-gray-400">Setting up your trading environment</p>
        </div>
      </div>
    );
  }

  // Show loading if no active journal
  if (!activeJournal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp size={64} className="mx-auto text-blue-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Setting up your journal...</h1>
          <p className="text-gray-400">Please wait while we prepare your trading environment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Mobile-First Header with Fixed Navigation Spacing */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo and Title - Fixed Width Container */}
            <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0 min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <TrendingUp size={20} className="sm:w-7 sm:h-7 text-blue-400" />
                </div>
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">
                  <span className="hidden sm:inline">TradingJournal Pro</span>
                  <span className="sm:hidden">TJ Pro</span>
                </h1>
              </div>
              
              {/* Desktop Journal Selector - Positioned with proper spacing */}
              <div className="hidden lg:block ml-4 xl:ml-6">
                <JournalSelector
                  journals={journals}
                  activeJournalId={activeJournalId}
                  onJournalChange={setActiveJournalId}
                  onCreateJournal={createJournal}
                  onRenameJournal={renameJournal}
                  onDeleteJournal={deleteJournal}
                  onResetJournal={resetJournal}
                  onExportJournal={exportJournal}
                  onImportJournal={importJournal}
                />
              </div>
            </div>
            
            {/* Navigation and Actions - Fixed for Mobile Settings Icon */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Desktop Navigation - Horizontal Layout (md and above) */}
              <nav className="hidden md:flex items-center flex-shrink min-w-0">
                <div className="flex items-center space-x-1 lg:space-x-1.5 xl:space-x-2">
                  {navItems.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`flex items-center space-x-1.5 px-2.5 lg:px-3 xl:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                        activeTab === id 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={12} className="flex-shrink-0" />
                      <span className="hidden lg:inline whitespace-nowrap">{label}</span>
                    </button>
                  ))}
                </div>
              </nav>
              
              {/* Action Buttons - Never allow these to shrink or be hidden */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {/* Date Navigator Button */}
                <button
                  onClick={() => setShowDateNavigator(true)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                    isReadOnlyMode 
                      ? 'text-orange-400 bg-orange-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={isReadOnlyMode ? `Viewing: ${format(parseISO(selectedHistoricalDate!), 'MMM dd, yyyy')}` : 'Time Travel'}
                >
                  <Calendar size={14} className="sm:w-4 sm:h-4" />
                </button>
                
                {/* Add Trade Button */}
                {!isReadOnlyMode && (
                  <button
                    onClick={() => setShowTradeForm(true)}
                    className="flex items-center space-x-1 sm:space-x-1.5 bg-blue-600 text-white px-2 sm:px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex-shrink-0"
                  >
                    <Plus size={16} className="flex-shrink-0" />
                    <span className="hidden sm:inline text-xs sm:text-sm lg:text-base whitespace-nowrap">Add Trade</span>
                  </button>
                )}
                
                {/* Settings Button - Always visible */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-gray-400 hover:text-white p-1.5 sm:p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
                >
                  <SettingsIcon size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation and Journal Selector - Full Width Below Header */}
          <div className="md:hidden pb-3 sm:pb-4 space-y-3">
            {/* Mobile Navigation - Two Row Grid Layout */}
            <nav className="w-full">
              <div className="grid grid-cols-4 gap-2 items-center justify-items-center">
                {/* First Row: Dashboard, Performance, AI Summary, Trades */}
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`w-full p-2.5 rounded-lg transition-all duration-200 flex flex-col items-center justify-center space-y-1 min-h-[48px] ${
                      activeTab === id 
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:scale-105'
                    }`}
                    title={label}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="text-xs font-medium leading-none">{label}</span>
                  </button>
                ))}
              </div>
              
              {/* Second Row: Time Travel, Add Trade, Settings */}
              <div className="grid grid-cols-3 gap-2 items-center justify-items-center mt-2">
                {/* Time Travel Button */}
                <button
                  onClick={() => setShowDateNavigator(true)}
                  className={`w-full p-2.5 rounded-lg transition-all duration-200 flex flex-col items-center justify-center space-y-1 min-h-[48px] ${
                    isReadOnlyMode 
                      ? 'bg-orange-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:scale-105'
                  }`}
                  title={isReadOnlyMode ? `Viewing: ${format(parseISO(selectedHistoricalDate!), 'MMM dd, yyyy')}` : 'Time Travel'}
                >
                  <Calendar size={16} className="flex-shrink-0" />
                  <span className="text-xs font-medium leading-none">
                    {isReadOnlyMode ? 'Viewing' : 'Time Travel'}
                  </span>
                </button>
                
                {/* Add Trade Button */}
                {!isReadOnlyMode && (
                  <button
                    onClick={() => setShowTradeForm(true)}
                    className="w-full p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex flex-col items-center justify-center space-y-1 shadow-lg hover:scale-105 min-h-[48px]"
                    title="Add Trade"
                  >
                    <Plus size={16} className="flex-shrink-0" />
                    <span className="text-xs font-medium leading-none">Add Trade</span>
                  </button>
                )}
                
                {/* Settings Button */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full p-2.5 rounded-lg transition-all duration-200 flex flex-col items-center justify-center space-y-1 text-gray-300 hover:text-white hover:bg-gray-700/50 hover:scale-105 min-h-[48px]"
                  title="Settings"
                >
                  <SettingsIcon size={16} className="flex-shrink-0" />
                  <span className="text-xs font-medium leading-none">Settings</span>
                </button>
              </div>
            </nav>
            
            {/* Read-only mode indicator */}
            {isReadOnlyMode && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-orange-400" />
                  <span className="text-orange-400 font-medium text-sm">
                    Viewing: {format(parseISO(selectedHistoricalDate!), 'MMMM dd, yyyy')} – Read Only Mode
                  </span>
                </div>
              </div>
            )}
            
            {!isReadOnlyMode && (
              <JournalSelector
                journals={journals}
                activeJournalId={activeJournalId}
                onJournalChange={setActiveJournalId}
                onCreateJournal={createJournal}
                onRenameJournal={renameJournal}
                onDeleteJournal={deleteJournal}
                onResetJournal={resetJournal}
                onExportJournal={exportJournal}
                onImportJournal={importJournal}
                isReadOnlyMode={isReadOnlyMode}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content with Enhanced Mobile Spacing */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        {/* Desktop Read-only mode indicator */}
        {isReadOnlyMode && (
          <div className="hidden lg:block mb-6">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Clock size={20} className="text-orange-400" />
                <div>
                  <span className="text-orange-400 font-medium">
                    Viewing: {format(parseISO(selectedHistoricalDate!), 'MMMM dd, yyyy')} – Read Only Mode
                  </span>
                  <p className="text-gray-400 text-sm mt-1">
                    You're viewing historical data. All editing functions are disabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Summary Cards */}
            <Summary 
              summary={summary} 
              settings={settings} 
              onEditStartingCapital={handleEditStartingCapital}
              isReadOnlyMode={isReadOnlyMode}
            />
            
            {trades.length > 0 ? (
              <>
                {/* Top Charts Grid - P&L and Win/Loss */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                  <PnLChart trades={trades} startingCapital={settings.startingCapital} />
                  <WinLossChart trades={trades} />
                </div>

                {/* Premium Analytics Cards - Full Width */}
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  <RiskRewardInsightsCard trades={trades} settings={settings} />
                  <TradingEdgeTimeline trades={trades} settings={settings} />
                </div>
              </>
            ) : (
              <div className="text-center py-8 sm:py-12 lg:py-16">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 sm:p-8 lg:p-12">
                  <TrendingUp size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-500 mb-4" />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2">No trades yet</h3>
                  <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Start by adding your first trade to see your analytics</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setShowTradeForm(true)}
                      className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 justify-center text-sm sm:text-base"
                      disabled={isReadOnlyMode}
                    >
                      <Plus size={16} />
                      <span>Add Completed Trade</span>
                    </button>
                    <button
                      onClick={() => setShowPendingTradeForm(true)}
                      className="bg-orange-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 justify-center text-sm sm:text-base"
                      disabled={isReadOnlyMode}
                    >
                      <Clock size={16} />
                      <span>Add Pending Trade</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <>
            {showUltimateMetrics ? (
              <UltimateMetrics 
                trades={trades} 
                settings={settings} 
                onBackToRegular={() => setShowUltimateMetrics(false)}
              />
            ) : (
              <PerformanceAnalysis 
                trades={trades} 
                settings={settings} 
                onToggleUltimateMetrics={() => setShowUltimateMetrics(!showUltimateMetrics)}
                showUltimateMetrics={showUltimateMetrics}
              />
            )}
          </>
        )}

        {activeTab === 'ai-summary' && (
          <SmartSummary trades={trades} settings={settings} />
        )}

        {activeTab === 'trades' && (
          <TradesList 
            trades={trades} 
            pendingTrades={pendingTrades}
            onCompleteTrade={handleCompletePendingTrade}
            onDeleteTrade={handleDeleteTrade}
            activeTradesSubTab={activeTradesSubTab}
            setActiveTradesSubTab={setActiveTradesSubTab}
            isReadOnlyMode={isReadOnlyMode}
          />
        )}
      </main>

      {/* Modals */}
      {showTradeForm && !isReadOnlyMode && (
        <TradeForm
          onSubmit={handleAddTrade}
          onCancel={() => setShowTradeForm(false)}
          onShowPendingForm={() => {
            setShowTradeForm(false);
            setShowPendingTradeForm(true);
          }}
          settings={settings}
          onUpdatePairSettings={(pair, pairSettings) => updatePairSettings(activeJournal.id, pair, pairSettings)}
          isReadOnlyMode={isReadOnlyMode}
        />
      )}

      {showPendingTradeForm && !isReadOnlyMode && (
        <PendingTradeForm
          onSubmit={handleAddPendingTrade}
          onCancel={() => setShowPendingTradeForm(false)}
          settings={settings}
          onUpdatePairSettings={(pair, pairSettings) => updatePairSettings(activeJournal.id, pair, pairSettings)}
          isReadOnlyMode={isReadOnlyMode}
        />
      )}

      {showCompletePendingForm && selectedPendingTrade && !isReadOnlyMode && (
        <CompletePendingTradeForm
          pendingTrade={selectedPendingTrade}
          onSubmit={handlePendingTradeCompletion}
          onCancel={() => {
            setShowCompletePendingForm(false);
            setSelectedPendingTrade(null);
          }}
          settings={settings}
        />
      )}

      {showSettings && (
        <Settings
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Date Navigator Modal */}
      <DateNavigatorModal
        isOpen={showDateNavigator}
        onClose={() => setShowDateNavigator(false)}
        firstActivityDate={firstActivityDate}
        lastActivityDate={lastActivityDate}
        dailyActivity={dailyActivity}
        selectedDate={selectedHistoricalDate}
        onSelectDate={setSelectedHistoricalDate}
      />

      {/* Edit Starting Capital Modal */}
      {showEditCapitalModal && (
        <EditStartingCapitalModal
          currentCapital={settings.startingCapital}
          onSave={handleStartingCapitalSave}
          onClose={() => setShowEditCapitalModal(false)}
          isReadOnlyMode={isReadOnlyMode}
        />
      )}
    </div>
  );
}

// Edit Starting Capital Modal Component
interface EditStartingCapitalModalProps {
  currentCapital: number;
  onSave: (newCapital: number) => void;
  onClose: () => void;
  isReadOnlyMode?: boolean;
}

const EditStartingCapitalModal: React.FC<EditStartingCapitalModalProps> = ({
  currentCapital,
  onSave,
  onClose,
  isReadOnlyMode = false
}) => {
  const [newCapital, setNewCapital] = useState(currentCapital.toString());
  const [isValid, setIsValid] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const capital = parseFloat(newCapital);
    
    if (isNaN(capital) || capital <= 0) {
      setIsValid(false);
      return;
    }
    
    onSave(capital);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCapital(value);
    
    const capital = parseFloat(value);
    setIsValid(!isNaN(capital) && capital > 0);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DollarSign size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Starting Capital</h2>
              <p className="text-gray-400 text-sm">This will reset your entire journal</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              New Starting Capital (USD)
            </label>
            <input
              type="number"
              value={newCapital}
              onChange={handleInputChange}
              className={`w-full bg-gray-800/50 border rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                isValid ? 'border-gray-600/50' : 'border-red-500/50'
              }`}
              placeholder="10000"
              step="0.01"
              min="0.01"
              required
              autoFocus
              disabled={isReadOnlyMode}
            />
            {!isValid && (
              <p className="text-red-400 text-sm">Please enter a valid amount greater than 0</p>
            )}
          </div>
          
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-orange-400 font-medium text-sm mb-1">Warning</h4>
                <p className="text-gray-300 text-sm">
                  Changing your starting capital will completely reset your journal. All trades, pending trades, and statistics will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600/50 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              style={{ display: isReadOnlyMode ? 'none' : 'flex' }}
            >
              <DollarSign size={16} />
              <span>Update & Reset Journal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default App;