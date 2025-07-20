import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Trade } from '../../types';
import { formatCompactCurrency, formatPercentage } from '../../utils/formatting';
import { formatRRDisplay, hasValidRR } from '../../utils/calculations';

interface WinLossChartProps {
  trades: Trade[];
}

interface TooltipStats {
  wins: {
    count: number;
    totalProfit: number;
    percentage: number;
    avgRR: number;
    topPairs: string;
    bestTrade: { symbol: string; tradeNumber: number; profit: number } | null;
  };
  losses: {
    count: number;
    totalLoss: number;
    percentage: number;
    avgRR: number;
    topPairs: string;
    worstTrade: { symbol: string; tradeNumber: number; loss: number } | null;
  };
  breakEven: {
    count: number;
    percentage: number;
  };
}

export const WinLossChart: React.FC<WinLossChartProps> = ({ trades }) => {
  const wins = trades.filter(t => t.result === 'Win').length;
  const losses = trades.filter(t => t.result === 'Loss').length;
  const breakEvens = trades.filter(t => t.result === 'Break-even').length;

  const data = [
    { name: 'Wins', value: wins, color: '#10B981', percentage: ((wins / trades.length) * 100).toFixed(1) },
    { name: 'Losses', value: losses, color: '#EF4444', percentage: ((losses / trades.length) * 100).toFixed(1) },
    { name: 'Break-even', value: breakEvens, color: '#9CA3AF', percentage: ((breakEvens / trades.length) * 100).toFixed(1) }
  ].filter(item => item.value > 0);

  // Precompute detailed statistics for tooltip
  const tooltipStats: TooltipStats = useMemo(() => {
    const winTrades = trades.filter(t => t.result === 'Win');
    const lossTrades = trades.filter(t => t.result === 'Loss');
    const breakEvenTrades = trades.filter(t => t.result === 'Break-even');

    // Helper function to get trade number
    const getTradeNumber = (trade: Trade) => trades.findIndex(t => t.id === trade.id) + 1;

    // Helper function to get most traded pairs
    const getMostTradedPairs = (tradeList: Trade[]) => {
      if (tradeList.length === 0) return '';
      
      const pairCounts = tradeList.reduce((acc, trade) => {
        acc[trade.pair] = (acc[trade.pair] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const maxCount = Math.max(...Object.values(pairCounts));
      const topPairs = Object.entries(pairCounts)
        .filter(([_, count]) => count === maxCount)
        .map(([pair, count]) => `${pair} (${count})`)
        .join(', ');

      return topPairs;
    };

    // Calculate wins stats
    const totalProfit = winTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winTradesWithRR = winTrades.filter(hasValidRR);
    const avgWinRR = winTradesWithRR.length > 0 
      ? winTradesWithRR.reduce((sum, trade) => sum + trade.rrRatio, 0) / winTradesWithRR.length 
      : 0;
    const bestTrade = winTrades.length > 0 
      ? winTrades.reduce((best, current) => current.pnl > best.pnl ? current : best)
      : null;

    // Calculate losses stats
    const totalLoss = Math.abs(lossTrades.reduce((sum, trade) => sum + trade.pnl, 0));
    const lossTradesWithRR = lossTrades.filter(hasValidRR);
    const avgLossRR = lossTradesWithRR.length > 0 
      ? lossTradesWithRR.reduce((sum, trade) => sum + trade.rrRatio, 0) / lossTradesWithRR.length 
      : 0;
    const worstTrade = lossTrades.length > 0 
      ? lossTrades.reduce((worst, current) => current.pnl < worst.pnl ? current : worst)
      : null;

    return {
      wins: {
        count: winTrades.length,
        totalProfit,
        percentage: trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0,
        avgRR: avgWinRR,
        topPairs: getMostTradedPairs(winTrades),
        bestTrade: bestTrade ? {
          symbol: bestTrade.pair,
          tradeNumber: getTradeNumber(bestTrade),
          profit: bestTrade.pnl
        } : null
      },
      losses: {
        count: lossTrades.length,
        totalLoss,
        percentage: trades.length > 0 ? (lossTrades.length / trades.length) * 100 : 0,
        avgRR: avgLossRR,
        topPairs: getMostTradedPairs(lossTrades),
        worstTrade: worstTrade ? {
          symbol: worstTrade.pair,
          tradeNumber: getTradeNumber(worstTrade),
          loss: Math.abs(worstTrade.pnl)
        } : null
      },
      breakEven: {
        count: breakEvenTrades.length,
        percentage: trades.length > 0 ? (breakEvenTrades.length / trades.length) * 100 : 0
      }
    };
  }, [trades]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const segmentName = data.name;

      return (
        <div className="bg-[#111827]/90 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[280px] max-w-sm font-sans">
          {segmentName === 'Wins' && (
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-green-400 font-bold text-base">Wins</span>
              </div>
              
              {/* Separator */}
              <div className="border-t border-gray-600/30 mb-4"></div>
              
              {/* Stats Grid */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Count</span>
                  <span className="text-white font-medium ml-4">{tooltipStats.wins.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Profit</span>
                  <span className="text-green-400 font-medium ml-4">+{formatCompactCurrency(tooltipStats.wins.totalProfit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Percentage</span>
                  <span className="text-white font-medium ml-4">{formatPercentage(tooltipStats.wins.percentage)}</span>
                </div>
                {tooltipStats.wins.avgRR > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg R:R</span>
                    <span className="text-white font-medium ml-4">{formatRRDisplay(tooltipStats.wins.avgRR)}</span>
                  </div>
                )}
                {tooltipStats.wins.topPairs && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400 flex-shrink-0">Top Pairs</span>
                    <span className="text-blue-400 font-medium text-right text-xs leading-tight ml-4 flex-1">{tooltipStats.wins.topPairs}</span>
                  </div>
                )}
                {tooltipStats.wins.bestTrade && (
                  <div className="pt-2 border-t border-gray-700/30">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400 flex-shrink-0">Best Trade</span>
                      <div className="text-right ml-4">
                        <div className="text-green-400 font-medium text-xs">
                          {tooltipStats.wins.bestTrade.symbol} • T{tooltipStats.wins.bestTrade.tradeNumber}
                        </div>
                        <div className="text-green-400 font-bold text-sm">
                          +{formatCompactCurrency(tooltipStats.wins.bestTrade.profit)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {segmentName === 'Losses' && (
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-red-400 font-bold text-base">Losses</span>
              </div>
              
              {/* Separator */}
              <div className="border-t border-gray-600/30 mb-4"></div>
              
              {/* Stats Grid */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Count</span>
                  <span className="text-white font-medium ml-4">{tooltipStats.losses.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Loss</span>
                  <span className="text-red-400 font-medium ml-4">-{formatCompactCurrency(tooltipStats.losses.totalLoss)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Percentage</span>
                  <span className="text-white font-medium ml-4">{formatPercentage(tooltipStats.losses.percentage)}</span>
                </div>
                {tooltipStats.losses.avgRR > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg R:R</span>
                    <span className="text-white font-medium ml-4">{formatRRDisplay(tooltipStats.losses.avgRR)}</span>
                  </div>
                )}
                {tooltipStats.losses.topPairs && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400 flex-shrink-0">Top Pairs</span>
                    <span className="text-blue-400 font-medium text-right text-xs leading-tight ml-4 flex-1">{tooltipStats.losses.topPairs}</span>
                  </div>
                )}
                {tooltipStats.losses.worstTrade && (
                  <div className="pt-2 border-t border-gray-700/30">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400 flex-shrink-0">Worst Trade</span>
                      <div className="text-right ml-4">
                        <div className="text-red-400 font-medium text-xs">
                          {tooltipStats.losses.worstTrade.symbol} • T{tooltipStats.losses.worstTrade.tradeNumber}
                        </div>
                        <div className="text-red-400 font-bold text-sm">
                          -{formatCompactCurrency(tooltipStats.losses.worstTrade.loss)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {segmentName === 'Break-even' && (
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-400 font-bold text-base">Break-even</span>
              </div>
              
              {/* Separator */}
              <div className="border-t border-gray-600/30 mb-4"></div>
              
              {/* Stats Grid */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Count</span>
                  <span className="text-white font-medium ml-4">{tooltipStats.breakEven.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Percentage</span>
                  <span className="text-white font-medium ml-4">{formatPercentage(tooltipStats.breakEven.percentage)}</span>
                </div>
                <div className="pt-2 border-t border-gray-700/30">
                  <div className="text-gray-400 text-xs italic">
                    No gain or loss recorded.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomInnerLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is significant enough (>5%)
    if (percent < 0.05) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
        className="drop-shadow-lg"
      >
        <tspan x={x} dy="-0.3em">{name}</tspan>
        <tspan x={x} dy="1.2em" fontSize={14} fontWeight="700">
          {`${(percent * 100).toFixed(0)}%`}
        </tspan>
      </text>
    );
  };

  // Center statistics display
  const CenterStats = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" className="fill-white text-lg font-bold">
        {trades.length}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="central" className="fill-gray-400 text-xs">
        Total Trades
      </text>
    </g>
  );

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:bg-gray-800/40 transition-all duration-300">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
        Win/Loss Ratio
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomInnerLabel}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1200}
              animationEasing="ease-out"
              cornerRadius={8}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{ 
                    filter: entry.name === 'Wins' 
                      ? `drop-shadow(0 0 12px ${entry.color}60)` 
                      : `drop-shadow(0 2px 4px ${entry.color}40)`
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color, fontWeight: '600' }}>
                  {value}
                </span>
              )}
            />
            {/* Center statistics */}
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-white text-lg font-bold">
              {trades.length}
            </text>
            <text x="50%" y="50%" dy="18" textAnchor="middle" dominantBaseline="central" className="fill-gray-400 text-xs">
              Total Trades
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};