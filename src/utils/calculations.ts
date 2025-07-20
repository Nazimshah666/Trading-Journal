import { Trade, AppSettings } from '../types';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import { safeNumber } from './formatting';
import { getPipSize, getPipValuePerStandardLot } from '../constants';

export const calculateTrade = (trade: Partial<Trade>, settings: AppSettings, previousEquity: number = 0): Trade => {
  // Input validation to prevent calculation errors
  if (!trade.pair || !trade.entryPrice || !trade.exitPrice || !trade.lotSize) {
    throw new Error('Missing required trade data for calculation');
  }
  
  const id = trade.id || crypto.randomUUID();
  
  // Handle multi-day trades
  const entryDate = trade.date!;
  const exitDate = trade.isMultiDay && trade.exitDate ? trade.exitDate : entryDate;
  
  // Calculate duration
  const entryDateTime = parseISO(`${entryDate}T${trade.entryTime}`);
  const exitDateTime = parseISO(`${exitDate}T${trade.exitTime}`);
  const duration = differenceInMinutes(exitDateTime, entryDateTime);
  
  // Get pip size for this pair (use stored pipSize or get from constants with custom override)
  const currentPairSettings = trade.pair ? settings.pairSettings?.[trade.pair] : undefined;
  const pipSize = trade.pipSize || getPipSize(trade.pair || '', currentPairSettings?.customPipSize);
  
  // Get pip value per standard lot (use stored value or get from constants with custom override)
  const pipValuePerStandardLot = trade.pipValuePerStandardLot || getPipValuePerStandardLot(trade.pair || '', currentPairSettings?.customPipValuePerStandardLot);
  
  // Validate pip size and pip value
  if (!pipSize || pipSize <= 0) {
    console.warn(`Invalid pip size for pair ${trade.pair}: ${pipSize}, using default`);
    // Use fallback instead of throwing
    const fallbackPipSize = 0.0001; // Default for most forex pairs
    return calculateTrade({...trade, pipSize: fallbackPipSize}, settings, previousEquity);
  }
  
  if (!pipValuePerStandardLot || pipValuePerStandardLot <= 0) {
    console.warn(`Invalid pip value per standard lot for pair ${trade.pair}: ${pipValuePerStandardLot}, using default`);
    // Use fallback instead of throwing
    const fallbackPipValue = 10; // Default for most forex pairs
    return calculateTrade({...trade, pipValuePerStandardLot: fallbackPipValue}, settings, previousEquity);
  }
  
  // Parse numeric values - NO ROUNDING AT THIS STAGE
  const entryPrice = safeNumber(trade.entryPrice);
  const stopLoss = safeNumber(trade.stopLoss);
  const takeProfit = safeNumber(trade.takeProfit);
  const exitPrice = safeNumber(trade.exitPrice);
  const lotSize = safeNumber(trade.lotSize); // Use FULL PRECISION lot size
  
  // Calculate risk (potential loss) - only if stop loss is provided
  // Formula: SL Pips = |Entry - SL| / PipSize
  // Risk = SL Pips × Pip Value per Standard Lot × Lot Size
  let risk = 0;
  if (stopLoss > 0) {
    const slPips = Math.abs((entryPrice - stopLoss) / pipSize);
    risk = slPips * pipValuePerStandardLot * lotSize; // FULL PRECISION - no rounding
  }
  
  // Calculate actual PnL based on direction and exit price
  // Formula: Pips Gained = |Entry - Exit| / PipSize (adjusted for direction)
  // P&L = Pips Gained × Pip Value per Standard Lot × Lot Size
  
  // Initialize result variable first
  let result: 'Win' | 'Loss' | 'Break-even' = 'Break-even';
  
  let pips = 0;
  let pnl = 0;
  
  // FIXED: Proper directional PnL calculation
  if (trade.direction === 'Buy') {
    // Buy: Profit when exit > entry, Loss when exit < entry
    pips = (exitPrice - entryPrice) / pipSize;
  } else {
    // Sell: Profit when exit < entry, Loss when exit > entry
    pips = (entryPrice - exitPrice) / pipSize;
  }
  
  // CRITICAL FIX: If stopped out at SL, force the loss to match the defined risk
  if (stopLoss > 0) {
    const isStoppedOut = (trade.direction === 'Buy' && exitPrice <= stopLoss) || 
                        (trade.direction === 'Sell' && exitPrice >= stopLoss);
    
    if (isStoppedOut) {
      // When stopped out, the loss should EXACTLY match the defined risk
      const actualLoss = -Math.abs(risk); // Force negative (loss)
      pnl = actualLoss;
      
      // Recalculate pips based on the actual loss to maintain consistency
      if (lotSize > 0 && pipValuePerStandardLot > 0) {
        pips = actualLoss / (pipValuePerStandardLot * lotSize);
      }
    } else {
      // Not stopped out - use normal pip-based calculation
      pnl = pips * pipValuePerStandardLot * lotSize;
    }
  } else {
    // No stop loss defined - use normal pip-based calculation
    pnl = pips * pipValuePerStandardLot * lotSize;
  }
  
  // Determine result based on PnL first
  if (pnl > 0.01) result = 'Win';
  else if (pnl < -0.01) result = 'Loss';
  
  // REAL-WORLD R:R CALCULATION LOGIC
  let rrRatio = 0;
  if (risk > 0 && stopLoss > 0) {
    const riskPips = Math.abs((entryPrice - stopLoss) / pipSize); // Risk pips
    
    if (result === 'Win') {
      // ✅ WINNING TRADES: Use actual Exit Price to calculate RR
      // This shows the real reward achieved vs risk taken
      const actualRewardPips = Math.abs(pips);
      rrRatio = actualRewardPips / riskPips;
    } else if (result === 'Loss' && takeProfit > 0) {
      // ✅ LOSING TRADES (with TP): Use intended TP to calculate RR
      // This shows risk-to-intended-reward ratio for analysis
      const plannedRewardPips = Math.abs((takeProfit - entryPrice) / pipSize);
      rrRatio = plannedRewardPips / riskPips;
    } else {
      // ⚠️ LOSING TRADES (without TP): No R:R calculation possible
      // Can't calculate R:R without knowing intended reward target
      rrRatio = 0;
    }
  }
  
  // Calculate change in capital percentage
  const changeInCapital = settings.startingCapital > 0 ? (pnl / settings.startingCapital) * 100 : 0;
  
  // Calculate actual reward achieved
  const reward = pnl > 0 ? pnl : 0; // Actual reward is the positive P&L achieved
  
  // Calculate new equity
  const equity = previousEquity + pnl;
  
  return {
    id,
    date: entryDate,
    exitDate: trade.isMultiDay ? exitDate : undefined,
    entryTime: trade.entryTime!,
    exitTime: trade.exitTime!,
    direction: trade.direction!,
    pair: trade.pair!,
    entryPrice,
    stopLoss: stopLoss > 0 ? stopLoss : undefined,
    takeProfit: takeProfit > 0 ? takeProfit : undefined,
    exitPrice,
    lotSize, // Store EXACT lot size with full precision
    strategy: trade.strategy!,
    setupTags: trade.setupTags || [],
    notes: trade.notes || '',
    screenshotLink: trade.screenshotLink || '',
    emotionRating: safeNumber(trade.emotionRating) || 5,
    isAPlusSetup: trade.isAPlusSetup || false,
    isMultiDay: trade.isMultiDay || false,
    pipSize, // Store pip size used for this trade
    pipValuePerStandardLot, // Store pip value per standard lot used for this trade
    duration,
    risk: risk, // FULL PRECISION - no rounding
    reward, // FULL PRECISION - actual reward achieved
    rrRatio, // FULL PRECISION - no rounding
    result,
    pnl, // FULL PRECISION - no rounding
    changeInCapital, // FULL PRECISION - no rounding
    equity // FULL PRECISION - no rounding
  };
};

export const calculateSummary = (trades: Trade[], settings: AppSettings) => {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      totalPnL: 0,
      avgRR: 0,
      winRate: 0,
      mostProfitablePair: '',
      bestDay: '',
      worstDay: '',
      maxDrawdown: 0,
      profitFactor: 0,
      aPlusSetups: 0,
      totalRiskUsed: 0
    };
  }

  const wins = trades.filter(t => t.result === 'Win');
  const losses = trades.filter(t => t.result === 'Loss');
  
  // Calculate totals with FULL PRECISION and safe number handling
  const totalPnL = safeNumber(trades.reduce((sum, t) => sum + safeNumber(t.pnl), 0));
  
  // Calculate average R:R ONLY for trades that have valid R:R (Stop Loss set)
  const tradesWithValidRR = trades.filter(t => hasValidRR(t));
  const avgRR = tradesWithValidRR.length > 0 
    ? safeNumber(tradesWithValidRR.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / tradesWithValidRR.length)
    : 0;
  
  const winRate = trades.length > 0 ? safeNumber((wins.length / trades.length) * 100) : 0;
  
  // A+ setups count
  const aPlusSetups = trades.filter(t => t.isAPlusSetup).length;
  
  // Total risk used
  const totalRiskUsed = safeNumber(trades.reduce((sum, t) => sum + safeNumber(t.risk), 0));
  
  // Most profitable pair
  const pairPnL = trades.reduce((acc, trade) => {
    const pnl = safeNumber(trade.pnl);
    acc[trade.pair] = safeNumber((acc[trade.pair] || 0) + pnl);
    return acc;
  }, {} as Record<string, number>);
  
  const mostProfitablePair = Object.keys(pairPnL).length > 0 
    ? Object.keys(pairPnL).reduce((a, b) => pairPnL[a] > pairPnL[b] ? a : b)
    : '';
  
  // Best and worst days - use exit date for multi-day trades
  const dailyPnL = trades.reduce((acc, trade) => {
    const tradeDate = trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date;
    const pnl = safeNumber(trade.pnl);
    acc[tradeDate] = safeNumber((acc[tradeDate] || 0) + pnl);
    return acc;
  }, {} as Record<string, number>);
  
  const dailyEntries = Object.entries(dailyPnL);
  const bestDay = dailyEntries.length > 0 
    ? dailyEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
    : '';
  
  const worstDay = dailyEntries.length > 0 
    ? dailyEntries.reduce((a, b) => a[1] < b[1] ? a : b)[0]
    : '';
  
  // Max drawdown calculation with FULL PRECISION
  let maxDrawdown = 0;
  let peak = safeNumber(settings.startingCapital);
  let currentEquity = safeNumber(settings.startingCapital);
  
  trades.forEach(trade => {
    currentEquity += safeNumber(trade.pnl);
    if (currentEquity > peak) {
      peak = currentEquity;
    }
    const drawdown = peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  maxDrawdown = safeNumber(maxDrawdown);
  
  // Profit factor with FULL PRECISION calculation
  const totalWins = safeNumber(wins.reduce((sum, t) => sum + safeNumber(t.pnl), 0));
  const totalLosses = Math.abs(safeNumber(losses.reduce((sum, t) => sum + safeNumber(t.pnl), 0)));
  
  let profitFactor = 0;
  if (totalLosses > 0) {
    profitFactor = safeNumber(totalWins / totalLosses);
  } else if (totalWins > 0) {
    profitFactor = Infinity;
  }
  
  return {
    totalTrades: trades.length,
    totalPnL,
    avgRR,
    winRate,
    mostProfitablePair,
    bestDay,
    worstDay,
    maxDrawdown,
    profitFactor,
    aPlusSetups,
    totalRiskUsed
  };
};

// Helper function to format R:R display
export const formatRRDisplay = (rrRatio: number): string => {
  const safeValue = safeNumber(rrRatio);
  if (safeValue <= 0) return '—';
  return safeValue.toFixed(2);
};

// Helper function to check if R:R is valid - UPDATED: Only requires Stop Loss
export const hasValidRR = (trade: Trade): boolean => {
  // ✅ WINNING TRADES: Need SL and positive R:R (calculated from actual exit)
  // ✅ LOSING TRADES: Need SL and either TP (for intended R:R) or just SL (for risk tracking)
  // ⚠️ NO TP on losses = No R:R (shows as "—")
  if (trade.result === 'Win') {
    return safeNumber(trade.rrRatio) > 0 && trade.stopLoss !== undefined;
  } else if (trade.result === 'Loss') {
    // For losses: Valid R:R only if has both SL and TP
    // If no TP, we can track the loss but not calculate meaningful R:R
    return trade.stopLoss !== undefined && trade.takeProfit !== undefined && safeNumber(trade.rrRatio) > 0;
  }
  return false;
};