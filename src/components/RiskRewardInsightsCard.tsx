import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Award, BarChart3, Eye, Calendar, DollarSign, Hash } from 'lucide-react';
import { Trade, AppSettings } from '../types';
import { formatRRDisplay, hasValidRR } from '../utils/calculations';
import { formatCompactCurrency, safeNumber } from '../utils/formatting';
import { TradeDetailsModal } from './TradeDetailsModal';

interface RiskRewardInsightsCardProps {
  trades: Trade[];
  settings: AppSettings;
}

interface RRStats {
  avgRR: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  tradesAbove1R: number;
  totalValidTrades: number;
  percentAbove1R: number;
}

interface RRCategory {
  label: string;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const RiskRewardInsightsCard: React.FC<RiskRewardInsightsCardProps> = ({ trades, settings }) => {
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showAllTrades, setShowAllTrades] = useState(false);

  // Filter trades with valid R:R data
  const validRRTrades = useMemo(() => trades.filter(hasValidRR), [trades]);

  // Calculate overall R:R statistics
  const rrStats: RRStats = useMemo(() => {
    if (validRRTrades.length === 0) {
      return {
        avgRR: 0,
        bestTrade: null,
        worstTrade: null,
        tradesAbove1R: 0,
        totalValidTrades: 0,
        percentAbove1R: 0
      };
    }

    const avgRR = validRRTrades.reduce((sum, trade) => sum + safeNumber(trade.rrRatio), 0) / validRRTrades.length;
    const bestTrade = validRRTrades.reduce((best, current) => 
      safeNumber(current.rrRatio) > safeNumber(best.rrRatio) ? current : best
    );
    const worstTrade = validRRTrades.reduce((worst, current) => 
      safeNumber(current.rrRatio) < safeNumber(worst.rrRatio) ? current : worst
    );
    const tradesAbove1R = validRRTrades.filter(trade => safeNumber(trade.rrRatio) > 1).length;
    const percentAbove1R = (tradesAbove1R / validRRTrades.length) * 100;

    return {
      avgRR: safeNumber(avgRR),
      bestTrade,
      worstTrade,
      tradesAbove1R,
      totalValidTrades: validRRTrades.length,
      percentAbove1R: safeNumber(percentAbove1R)
    };
  }, [validRRTrades]);

  // Categorize trades by R:R ratio - Updated with new categories and colors
  const rrCategories: RRCategory[] = useMemo(() => {
    const categories = [
      { label: '< 1R', count: 0, color: 'text-red-400', bgColor: 'bg-red-500/70', borderColor: 'border-red-500/30' },
      { label: '> 1R', count: 0, color: 'text-sky-400', bgColor: 'bg-sky-500/70', borderColor: 'border-sky-500/30' },
      { label: '> 2R', count: 0, color: 'text-indigo-400', bgColor: 'bg-indigo-500/70', borderColor: 'border-indigo-500/30' },
      { label: '> 3R (GOAT)', count: 0, color: 'text-emerald-400', bgColor: 'bg-emerald-500/80', borderColor: 'border-emerald-500/30' }
    ];

    validRRTrades.forEach(trade => {
      const rr = safeNumber(trade.rrRatio);
      if (rr < 1) {
        categories[0].count++;
      } else if (rr >= 1 && rr < 2) {
        categories[1].count++;
      } else if (rr >= 2 && rr < 3) {
        categories[2].count++;
      } else if (rr >= 3) {
        categories[3].count++;
      }
    });

    return categories;
  }, [validRRTrades]);

  // Get recent trades for the table (last 10 or show all)
  const displayTrades = useMemo(() => {
    const sortedTrades = [...validRRTrades].reverse(); // Most recent first
    return showAllTrades ? sortedTrades : sortedTrades.slice(0, 10);
  }, [validRRTrades, showAllTrades]);

  const getTradeNumber = (trade: Trade) => {
    return trades.findIndex(t => t.id === trade.id) + 1;
  };

  const calculateRiskReward = (trade: Trade) => {
    const entryPrice = safeNumber(trade.entryPrice);
    const stopLoss = safeNumber(trade.stopLoss);
    const exitPrice = safeNumber(trade.exitPrice);
    const pipSize = safeNumber(trade.pipSize);
    const lotSize = safeNumber(trade.lotSize);
    const pipValuePerLot = safeNumber(trade.pipValuePerStandardLot);

    const riskPips = Math.abs(entryPrice - stopLoss) / pipSize;
    const rewardPips = Math.abs(exitPrice - entryPrice) / pipSize;
    const riskDollars = riskPips * lotSize * pipValuePerLot;
    const rewardDollars = rewardPips * lotSize * pipValuePerLot;

    return {
      riskPips: Math.round(riskPips * 10) / 10,
      rewardPips: Math.round(rewardPips * 10) / 10,
      riskDollars: Math.round(riskDollars * 100) / 100,
      rewardDollars: Math.round(rewardDollars * 100) / 100
    };
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'Win':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">Win</span>;
      case 'Loss':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">Loss</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/20">BE</span>;
    }
  };

  if (validRRTrades.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
            <Target size={24} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Risk-Reward Insights</h3>
            <p className="text-gray-400 text-sm">Comprehensive R:R analysis and performance metrics</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-gray-700/30 rounded-xl p-8">
            <Target size={48} className="mx-auto text-gray-500 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">No R:R Data Available</h4>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Add Stop Loss and Take Profit levels to your trades to unlock comprehensive risk-reward analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-all duration-300 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-gray-700/50 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl shadow-lg">
              <Target size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Risk-Reward Insights</h3>
              <p className="text-gray-400 text-sm">Comprehensive R:R analysis and performance metrics</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Section 1: Overall Summary */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <BarChart3 size={18} className="mr-2 text-blue-400" />
              Performance Overview
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Average R:R */}
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4 hover:bg-gray-700/40 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target size={16} className="text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-400">Average</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">{formatRRDisplay(rrStats.avgRR)}</p>
                  <p className="text-xs text-gray-400">R:R Ratio</p>
                </div>
              </div>

              {/* Best R:R Trade */}
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4 hover:bg-gray-700/40 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Award size={16} className="text-green-400" />
                  </div>
                  <span className="text-xs text-gray-400">Best</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-400">
                    {rrStats.bestTrade ? formatRRDisplay(rrStats.bestTrade.rrRatio) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {rrStats.bestTrade ? `•T${getTradeNumber(rrStats.bestTrade)}` : 'No data'}
                  </p>
                </div>
              </div>

              {/* Worst R:R Trade */}
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4 hover:bg-gray-700/40 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <TrendingDown size={16} className="text-red-400" />
                  </div>
                  <span className="text-xs text-gray-400">Worst</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-red-400">
                    {rrStats.worstTrade ? formatRRDisplay(rrStats.worstTrade.rrRatio) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {rrStats.worstTrade ? `•T${getTradeNumber(rrStats.worstTrade)}` : 'No data'}
                  </p>
                </div>
              </div>

              {/* Trades Above 1R */}
              <div className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4 hover:bg-gray-700/40 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <TrendingUp size={16} className="text-purple-400" />
                  </div>
                  <span className="text-xs text-gray-400">Above 1R</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-purple-400">{rrStats.percentAbove1R.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">{rrStats.tradesAbove1R} of {rrStats.totalValidTrades}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Visual Ratio Meter - Enhanced Design */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Eye size={18} className="mr-2 text-cyan-400" />
              R:R Distribution
            </h4>
            
            {/* Visual Meter */}
            <div className="bg-gray-700/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-gray-400">Risk-Reward Categories</span>
                <span className="text-xs text-gray-500">Total: {rrStats.totalValidTrades} trades</span>
              </div>
              
              {/* Enhanced Horizontal Bar */}
              <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden flex mb-6 shadow-inner">
                {rrCategories.map((category, index) => {
                  const percentage = rrStats.totalValidTrades > 0 ? (category.count / rrStats.totalValidTrades) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className={`${category.bgColor} transition-all duration-500 flex items-center justify-center relative`}
                      style={{ width: `${percentage}%` }}
                      title={`${category.label}: ${category.count} trades (${percentage.toFixed(1)}%)`}
                    >
                      {percentage > 8 && (
                        <span className="text-white text-xs font-bold drop-shadow-lg">{category.count}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Enhanced Category Legend */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {rrCategories.map((category, index) => (
                  <div key={index} className={`flex items-center space-x-3 p-3 rounded-xl border ${category.borderColor} bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-300`}>
                    <div className={`w-4 h-4 rounded-full ${category.bgColor} shadow-lg`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${category.color}`}>{category.label}</p>
                      <p className="text-xs text-gray-400">{category.count} trades</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Trade-Wise Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <Hash size={18} className="mr-2 text-orange-400" />
                Recent Trades Analysis
              </h4>
              {validRRTrades.length > 10 && (
                <button
                  onClick={() => setShowAllTrades(!showAllTrades)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-all text-sm"
                >
                  <Eye size={14} />
                  <span>{showAllTrades ? 'Show Less' : `Show All (${validRRTrades.length})`}</span>
                </button>
              )}
            </div>
            
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {displayTrades.map((trade) => {
                const { riskPips, rewardPips, riskDollars, rewardDollars } = calculateRiskReward(trade);
                return (
                  <div 
                    key={trade.id}
                    className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4 hover:bg-gray-700/40 transition-all cursor-pointer"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium text-sm ${
                          trade.direction === 'Buy' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          •T{getTradeNumber(trade)}
                        </span>
                        <span className="text-gray-400 text-sm">{trade.pair}</span>
                      </div>
                      {getResultBadge(trade.result)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Risk:</span>
                        <div className="text-red-400 font-medium">{riskPips}p / ${riskDollars}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Reward:</span>
                        <div className="text-green-400 font-medium">{rewardPips}p / ${rewardDollars}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400">R:R Ratio:</span>
                        <div className="text-white font-bold text-lg">{formatRRDisplay(trade.rrRatio)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Risk (Pips / $)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reward (Pips / $)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">R:R Ratio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {displayTrades.map((trade) => {
                    const { riskPips, rewardPips, riskDollars, rewardDollars } = calculateRiskReward(trade);
                    return (
                      <tr 
                        key={trade.id}
                        className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedTrade(trade)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${
                              trade.direction === 'Buy' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              •T{getTradeNumber(trade)}
                            </span>
                            <span className="text-gray-400 text-sm">{trade.pair}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-red-400 font-medium">
                            {riskPips}p / ${riskDollars}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-green-400 font-medium">
                            {rewardPips}p / ${rewardDollars}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-white font-bold text-lg">
                            {formatRRDisplay(trade.rrRatio)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getResultBadge(trade.result)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Details Modal */}
      {selectedTrade && (
        <TradeDetailsModal
          trade={selectedTrade}
          tradeNumber={getTradeNumber(selectedTrade)}
          onClose={() => setSelectedTrade(null)}
          onDelete={() => {}} // This will be handled by parent component
        />
      )}
    </>
  );
};