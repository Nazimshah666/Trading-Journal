import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Calculator, PieChart, Activity, Zap, Eye } from 'lucide-react';
import { Trade, AppSettings } from '../types';
import { formatCurrency, formatPercentage, safeNumber } from '../utils/formatting';

interface PerformanceAnalysisProps {
  trades: Trade[];
  settings: AppSettings;
  onToggleUltimateMetrics?: () => void;
  showUltimateMetrics?: boolean;
}

interface PerformanceMetrics {
  totalPnL: number;
  totalProfit: number;
  totalLoss: number;
  currentBalance: number;
  breakEvenPoint: number;
  winRate: number;
  lossRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  returnOnInvestment: number;
  maxDrawdown: number;
  maxDrawdownAmount: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({ 
  trades, 
  settings, 
  onToggleUltimateMetrics,
  showUltimateMetrics = false 
}) => {
  const metrics = useMemo((): PerformanceMetrics => {
    if (trades.length === 0) {
      return {
        totalPnL: 0,
        totalProfit: 0,
        totalLoss: 0,
        currentBalance: settings.startingCapital,
        breakEvenPoint: 0,
        winRate: 0,
        lossRate: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        returnOnInvestment: 0,
        maxDrawdown: 0,
        maxDrawdownAmount: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      };
    }

    // Separate trades by result
    const winningTrades = trades.filter(t => t.result === 'Win');
    const losingTrades = trades.filter(t => t.result === 'Loss');
    const breakEvenTrades = trades.filter(t => t.result === 'Break-even');

    // Calculate totals with safe number handling
    const totalProfit = safeNumber(winningTrades.reduce((sum, t) => sum + safeNumber(t.pnl), 0));
    const totalLoss = Math.abs(safeNumber(losingTrades.reduce((sum, t) => sum + safeNumber(t.pnl), 0)));
    const totalPnL = safeNumber(trades.reduce((sum, t) => sum + safeNumber(t.pnl), 0));
    const currentBalance = safeNumber(settings.startingCapital + totalPnL);

    // Calculate averages
    const averageWin = winningTrades.length > 0 ? safeNumber(totalProfit / winningTrades.length) : 0;
    const averageLoss = losingTrades.length > 0 ? safeNumber(totalLoss / losingTrades.length) : 0;

    // Find largest win/loss
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => safeNumber(t.pnl))) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(t => safeNumber(t.pnl)))) : 0;

    // Calculate rates
    const winRate = trades.length > 0 ? safeNumber((winningTrades.length / trades.length) * 100) : 0;
    const lossRate = trades.length > 0 ? safeNumber((losingTrades.length / trades.length) * 100) : 0;

    // Calculate profit factor
    const profitFactor = totalLoss > 0 ? safeNumber(totalProfit / totalLoss) : (totalProfit > 0 ? Infinity : 0);

    // Calculate ROI
    const returnOnInvestment = settings.startingCapital > 0 ? safeNumber((totalPnL / settings.startingCapital) * 100) : 0;

    // Calculate break-even point (how much needed to break even if currently losing)
    const breakEvenPoint = totalPnL < 0 ? Math.abs(totalPnL) : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let maxDrawdownAmount = 0;
    let peak = settings.startingCapital;
    let currentEquity = settings.startingCapital;

    trades.forEach(trade => {
      currentEquity += safeNumber(trade.pnl);
      if (currentEquity > peak) {
        peak = currentEquity;
      }
      const drawdownAmount = peak - currentEquity;
      const drawdownPercent = peak > 0 ? (drawdownAmount / peak) * 100 : 0;
      
      if (drawdownPercent > maxDrawdown) {
        maxDrawdown = safeNumber(drawdownPercent);
        maxDrawdownAmount = safeNumber(drawdownAmount);
      }
    });

    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    trades.forEach(trade => {
      if (trade.result === 'Win') {
        currentWinStreak++;
        currentLossStreak = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
      } else if (trade.result === 'Loss') {
        currentLossStreak++;
        currentWinStreak = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    });

    return {
      totalPnL,
      totalProfit,
      totalLoss,
      currentBalance,
      breakEvenPoint,
      winRate,
      lossRate,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      returnOnInvestment,
      maxDrawdown,
      maxDrawdownAmount,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses
    };
  }, [trades, settings]);

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getPerformanceIcon = (value: number) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return Target;
  };

  const PerformanceIcon = getPerformanceIcon(metrics.totalPnL);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart3 size={24} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Performance Analysis</h2>
            <p className="text-gray-400">Detailed breakdown of your trading performance</p>
          </div>
        </div>
        
        {/* Ultimate Metrics Toggle */}
        {onToggleUltimateMetrics && (
          <button
            onClick={onToggleUltimateMetrics}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              showUltimateMetrics
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/50'
            }`}
          >
            <Zap size={16} className={showUltimateMetrics ? 'text-white' : 'text-purple-400'} />
            <span className="font-medium">
              Ultimate Metrics
            </span>
            <div className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
              PRO
            </div>
          </button>
        )}
      </div>

      {/* Show Ultimate Metrics Notice */}
      {showUltimateMetrics && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Zap size={20} className="text-purple-400" />
            <div>
              <h3 className="text-purple-400 font-medium">Ultimate Metrics Mode Active</h3>
              <p className="text-gray-300 text-sm">Viewing comprehensive professional-grade analytics dashboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DollarSign size={20} className="text-blue-400" />
            </div>
            <PerformanceIcon size={20} className={getPerformanceColor(metrics.totalPnL)} />
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(metrics.currentBalance)}</p>
            <p className="text-xs text-gray-500">Starting: {formatCurrency(settings.startingCapital)}</p>
          </div>
        </div>

        {/* Total P&L */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${metrics.totalPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <PerformanceIcon size={20} className={getPerformanceColor(metrics.totalPnL)} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${getPerformanceColor(metrics.totalPnL)}`}>
              {formatCurrency(metrics.totalPnL)}
            </p>
            <p className={`text-xs ${getPerformanceColor(metrics.returnOnInvestment)}`}>
              ROI: {formatPercentage(metrics.returnOnInvestment)}
            </p>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Target size={20} className="text-cyan-400" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-white">{formatPercentage(metrics.winRate)}</p>
            <p className="text-xs text-gray-500">{metrics.winningTrades} of {metrics.totalTrades} trades</p>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calculator size={20} className="text-purple-400" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Profit Factor</p>
            <p className="text-2xl font-bold text-white">
              {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(metrics.totalProfit)} / {formatCurrency(metrics.totalLoss)}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit/Loss Breakdown */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <PieChart size={20} className="mr-2 text-green-400" />
            Profit/Loss Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
              <span className="text-green-400 font-medium">Total Profits</span>
              <span className="text-green-400 font-bold">{formatCurrency(metrics.totalProfit)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
              <span className="text-red-400 font-medium">Total Losses</span>
              <span className="text-red-400 font-bold">-{formatCurrency(metrics.totalLoss)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-300 font-medium">Net Result</span>
              <span className={`font-bold ${getPerformanceColor(metrics.totalPnL)}`}>
                {formatCurrency(metrics.totalPnL)}
              </span>
            </div>
          </div>
        </div>

        {/* Trade Statistics */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity size={20} className="mr-2 text-blue-400" />
            Trade Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-700/30 rounded-lg">
              <p className="text-2xl font-bold text-green-400">{metrics.winningTrades}</p>
              <p className="text-xs text-gray-400">Winning Trades</p>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded-lg">
              <p className="text-2xl font-bold text-red-400">{metrics.losingTrades}</p>
              <p className="text-xs text-gray-400">Losing Trades</p>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded-lg">
              <p className="text-2xl font-bold text-gray-400">{metrics.breakEvenTrades}</p>
              <p className="text-xs text-gray-400">Break-even</p>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded-lg">
              <p className="text-2xl font-bold text-white">{metrics.totalTrades}</p>
              <p className="text-xs text-gray-400">Total Trades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Average Win</h4>
          <p className="text-xl font-bold text-green-400">{formatCurrency(metrics.averageWin)}</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Average Loss</h4>
          <p className="text-xl font-bold text-red-400">-{formatCurrency(metrics.averageLoss)}</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Largest Win</h4>
          <p className="text-xl font-bold text-green-400">{formatCurrency(metrics.largestWin)}</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Largest Loss</h4>
          <p className="text-xl font-bold text-red-400">-{formatCurrency(metrics.largestLoss)}</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Max Drawdown</h4>
          <p className="text-xl font-bold text-orange-400">{formatPercentage(metrics.maxDrawdown)}</p>
          <p className="text-xs text-gray-500">({formatCurrency(metrics.maxDrawdownAmount)})</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Max Consecutive</h4>
          <p className="text-sm text-green-400">Wins: {metrics.consecutiveWins}</p>
          <p className="text-sm text-red-400">Losses: {metrics.consecutiveLosses}</p>
        </div>
      </div>

      {/* Break-even Analysis */}
      {metrics.totalPnL < 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center">
            <Target size={20} className="mr-2" />
            Break-even Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-300 mb-2">Amount needed to break even:</p>
              <p className="text-2xl font-bold text-orange-400">{formatCurrency(metrics.breakEvenPoint)}</p>
            </div>
            <div>
              <p className="text-gray-300 mb-2">Required win rate to break even:</p>
              <p className="text-xl font-bold text-orange-400">
                {metrics.averageWin > 0 ? formatPercentage((metrics.breakEvenPoint / metrics.averageWin) * 100) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300">
            {metrics.totalTrades === 0 ? (
              "No trades recorded yet. Start trading to see your performance analysis."
            ) : (
              <>
                You have completed <strong>{metrics.totalTrades}</strong> trades with a{' '}
                <span className={getPerformanceColor(metrics.winRate)}><strong>{formatPercentage(metrics.winRate)}</strong></span> win rate.
                Your account has {metrics.totalPnL >= 0 ? 'grown' : 'decreased'} by{' '}
                <span className={getPerformanceColor(metrics.totalPnL)}><strong>{formatCurrency(Math.abs(metrics.totalPnL))}</strong></span>,
                representing a <span className={getPerformanceColor(metrics.returnOnInvestment)}><strong>{formatPercentage(Math.abs(metrics.returnOnInvestment))}</strong></span>{' '}
                {metrics.returnOnInvestment >= 0 ? 'return' : 'loss'} on your initial investment.
                {metrics.profitFactor > 1 && (
                  <> Your profit factor of <strong>{metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}</strong> indicates profitable trading.</>
                )}
                {metrics.maxDrawdown > 0 && (
                  <> Your maximum drawdown was <strong>{formatPercentage(metrics.maxDrawdown)}</strong>.</>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};