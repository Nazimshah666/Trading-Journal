import React, { useState, useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Trophy, Calendar, BarChart3, Zap, AlertTriangle, CheckCircle, Info, Flame, Activity, Clock, Hash, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Trade, AppSettings, HoldTimeStats } from '../types';
import { generateSmartInsights, detectStreaks, getBestWorstTrades, generateAIFeedback, getStreakAnalytics, getTopTradedPairs, getHoldTimeStats } from '../utils/aiInsights';
import { calculateSummary, hasValidRR } from '../utils/calculations';
import { formatRRDisplay } from '../utils/calculations';
import { formatCompactCurrency, formatDuration, formatPercentage } from '../utils/formatting';
import { format, parseISO, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { useToggleVisibility, useLocalStorage } from '../hooks/useLocalStorage';

interface SmartSummaryProps {
  trades: Trade[];
  settings: AppSettings;
}

type TimeframeType = 'day' | 'week' | 'month' | 'year' | 'all';

export const SmartSummary: React.FC<SmartSummaryProps> = ({ trades, settings }) => {
  // Persistent global timeframe for the 6 summary cards
  const [globalTimeframe, setGlobalTimeframe] = useLocalStorage<TimeframeType>('ai-summary-global-timeframe', 'week');
  
  // Persistent timeframes for individual big cards
  const [bigCardTimeframes, setBigCardTimeframes] = useLocalStorage<Record<string, TimeframeType>>('ai-summary-card-timeframes', {
    streaks: 'week',
    bestWorst: 'week',
    topPairs: 'all',
    holdTime: 'all'
  });

  // Chart visibility controls
  const defaultChartVisibility = {
    streaks: true,
    bestWorst: true,
    topPairs: true,
    holdTime: true
  };

  const { visibility: chartVisibility, toggleVisibility: toggleChartVisibility } = useToggleVisibility('ai-summary-charts', defaultChartVisibility);

  // Filter trades based on global timeframe for the 6 cards
  const filteredTradesForCards = useMemo(() => {
    if (globalTimeframe === 'all') return trades;
    
    return trades.filter(trade => {
      const tradeDate = parseISO(trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date);
      switch (globalTimeframe) {
        case 'day': return isToday(tradeDate);
        case 'week': return isThisWeek(tradeDate);
        case 'month': return isThisMonth(tradeDate);
        case 'year': return isThisYear(tradeDate);
        default: return true;
      }
    });
  }, [trades, globalTimeframe]);

  // Calculate summary for the filtered trades (for the 6 cards)
  const filteredSummary = useMemo(() => calculateSummary(filteredTradesForCards, settings), [filteredTradesForCards, settings]);

  const insights = useMemo(() => generateSmartInsights(trades, globalTimeframe), [trades, globalTimeframe]);
  const streak = useMemo(() => detectStreaks(trades), [trades]);
  const streakAnalytics = useMemo(() => getStreakAnalytics(trades, bigCardTimeframes.streaks), [trades, bigCardTimeframes.streaks]);
  const { best, worst } = useMemo(() => getBestWorstTrades(trades, bigCardTimeframes.bestWorst), [trades, bigCardTimeframes.bestWorst]);
  const topPairs = useMemo(() => getTopTradedPairs(trades, bigCardTimeframes.topPairs), [trades, bigCardTimeframes.topPairs]);
  const holdTimeStats: HoldTimeStats | null = useMemo(() => getHoldTimeStats(trades, bigCardTimeframes.holdTime), [trades, bigCardTimeframes.holdTime]);

  const updateBigCardTimeframe = (cardId: string, timeframe: TimeframeType) => {
    setBigCardTimeframes(prev => ({
      ...prev,
      [cardId]: timeframe
    }));
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-400" size={18} />;
      case 'warning': return <AlertTriangle className="text-yellow-400" size={18} />;
      case 'error': return <TrendingDown className="text-red-400" size={18} />;
      default: return <Info className="text-blue-400" size={18} />;
    }
  };

  const TimeframeSelector = ({ value, onChange, className = "" }: { 
    value: TimeframeType; 
    onChange: (value: TimeframeType) => void;
    className?: string;
  }) => (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeframeType)}
        className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 transition-all appearance-none pr-8"
      >
        <option value="day" className="bg-gray-800 text-white">Today</option>
        <option value="week" className="bg-gray-800 text-white">This Week</option>
        <option value="month" className="bg-gray-800 text-white">This Month</option>
        <option value="year" className="bg-gray-800 text-white">This Year</option>
        <option value="all" className="bg-gray-800 text-white">All Time</option>
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );

  const BigCard = ({ 
    id, 
    title, 
    icon: Icon, 
    color, 
    children, 
    timeframe, 
    onTimeframeChange 
  }: {
    id: string;
    title: string;
    icon: React.ComponentType<{ size: number; className?: string }>;
    color: string;
    children: React.ReactNode;
    timeframe: TimeframeType;
    onTimeframeChange: (timeframe: TimeframeType) => void;
  }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
          <Icon size={18} className={`mr-2 ${color}`} />
          <span className="text-base sm:text-lg">{title}</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleChartVisibility(id)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              chartVisibility[id]
                ? 'text-blue-400 bg-blue-500/20'
                : 'text-gray-500 hover:text-gray-400 hover:bg-gray-700/30'
            }`}
            title={`${chartVisibility[id] ? 'Hide' : 'Show'} ${title}`}
          >
            {chartVisibility[id] ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <TimeframeSelector 
            value={timeframe} 
            onChange={onTimeframeChange}
            className="text-xs"
          />
        </div>
      </div>
      {chartVisibility[id] && children}
    </div>
  );

  const getTimeframeLabel = (timeframe: TimeframeType) => {
    switch (timeframe) {
      case 'day': return 'today';
      case 'week': return 'this week';
      case 'month': return 'this month';
      case 'year': return 'this year';
      case 'all': return 'all time';
      default: return timeframe;
    }
  };

  const formatPairsDisplay = (pairs: string[]): string => {
    if (pairs.length === 0) return '';
    if (pairs.length === 1) return `(${pairs[0]})`;
    return `(${pairs.join(', ')})`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Mobile Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="text-purple-400" size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">AI Smart Summary</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-purple-400" />
            <span className="text-gray-400 text-sm">Global Timeframe:</span>
            <TimeframeSelector 
              value={globalTimeframe} 
              onChange={setGlobalTimeframe}
            />
          </div>
        </div>
      </div>

      {/* Streak Alert */}
      {streak && (
        <div className={`p-3 sm:p-4 rounded-xl border-l-4 ${
          streak.type === 'winning' 
            ? 'bg-green-500/10 border-green-500 text-green-400' 
            : 'bg-red-500/10 border-red-500 text-red-400'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-xl sm:text-2xl">{streak.type === 'winning' ? '🔥' : '🧠'}</span>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">
                {streak.type === 'winning' ? 'Winning Streak!' : 'Losing Streak - Consider a Break'}
              </h3>
              <p className="text-xs sm:text-sm opacity-80">
                {streak.count} {streak.type === 'winning' ? 'wins' : 'losses'} in a row
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Mobile Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 size={14} className="text-blue-400" />
            <span className="text-xs text-gray-400">Total Trades</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-white">{filteredSummary.totalTrades}</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target size={14} className="text-green-400" />
            <span className="text-xs text-gray-400">Win Rate</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-white">{filteredSummary.winRate.toFixed(1)}%</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-xs text-gray-400">Avg R:R</span>
          </div>
          <p 
            className={`text-base sm:text-xl font-bold ${filteredSummary.avgRR === 0 ? 'text-gray-500' : 'text-white'}`}
            title={filteredSummary.avgRR === 0 ? 'Add Stop Loss and Take Profit to trades for R:R calculation' : undefined}
          >
            {formatRRDisplay(filteredSummary.avgRR)}
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp size={14} className={filteredSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'} />
            <span className="text-xs text-gray-400">Total P&L</span>
          </div>
          <p className={`text-base sm:text-xl font-bold ${filteredSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCompactCurrency(filteredSummary.totalPnL)}
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap size={14} className="text-purple-400" />
            <span className="text-xs text-gray-400">A+ Setups</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-white">{filteredSummary.aPlusSetups}</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle size={14} className="text-orange-400" />
            <span className="text-xs text-gray-400">Risk Used</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-white">{formatCompactCurrency(filteredSummary.totalRiskUsed)}</p>
        </div>
      </div>

      {/* Big Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Streak Analytics */}
        <BigCard
          id="streaks"
          title={`Streak Analytics (${getTimeframeLabel(bigCardTimeframes.streaks)})`}
          icon={Flame}
          color="text-orange-400"
          timeframe={bigCardTimeframes.streaks}
          onTimeframeChange={(timeframe) => updateBigCardTimeframe('streaks', timeframe)}
        >
          {streakAnalytics ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-400 mb-2">Winning Streaks</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Max Streak:</span>
                    <span className="text-green-400 font-bold">{streakAnalytics.maxWinStreak}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Avg Profit:</span>
                    <span className="text-green-400">{formatCompactCurrency(streakAnalytics.avgWinProfit)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Total Streaks:</span>
                    <span className="text-white">{streakAnalytics.totalWinStreaks}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-400 mb-2">Losing Streaks</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Max Streak:</span>
                    <span className="text-red-400 font-bold">{streakAnalytics.maxLossStreak}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Avg Loss:</span>
                    <span className="text-red-400">{formatCompactCurrency(streakAnalytics.avgLossAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Total Streaks:</span>
                    <span className="text-white">{streakAnalytics.totalLossStreaks}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">No streak data available for this timeframe</p>
            </div>
          )}
        </BigCard>

        {/* Best & Worst Trades */}
        <BigCard
          id="bestWorst"
          title={`Best & Worst Trades (${getTimeframeLabel(bigCardTimeframes.bestWorst)})`}
          icon={Trophy}
          color="text-yellow-400"
          timeframe={bigCardTimeframes.bestWorst}
          onTimeframeChange={(timeframe) => updateBigCardTimeframe('bestWorst', timeframe)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {best && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center">
                  <Trophy size={14} className="mr-1" />
                  Best Trade
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pair:</span>
                    <span className="text-white font-medium">{best.pair}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{format(parseISO(best.date), 'MMM dd')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">R:R:</span>
                    <span className={`font-medium ${hasValidRR(best) ? 'text-green-400' : 'text-gray-500'}`}>
                      {formatRRDisplay(best.rrRatio)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">P&L:</span>
                    <span className="text-green-400 font-medium">{formatCompactCurrency(best.pnl)}</span>
                  </div>
                  {best.isAPlusSetup && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-yellow-400 text-xs">A+ Setup</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {worst && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center">
                  <TrendingDown size={14} className="mr-1" />
                  Worst Trade
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pair:</span>
                    <span className="text-white font-medium">{worst.pair}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{format(parseISO(worst.date), 'MMM dd')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">R:R:</span>
                    <span className={`font-medium ${hasValidRR(worst) ? 'text-red-400' : 'text-gray-500'}`}>
                      {formatRRDisplay(worst.rrRatio)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">P&L:</span>
                    <span className="text-red-400 font-medium">{formatCompactCurrency(worst.pnl)}</span>
                  </div>
                </div>
              </div>
            )}

            {!best && !worst && (
              <div className="col-span-2 text-center py-4">
                <p className="text-gray-400 text-sm">No trade data available for this timeframe</p>
              </div>
            )}
          </div>
        </BigCard>

        {/* Top & Least Traded Pairs */}
        <BigCard
          id="topPairs"
          title={`Top & Least Traded Pairs (${getTimeframeLabel(bigCardTimeframes.topPairs)})`}
          icon={Hash}
          color="text-blue-400"
          timeframe={bigCardTimeframes.topPairs}
          onTimeframeChange={(timeframe) => updateBigCardTimeframe('topPairs', timeframe)}
        >
          {topPairs?.most && topPairs?.least ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Most Traded</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pair:</span>
                    <span className="text-white font-medium">{topPairs.most.pair}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trades:</span>
                    <span className="text-blue-400 font-medium">{topPairs.most.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Percentage:</span>
                    <span className="text-blue-400">{formatPercentage(topPairs.most.percentage)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Least Traded</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pair:</span>
                    <span className="text-white font-medium">{topPairs.least.pair}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trades:</span>
                    <span className="text-gray-400 font-medium">{topPairs.least.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Percentage:</span>
                    <span className="text-gray-400">{formatPercentage(topPairs.least.percentage)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">No trading pair data available for this timeframe</p>
            </div>
          )}
        </BigCard>

        {/* Hold Time Stats */}
        <BigCard
          id="holdTime"
          title={`Hold Time Stats (${getTimeframeLabel(bigCardTimeframes.holdTime)})`}
          icon={Clock}
          color="text-cyan-400"
          timeframe={bigCardTimeframes.holdTime}
          onTimeframeChange={(timeframe) => updateBigCardTimeframe('holdTime', timeframe)}
        >
          {holdTimeStats ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-center">
                <h4 className="text-xs font-medium text-cyan-400 mb-1">Average</h4>
                <p className="text-sm font-bold text-white">{formatDuration(holdTimeStats.average)}</p>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                <h4 className="text-xs font-medium text-green-400 mb-1">Minimum</h4>
                <p className="text-sm font-bold text-white">{formatDuration(holdTimeStats.minimum)}</p>
                {holdTimeStats.minPairs.length > 0 && (
                  <p className="text-xs text-green-300 mt-1">{formatPairsDisplay(holdTimeStats.minPairs)}</p>
                )}
              </div>
              
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                <h4 className="text-xs font-medium text-orange-400 mb-1">Maximum</h4>
                <p className="text-sm font-bold text-white">{formatDuration(holdTimeStats.maximum)}</p>
                {holdTimeStats.maxPairs.length > 0 && (
                  <p className="text-xs text-orange-300 mt-1">{formatPairsDisplay(holdTimeStats.maxPairs)}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">No hold time data available for this timeframe</p>
            </div>
          )}
        </BigCard>
      </div>

      {/* Smart Insights */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center">
          <Brain size={18} className="mr-2 text-purple-400" />
          Smart Insights
        </h3>
        
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-700/30">
                <span className="text-base sm:text-lg">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-medium text-white text-sm">{insight.title}</h4>
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <Brain size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400 text-sm">No insights available for the selected timeframe.</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Add more trades to get AI-powered insights!</p>
          </div>
        )}
      </div>
    </div>
  );
};