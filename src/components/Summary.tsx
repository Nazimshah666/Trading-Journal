import React from 'react';
import { TrendingUp, TrendingDown, Target, Trophy, Calendar, BarChart3, Wallet, DollarSign, Eye, EyeOff, Settings, Edit3 } from 'lucide-react';
import { Summary as SummaryType, AppSettings } from '../types';
import { formatRRDisplay } from '../utils/calculations';
import { formatCompactCurrency, formatPercentage, safeNumber, formatCurrency } from '../utils/formatting';
import { useToggleVisibility } from '../hooks/useLocalStorage';

interface SummaryProps {
  summary: SummaryType;
  settings: AppSettings;
  onEditStartingCapital?: () => void;
  isReadOnlyMode?: boolean;
}

export const Summary: React.FC<SummaryProps> = ({ 
  summary, 
  settings, 
  onEditStartingCapital, 
  isReadOnlyMode = false 
}) => {
  const defaultVisibility = {
    totalCapital: true,
    totalTrades: true,
    totalPnL: true,
    winRate: true,
    avgRR: true,
    profitFactor: true,
    maxDrawdown: true
  };

  const { visibility, toggleVisibility } = useToggleVisibility('dashboard-cards-visibility', defaultVisibility);

  const getFullCurrencyValue = (value: number) => {
    return formatCurrency(safeNumber(value));
  };

  // Calculate total capital
  const totalCapital = safeNumber(settings.startingCapital) + safeNumber(summary.totalPnL);

  // Determine if total capital is negative
  const isNegativeCapital = totalCapital < 0;

  const cards = [
    {
      id: 'totalCapital',
      title: 'Total Capital',
      value: formatCompactCurrency(totalCapital),
      fullValue: getFullCurrencyValue(totalCapital),
      subtitle: `Starting: ${formatCompactCurrency(settings.startingCapital)}`,
      subtitleFull: `Starting: ${getFullCurrencyValue(settings.startingCapital)}`,
      icon: DollarSign,
      color: isNegativeCapital ? 'text-red-400' : 'text-emerald-400',
      bgColor: isNegativeCapital ? 'bg-red-500/10' : 'bg-emerald-500/10',
      isCapital: true,
      isNegative: isNegativeCapital
    },
    {
      id: 'totalTrades',
      title: 'Total Trades',
      value: summary.totalTrades.toString(),
      fullValue: summary.totalTrades.toString(),
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'totalPnL',
      title: 'Total P&L',
      value: formatCompactCurrency(summary.totalPnL),
      fullValue: getFullCurrencyValue(summary.totalPnL),
      icon: safeNumber(summary.totalPnL) >= 0 ? TrendingUp : TrendingDown,
      color: safeNumber(summary.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: safeNumber(summary.totalPnL) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
    },
    {
      id: 'winRate',
      title: 'Win Rate',
      value: formatPercentage(summary.winRate),
      fullValue: formatPercentage(summary.winRate),
      icon: Target,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10'
    },
    {
      id: 'avgRR',
      title: 'Avg R:R',
      value: formatRRDisplay(summary.avgRR),
      fullValue: formatRRDisplay(summary.avgRR),
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      tooltip: safeNumber(summary.avgRR) === 0 ? 'Add Stop Loss and Take Profit to trades for R:R calculation' : undefined
    },
    {
      id: 'profitFactor',
      title: 'Profit Factor',
      value: safeNumber(summary.profitFactor) === Infinity ? '∞' : safeNumber(summary.profitFactor).toFixed(2),
      fullValue: safeNumber(summary.profitFactor) === Infinity ? '∞' : safeNumber(summary.profitFactor).toFixed(2),
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: 'maxDrawdown',
      title: 'Max Drawdown',
      value: formatPercentage(summary.maxDrawdown),
      fullValue: formatPercentage(summary.maxDrawdown),
      icon: TrendingDown,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    }
  ];

  const visibleCards = cards.filter(card => visibility[card.id]);
  const hiddenCardsCount = cards.length - visibleCards.length;

  return (
    <div className="space-y-4">
      {/* Card Visibility Controls - Fixed for Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Settings size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Dashboard Cards</span>
          {hiddenCardsCount > 0 && (
            <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full">
              {hiddenCardsCount} hidden
            </span>
          )}
        </div>
        
        {/* Eye Icons Container - Fixed for Mobile Wrapping */}
        <div className="flex items-center flex-wrap gap-1 justify-start sm:justify-end">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => toggleVisibility(card.id)}
              className={`p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 ${
                visibility[card.id]
                  ? 'text-blue-400 bg-blue-500/20 shadow-sm'
                  : 'text-gray-500 hover:text-gray-400 hover:bg-gray-700/30'
              }`}
              title={`${visibility[card.id] ? 'Hide' : 'Show'} ${card.title}`}
            >
              {visibility[card.id] ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
        {visibleCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.id} 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-2 sm:p-3 lg:p-4 hover:bg-gray-800/70 transition-all duration-200 group min-w-0"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1 sm:p-1.5 lg:p-2 rounded-lg ${card.bgColor} relative flex-shrink-0`}>
                  <Icon size={14} className={`sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${card.color}`} />
                  {card.isCapital && onEditStartingCapital && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStartingCapital();
                      }}
                      className="absolute -top-1 -right-1 p-1 bg-gray-700/80 hover:bg-gray-600/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                      title="Edit Starting Capital"
                      disabled={isReadOnlyMode}
                      style={{ display: isReadOnlyMode ? 'none' : 'block' }}
                    >
                      <Edit3 size={10} className="text-gray-300 hover:text-white" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p 
                  className={`text-base sm:text-lg lg:text-xl xl:text-2xl font-bold ${
                    card.value === '—' ? 'text-gray-500' : 
                    card.isNegative ? card.color : 'text-white'
                  } leading-tight cursor-help overflow-hidden`}
                  title={card.tooltip || (card.value !== card.fullValue ? card.fullValue : undefined)}
                  style={{
                    fontSize: card.value.length > 8 ? 'clamp(0.875rem, 2.5vw, 1.5rem)' : undefined
                  }}
                >
                  {card.value}
                </p>
                <p className="text-xs lg:text-sm text-gray-400 leading-tight truncate">{card.title}</p>
                {card.isCapital && card.subtitle && (
                  <p 
                    className="text-xs text-gray-500 leading-tight cursor-help truncate"
                    title={card.subtitleFull}
                  >
                    {card.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibleCards.length === 0 && (
        <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <EyeOff size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">All cards hidden</h3>
          <p className="text-gray-400 mb-4">Use the visibility controls above to show dashboard cards</p>
        </div>
      )}
    </div>
  );
};