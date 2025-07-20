import { Trade, AppSettings } from '../types';
import { safeNumber } from './formatting';
import { hasValidRR } from './calculations';
import { format, parseISO, getDay, getMonth, getYear, differenceInDays, differenceInMinutes, isSameDay } from 'date-fns';

export interface UltimateMetrics {
  // Overall Profitability & Efficiency
  totalNetPnL: number;
  grossProfit: number;
  grossLoss: number;
  winRate: number;
  lossRate: number;
  breakEvenRate: number;
  profitFactor: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  roi: number;
  tradesAbove1R: { count: number; percentage: number };
  tradesAbove2R: { count: number; percentage: number };
  tradesAbove3R: { count: number; percentage: number };
  tradesBelow1R: { count: number; percentage: number };
  breakEvenPoint: number;

  // Risk Management & Capital Preservation
  maxDrawdownAmount: number;
  maxDrawdownPercentage: number;
  averageRiskPerTrade: number;
  averageRROverall: number;
  averageRRWins: number;
  averageRRLosses: number;
  tradesWithoutSL: { count: number; percentage: number };
  tradesWithoutTP: { count: number; percentage: number };
  averageSLDistancePips: number;
  averageTPDistancePips: number;

  // Time-Based Performance
  bestDayOfWeek: { day: string; avgPnL: number };
  worstDayOfWeek: { day: string; avgPnL: number };
  mostProfitableMonth: { month: string; totalPnL: number };
  leastProfitableMonth: { month: string; totalPnL: number };
  mostProfitableYear: { year: string; totalPnL: number };
  leastProfitableYear: { year: string; totalPnL: number };
  averageHoldTimeOverall: number;
  averageHoldTimeWins: number;
  averageHoldTimeLosses: number;
  shortestHoldTime: number;
  longestHoldTime: number;

  // Instrument & Strategy Specific
  mostProfitablePair: { pair: string; totalPnL: number };
  leastProfitablePair: { pair: string; totalPnL: number };
  highestWinRatePair: { pair: string; winRate: number };
  lowestWinRatePair: { pair: string; winRate: number };
  mostTradedPair: { pair: string; count: number };
  leastTradedPair: { pair: string; count: number };
  mostProfitableStrategy: { strategy: string; totalPnL: number };
  mostUsedStrategy: { strategy: string; count: number };
  highestWinRateStrategy: { strategy: string; winRate: number };
  mostUsedSetupTag: { tag: string; count: number };
  mostProfitableSetupTag: { tag: string; totalPnL: number };
  highestWinRateSetupTag: { tag: string; winRate: number };
  aPlusSetupWinRate: number;
  aPlusSetupTotalPnL: number;

  // Behavioral & Psychological
  maxWinningStreak: number;
  maxLosingStreak: number;
  totalWinningStreaks: number;
  totalLosingStreaks: number;
  avgPnLHighEmotion: number;
  avgPnLLowEmotion: number;
  tradesHighEmotion: { count: number; percentage: number };
  tradesLowEmotion: { count: number; percentage: number };

  // Equity & Drawdown Dynamics
  equityAtStart: number;
  equityAtEnd: number;
  timeToRecoverMaxDrawdown: number;
  numberOfDrawdowns: number;

  // Timing & Performance Correlations
  timeSinceLastTradeCorrelation: {
    avgTimeBetweenTrades: number; // in minutes
    shortGapPerformance: { avgPnL: number; winRate: number; tradeCount: number }; // < 30 min
    mediumGapPerformance: { avgPnL: number; winRate: number; tradeCount: number }; // 30min - 4hrs
    longGapPerformance: { avgPnL: number; winRate: number; tradeCount: number }; // > 4hrs
    bestGapRange: string;
    worstGapRange: string;
  };
  dailyPerformanceDecay: {
    tradesByPosition: Array<{
      position: number; // 1st, 2nd, 3rd trade of day
      avgPnL: number;
      winRate: number;
      tradeCount: number;
    }>;
    bestTradePosition: number;
    worstTradePosition: number;
    maxTradesPerDay: number;
    optimalDailyLimit: number; // suggested based on performance decay
  };
}

export const calculateUltimateMetrics = (trades: Trade[], settings: AppSettings): UltimateMetrics => {
  if (trades.length === 0) {
    return {
      totalNetPnL: 0,
      grossProfit: 0,
      grossLoss: 0,
      winRate: 0,
      lossRate: 0,
      breakEvenRate: 0,
      profitFactor: 0,
      expectancy: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      roi: 0,
      tradesAbove1R: { count: 0, percentage: 0 },
      tradesAbove2R: { count: 0, percentage: 0 },
      tradesAbove3R: { count: 0, percentage: 0 },
      tradesBelow1R: { count: 0, percentage: 0 },
      breakEvenPoint: 0,
      maxDrawdownAmount: 0,
      maxDrawdownPercentage: 0,
      averageRiskPerTrade: 0,
      averageRROverall: 0,
      averageRRWins: 0,
      averageRRLosses: 0,
      tradesWithoutSL: { count: 0, percentage: 0 },
      tradesWithoutTP: { count: 0, percentage: 0 },
      averageSLDistancePips: 0,
      averageTPDistancePips: 0,
      bestDayOfWeek: { day: '', avgPnL: 0 },
      worstDayOfWeek: { day: '', avgPnL: 0 },
      mostProfitableMonth: { month: '', totalPnL: 0 },
      leastProfitableMonth: { month: '', totalPnL: 0 },
      mostProfitableYear: { year: '', totalPnL: 0 },
      leastProfitableYear: { year: '', totalPnL: 0 },
      averageHoldTimeOverall: 0,
      averageHoldTimeWins: 0,
      averageHoldTimeLosses: 0,
      shortestHoldTime: 0,
      longestHoldTime: 0,
      mostProfitablePair: { pair: '', totalPnL: 0 },
      leastProfitablePair: { pair: '', totalPnL: 0 },
      highestWinRatePair: { pair: '', winRate: 0 },
      lowestWinRatePair: { pair: '', winRate: 0 },
      mostTradedPair: { pair: '', count: 0 },
      leastTradedPair: { pair: '', count: 0 },
      mostProfitableStrategy: { strategy: '', totalPnL: 0 },
      mostUsedStrategy: { strategy: '', count: 0 },
      highestWinRateStrategy: { strategy: '', winRate: 0 },
      mostUsedSetupTag: { tag: '', count: 0 },
      mostProfitableSetupTag: { tag: '', totalPnL: 0 },
      highestWinRateSetupTag: { tag: '', winRate: 0 },
      aPlusSetupWinRate: 0,
      aPlusSetupTotalPnL: 0,
      maxWinningStreak: 0,
      maxLosingStreak: 0,
      totalWinningStreaks: 0,
      totalLosingStreaks: 0,
      avgPnLHighEmotion: 0,
      avgPnLLowEmotion: 0,
      tradesHighEmotion: { count: 0, percentage: 0 },
      tradesLowEmotion: { count: 0, percentage: 0 },
      equityAtStart: settings.startingCapital,
      equityAtEnd: settings.startingCapital,
      timeToRecoverMaxDrawdown: 0,
      numberOfDrawdowns: 0,
      timeSinceLastTradeCorrelation: {
        avgTimeBetweenTrades: 0,
        shortGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        mediumGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        longGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        bestGapRange: '',
        worstGapRange: ''
      },
      dailyPerformanceDecay: {
        tradesByPosition: [],
        bestTradePosition: 0,
        worstTradePosition: 0,
        maxTradesPerDay: 0,
        optimalDailyLimit: 0
      }
    };
  }

  // Separate trades by result
  const winTrades = trades.filter(t => t.result === 'Win');
  const lossTrades = trades.filter(t => t.result === 'Loss');
  const breakEvenTrades = trades.filter(t => t.result === 'Break-even');
  const validRRTrades = trades.filter(hasValidRR);

  // Overall Profitability & Efficiency
  const totalNetPnL = safeNumber(trades.reduce((sum, t) => sum + safeNumber(t.pnl), 0));
  const grossProfit = safeNumber(winTrades.reduce((sum, t) => sum + safeNumber(t.pnl), 0));
  const grossLoss = Math.abs(safeNumber(lossTrades.reduce((sum, t) => sum + safeNumber(t.pnl), 0)));
  const winRate = (winTrades.length / trades.length) * 100;
  const lossRate = (lossTrades.length / trades.length) * 100;
  const breakEvenRate = (breakEvenTrades.length / trades.length) * 100;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
  
  // Calculate expectancy using R:R ratios
  let expectancy = 0;
  if (validRRTrades.length > 0) {
    const winningRRTrades = validRRTrades.filter(t => t.result === 'Win');
    const losingRRTrades = validRRTrades.filter(t => t.result === 'Loss');
    
    const avgWinR = winningRRTrades.length > 0 
      ? winningRRTrades.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / winningRRTrades.length 
      : 0;
    
    const avgLossR = losingRRTrades.length > 0 
      ? Math.abs(losingRRTrades.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / losingRRTrades.length)
      : 0;
    
    const winRateDecimal = winRate / 100;
    const lossRateDecimal = lossRate / 100;
    
    expectancy = (winRateDecimal * avgWinR) - (lossRateDecimal * avgLossR);
  }

  const averageWin = winTrades.length > 0 ? grossProfit / winTrades.length : 0;
  const averageLoss = lossTrades.length > 0 ? grossLoss / lossTrades.length : 0;
  const largestWin = winTrades.length > 0 ? Math.max(...winTrades.map(t => safeNumber(t.pnl))) : 0;
  const largestLoss = lossTrades.length > 0 ? Math.abs(Math.min(...lossTrades.map(t => safeNumber(t.pnl)))) : 0;
  const roi = settings.startingCapital > 0 ? (totalNetPnL / settings.startingCapital) * 100 : 0;

  // R:R Analysis
  // FIXED: Use exclusive bands instead of overlapping categories
  const below1R = validRRTrades.filter(t => safeNumber(t.rrRatio) < 1);
  const between1R2R = validRRTrades.filter(t => {
    const rr = safeNumber(t.rrRatio);
    return rr >= 1 && rr < 2;
  });
  const between2R3R = validRRTrades.filter(t => {
    const rr = safeNumber(t.rrRatio);
    return rr >= 2 && rr < 3;
  });
  const above3R = validRRTrades.filter(t => safeNumber(t.rrRatio) >= 3);

  const tradesAbove1R = {
    count: between1R2R.length,
    percentage: validRRTrades.length > 0 ? (between1R2R.length / validRRTrades.length) * 100 : 0
  };
  const tradesAbove3R = {
    count: above3R.length,
    percentage: validRRTrades.length > 0 ? (above3R.length / validRRTrades.length) * 100 : 0
  };
  const tradesBelow1R = {
    count: below1R.length,
    percentage: validRRTrades.length > 0 ? (below1R.length / validRRTrades.length) * 100 : 0
  };
  const tradesAbove2R = {
    count: between2R3R.length,
    percentage: validRRTrades.length > 0 ? (between2R3R.length / validRRTrades.length) * 100 : 0
  };

  const breakEvenPoint = totalNetPnL < 0 ? Math.abs(totalNetPnL) : 0;

  // Risk Management & Capital Preservation
  let maxDrawdownAmount = 0;
  let maxDrawdownPercentage = 0;
  let peak = settings.startingCapital;
  let currentEquity = settings.startingCapital;
  let numberOfDrawdowns = 0;
  let inDrawdown = false;

  trades.forEach(trade => {
    currentEquity += safeNumber(trade.pnl);
    if (currentEquity > peak) {
      if (inDrawdown) {
        numberOfDrawdowns++;
        inDrawdown = false;
      }
      peak = currentEquity;
    } else if (currentEquity < peak && !inDrawdown) {
      inDrawdown = true;
    }
    
    const drawdownAmount = peak - currentEquity;
    const drawdownPercent = peak > 0 ? (drawdownAmount / peak) * 100 : 0;
    
    if (drawdownAmount > maxDrawdownAmount) {
      maxDrawdownAmount = drawdownAmount;
    }
    if (drawdownPercent > maxDrawdownPercentage) {
      maxDrawdownPercentage = drawdownPercent;
    }
  });

  const averageRiskPerTrade = trades.reduce((sum, t) => sum + safeNumber(t.risk), 0) / trades.length;
  const averageRROverall = validRRTrades.length > 0 
    ? validRRTrades.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / validRRTrades.length 
    : 0;

  const winRRTrades = validRRTrades.filter(t => t.result === 'Win');
  const lossRRTrades = validRRTrades.filter(t => t.result === 'Loss');
  
  const averageRRWins = winRRTrades.length > 0 
    ? winRRTrades.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / winRRTrades.length 
    : 0;
  const averageRRLosses = lossRRTrades.length > 0 
    ? lossRRTrades.reduce((sum, t) => sum + safeNumber(t.rrRatio), 0) / lossRRTrades.length 
    : 0;

  const tradesWithoutSLCount = trades.filter(t => !t.stopLoss).length;
  const tradesWithoutTPCount = trades.filter(t => !t.takeProfit).length;

  const tradesWithoutSL = {
    count: tradesWithoutSLCount,
    percentage: (tradesWithoutSLCount / trades.length) * 100
  };
  const tradesWithoutTP = {
    count: tradesWithoutTPCount,
    percentage: (tradesWithoutTPCount / trades.length) * 100
  };

  // Calculate average SL/TP distances
  const tradesWithSL = trades.filter(t => t.stopLoss);
  const tradesWithTP = trades.filter(t => t.takeProfit);

  const averageSLDistancePips = tradesWithSL.length > 0 
    ? tradesWithSL.reduce((sum, t) => sum + Math.abs(t.entryPrice - t.stopLoss!) / t.pipSize, 0) / tradesWithSL.length 
    : 0;
  const averageTPDistancePips = tradesWithTP.length > 0 
    ? tradesWithTP.reduce((sum, t) => sum + Math.abs(t.takeProfit! - t.entryPrice) / t.pipSize, 0) / tradesWithTP.length 
    : 0;

  // Time-Based Performance
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPnL: Record<string, number[]> = {};
  
  trades.forEach(trade => {
    const tradeDate = parseISO(trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date);
    const dayOfWeek = dayNames[getDay(tradeDate)];
    if (!dayPnL[dayOfWeek]) dayPnL[dayOfWeek] = [];
    dayPnL[dayOfWeek].push(safeNumber(trade.pnl));
  });

  const dayAverages = Object.entries(dayPnL).map(([day, pnls]) => ({
    day,
    avgPnL: pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length
  }));

  const bestDayOfWeek = dayAverages.length > 0 
    ? dayAverages.reduce((best, current) => current.avgPnL > best.avgPnL ? current : best)
    : { day: '', avgPnL: 0 };
  const worstDayOfWeek = dayAverages.length > 0 
    ? dayAverages.reduce((worst, current) => current.avgPnL < worst.avgPnL ? current : worst)
    : { day: '', avgPnL: 0 };

  // Monthly performance
  const monthPnL: Record<string, number> = {};
  trades.forEach(trade => {
    const tradeDate = parseISO(trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date);
    const monthKey = format(tradeDate, 'yyyy-MM');
    monthPnL[monthKey] = (monthPnL[monthKey] || 0) + safeNumber(trade.pnl);
  });

  const monthEntries = Object.entries(monthPnL);
  const mostProfitableMonth = monthEntries.length > 0 
    ? monthEntries.reduce((best, current) => current[1] > best[1] ? current : best)
    : ['', 0];
  const leastProfitableMonth = monthEntries.length > 0 
    ? monthEntries.reduce((worst, current) => current[1] < worst[1] ? current : worst)
    : ['', 0];

  // Yearly performance
  const yearPnL: Record<string, number> = {};
  trades.forEach(trade => {
    const tradeDate = parseISO(trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date);
    const year = getYear(tradeDate).toString();
    yearPnL[year] = (yearPnL[year] || 0) + safeNumber(trade.pnl);
  });

  const yearEntries = Object.entries(yearPnL);
  const mostProfitableYear = yearEntries.length > 0 
    ? yearEntries.reduce((best, current) => current[1] > best[1] ? current : best)
    : ['', 0];
  const leastProfitableYear = yearEntries.length > 0 
    ? yearEntries.reduce((worst, current) => current[1] < worst[1] ? current : worst)
    : ['', 0];

  // Hold time analysis
  const durations = trades.map(t => t.duration);
  const winDurations = winTrades.map(t => t.duration);
  const lossDurations = lossTrades.map(t => t.duration);

  const averageHoldTimeOverall = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const averageHoldTimeWins = winDurations.length > 0 ? winDurations.reduce((sum, d) => sum + d, 0) / winDurations.length : 0;
  const averageHoldTimeLosses = lossDurations.length > 0 ? lossDurations.reduce((sum, d) => sum + d, 0) / lossDurations.length : 0;
  const shortestHoldTime = Math.min(...durations);
  const longestHoldTime = Math.max(...durations);

  // Instrument & Strategy Specific
  const pairPnL: Record<string, number> = {};
  const pairCounts: Record<string, number> = {};
  const pairWins: Record<string, number> = {};

  trades.forEach(trade => {
    pairPnL[trade.pair] = (pairPnL[trade.pair] || 0) + safeNumber(trade.pnl);
    pairCounts[trade.pair] = (pairCounts[trade.pair] || 0) + 1;
    if (trade.result === 'Win') {
      pairWins[trade.pair] = (pairWins[trade.pair] || 0) + 1;
    }
  });

  const pairPnLEntries = Object.entries(pairPnL);
  const pairCountEntries = Object.entries(pairCounts);

  const mostProfitablePair = pairPnLEntries.length > 0 
    ? pairPnLEntries.reduce((best, current) => current[1] > best[1] ? current : best)
    : ['', 0];
  const leastProfitablePair = pairPnLEntries.length > 0 
    ? pairPnLEntries.reduce((worst, current) => current[1] < worst[1] ? current : worst)
    : ['', 0];

  const mostTradedPair = pairCountEntries.length > 0 
    ? pairCountEntries.reduce((most, current) => current[1] > most[1] ? current : most)
    : ['', 0];
  const leastTradedPair = pairCountEntries.length > 0 
    ? pairCountEntries.reduce((least, current) => current[1] < least[1] ? current : least)
    : ['', 0];

  // Calculate win rates per pair
  const pairWinRates = Object.entries(pairCounts).map(([pair, count]) => ({
    pair,
    winRate: ((pairWins[pair] || 0) / count) * 100
  }));

  const highestWinRatePair = pairWinRates.length > 0 
    ? pairWinRates.reduce((best, current) => current.winRate > best.winRate ? current : best)
    : { pair: '', winRate: 0 };
  const lowestWinRatePair = pairWinRates.length > 0 
    ? pairWinRates.reduce((worst, current) => current.winRate < worst.winRate ? current : worst)
    : { pair: '', winRate: 0 };

  // Strategy analysis
  const strategyPnL: Record<string, number> = {};
  const strategyCounts: Record<string, number> = {};
  const strategyWins: Record<string, number> = {};

  // Only include trades with valid strategy values
  trades.forEach(trade => {
    // Skip trades with missing, empty, or whitespace-only strategy
    if (!trade.strategy || trade.strategy.trim() === '') {
      return;
    }
    
    strategyPnL[trade.strategy] = (strategyPnL[trade.strategy] || 0) + safeNumber(trade.pnl);
    strategyCounts[trade.strategy] = (strategyCounts[trade.strategy] || 0) + 1;
    if (trade.result === 'Win') {
      strategyWins[trade.strategy] = (strategyWins[trade.strategy] || 0) + 1;
    }
  });

  const strategyPnLEntries = Object.entries(strategyPnL);
  const strategyCountEntries = Object.entries(strategyCounts);
  const mostProfitableStrategy = strategyPnLEntries.length > 0 
    ? strategyPnLEntries.reduce((best, current) => current[1] > best[1] ? current : best)
    : ['', 0];

  const mostUsedStrategy = strategyCountEntries.length > 0 
    ? strategyCountEntries.reduce((most, current) => current[1] > most[1] ? current : most)
    : ['', 0];

  const strategyWinRates = Object.entries(strategyCounts).map(([strategy, count]) => ({
    strategy,
    winRate: ((strategyWins[strategy] || 0) / count) * 100
  }));

  const highestWinRateStrategy = strategyWinRates.length > 0 
    ? strategyWinRates.reduce((best, current) => current.winRate > best.winRate ? current : best)
    : { strategy: '', winRate: 0 };

  // Setup Tags analysis
  const setupTagCounts: Record<string, number> = {};
  const setupTagPnL: Record<string, number> = {};
  const setupTagWins: Record<string, number> = {};

  trades.forEach(trade => {
    if (trade.setupTags && trade.setupTags.length > 0) {
      trade.setupTags.forEach(tag => {
        if (tag && tag.trim() !== '') {
          setupTagCounts[tag] = (setupTagCounts[tag] || 0) + 1;
          setupTagPnL[tag] = (setupTagPnL[tag] || 0) + safeNumber(trade.pnl);
          if (trade.result === 'Win') {
            setupTagWins[tag] = (setupTagWins[tag] || 0) + 1;
          }
        }
      });
    }
  });

  const setupTagCountEntries = Object.entries(setupTagCounts);
  const setupTagPnLEntries = Object.entries(setupTagPnL);

  const mostUsedSetupTag = setupTagCountEntries.length > 0 
    ? setupTagCountEntries.reduce((most, current) => current[1] > most[1] ? current : most)
    : ['', 0];

  const mostProfitableSetupTag = setupTagPnLEntries.length > 0 
    ? setupTagPnLEntries.reduce((best, current) => current[1] > best[1] ? current : best)
    : ['', 0];

  const setupTagWinRates = Object.entries(setupTagCounts).map(([tag, count]) => ({
    tag,
    winRate: ((setupTagWins[tag] || 0) / count) * 100
  }));

  const highestWinRateSetupTag = setupTagWinRates.length > 0 
    ? setupTagWinRates.reduce((best, current) => current.winRate > best.winRate ? current : best)
    : { tag: '', winRate: 0 };

  // A+ Setup analysis
  const aPlusSetups = trades.filter(t => t.isAPlusSetup);
  const aPlusWins = aPlusSetups.filter(t => t.result === 'Win');
  const aPlusSetupWinRate = aPlusSetups.length > 0 ? (aPlusWins.length / aPlusSetups.length) * 100 : 0;
  const aPlusSetupTotalPnL = aPlusSetups.reduce((sum, t) => sum + safeNumber(t.pnl), 0);

  // Behavioral & Psychological
  let maxWinningStreak = 0;
  let maxLosingStreak = 0;
  let totalWinningStreaks = 0;
  let totalLosingStreaks = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  trades.forEach(trade => {
    if (trade.result === 'Win') {
      currentWinStreak++;
      if (currentLossStreak > 0) {
        if (currentLossStreak >= 2) totalLosingStreaks++;
        maxLosingStreak = Math.max(maxLosingStreak, currentLossStreak);
        currentLossStreak = 0;
      }
    } else if (trade.result === 'Loss') {
      currentLossStreak++;
      if (currentWinStreak > 0) {
        if (currentWinStreak >= 2) totalWinningStreaks++;
        maxWinningStreak = Math.max(maxWinningStreak, currentWinStreak);
        currentWinStreak = 0;
      }
    } else {
      if (currentWinStreak >= 2) totalWinningStreaks++;
      if (currentLossStreak >= 2) totalLosingStreaks++;
      maxWinningStreak = Math.max(maxWinningStreak, currentWinStreak);
      maxLosingStreak = Math.max(maxLosingStreak, currentLossStreak);
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });

  // Handle final streaks
  if (currentWinStreak >= 2) totalWinningStreaks++;
  if (currentLossStreak >= 2) totalLosingStreaks++;
  maxWinningStreak = Math.max(maxWinningStreak, currentWinStreak);
  maxLosingStreak = Math.max(maxLosingStreak, currentLossStreak);

  // Calculate Timing & Performance Correlations
  
  // 1. Time Since Last Trade vs. Outcome
  const timeSinceLastTradeCorrelation = (() => {
    if (trades.length < 2) {
      return {
        avgTimeBetweenTrades: 0,
        shortGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        mediumGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        longGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        bestGapRange: '',
        worstGapRange: ''
      };
    }

    const tradesWithGaps = [];
    let totalGapMinutes = 0;

    for (let i = 1; i < trades.length; i++) {
      const currentTrade = trades[i];
      const previousTrade = trades[i - 1];
      
      // Calculate time gap between entry times
      const currentTradeTime = parseISO(`${currentTrade.date}T${currentTrade.entryTime}`);
      const previousTradeTime = parseISO(`${previousTrade.date}T${previousTrade.entryTime}`);
      
      const gapMinutes = differenceInMinutes(currentTradeTime, previousTradeTime);
      
      // Only include gaps that are positive and less than 12 hours (720 minutes)
      if (gapMinutes >= 0 && gapMinutes <= 720) {
        tradesWithGaps.push({
          trade: currentTrade,
          gapMinutes,
          pnl: safeNumber(currentTrade.pnl),
          isWin: currentTrade.result === 'Win'
        });
        totalGapMinutes += gapMinutes;
      }
    }

    if (tradesWithGaps.length === 0) {
      return {
        avgTimeBetweenTrades: 0,
        shortGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        mediumGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        longGapPerformance: { avgPnL: 0, winRate: 0, tradeCount: 0 },
        bestGapRange: '',
        worstGapRange: ''
      };
    }

    const avgTimeBetweenTrades = totalGapMinutes / tradesWithGaps.length;

    // Categorize by gap duration
    const shortGapTrades = tradesWithGaps.filter(t => t.gapMinutes < 30); // < 30 minutes
    const mediumGapTrades = tradesWithGaps.filter(t => t.gapMinutes >= 30 && t.gapMinutes < 240); // 30min - 4hrs
    const longGapTrades = tradesWithGaps.filter(t => t.gapMinutes >= 240); // > 4hrs

    const calculateGapPerformance = (gapTrades: typeof tradesWithGaps) => {
      if (gapTrades.length === 0) return { avgPnL: 0, winRate: 0, tradeCount: 0 };
      
      const avgPnL = gapTrades.reduce((sum, t) => sum + t.pnl, 0) / gapTrades.length;
      const winRate = (gapTrades.filter(t => t.isWin).length / gapTrades.length) * 100;
      
      return {
        avgPnL: safeNumber(avgPnL),
        winRate: safeNumber(winRate),
        tradeCount: gapTrades.length
      };
    };

    const shortGapPerformance = calculateGapPerformance(shortGapTrades);
    const mediumGapPerformance = calculateGapPerformance(mediumGapTrades);
    const longGapPerformance = calculateGapPerformance(longGapTrades);

    // Determine best and worst gap ranges
    const gapRanges = [
      { name: 'Short Gap (<30min)', performance: shortGapPerformance },
      { name: 'Medium Gap (30min-4hrs)', performance: mediumGapPerformance },
      { name: 'Long Gap (>4hrs)', performance: longGapPerformance }
    ].filter(range => range.performance.tradeCount > 0);

    const bestGapRange = gapRanges.length > 0 
      ? gapRanges.reduce((best, current) => 
          current.performance.avgPnL > best.performance.avgPnL ? current : best
        ).name
      : '';

    const worstGapRange = gapRanges.length > 0 
      ? gapRanges.reduce((worst, current) => 
          current.performance.avgPnL < worst.performance.avgPnL ? current : worst
        ).name
      : '';

    return {
      avgTimeBetweenTrades: safeNumber(avgTimeBetweenTrades),
      shortGapPerformance,
      mediumGapPerformance,
      longGapPerformance,
      bestGapRange,
      worstGapRange
    };
  })();

  // 2. Daily Performance Decay
  const dailyPerformanceDecay = (() => {
    // Group trades by day
    const tradesByDay = trades.reduce((acc, trade) => {
      const tradeDate = trade.isMultiDay && trade.exitDate ? trade.exitDate : trade.date;
      const dayKey = tradeDate.split('T')[0]; // Get YYYY-MM-DD
      
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(trade);
      return acc;
    }, {} as Record<string, Trade[]>);

    // Sort trades within each day by entry time
    Object.keys(tradesByDay).forEach(day => {
      tradesByDay[day].sort((a, b) => {
        const timeA = parseISO(`${a.date}T${a.entryTime}`);
        const timeB = parseISO(`${b.date}T${b.entryTime}`);
        return timeA.getTime() - timeB.getTime();
      });
    });

    // Calculate performance by trade position within day
    const positionStats: Record<number, { pnls: number[]; wins: number; total: number }> = {};
    let maxTradesPerDay = 0;

    Object.values(tradesByDay).forEach(dayTrades => {
      maxTradesPerDay = Math.max(maxTradesPerDay, dayTrades.length);
      
      dayTrades.forEach((trade, index) => {
        const position = index + 1; // 1st, 2nd, 3rd trade of day
        
        if (!positionStats[position]) {
          positionStats[position] = { pnls: [], wins: 0, total: 0 };
        }
        
        positionStats[position].pnls.push(safeNumber(trade.pnl));
        positionStats[position].total++;
        if (trade.result === 'Win') {
          positionStats[position].wins++;
        }
      });
    });

    // Convert to array format
    const tradesByPosition = Object.entries(positionStats).map(([position, stats]) => ({
      position: parseInt(position),
      avgPnL: safeNumber(stats.pnls.reduce((sum, pnl) => sum + pnl, 0) / stats.pnls.length),
      winRate: safeNumber((stats.wins / stats.total) * 100),
      tradeCount: stats.total
    })).sort((a, b) => a.position - b.position);

    // Find best and worst positions
    const bestTradePosition = tradesByPosition.length > 0 
      ? tradesByPosition.reduce((best, current) => 
          current.avgPnL > best.avgPnL ? current : best
        ).position
      : 0;

    const worstTradePosition = tradesByPosition.length > 0 
      ? tradesByPosition.reduce((worst, current) => 
          current.avgPnL < worst.avgPnL ? current : worst
        ).position
      : 0;

    // Calculate optimal daily limit based on performance decay
    let optimalDailyLimit = maxTradesPerDay;
    
    // Find the position where performance starts to decline significantly
    for (let i = 1; i < tradesByPosition.length; i++) {
      const current = tradesByPosition[i];
      const previous = tradesByPosition[i - 1];
      
      // If current position has significantly worse performance (>20% decline in avg PnL)
      if (current.avgPnL < previous.avgPnL * 0.8 && current.tradeCount >= 5) {
        optimalDailyLimit = i; // Suggest stopping before this position
        break;
      }
    }

    return {
      tradesByPosition,
      bestTradePosition,
      worstTradePosition,
      maxTradesPerDay,
      optimalDailyLimit
    };
  })();

  // Emotion analysis
  const highEmotionTrades = trades.filter(t => t.emotionRating >= 8);
  const lowEmotionTrades = trades.filter(t => t.emotionRating <= 3);

  const avgPnLHighEmotion = highEmotionTrades.length > 0 
    ? highEmotionTrades.reduce((sum, t) => sum + safeNumber(t.pnl), 0) / highEmotionTrades.length 
    : 0;
  const avgPnLLowEmotion = lowEmotionTrades.length > 0 
    ? lowEmotionTrades.reduce((sum, t) => sum + safeNumber(t.pnl), 0) / lowEmotionTrades.length 
    : 0;

  const tradesHighEmotion = {
    count: highEmotionTrades.length,
    percentage: (highEmotionTrades.length / trades.length) * 100
  };
  const tradesLowEmotion = {
    count: lowEmotionTrades.length,
    percentage: (lowEmotionTrades.length / trades.length) * 100
  };

  // Equity & Drawdown Dynamics
  const equityAtStart = settings.startingCapital;
  const equityAtEnd = settings.startingCapital + totalNetPnL;

  // Calculate time to recover from max drawdown
  let timeToRecoverMaxDrawdown = 0;
  let maxDrawdownTradeIndex = -1;
  let recoveryTradeIndex = -1;
  
  currentEquity = settings.startingCapital;
  peak = settings.startingCapital;
  let maxDrawdownSoFar = 0;

  trades.forEach((trade, index) => {
    currentEquity += safeNumber(trade.pnl);
    if (currentEquity > peak) {
      peak = currentEquity;
      if (maxDrawdownTradeIndex !== -1 && recoveryTradeIndex === -1) {
        recoveryTradeIndex = index;
      }
    }
    
    const drawdownAmount = peak - currentEquity;
    if (drawdownAmount > maxDrawdownSoFar) {
      maxDrawdownSoFar = drawdownAmount;
      maxDrawdownTradeIndex = index;
      recoveryTradeIndex = -1;
    }
  });

  if (maxDrawdownTradeIndex !== -1 && recoveryTradeIndex !== -1) {
    const drawdownDate = parseISO(trades[maxDrawdownTradeIndex].isMultiDay && trades[maxDrawdownTradeIndex].exitDate 
      ? trades[maxDrawdownTradeIndex].exitDate! 
      : trades[maxDrawdownTradeIndex].date);
    const recoveryDate = parseISO(trades[recoveryTradeIndex].isMultiDay && trades[recoveryTradeIndex].exitDate 
      ? trades[recoveryTradeIndex].exitDate! 
      : trades[recoveryTradeIndex].date);
    timeToRecoverMaxDrawdown = differenceInDays(recoveryDate, drawdownDate);
  }

  return {
    totalNetPnL,
    grossProfit,
    grossLoss,
    winRate,
    lossRate,
    breakEvenRate,
    profitFactor,
    expectancy,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    roi,
    tradesAbove1R,
    tradesAbove2R,
    tradesAbove3R,
    tradesBelow1R,
    breakEvenPoint,
    maxDrawdownAmount,
    maxDrawdownPercentage,
    averageRiskPerTrade,
    averageRROverall,
    averageRRWins,
    averageRRLosses,
    tradesWithoutSL,
    tradesWithoutTP,
    averageSLDistancePips,
    averageTPDistancePips,
    bestDayOfWeek,
    worstDayOfWeek,
    mostProfitableMonth: { month: format(parseISO(mostProfitableMonth[0] + '-01'), 'MMM yyyy'), totalPnL: mostProfitableMonth[1] },
    leastProfitableMonth: { month: format(parseISO(leastProfitableMonth[0] + '-01'), 'MMM yyyy'), totalPnL: leastProfitableMonth[1] },
    mostProfitableYear: { year: mostProfitableYear[0], totalPnL: mostProfitableYear[1] },
    leastProfitableYear: { year: leastProfitableYear[0], totalPnL: leastProfitableYear[1] },
    averageHoldTimeOverall,
    averageHoldTimeWins,
    averageHoldTimeLosses,
    shortestHoldTime,
    longestHoldTime,
    mostProfitablePair: { pair: mostProfitablePair[0], totalPnL: mostProfitablePair[1] },
    leastProfitablePair: { pair: leastProfitablePair[0], totalPnL: leastProfitablePair[1] },
    highestWinRatePair,
    lowestWinRatePair,
    mostTradedPair: { pair: mostTradedPair[0], count: mostTradedPair[1] },
    leastTradedPair: { pair: leastTradedPair[0], count: leastTradedPair[1] },
    mostProfitableStrategy: { strategy: mostProfitableStrategy[0], totalPnL: mostProfitableStrategy[1] },
    mostUsedStrategy: { strategy: mostUsedStrategy[0], count: mostUsedStrategy[1] },
    highestWinRateStrategy,
    mostUsedSetupTag: { tag: mostUsedSetupTag[0], count: mostUsedSetupTag[1] },
    mostProfitableSetupTag: { tag: mostProfitableSetupTag[0], totalPnL: mostProfitableSetupTag[1] },
    highestWinRateSetupTag,
    aPlusSetupWinRate,
    aPlusSetupTotalPnL,
    maxWinningStreak,
    maxLosingStreak,
    totalWinningStreaks,
    totalLosingStreaks,
    avgPnLHighEmotion,
    avgPnLLowEmotion,
    tradesHighEmotion,
    tradesLowEmotion,
    equityAtStart,
    equityAtEnd,
    timeToRecoverMaxDrawdown,
    numberOfDrawdowns,
    timeSinceLastTradeCorrelation,
    dailyPerformanceDecay
  };
};