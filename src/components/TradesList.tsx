import React, { useState } from 'react';
import { Trade, PendingTrade } from '../types';
import { format, parseISO } from 'date-fns';
import { ExternalLink, Filter, ChevronDown, ChevronUp, Calendar, DollarSign, TrendingUp, X, Menu, Eye, EyeOff, Clock, List } from 'lucide-react';
import { formatRRDisplay, hasValidRR } from '../utils/calculations';
import { formatCompactCurrency, formatLotSizeForTradesHistory, formatCleanNumberDisplay } from '../utils/formatting';
import { OpenTradesList } from './OpenTradesList';
import { TradeDetailsModal } from './TradeDetailsModal';

interface TradesListProps {
  trades: Trade[];
  pendingTrades: PendingTrade[];
  onCompleteTrade: (trade: PendingTrade) => void;
  onDeleteTrade: (tradeId: string) => void;
  activeTradesSubTab: 'open' | 'completed';
  setActiveTradesSubTab: (tab: 'open' | 'completed') => void;
  isReadOnlyMode?: boolean;
}

export const TradesList: React.FC<TradesListProps> = ({ 
  trades, 
  pendingTrades, 
  onCompleteTrade, 
  onDeleteTrade,
  activeTradesSubTab,
  setActiveTradesSubTab,
  isReadOnlyMode = false
}) => {
  const [sortField, setSortField] = useState<keyof Trade | 'tradeNumber'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterPair, setFilterPair] = useState<string>('all');
  const [filterStrategy, setFilterStrategy] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showTradesWithoutSLTP, setShowTradesWithoutSLTP] = useState(false);
  const [rrRangeMin, setRrRangeMin] = useState<string>('');
  const [rrRangeMax, setRrRangeMax] = useState<string>('');
  const [pnlRangeMin, setPnlRangeMin] = useState<string>('');
  const [pnlRangeMax, setPnlRangeMax] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const handleSort = (field: keyof Trade | 'tradeNumber') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getTradeNumber = (trade: Trade) => {
    return trades.findIndex(t => t.id === trade.id) + 1;
  };

  const filteredTrades = trades
    .filter(trade => filterResult === 'all' || trade.result === filterResult)
    .filter(trade => filterPair === 'all' || trade.pair === filterPair)
    .filter(trade => filterStrategy === 'all' || trade.strategy === filterStrategy)
    .filter(trade => {
      // Show trades without SL/TP filter
      if (showTradesWithoutSLTP) {
        return !hasValidRR(trade);
      }
      return true;
    })
    .filter(trade => {
      // R:R Range filter - only apply to trades with valid R:R
      if (rrRangeMin && hasValidRR(trade) && trade.rrRatio < parseFloat(rrRangeMin)) return false;
      if (rrRangeMax && hasValidRR(trade) && trade.rrRatio > parseFloat(rrRangeMax)) return false;
      return true;
    })
    .filter(trade => {
      // P&L Range filter
      if (pnlRangeMin && trade.pnl < parseFloat(pnlRangeMin)) return false;
      if (pnlRangeMax && trade.pnl > parseFloat(pnlRangeMax)) return false;
      return true;
    })
    .filter(trade => {
      // Date range filter
      const tradeDate = parseISO(trade.date);
      if (dateFrom && tradeDate < parseISO(dateFrom)) return false;
      if (dateTo && tradeDate > parseISO(dateTo)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'tradeNumber') {
        // Special handling for trade number sorting
        const aTradeNumber = getTradeNumber(a);
        const bTradeNumber = getTradeNumber(b);
        return sortDirection === 'asc' ? aTradeNumber - bTradeNumber : bTradeNumber - aTradeNumber;
      }
      
      const aValue = a[sortField as keyof Trade];
      const bValue = b[sortField as keyof Trade];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  // Get unique values that exist in current trades for smart filtering
  const uniquePairs = [...new Set(trades.map(t => t.pair))].sort();
  const uniqueStrategies = [...new Set(trades.map(t => t.strategy))].sort();

  const clearFilters = () => {
    setFilterResult('all');
    setFilterPair('all');
    setFilterStrategy('all');
    setShowTradesWithoutSLTP(false);
    setRrRangeMin('');
    setRrRangeMax('');
    setPnlRangeMin('');
    setPnlRangeMax('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = () => {
    return filterResult !== 'all' || filterPair !== 'all' || filterStrategy !== 'all' ||
           showTradesWithoutSLTP || rrRangeMin || rrRangeMax || pnlRangeMin || pnlRangeMax || dateFrom || dateTo;
  };

  const getResultPill = (result: string) => {
    switch (result) {
      case 'Win':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">Win</span>;
      case 'Loss':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">Loss</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/20">Break-even</span>;
    }
  };

  const getDirectionPill = (direction: string) => {
    return direction === 'Buy' 
      ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">•Buy</span>
      : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">•Sell</span>;
  };

  const SortButton = ({ field, children }: { field: keyof Trade | 'tradeNumber'; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-white transition-colors group"
    >
      <span>{children}</span>
      {sortField === field && (
        <div className="text-blue-400">
          {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      )}
    </button>
  );

  const tradesWithoutSLTP = trades.filter(t => !hasValidRR(t));

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  const handleDeleteTrade = (tradeId: string) => {
    onDeleteTrade(tradeId);
    setSelectedTrade(null); // Close the modal after deletion
  };

  return (
    <div className="space-y-6">
      {/* Professional Tab Navigation */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <List size={18} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">Trading History</h3>
                <p className="text-gray-400 text-sm">
                  {pendingTrades.length} open • {trades.length} completed
                </p>
              </div>
            </div>
          </div>

          {/* Modern Tab Selector */}
          <div className="flex items-center space-x-1 bg-gray-700/30 rounded-lg p-1">
            <button
              onClick={() => setActiveTradesSubTab('open')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 flex-1 justify-center ${
                activeTradesSubTab === 'open'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              <Clock size={16} />
              <span className="font-medium">Open Trades</span>
              {pendingTrades.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTradesSubTab === 'open' 
                    ? 'bg-orange-700 text-orange-100' 
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {pendingTrades.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTradesSubTab('completed')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 flex-1 justify-center ${
                activeTradesSubTab === 'completed'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              <TrendingUp size={16} />
              <span className="font-medium">Completed Trades</span>
              {/* Removed the trade count badge for completed trades as requested */}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTradesSubTab === 'open' ? (
            <div className="p-6">
              <OpenTradesList 
                pendingTrades={pendingTrades}
                onCompleteTrade={onCompleteTrade}
                isReadOnlyMode={isReadOnlyMode}
              />
            </div>
          ) : (
            <div>
              {/* Completed Trades Filters */}
              <div className="p-4 sm:p-6 border-b border-gray-700/50">
                <div className="flex flex-col space-y-4">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="md:hidden flex items-center space-x-2 px-3 py-2 bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white rounded-lg transition-all"
                  >
                    <Menu size={16} />
                    <span className="text-sm">Filters</span>
                    {hasActiveFilters() && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                        Active
                      </span>
                    )}
                  </button>

                  {/* Desktop Filter Controls */}
                  <div className="hidden md:flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                          showAdvancedFilters 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                        }`}
                      >
                        <Filter size={16} />
                        <span className="text-sm font-medium">Advanced Filters</span>
                        {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {/* Show Trades Without SL/TP Toggle */}
                      {tradesWithoutSLTP.length > 0 && (
                        <button
                          onClick={() => setShowTradesWithoutSLTP(!showTradesWithoutSLTP)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                            showTradesWithoutSLTP 
                              ? 'bg-orange-600 text-white shadow-lg' 
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                          }`}
                        >
                          {showTradesWithoutSLTP ? <Eye size={16} /> : <EyeOff size={16} />}
                          <span className="text-sm font-medium">
                            {showTradesWithoutSLTP ? 'Showing' : 'Show'} No SL/TP ({tradesWithoutSLTP.length})
                          </span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={filterResult}
                        onChange={(e) => setFilterResult(e.target.value)}
                        className="bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="all" className="bg-gray-800 text-white">All Results</option>
                        <option value="Win" className="bg-gray-800 text-white">Wins</option>
                        <option value="Loss" className="bg-gray-800 text-white">Losses</option>
                        <option value="Break-even" className="bg-gray-800 text-white">Break-even</option>
                      </select>
                      
                      <select
                        value={filterPair}
                        onChange={(e) => setFilterPair(e.target.value)}
                        className="bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="all" className="bg-gray-800 text-white">All Pairs</option>
                        {uniquePairs.map(pair => (
                          <option key={pair} value={pair} className="bg-gray-800 text-white">{pair}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mobile Filter Panel */}
                  {showMobileFilters && (
                    <div className="md:hidden bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-4 space-y-4 animate-fade-in-up">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-white">Filters</h4>
                        <button
                          onClick={() => setShowMobileFilters(false)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <select
                          value={filterResult}
                          onChange={(e) => setFilterResult(e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="all" className="bg-gray-800 text-white">All Results</option>
                          <option value="Win" className="bg-gray-800 text-white">Wins</option>
                          <option value="Loss" className="bg-gray-800 text-white">Losses</option>
                          <option value="Break-even" className="bg-gray-800 text-white">Break-even</option>
                        </select>
                        
                        <select
                          value={filterPair}
                          onChange={(e) => setFilterPair(e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="all" className="bg-gray-800 text-white">All Pairs</option>
                          {uniquePairs.map(pair => (
                            <option key={pair} value={pair} className="bg-gray-800 text-white">{pair}</option>
                          ))}
                        </select>
                        
                        <select
                          value={filterStrategy}
                          onChange={(e) => setFilterStrategy(e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="all" className="bg-gray-800 text-white">All Strategies</option>
                          {uniqueStrategies.map(strategy => (
                            <option key={strategy} value={strategy} className="bg-gray-800 text-white">{strategy}</option>
                          ))}
                        </select>

                        {/* Mobile Show Trades Without SL/TP Toggle */}
                        {tradesWithoutSLTP.length > 0 && (
                          <button
                            onClick={() => setShowTradesWithoutSLTP(!showTradesWithoutSLTP)}
                            className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                              showTradesWithoutSLTP 
                                ? 'bg-orange-600 text-white shadow-lg' 
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                            }`}
                          >
                            {showTradesWithoutSLTP ? <Eye size={16} /> : <EyeOff size={16} />}
                            <span className="text-sm font-medium">
                              {showTradesWithoutSLTP ? 'Showing' : 'Show'} No SL/TP ({tradesWithoutSLTP.length})
                            </span>
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                          showAdvancedFilters 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                        }`}
                      >
                        <Filter size={16} />
                        <span className="text-sm font-medium">Advanced Options</span>
                        {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {hasActiveFilters() && (
                        <button
                          onClick={clearFilters}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                        >
                          <X size={14} />
                          <span>Clear All Filters</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Advanced Filters Panel */}
                  {showAdvancedFilters && (
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-xl p-4 sm:p-6 space-y-6 animate-fade-in-up">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base sm:text-lg font-semibold text-white">Advanced Filtering Options</h4>
                        {hasActiveFilters() && (
                          <button
                            onClick={clearFilters}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                          >
                            <X size={14} />
                            <span className="hidden sm:inline">Clear All</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Strategy Filter - Hidden on mobile since it's in mobile panel */}
                        <div className="hidden md:block space-y-2">
                          <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                            <TrendingUp size={16} className="text-blue-400" />
                            <span>Strategy</span>
                          </label>
                          <select
                            value={filterStrategy}
                            onChange={(e) => setFilterStrategy(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                          >
                            <option value="all" className="bg-gray-800 text-white">All Strategies</option>
                            {uniqueStrategies.map(strategy => (
                              <option key={strategy} value={strategy} className="bg-gray-800 text-white">{strategy}</option>
                            ))}
                          </select>
                        </div>

                        {/* R:R Range */}
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                            <TrendingUp size={16} className="text-green-400" />
                            <span>R:R Range</span>
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Min"
                              value={rrRangeMin}
                              onChange={(e) => setRrRangeMin(e.target.value)}
                              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Max"
                              value={rrRangeMax}
                              onChange={(e) => setRrRangeMax(e.target.value)}
                              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* P&L Range */}
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                            <DollarSign size={16} className="text-yellow-400" />
                            <span>P&L Range</span>
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Min $"
                              value={pnlRangeMin}
                              onChange={(e) => setPnlRangeMin(e.target.value)}
                              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Max $"
                              value={pnlRangeMax}
                              onChange={(e) => setPnlRangeMax(e.target.value)}
                              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Date Range */}
                        <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                          <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                            <Calendar size={16} className="text-purple-400" />
                            <span>Date Range</span>
                          </label>
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <span className="text-gray-400 self-center px-2 text-center sm:text-left">to</span>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-600/30 space-y-3 sm:space-y-0">
                        <div className="text-sm text-gray-400 text-center sm:text-left">
                          Showing <span className="text-white font-medium">{filteredTrades.length}</span> of <span className="text-white font-medium">{trades.length}</span> trades
                        </div>
                        {hasActiveFilters() && (
                          <button
                            onClick={clearFilters}
                            className="w-full sm:w-auto px-4 py-2 bg-gray-600/50 hover:bg-gray-500/50 text-white rounded-lg transition-all text-sm font-medium"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Completed Trades Table */}
              <div className="overflow-x-auto">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  {filteredTrades.map((trade) => (
                    <div 
                      key={trade.id} 
                      className="p-4 border-b border-gray-700/50 last:border-b-0 cursor-pointer hover:bg-gray-700/30 transition-colors"
                      onClick={() => handleTradeClick(trade)}
                    >
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium text-sm ${
                              trade.direction === 'Buy' 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              •T{getTradeNumber(trade)}
                            </span>
                            {trade.isAPlusSetup && (
                              <span className="text-yellow-400" title="A+ Setup">⭐</span>
                            )}
                            {!hasValidRR(trade) && (
                              <span className="text-gray-500 text-xs" title="No SL/TP data">—</span>
                            )}
                          </div>
                          {getResultPill(trade.result)}
                        </div>
                        
                        {/* Trade Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400">Pair:</span>
                            <div className="font-medium text-white">{trade.pair}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Date:</span>
                            <div className="text-white">{format(parseISO(trade.date), 'MM/dd/yyyy')}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Direction:</span>
                            <div>{getDirectionPill(trade.direction)}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Size:</span>
                            <div className="text-white">{formatCleanNumberDisplay(trade.lotSize)}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">R:R:</span>
                            <div className={hasValidRR(trade) ? 'text-white' : 'text-gray-500'}>
                              {formatRRDisplay(trade.rrRatio)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">P&L:</span>
                            <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCompactCurrency(trade.pnl)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Strategy and Notes */}
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-400">Strategy:</span>
                            <span className="ml-2 text-white">{trade.strategy}</span>
                          </div>
                          {(trade.notes || trade.screenshotLink) && (
                            <div>
                              <span className="text-gray-400">Notes:</span>
                              <div className="flex items-start space-x-2 mt-1">
                                <span className="text-white text-xs">{trade.notes || '—'}</span>
                                {trade.screenshotLink && (
                                  <a 
                                    href={trade.screenshotLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <table className="hidden sm:table w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <SortButton field="tradeNumber">Trade</SortButton>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <SortButton field="date">Date</SortButton>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <SortButton field="pair">Pair</SortButton>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <SortButton field="direction">Direction</SortButton>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <SortButton field="lotSize">Size</SortButton>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <SortButton field="rrRatio">R:R</SortButton>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <SortButton field="result">Result</SortButton>
                      </th>
                      <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <SortButton field="pnl">P&L</SortButton>
                      </th>
                      <th className="hidden lg:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Strategy
                      </th>
                      <th className="hidden xl:table-cell px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredTrades.map((trade) => (
                      <tr 
                        key={trade.id} 
                        className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                        onClick={() => handleTradeClick(trade)}
                      >
                        <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${
                              trade.direction === 'Buy' 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              •T{getTradeNumber(trade)}
                            </span>
                            {trade.isAPlusSetup && (
                              <span className="text-yellow-400" title="A+ Setup">⭐</span>
                            )}
                            {!hasValidRR(trade) && (
                              <span className="text-gray-500 text-xs" title="No SL/TP data">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-white">
                          {format(parseISO(trade.date), 'MM/dd/yyyy')}
                        </td>
                        <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {trade.pair}
                        </td>
                        <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm">
                          {getDirectionPill(trade.direction)}
                        </td>
                        <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {formatCleanNumberDisplay(trade.lotSize)}
                        </td>
                        <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          <span className={hasValidRR(trade) ? 'text-gray-300' : 'text-gray-500'}>
                            {formatRRDisplay(trade.rrRatio)}
                          </span>
                        </td>
                        <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm">
                          {getResultPill(trade.result)}
                        </td>
                        <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {formatCompactCurrency(trade.pnl)}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {trade.strategy}
                        </td>
                        <td className="hidden xl:table-cell px-3 lg:px-4 py-3 text-sm text-gray-300 max-w-xs">
                          <div className="flex items-start space-x-2">
                            <span className="truncate">{trade.notes || '—'}</span>
                            {trade.screenshotLink && (
                              <a 
                                href={trade.screenshotLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredTrades.length === 0 && (
                <div className="p-8 sm:p-12 text-center">
                  <div className="bg-gray-700/30 rounded-xl p-6 sm:p-8">
                    <Filter size={48} className="mx-auto text-gray-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {isReadOnlyMode ? 'No activity on this date' : 'No trades found'}
                    </h3>
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">
                      {isReadOnlyMode 
                        ? 'No trades were added or modified on the selected date.'
                        : hasActiveFilters() 
                          ? 'No trades match your current filters. Try adjusting your criteria.'
                          : 'No trades have been added yet. Start by adding your first trade!'
                      }
                    </p>
                    {hasActiveFilters() && !isReadOnlyMode && (
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trade Details Modal */}
      {selectedTrade && (
        <TradeDetailsModal
          trade={selectedTrade}
          tradeNumber={getTradeNumber(selectedTrade)}
          onClose={() => setSelectedTrade(null)}
          onDelete={handleDeleteTrade}
          isReadOnlyMode={isReadOnlyMode}
        />
      )}
    </div>
  );
};