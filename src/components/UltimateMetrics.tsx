import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  BarChart3, 
  Shield, 
  Clock, 
  Hash, 
  Brain, 
  Wallet,
  Award,
  AlertTriangle,
  Calendar,
  Activity,
  Zap,
  Star,
  Eye,
  EyeOff,
  ArrowLeft,
  Timer,
  Hourglass,
  RotateCcw,
  Info
} from 'lucide-react';
import { Trade, AppSettings } from '../types';
import { calculateUltimateMetrics, UltimateMetrics as UltimateMetricsType } from '../utils/ultimateCalculations';
import { formatCompactCurrency, formatPercentage, formatDuration, formatNumber, safeNumber } from '../utils/formatting';

interface UltimateMetricsProps {
  trades: Trade[];
  settings: AppSettings;
  onBackToRegular?: () => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  bgColor: string;
  isPositive?: boolean;
  isNegative?: boolean;
  isNeutral?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  bgColor,
  isPositive = false,
  isNegative = false,
  isNeutral = false
}) => {
  const getValueColor = () => {
    if (isPositive) return 'text-green-400';
    if (isNegative) return 'text-red-400';
    if (isNeutral) return 'text-gray-400';
    return 'text-white';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/70 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={16} className={color} />
        </div>
        {(isPositive || isNegative) && (
          <div className={`p-1 rounded-full ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {isPositive ? (
              <TrendingUp size={12} className="text-green-400" />
            ) : (
              <TrendingDown size={12} className="text-red-400" />
            )}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className={`text-lg font-bold ${getValueColor()} leading-tight`}>
          {value}
        </p>
        <p className="text-xs text-gray-400 leading-tight">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

interface MetricSectionProps {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  iconColor: string;
  children: React.ReactNode;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
}

const MetricSection: React.FC<MetricSectionProps> = ({ 
  title, 
  icon: Icon, 
  iconColor, 
  children,
  isCollapsible = false,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (isCollapsible) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-all duration-200 border border-gray-700/30 group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-700/50 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Icon size={18} className={iconColor} />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            {isOpen ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
          </div>
        </button>
        {isOpen && (
          <div className="animate-fade-in-up">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-700/50 rounded-lg">
          <Icon size={18} className={iconColor} />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export const UltimateMetrics: React.FC<UltimateMetricsProps> = ({ trades, settings, onBackToRegular }) => {
  const metrics: UltimateMetricsType = useMemo(() => {
    return calculateUltimateMetrics(trades, settings);
  }, [trades, settings]);

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
            <BarChart3 size={64} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Ultimate Metrics Available</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Complete some trades to unlock the most comprehensive trading analytics dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBackToRegular && (
              <button
                onClick={onBackToRegular}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50"
                title="Back to Regular Performance View"
              >
                <ArrowLeft size={16} />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl shadow-lg">
                <Zap size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Ultimate Metrics Dashboard</h2>
                <p className="text-gray-400 text-sm">Professional-grade analytics for serious traders</p>
              </div>
            </div>
          </div>
          
          {/* Pro Badge */}
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl shadow-lg">
            <div className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <Zap size={14} />
                <span className="text-sm font-bold">PRO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* I. Overall Profitability & Efficiency Metrics */}
      <MetricSection 
        title="Overall Profitability & Efficiency" 
        icon={DollarSign} 
        iconColor="text-green-400"
        isCollapsible={true}
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Net P&L"
            value={formatCompactCurrency(metrics.totalNetPnL)}
            icon={DollarSign}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={metrics.totalNetPnL > 0}
            isNegative={metrics.totalNetPnL < 0}
          />
          <MetricCard
            title="Gross Profit"
            value={formatCompactCurrency(metrics.grossProfit)}
            icon={TrendingUp}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Gross Loss"
            value={formatCompactCurrency(metrics.grossLoss)}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Win Rate"
            value={formatPercentage(metrics.winRate)}
            icon={Target}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <MetricCard
            title="Loss Rate"
            value={formatPercentage(metrics.lossRate)}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
          <MetricCard
            title="Break-even Rate"
            value={formatPercentage(metrics.breakEvenRate)}
            icon={Target}
            color="text-gray-400"
            bgColor="bg-gray-500/20"
            isNeutral={true}
          />
          <MetricCard
            title="Profit Factor"
            value={metrics.profitFactor === Infinity ? '∞' : formatNumber(metrics.profitFactor, 2)}
            icon={BarChart3}
            color="text-purple-400"
            bgColor="bg-purple-500/20"
          />
          <MetricCard
            title="Expectancy (R)"
            value={`${metrics.expectancy >= 0 ? '+' : ''}${formatNumber(metrics.expectancy, 2)}R`}
            icon={Brain}
            color="text-cyan-400"
            bgColor="bg-cyan-500/20"
            isPositive={metrics.expectancy > 0}
            isNegative={metrics.expectancy < 0}
          />
          <MetricCard
            title="Average Win"
            value={formatCompactCurrency(metrics.averageWin)}
            icon={TrendingUp}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Average Loss"
            value={formatCompactCurrency(metrics.averageLoss)}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Largest Win"
            value={formatCompactCurrency(metrics.largestWin)}
            icon={Award}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Largest Loss"
            value={formatCompactCurrency(metrics.largestLoss)}
            icon={AlertTriangle}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="ROI"
            value={formatPercentage(metrics.roi)}
            icon={TrendingUp}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
            isPositive={metrics.roi > 0}
            isNegative={metrics.roi < 0}
          />
          <MetricCard
            title="Trades 1R-2R"
            value={`${metrics.tradesAbove1R.count} (${formatPercentage(metrics.tradesAbove1R.percentage)})`}
            icon={Target}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <MetricCard
            title="Trades 2R-3R"
            value={`${metrics.tradesAbove2R.count} (${formatPercentage(metrics.tradesAbove2R.percentage)})`}
            icon={Target}
            color="text-indigo-400"
            bgColor="bg-indigo-500/20"
          />
          <MetricCard
            title="Trades >3R (GOAT)"
            value={`${metrics.tradesAbove3R.count} (${formatPercentage(metrics.tradesAbove3R.percentage)})`}
            icon={Star}
            color="text-yellow-400"
            bgColor="bg-yellow-500/20"
          />
          <MetricCard
            title="Trades < 1R"
            value={`${metrics.tradesBelow1R.count} (${formatPercentage(metrics.tradesBelow1R.percentage)})`}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
          {metrics.breakEvenPoint > 0 && (
            <MetricCard
              title="Break-even Point"
              value={formatCompactCurrency(metrics.breakEvenPoint)}
              subtitle="Needed to reach $0 P&L"
              icon={Target}
              color="text-orange-400"
              bgColor="bg-orange-500/20"
            />
          )}
        </div>
      </MetricSection>

      {/* II. Risk Management & Capital Preservation */}
      <MetricSection 
        title="Risk Management & Capital Preservation" 
        icon={Shield} 
        iconColor="text-orange-400"
        isCollapsible={true}
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <MetricCard
            title="Max Drawdown ($)"
            value={formatCompactCurrency(metrics.maxDrawdownAmount)}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Max Drawdown (%)"
            value={formatPercentage(metrics.maxDrawdownPercentage)}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Avg Risk/Trade"
            value={formatCompactCurrency(metrics.averageRiskPerTrade)}
            icon={Shield}
            color="text-orange-400"
            bgColor="bg-orange-500/20"
          />
          <MetricCard
            title="Avg R:R (Overall)"
            value={formatNumber(metrics.averageRROverall, 2)}
            icon={Target}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <MetricCard
            title="Avg R:R (Wins)"
            value={formatNumber(metrics.averageRRWins, 2)}
            icon={TrendingUp}
            color="text-green-400"
            bgColor="bg-green-500/20"
          />
          <MetricCard
            title="Avg R:R (Losses)"
            value={formatNumber(metrics.averageRRLosses, 2)}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
          <MetricCard
            title="Trades w/o SL"
            value={`${metrics.tradesWithoutSL.count} (${formatPercentage(metrics.tradesWithoutSL.percentage)})`}
            icon={AlertTriangle}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
          <MetricCard
            title="Trades w/o TP"
            value={`${metrics.tradesWithoutTP.count} (${formatPercentage(metrics.tradesWithoutTP.percentage)})`}
            icon={AlertTriangle}
            color="text-yellow-400"
            bgColor="bg-yellow-500/20"
          />
          <MetricCard
            title="Avg SL Distance"
            value={`${formatNumber(metrics.averageSLDistancePips, 1)} pips`}
            icon={Shield}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
          <MetricCard
            title="Avg TP Distance"
            value={`${formatNumber(metrics.averageTPDistancePips, 1)} pips`}
            icon={Target}
            color="text-green-400"
            bgColor="bg-green-500/20"
          />
        </div>
      </MetricSection>

      {/* III. Time-Based Performance */}
      <MetricSection 
        title="Time-Based Performance" 
        icon={Clock} 
        iconColor="text-blue-400"
        isCollapsible={true}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Best Day of Week"
            value={metrics.bestDayOfWeek.day}
            subtitle={formatCompactCurrency(metrics.bestDayOfWeek.avgPnL)}
            icon={Calendar}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Worst Day of Week"
            value={metrics.worstDayOfWeek.day}
            subtitle={formatCompactCurrency(metrics.worstDayOfWeek.avgPnL)}
            icon={Calendar}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Most Profitable Month"
            value={metrics.mostProfitableMonth.month}
            subtitle={formatCompactCurrency(metrics.mostProfitableMonth.totalPnL)}
            icon={Calendar}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Least Profitable Month"
            value={metrics.leastProfitableMonth.month}
            subtitle={formatCompactCurrency(metrics.leastProfitableMonth.totalPnL)}
            icon={Calendar}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Most Profitable Year"
            value={metrics.mostProfitableYear.year}
            subtitle={formatCompactCurrency(metrics.mostProfitableYear.totalPnL)}
            icon={Calendar}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Least Profitable Year"
            value={metrics.leastProfitableYear.year}
            subtitle={formatCompactCurrency(metrics.leastProfitableYear.totalPnL)}
            icon={Calendar}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Avg Hold Time"
            value={formatDuration(Math.round(metrics.averageHoldTimeOverall))}
            icon={Clock}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <MetricCard
            title="Avg Hold Time (Wins)"
            value={formatDuration(Math.round(metrics.averageHoldTimeWins))}
            icon={TrendingUp}
            color="text-green-400"
            bgColor="bg-green-500/20"
          />
          <MetricCard
            title="Avg Hold Time (Losses)"
            value={formatDuration(Math.round(metrics.averageHoldTimeLosses))}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
          <MetricCard
            title="Shortest Hold Time"
            value={formatDuration(Math.round(metrics.shortestHoldTime))}
            icon={Clock}
            color="text-cyan-400"
            bgColor="bg-cyan-500/20"
          />
          <MetricCard
            title="Longest Hold Time"
            value={formatDuration(Math.round(metrics.longestHoldTime))}
            icon={Clock}
            color="text-purple-400"
            bgColor="bg-purple-500/20"
          />
        </div>
      </MetricSection>

      {/* IV. Instrument & Strategy Specific */}
      <MetricSection 
        title="Instrument & Strategy Specific" 
        icon={Hash} 
        iconColor="text-purple-400"
        isCollapsible={true}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <MetricCard
            title="Most Profitable Pair"
            value={metrics.mostProfitablePair.pair}
            subtitle={formatCompactCurrency(metrics.mostProfitablePair.totalPnL)}
            icon={TrendingUp}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Least Profitable Pair"
            value={metrics.leastProfitablePair.pair}
            subtitle={formatCompactCurrency(metrics.leastProfitablePair.totalPnL)}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Highest Win Rate Pair"
            value={metrics.highestWinRatePair.pair}
            subtitle={formatPercentage(metrics.highestWinRatePair.winRate)}
            icon={Target}
            color="text-green-400"
            bgColor="bg-green-500/20"
          />
          <MetricCard
            title="Lowest Win Rate Pair"
            value={metrics.lowestWinRatePair.pair}
            subtitle={formatPercentage(metrics.lowestWinRatePair.winRate)}
            icon={Target}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
          <MetricCard
            title="Most Traded Pair"
            value={metrics.mostTradedPair.pair}
            subtitle={`${metrics.mostTradedPair.count} trades`}
            icon={BarChart3}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <MetricCard
            title="Least Traded Pair"
            value={metrics.leastTradedPair.pair}
            subtitle={`${metrics.leastTradedPair.count} trades`}
            icon={BarChart3}
            color="text-gray-400"
            bgColor="bg-gray-500/20"
          />
          <MetricCard
            title="Most Profitable Strategy"
            value={metrics.mostProfitableStrategy.strategy}
            subtitle={formatCompactCurrency(metrics.mostProfitableStrategy.totalPnL)}
            icon={Brain}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Most Used Strategy"
            value={metrics.mostUsedStrategy.strategy}
            subtitle={`${metrics.mostUsedStrategy.count} trades`}
            icon={BarChart3}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <MetricCard
            title="Highest Win Rate Strategy"
            value={metrics.highestWinRateStrategy.strategy}
            subtitle={formatPercentage(metrics.highestWinRateStrategy.winRate)}
            icon={Target}
            color="text-green-400"
            bgColor="bg-green-500/20"
          />
          <MetricCard
            title="Most Use Setup Tag"
            value={metrics.mostUsedSetupTag.tag}
            subtitle={`${metrics.mostUsedSetupTag.count} trades`}
            icon={Hash}
            color="text-cyan-400"
            bgColor="bg-cyan-500/20"
          />
          <MetricCard
            title="Most Profitable Setup Tag"
            value={metrics.mostProfitableSetupTag.tag}
            subtitle={formatCompactCurrency(metrics.mostProfitableSetupTag.totalPnL)}
            icon={Hash}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={metrics.mostProfitableSetupTag.totalPnL > 0}
                        isNegative={metrics.mostProfitableSetupTag.totalPnL < 0}
          />
          <MetricCard
            title="Highest Win Rate Setup Tag"
            value={metrics.highestWinRateSetupTag.tag}
            subtitle={formatPercentage(metrics.highestWinRateSetupTag.winRate)}
            icon={Hash}
            color="text-green-400"
            bgColor="bg-green-500/20"
          />
          <MetricCard
            title="A+ Setup Win Rate"
            value={formatPercentage(metrics.aPlusSetupWinRate)}
            icon={Star}
            color="text-yellow-400"
            bgColor="bg-yellow-500/20"
          />
          <MetricCard
            title="A+ Setup Total P&L"
            value={formatCompactCurrency(metrics.aPlusSetupTotalPnL)}
            icon={Star}
            color="text-yellow-400"
            bgColor="bg-yellow-500/20"
            isPositive={metrics.aPlusSetupTotalPnL > 0}
            isNegative={metrics.aPlusSetupTotalPnL < 0}
          />
        </div>
      </MetricSection>

      {/* VII. Timing & Performance Correlations */}
      <MetricSection 
        title="Timing & Performance Correlations" 
        icon={Timer} 
        iconColor="text-indigo-400"
        isCollapsible={true}
        defaultOpen={false}
      >
        <div className="space-y-6">
          {/* Time Since Last Trade Analysis */}
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center">
              <Hourglass size={16} className="mr-2" />
              Time Gap Between Trades vs. Performance
            </h4>
            
            {metrics.timeSinceLastTradeCorrelation.avgTimeBetweenTrades > 0 ? (
              <div className="space-y-4">
                {/* Average Time Between Trades */}
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300 text-sm">Average Gap Between Trades</span>
                      <div className="group relative">
                        <Info size={12} className="text-gray-500 hover:text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                          Only time gaps below 12 hours are considered. Gaps above 12 hours are excluded from this calculation.
                        </div>
                      </div>
                    </div>
                    <span className="text-white font-bold">
                      {formatDuration(Math.round(metrics.timeSinceLastTradeCorrelation.avgTimeBetweenTrades * 100) / 100)}
                    </span>
                  </div>
                </div>

                {/* Gap Performance Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Short Gap */}
                  <div className={`p-3 rounded-lg border ${
                    metrics.timeSinceLastTradeCorrelation.bestGapRange.includes('Short') 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : metrics.timeSinceLastTradeCorrelation.worstGapRange.includes('Short')
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-gray-700/30 border-gray-600/30'
                  }`}>
                    <div className="text-center">
                      <h5 className="text-xs font-medium text-gray-300 mb-2">Short Gap (&lt;30min)</h5>
                      <div className="space-y-1">
                        <p className={`text-sm font-bold ${
                          metrics.timeSinceLastTradeCorrelation.shortGapPerformance.avgPnL >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {formatCompactCurrency(metrics.timeSinceLastTradeCorrelation.shortGapPerformance.avgPnL)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPercentage(metrics.timeSinceLastTradeCorrelation.shortGapPerformance.winRate)} WR
                        </p>
                        <p className="text-xs text-gray-500">
                          {metrics.timeSinceLastTradeCorrelation.shortGapPerformance.tradeCount} trades
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medium Gap */}
                  <div className={`p-3 rounded-lg border ${
                    metrics.timeSinceLastTradeCorrelation.bestGapRange.includes('Medium') 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : metrics.timeSinceLastTradeCorrelation.worstGapRange.includes('Medium')
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-gray-700/30 border-gray-600/30'
                  }`}>
                    <div className="text-center">
                      <h5 className="text-xs font-medium text-gray-300 mb-2">Medium Gap (30min-4hrs)</h5>
                      <div className="space-y-1">
                        <p className={`text-sm font-bold ${
                          metrics.timeSinceLastTradeCorrelation.mediumGapPerformance.avgPnL >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {formatCompactCurrency(metrics.timeSinceLastTradeCorrelation.mediumGapPerformance.avgPnL)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPercentage(metrics.timeSinceLastTradeCorrelation.mediumGapPerformance.winRate)} WR
                        </p>
                        <p className="text-xs text-gray-500">
                          {metrics.timeSinceLastTradeCorrelation.mediumGapPerformance.tradeCount} trades
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Long Gap */}
                  <div className={`p-3 rounded-lg border ${
                    metrics.timeSinceLastTradeCorrelation.bestGapRange.includes('Long') 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : metrics.timeSinceLastTradeCorrelation.worstGapRange.includes('Long')
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-gray-700/30 border-gray-600/30'
                  }`}>
                    <div className="text-center">
                      <h5 className="text-xs font-medium text-gray-300 mb-2">Long Gap (&gt;4hrs)</h5>
                      <div className="space-y-1">
                        <p className={`text-sm font-bold ${
                          metrics.timeSinceLastTradeCorrelation.longGapPerformance.avgPnL >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          {formatCompactCurrency(metrics.timeSinceLastTradeCorrelation.longGapPerformance.avgPnL)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPercentage(metrics.timeSinceLastTradeCorrelation.longGapPerformance.winRate)} WR
                        </p>
                        <p className="text-xs text-gray-500">
                          {metrics.timeSinceLastTradeCorrelation.longGapPerformance.tradeCount} trades
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best/Worst Gap Insight */}
                {metrics.timeSinceLastTradeCorrelation.bestGapRange && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target size={14} className="text-blue-400" />
                      <span className="text-blue-400 font-medium text-sm">Timing Insight</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      <strong className="text-green-400">{metrics.timeSinceLastTradeCorrelation.bestGapRange}</strong> shows 
                      your best performance, while <strong className="text-red-400">{metrics.timeSinceLastTradeCorrelation.worstGapRange}</strong> shows 
                      the worst. Consider adjusting your trading frequency accordingly.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">Need at least 2 trades to analyze timing gaps</p>
              </div>
            )}
          </div>

          {/* Daily Performance Decay Analysis */}
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center">
              <RotateCcw size={16} className="mr-2" />
              Daily Performance Decay Analysis
            </h4>
            
            {metrics.dailyPerformanceDecay.tradesByPosition.length > 0 ? (
              <div className="space-y-4">
                {/* Performance by Trade Position */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {metrics.dailyPerformanceDecay.tradesByPosition.map((position) => (
                    <div 
                      key={position.position}
                      className={`p-3 rounded-lg border text-center ${
                        position.position === metrics.dailyPerformanceDecay.bestTradePosition
                          ? 'bg-green-500/10 border-green-500/30'
                          : position.position === metrics.dailyPerformanceDecay.worstTradePosition
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-gray-700/30 border-gray-600/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <h5 className="text-xs font-medium text-gray-300">
                          {position.position === 1 ? '1st' : 
                           position.position === 2 ? '2nd' : 
                           position.position === 3 ? '3rd' : 
                           `${position.position}th`} Trade
                        </h5>
                        <p className={`text-sm font-bold ${
                          position.avgPnL >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCompactCurrency(position.avgPnL)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPercentage(position.winRate)} WR
                        </p>
                        <p className="text-xs text-gray-500">
                          {position.tradeCount} trades
                        </p>
                        {position.position === metrics.dailyPerformanceDecay.bestTradePosition && (
                          <div className="flex items-center justify-center mt-1">
                            <Award size={10} className="text-green-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Daily Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Max Trades Per Day</span>
                      <span className="text-white font-bold">{metrics.dailyPerformanceDecay.maxTradesPerDay}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Suggested Daily Limit</span>
                      <span className="text-orange-400 font-bold">{metrics.dailyPerformanceDecay.optimalDailyLimit}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Decay Insight */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity size={14} className="text-orange-400" />
                    <span className="text-orange-400 font-medium text-sm">Daily Performance Pattern</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Your <strong className="text-green-400">
                      {metrics.dailyPerformanceDecay.bestTradePosition === 1 ? '1st' : 
                       metrics.dailyPerformanceDecay.bestTradePosition === 2 ? '2nd' : 
                       metrics.dailyPerformanceDecay.bestTradePosition === 3 ? '3rd' : 
                       `${metrics.dailyPerformanceDecay.bestTradePosition}th`} trade of the day
                    </strong> performs best on average. 
                    {metrics.dailyPerformanceDecay.optimalDailyLimit < metrics.dailyPerformanceDecay.maxTradesPerDay && (
                      <> Consider limiting daily trades to <strong className="text-orange-400">{metrics.dailyPerformanceDecay.optimalDailyLimit}</strong> to avoid performance decay.</>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">Need multiple trading days to analyze daily performance patterns</p>
              </div>
            )}
          </div>
        </div>
      </MetricSection>

      {/* V. Behavioral & Psychological */}
      <MetricSection 
        title="Behavioral & Psychological Insights" 
        icon={Brain} 
        iconColor="text-cyan-400"
        isCollapsible={true}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Max Winning Streak"
            value={`${metrics.maxWinningStreak} trades`}
            icon={TrendingUp}
            color="text-green-400"
            bgColor="bg-green-500/20"
            isPositive={true}
          />
          <MetricCard
            title="Max Losing Streak"
            value={`${metrics.maxLosingStreak} trades`}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
            isNegative={true}
          />
          <MetricCard
            title="Total Winning Streaks"
            value={`${metrics.totalWinningStreaks} streaks`}
            icon={Activity}
            color="text-green-400"
            bgColor="bg-green-500/20"
          />
          <MetricCard
            title="Total Losing Streaks"
            value={`${metrics.totalLosingStreaks} streaks`}
            icon={Activity}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
          <MetricCard
            title="Avg P&L (High Emotion)"
            value={formatCompactCurrency(metrics.avgPnLHighEmotion)}
            subtitle="Emotion ≥ 8/10"
            icon={Brain}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
            isPositive={metrics.avgPnLHighEmotion > 0}
            isNegative={metrics.avgPnLHighEmotion < 0}
          />
          <MetricCard
            title="Avg P&L (Low Emotion)"
            value={formatCompactCurrency(metrics.avgPnLLowEmotion)}
            subtitle="Emotion ≤ 3/10"
            icon={Brain}
            color="text-orange-400"
            bgColor="bg-orange-500/20"
            isPositive={metrics.avgPnLLowEmotion > 0}
            isNegative={metrics.avgPnLLowEmotion < 0}
          />
          <MetricCard
            title="High Emotion Trades"
            value={`${metrics.tradesHighEmotion.count} (${formatPercentage(metrics.tradesHighEmotion.percentage)})`}
            icon={Brain}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <MetricCard
            title="Low Emotion Trades"
            value={`${metrics.tradesLowEmotion.count} (${formatPercentage(metrics.tradesLowEmotion.percentage)})`}
            icon={Brain}
            color="text-orange-400"
            bgColor="bg-orange-500/20"
          />
        </div>
      </MetricSection>

      {/* VI. Equity & Drawdown Dynamics */}
      <MetricSection 
        title="Equity & Drawdown Dynamics" 
        icon={Wallet} 
        iconColor="text-emerald-400"
        isCollapsible={true}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Equity at Start"
            value={formatCompactCurrency(metrics.equityAtStart)}
            icon={Wallet}
            color="text-blue-400"
            bgColor="bg-blue-500/20"
          />
          <MetricCard
            title="Equity at End"
            value={formatCompactCurrency(metrics.equityAtEnd)}
            icon={Wallet}
            color="text-emerald-400"
            bgColor="bg-emerald-500/20"
            isPositive={metrics.equityAtEnd > metrics.equityAtStart}
            isNegative={metrics.equityAtEnd < metrics.equityAtStart}
          />
          <MetricCard
            title="Recovery Time (Max DD)"
            value={metrics.timeToRecoverMaxDrawdown > 0 ? `${metrics.timeToRecoverMaxDrawdown} days` : 'N/A'}
            icon={Clock}
            color="text-orange-400"
            bgColor="bg-orange-500/20"
          />
          <MetricCard
            title="Number of Drawdowns"
            value={`${metrics.numberOfDrawdowns} periods`}
            icon={TrendingDown}
            color="text-red-400"
            bgColor="bg-red-500/20"
          />
        </div>
      </MetricSection>
    </div>
  );
};