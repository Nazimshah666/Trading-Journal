import React, { useState } from 'react';
import { Clock, TrendingUp, TrendingDown, Target, Hash, Star, ExternalLink, Calendar, DollarSign, Edit3 } from 'lucide-react';
import { PendingTrade } from '../types';
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { formatCompactCurrency, formatCleanNumberDisplay } from '../utils/formatting';

interface OpenTradesListProps {
  pendingTrades: PendingTrade[];
  onCompleteTrade: (trade: PendingTrade) => void;
  isReadOnlyMode?: boolean;
}

export const OpenTradesList: React.FC<OpenTradesListProps> = ({ 
  pendingTrades, 
  onCompleteTrade, 
  isReadOnlyMode = false 
}) => {
  const [sortField, setSortField] = useState<keyof PendingTrade>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof PendingTrade) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTrades = [...pendingTrades].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
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

  const getTradeNumber = (trade: PendingTrade) => {
    return pendingTrades.findIndex(t => t.id === trade.id) + 1;
  };

  const getDirectionPill = (direction: string) => {
    return direction === 'Buy' 
      ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">•Buy</span>
      : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">•Sell</span>;
  };

  const getTimeElapsed = (entryDate: string, entryTime: string) => {
    const entryDateTime = parseISO(`${entryDate}T${entryTime}`);
    const now = new Date();
    
    const days = differenceInDays(now, entryDateTime);
    const hours = differenceInHours(now, entryDateTime) % 24;
    const minutes = differenceInMinutes(now, entryDateTime) % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const calculatePotentialRR = (trade: PendingTrade) => {
    if (!trade.stopLoss || !trade.takeProfit) return null;
    
    const risk = Math.abs(trade.entryPrice - trade.stopLoss);
    const reward = Math.abs(trade.takeProfit - trade.entryPrice);
    
    return risk > 0 ? (reward / risk).toFixed(2) : null;
  };

  if (pendingTrades.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Open Trades</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Add a pending trade to track your open positions and complete them when they close.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-4">
        {sortedTrades.map((trade) => (
          <div key={trade.id} className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4">
            <div className="space-y-3">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`font-medium text-sm ${
                    trade.direction === 'Buy' 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    •P{getTradeNumber(trade)}
                  </span>
                  {trade.isAPlusSetup && (
                    <span className="text-yellow-400" title="A+ Setup">⭐</span>
                  )}
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                    Open
                  </span>
                </div>
                <button
                  onClick={() => onCompleteTrade(trade)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                  disabled={isReadOnlyMode}
                  style={{ display: isReadOnlyMode ? 'none' : 'flex' }}
                >
                  <Edit3 size={12} />
                  <span>Complete</span>
                </button>
              </div>
              
              {/* Trade Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Pair:</span>
                  <div className="font-medium text-white">{trade.pair}</div>
                </div>
                <div>
                  <span className="text-gray-400">Entry:</span>
                  <div className="text-white">{trade.entryPrice}</div>
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
                  <span className="text-gray-400">Time Open:</span>
                  <div className="text-orange-400 font-medium">
                    {getTimeElapsed(trade.date, trade.entryTime)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">R:R:</span>
                  <div className="text-white">
                    {calculatePotentialRR(trade) || '—'}
                  </div>
                </div>
              </div>
              
              {/* Strategy and SL/TP */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Strategy:</span>
                  <span className="ml-2 text-white">{trade.strategy}</span>
                </div>
                {(trade.stopLoss || trade.takeProfit) && (
                  <div className="flex space-x-4">
                    {trade.stopLoss && (
                      <div>
                        <span className="text-red-400">SL:</span>
                        <span className="ml-1 text-white">{trade.stopLoss}</span>
                      </div>
                    )}
                    {trade.takeProfit && (
                      <div>
                        <span className="text-green-400">TP:</span>
                        <span className="ml-1 text-white">{trade.takeProfit}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Trade
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('date')}>
                Entry Date
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('pair')}>
                Pair
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('direction')}>
                Direction
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('entryPrice')}>
                Entry Price
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                SL/TP
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Time Open
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                R:R
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {sortedTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      trade.direction === 'Buy' 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      •P{getTradeNumber(trade)}
                    </span>
                    {trade.isAPlusSetup && (
                      <span className="text-yellow-400" title="A+ Setup">⭐</span>
                    )}
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                      Open
                    </span>
                  </div>
                </td>
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-white">
                  <div>
                    {format(parseISO(trade.date), 'MM/dd/yyyy')}
                    <div className="text-xs text-gray-400">{trade.entryTime}</div>
                  </div>
                </td>
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                  {trade.pair}
                </td>
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm">
                  {getDirectionPill(trade.direction)}
                </td>
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-white font-medium">
                  {trade.entryPrice}
                </td>
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm">
                  <div className="space-y-1">
                    {trade.stopLoss && (
                      <div className="text-red-400 text-xs">
                        SL: {trade.stopLoss}
                      </div>
                    )}
                    {trade.takeProfit && (
                      <div className="text-green-400 text-xs">
                        TP: {trade.takeProfit}
                      </div>
                    )}
                    {!trade.stopLoss && !trade.takeProfit && (
                      <span className="text-gray-500 text-xs">—</span>
                    )}
                  </div>
                </td>
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm">
                  <span className="text-orange-400 font-medium">
                    {getTimeElapsed(trade.date, trade.entryTime)}
                  </span>
                </td>
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm text-white">
                  {calculatePotentialRR(trade) || '—'}
                </td>
                <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onCompleteTrade(trade)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                    disabled={isReadOnlyMode}
                    style={{ display: isReadOnlyMode ? 'none' : 'flex' }}
                  >
                    <Edit3 size={12} />
                    <span>Complete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};