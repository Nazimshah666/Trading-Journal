import React, { useState, useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Trade, AppSettings, PeriodData } from '../types';
import { format, parseISO, startOfWeek, getWeek, getYear } from 'date-fns';
import { formatCompactCurrency, formatPercentage, safeNumber } from '../utils/formatting';
import { hasValidRR } from '../utils/calculations';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Award, Activity } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TradingEdgeTimelineProps {
  trades: Trade[];
  settings: AppSettings;
}

type ViewMode = 'monthly' | 'weekly' | 'yearly';

export const TradingEdgeTimeline: React.FC<TradingEdgeTimelineProps> = ({ trades, settings }) => {
  // Persistent timeframe selection for Trading Edge Timeline
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('trading-edge-timeline-view-mode', 'monthly');

  // Move generateSmartInsight function before useMemo
  const generateSmartInsight = (metrics: {
    netPnL: number;
    winRate: number;
    avgRR: number;
    expectancy: number;
    maxDrawdown: number;
    tradeCount: number;
  }): string => {
    const { netPnL, winRate, avgRR, expectancy, maxDrawdown, tradeCount } = metrics;

    if (tradeCount === 0) return 'No trades';
    if (tradeCount === 1) return 'Single trade';
    
    // Priority insights based on performance
    if (expectancy > 1.5) return 'Exceptional edge';
    if (expectancy > 1.0) return 'Strong performance';
    if (expectancy > 0.5) return 'Positive edge';
    if (netPnL > 0 && winRate >= 70) return 'High accuracy';
    if (netPnL > 0 && avgRR >= 2.0) return 'Great R:R';
    if (netPnL > 0) return 'Profitable period';
    if (maxDrawdown > 15) return 'High drawdown';
    if (winRate < 30) return 'Low win rate';
    if (expectancy < -0.5) return 'Needs review';
    
    return 'Mixed results';
  };

  const periodData = useMemo((): PeriodData[] => {
    if (trades.length === 0) return [];

    const currentYear = new Date().getFullYear();

    // Group trades by period with both key and label
    const groupedTrades = trades.reduce((acc, trade) => {
      const tradeDate = parseISO(trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date);
      
      let periodKey: string;
      let periodLabel: string;
      
      if (viewMode === 'monthly') {
        periodKey = format(tradeDate, 'yyyy-MM');
        const year = getYear(tradeDate);
        if (year === currentYear) {
          periodLabel = format(tradeDate, 'MMM');
        } else {
          periodLabel = format(tradeDate, 'MMM yyyy');
        }
      } else if (viewMode === 'weekly') {
        const weekStart = startOfWeek(tradeDate, { weekStartsOn: 1 }); // Monday start
        const weekNumber = getWeek(tradeDate, { weekStartsOn: 1 });
        const year = getYear(tradeDate);
        periodKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
        if (year === currentYear) {
          periodLabel = `Week ${weekNumber}`;
        } else {
          periodLabel = `Week ${weekNumber}, ${year}`;
        }
      } else { // yearly
        const year = getYear(tradeDate);
        periodKey = year.toString();
        periodLabel = year.toString();
      }
      
      if (!acc[periodKey]) {
        acc[periodKey] = {
          label: periodLabel,
          trades: []
        };
      }
      acc[periodKey].trades.push(trade);
      return acc;
    }, {} as Record<string, { label: string; trades: Trade[] }>);

    // Calculate metrics for each period
    const periods = Object.entries(groupedTrades).map(([periodKey, periodData]) => {
      const { label: periodLabel, trades: periodTrades } = periodData;
      
      const sortedTrades = periodTrades.sort((a, b) => {
        const dateA = parseISO(a.isMultiDay && a.exitDate ? a.exitDate : a.date);
        const dateB = parseISO(b.isMultiDay && b.exitDate ? b.exitDate : b.date);
        return dateA.getTime() - dateB.getTime();
      });

      // Calculate basic metrics
      const netPnL = sortedTrades.reduce((sum, trade) => sum + safeNumber(trade.pnl), 0);
      const wins = sortedTrades.filter(t => t.result === 'Win');
      const losses = sortedTrades.filter(t => t.result === 'Loss');
      const winRate = sortedTrades.length > 0 ? (wins.length / sortedTrades.length) * 100 : 0;
      
      // Calculate average R:R for trades with valid R:R
      const tradesWithValidRR = sortedTrades.filter(hasValidRR);
      const avgRR = tradesWithValidRR.length > 0 
        ? tradesWithValidRR.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / tradesWithValidRR.length 
        : 0;

      // Calculate expectancy using R:R ratios
      let expectancy = 0;
      if (tradesWithValidRR.length > 0) {
        const winningRRTrades = tradesWithValidRR.filter(t => t.result === 'Win');
        const losingRRTrades = tradesWithValidRR.filter(t => t.result === 'Loss');
        
        const avgWinR = winningRRTrades.length > 0 
          ? winningRRTrades.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / winningRRTrades.length 
          : 0;
        
        const avgLossR = losingRRTrades.length > 0 
          ? Math.abs(losingRRTrades.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / losingRRTrades.length)
          : 0;
        
        const winRateDecimal = winRate / 100;
        const lossRateDecimal = 1 - winRateDecimal;
        
        expectancy = (winRateDecimal * avgWinR) - (lossRateDecimal * avgLossR);
      }

      // Calculate equity curve and max drawdown for this period
      let runningEquity = sortedTrades.length > 0 ? sortedTrades[0].equity - sortedTrades[0].pnl : settings.startingCapital;
      const startingEquity = runningEquity;
      
      const equityPoints = [{ index: 0, equity: runningEquity }];
      let peak = runningEquity;
      let maxDrawdown = 0;

      sortedTrades.forEach((trade, index) => {
        runningEquity += safeNumber(trade.pnl);
        equityPoints.push({ index: index + 1, equity: runningEquity });
        
        if (runningEquity > peak) {
          peak = runningEquity;
        }
        
        const drawdown = peak > 0 ? ((peak - runningEquity) / peak) * 100 : 0;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      });

      const endingEquity = runningEquity;

      // Calculate new metrics
      const avgProfit = wins.length > 0 
        ? wins.reduce((sum, t) => sum + safeNumber(t.pnl), 0) / wins.length 
        : 0;
      
      const avgLoss = losses.length > 0 
        ? Math.abs(losses.reduce((sum, t) => sum + safeNumber(t.pnl), 0) / losses.length)
        : 0;
      
      const maxProfit = wins.length > 0 
        ? Math.max(...wins.map(t => safeNumber(t.pnl)))
        : 0;
      
      const maxLoss = losses.length > 0 
        ? Math.abs(Math.min(...losses.map(t => safeNumber(t.pnl))))
        : 0;

      // Calculate best day and underperforming day
      let bestDay: string | undefined;
      let underperformingDay: string | undefined;

      if (sortedTrades.length > 0) {
        // Group trades by weekday
        const weekdayPnL = sortedTrades.reduce((acc, trade) => {
          const tradeDate = parseISO(trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date);
          const weekday = format(tradeDate, 'EEEE'); // Full weekday name
          
          if (!acc[weekday]) {
            acc[weekday] = [];
          }
          acc[weekday].push(safeNumber(trade.pnl));
          return acc;
        }, {} as Record<string, number[]>);

        // Calculate average P&L per weekday
        const weekdayAverages = Object.entries(weekdayPnL).map(([weekday, pnls]) => ({
          weekday,
          avgPnL: pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length,
          tradeCount: pnls.length
        }));

        if (weekdayAverages.length > 0) {
          // Best day: highest average P&L
          const bestDayData = weekdayAverages.reduce((best, current) => 
            current.avgPnL > best.avgPnL ? current : best
          );
          bestDay = bestDayData.weekday;

          // Underperforming day: only for monthly and yearly views
          if (viewMode === 'monthly' || viewMode === 'yearly') {
            const underperformingDayData = weekdayAverages.reduce((worst, current) => 
              current.avgPnL < worst.avgPnL ? current : worst
            );
            underperformingDay = underperformingDayData.weekday;
          }
        }
      }

      // Generate smart insight
      const smartInsight = generateSmartInsight({
        netPnL,
        winRate,
        avgRR,
        expectancy,
        maxDrawdown,
        tradeCount: sortedTrades.length
      });

      return {
        periodKey,
        periodLabel,
        netPnL: Math.round(netPnL * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        avgRR: Math.round(avgRR * 100) / 100,
        expectancy: Math.round(expectancy * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        equitySparklineData: equityPoints,
        smartInsight,
        isBestPeriod: false, // Will be set after comparing all periods
        tradeCount: sortedTrades.length,
        startingEquity,
        endingEquity,
        avgProfit: Math.round(avgProfit * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        maxProfit: Math.round(maxProfit * 100) / 100,
        maxLoss: Math.round(maxLoss * 100) / 100,
        bestDay,
        underperformingDay
      };
    });

    // Sort periods chronologically
    periods.sort((a, b) => a.periodKey.localeCompare(b.periodKey));

    // Mark the best period (highest net P&L)
    if (periods.length > 0) {
      const bestPeriod = periods.reduce((best, current) => 
        current.netPnL > best.netPnL ? current : best
      );
      bestPeriod.isBestPeriod = true;
    }

    return periods;
  }, [trades, settings.startingCapital, viewMode, generateSmartInsight]);

  const PeriodCard: React.FC<{ period: PeriodData }> = ({ period }) => {
    const isProfit = period.netPnL >= 0;
    const hasValidData = period.tradeCount > 0;

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-all duration-300 group">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white">{period.periodLabel}</h3>
            {period.isBestPeriod && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 flex items-center">
                <Award size={10} className="mr-1" />
                Best
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">{period.tradeCount} trades</div>
        </div>

        {/* Main Metrics */}
        <div className="space-y-3">
          {/* Net P&L */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Net P&L</span>
            <div className="flex items-center space-x-1">
              {isProfit ? (
                <TrendingUp size={12} className="text-green-400" />
              ) : (
                <TrendingDown size={12} className="text-red-400" />
              )}
              <span className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {formatCompactCurrency(period.netPnL)}
              </span>
            </div>
          </div>

          {/* Win Rate & R:R */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">Win Rate</div>
              <div className="text-sm font-medium text-white">{formatPercentage(period.winRate)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Avg R:R</div>
              <div className="text-sm font-medium text-white">
                {period.avgRR > 0 ? period.avgRR.toFixed(2) : '—'}
              </div>
            </div>
          </div>

          {/* Expectancy & Drawdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">Expectancy</div>
              <div className={`text-sm font-medium ${period.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {period.expectancy >= 0 ? '+' : ''}{period.expectancy.toFixed(2)}R
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Max DD</div>
              <div className="text-sm font-medium text-orange-400">
                {period.maxDrawdown > 0 ? `-${formatPercentage(period.maxDrawdown)}` : '0%'}
              </div>
            </div>
          </div>

          {/* New Metrics: Avg/Max Profit & Loss */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">Avg. Profit</div>
              <div className="text-sm font-medium text-green-400">
                {period.avgProfit > 0 ? formatCompactCurrency(period.avgProfit) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Avg. Loss</div>
              <div className="text-sm font-medium text-red-400">
                {period.avgLoss > 0 ? `-${formatCompactCurrency(period.avgLoss)}` : '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">Max Profit</div>
              <div className="text-sm font-medium text-green-400">
                {period.maxProfit > 0 ? formatCompactCurrency(period.maxProfit) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Max Loss</div>
              <div className="text-sm font-medium text-red-400">
                {period.maxLoss > 0 ? `-${formatCompactCurrency(period.maxLoss)}` : '—'}
              </div>
            </div>
          </div>

          {/* Best Day & Underperforming Day */}
          {period.bestDay && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Best Day</span>
                <span className="text-xs font-medium text-blue-400">{period.bestDay}</span>
              </div>
              {period.underperformingDay && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Underperforming Day</span>
                  <span className="text-xs font-medium text-orange-400">{period.underperformingDay}</span>
                </div>
              )}
            </div>
          )}

          {/* Equity Sparkline */}
          {hasValidData && period.equitySparklineData.length > 1 && (
            <div className="h-12 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={period.equitySparklineData}>
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke={isProfit ? '#10B981' : '#EF4444'}
                    strokeWidth={1.5}
                    dot={false}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Smart Insight */}
          <div className="pt-2 border-t border-gray-700/30">
            <div className="flex items-center space-x-2">
              <Activity size={12} className="text-blue-400" />
              <span className="text-xs text-gray-300">{period.smartInsight}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (trades.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
            <BarChart3 size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Trading Edge Timeline</h3>
            <p className="text-gray-400 text-sm">Track your performance evolution over time</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-gray-700/30 rounded-xl p-8">
            <Calendar size={48} className="mx-auto text-gray-500 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">No Timeline Data</h4>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Complete some trades to see your performance timeline and edge analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-800/70 transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-700/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl shadow-lg">
              <BarChart3 size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Trading Edge Timeline</h3>
              <p className="text-gray-400 text-sm">Track your performance evolution over time</p>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-700/30 rounded-lg p-1 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                viewMode === 'weekly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              <Activity size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="hidden sm:inline">Weekly</span>
              <span className="sm:hidden">W</span>
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              <Calendar size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="hidden sm:inline">Monthly</span>
              <span className="sm:hidden">M</span>
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                viewMode === 'yearly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
              }`}
            >
              <BarChart3 size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="hidden sm:inline">Yearly</span>
              <span className="sm:hidden">Y</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Cards */}
      <div className="p-6">
        {periodData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {periodData.map((period) => (
              <PeriodCard key={period.periodKey} period={period} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-700/30 rounded-xl p-6">
              <BarChart3 size={40} className="mx-auto text-gray-500 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">No Data Available</h4>
              <p className="text-gray-400 text-sm">
                No trades found for the selected time period.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};