import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { Trade } from '../../types';
import { formatCompactCurrency } from '../../utils/formatting';

interface PnLChartProps {
  trades: Trade[];
  startingCapital: number;
}

export const PnLChart: React.FC<PnLChartProps> = ({ trades, startingCapital }) => {
  const data = trades.reduce((acc, trade, index) => {
    const runningPnL = index === 0 ? trade.pnl : acc[index - 1].runningPnL + trade.pnl;
    const totalCapital = startingCapital + runningPnL;
    const isProfit = runningPnL >= 0;
    
    acc.push({
      trade: index + 1,
      runningPnL: Math.round(runningPnL * 100) / 100,
      totalCapital: Math.round(totalCapital * 100) / 100,
      isProfit,
      tradeResult: trade.result,
      pair: trade.pair,
      direction: trade.direction,
      tradePnL: Math.round(trade.pnl * 100) / 100,
      date: trade.date,
      // Add separate values for profit and loss zones
      profitZone: runningPnL >= 0 ? runningPnL : 0,
      lossZone: runningPnL < 0 ? runningPnL : 0
    });
    return acc;
  }, [] as Array<{ 
    trade: number; 
    runningPnL: number; 
    totalCapital: number; 
    isProfit: boolean;
    tradeResult: string;
    pair: string;
    direction: string;
    tradePnL: number;
    date: string;
    profitZone: number;
    lossZone: number;
  }>);

  // Add starting point
  if (data.length > 0) {
    data.unshift({ 
      trade: 0, 
      runningPnL: 0, 
      totalCapital: startingCapital, 
      isProfit: true,
      tradeResult: '',
      pair: '',
      direction: '',
      tradePnL: 0,
      date: '',
      profitZone: 0,
      lossZone: 0
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-600/50 rounded-lg p-4 shadow-2xl">
          <div className="flex items-center space-x-2 mb-2">
            {label === 0 ? (
              <p className="text-white font-semibold text-sm">Starting Position</p>
            ) : (
              <div className="flex items-center space-x-2">
                <span className={`font-medium text-sm ${
                  data.direction === 'Buy' 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  •T{label}
                </span>
                <span className="text-white font-semibold text-sm">Trade Details</span>
              </div>
            )}
          </div>
          {data.pair && (
            <p className="text-blue-400 text-xs sm:text-sm mb-1">
              Pair: {data.pair}
            </p>
          )}
          <p className="text-white font-medium text-sm">
            Total Capital: {formatCompactCurrency(data.totalCapital)}
          </p>
          <p className={`text-sm ${data.runningPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Running P&L: {data.runningPnL >= 0 ? '+' : ''}{formatCompactCurrency(data.runningPnL)}
          </p>
          {data.tradePnL !== 0 && (
            <p className={`text-xs ${data.tradePnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Trade P&L: {data.tradePnL >= 0 ? '+' : ''}{formatCompactCurrency(data.tradePnL)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Create timeline indicator data
  const timelineData = data.map((point, index) => ({
    trade: point.trade,
    performance: point.runningPnL >= 0 ? 1 : -1,
    isProfit: point.runningPnL >= 0
  }));

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4 sm:p-6 hover:bg-gray-800/40 transition-all duration-300">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
        <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
        <span className="text-base sm:text-xl">Running P&L Performance</span>
      </h3>
      
      {/* Main PnL Chart */}
      <div className="h-64 sm:h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
            <defs>
              {/* Profit zone gradient (green above zero) */}
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
              
              {/* Loss zone gradient (red below zero) */}
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis 
              dataKey="trade" 
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9CA3AF' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={10}
              tickFormatter={(value) => {
                const absValue = Math.abs(value);
                if (absValue >= 1000000) {
                  return `${value >= 0 ? '' : '-'}$${(absValue / 1000000).toFixed(1)}M`;
                } else if (absValue >= 1000) {
                  return `${value >= 0 ? '' : '-'}$${(absValue / 1000).toFixed(1)}K`;
                }
                return `$${value}`;
              }}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference line at break even (zero) */}
            <ReferenceLine 
              y={0} 
              stroke="#6B7280" 
              strokeDasharray="2 2" 
              strokeOpacity={0.6}
              label={{ value: "Break Even", position: "topRight", fill: "#9CA3AF", fontSize: 10 }}
            />
            
            {/* Profit zone area (green above zero) */}
            <Area
              type="monotone"
              dataKey="profitZone"
              stroke="none"
              fill="url(#profitGradient)"
              fillOpacity={1}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
            
            {/* Loss zone area (red below zero) */}
            <Area
              type="monotone"
              dataKey="lossZone"
              stroke="none"
              fill="url(#lossGradient)"
              fillOpacity={1}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
            
            {/* Main P&L line */}
            <Line
              type="monotone"
              dataKey="runningPnL"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              activeDot={{ 
                r: 6, 
                fill: '#60A5FA', 
                stroke: '#1E40AF', 
                strokeWidth: 2,
                style: { filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' }
              }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Timeline Indicator */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Performance Timeline</span>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-2 bg-green-500 rounded-sm"></div>
              <span className="text-gray-400">Profit</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-2 bg-red-500 rounded-sm"></div>
              <span className="text-gray-400">Loss</span>
            </div>
          </div>
        </div>
        
        {/* Timeline Bar */}
        <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden flex">
          {timelineData.map((point, index) => (
            <div
              key={index}
              className={`flex-1 transition-all duration-300 ${
                point.isProfit ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ 
                opacity: point.trade === 0 ? 0.3 : 0.8,
                minWidth: '2px'
              }}
              title={`T${point.trade}: ${point.isProfit ? 'Profit' : 'Loss'} Period`}
            />
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/30">
        <div className="text-center">
          <p className="text-xs text-gray-400">Current P&L</p>
          <p className={`text-sm font-bold ${
            data.length > 0 && data[data.length - 1].runningPnL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {data.length > 0 ? (
              `${data[data.length - 1].runningPnL >= 0 ? '+' : ''}${formatCompactCurrency(data[data.length - 1].runningPnL)}`
            ) : '$0.00'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Total Capital</p>
          <p className="text-sm font-bold text-white">
            {data.length > 0 ? (
              formatCompactCurrency(data[data.length - 1].totalCapital)
            ) : formatCompactCurrency(startingCapital)}
          </p>
        </div>
      </div>
    </div>
  );
};