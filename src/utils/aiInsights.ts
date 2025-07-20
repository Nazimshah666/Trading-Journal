import { Trade, SmartInsight, Streak, AIFeedback, HoldTimeStats } from '../types';
import { format, parseISO, isToday, isThisWeek, isThisMonth, isThisYear, startOfDay, differenceInDays } from 'date-fns';
import { hasValidRR } from './calculations';

export const generateSmartInsights = (trades: Trade[], timeframe: 'day' | 'week' | 'month' | 'year' | 'all' = 'week'): SmartInsight[] => {
  if (trades.length === 0) return [];

  const insights: SmartInsight[] = [];
  const now = new Date();
  
  // Filter trades by timeframe
  const filteredTrades = trades.filter(trade => {
    if (timeframe === 'all') return true;
    
    const tradeDate = parseISO(trade.date);
    switch (timeframe) {
      case 'day': return isToday(tradeDate);
      case 'week': return isThisWeek(tradeDate);
      case 'month': return isThisMonth(tradeDate);
      case 'year': return isThisYear(tradeDate);
      default: return true;
    }
  });

  if (filteredTrades.length === 0) return [];

  // Overtrading detection
  const dailyTrades = filteredTrades.reduce((acc, trade) => {
    const day = format(parseISO(trade.date), 'yyyy-MM-dd');
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxTradesPerDay = Math.max(...Object.values(dailyTrades));
  if (maxTradesPerDay > 10) {
    insights.push({
      type: 'warning',
      title: 'Overtrading Alert',
      message: `You made ${maxTradesPerDay} trades in a single day. Consider reducing frequency for better quality.`,
      icon: '⚠️'
    });
  }

  // Win rate analysis
  const wins = filteredTrades.filter(t => t.result === 'Win').length;
  const winRate = (wins / filteredTrades.length) * 100;
  
  if (winRate >= 70) {
    insights.push({
      type: 'success',
      title: 'Excellent Win Rate',
      message: `Your ${winRate.toFixed(1)}% win rate is outstanding! Keep following your strategy.`,
      icon: '🎯'
    });
  } else if (winRate < 40) {
    insights.push({
      type: 'error',
      title: 'Low Win Rate',
      message: `Your ${winRate.toFixed(1)}% win rate needs improvement. Review your entry criteria.`,
      icon: '📉'
    });
  }

  // R:R improvement tracking - only for trades with valid R:R
  const tradesWithValidRR = filteredTrades.filter(hasValidRR);
  const recentTrades = tradesWithValidRR.slice(-10);
  const olderTrades = tradesWithValidRR.slice(-20, -10);
  
  if (recentTrades.length >= 5 && olderTrades.length >= 5) {
    const recentAvgRR = recentTrades.reduce((sum, t) => sum + t.rrRatio, 0) / recentTrades.length;
    const olderAvgRR = olderTrades.reduce((sum, t) => sum + t.rrRatio, 0) / olderTrades.length;
    
    if (recentAvgRR > olderAvgRR * 1.1) {
      insights.push({
        type: 'success',
        title: 'R:R Improving',
        message: `Your recent R:R ratio (${recentAvgRR.toFixed(2)}) is improving! Great progress.`,
        icon: '📈'
      });
    }
  }

  // Missing R:R data insight - UPDATED: Only mentions Stop Loss
  const tradesWithoutRR = filteredTrades.filter(t => !hasValidRR(t));
  if (tradesWithoutRR.length > filteredTrades.length * 0.3) {
    insights.push({
      type: 'info',
      title: 'Missing R:R Data',
      message: `Add a Stop Loss to unlock accurate R:R tracking for your trades. ${tradesWithoutRR.length} trades missing SL data.`,
      icon: '📊'
    });
  }

  // A+ setup performance
  const aPlusSetups = filteredTrades.filter(t => t.isAPlusSetup);
  if (aPlusSetups.length > 0) {
    const aPlusWinRate = (aPlusSetups.filter(t => t.result === 'Win').length / aPlusSetups.length) * 100;
    if (aPlusWinRate >= 80) {
      insights.push({
        type: 'success',
        title: 'A+ Setups Performing',
        message: `Your A+ setups have ${aPlusWinRate.toFixed(1)}% win rate. Focus on these patterns!`,
        icon: '⭐'
      });
    }
  }

  // Emotional discipline
  const highEmotionTrades = filteredTrades.filter(t => t.emotionRating >= 8);
  const lowEmotionTrades = filteredTrades.filter(t => t.emotionRating <= 3);
  
  if (highEmotionTrades.length > lowEmotionTrades.length) {
    insights.push({
      type: 'info',
      title: 'Good Emotional Control',
      message: 'You\'re maintaining good emotional discipline in your trades.',
      icon: '🧠'
    });
  } else if (lowEmotionTrades.length > filteredTrades.length * 0.3) {
    insights.push({
      type: 'warning',
      title: 'Emotional Stress Detected',
      message: 'Consider taking a break when emotional ratings are consistently low.',
      icon: '😰'
    });
  }

  return insights;
};

export const detectStreaks = (trades: Trade[]): Streak | null => {
  if (trades.length < 3) return null;

  const recentTrades = trades.slice(-10); // Look at last 10 trades
  let currentStreak = 1;
  let streakType: 'winning' | 'losing' = recentTrades[recentTrades.length - 1].result === 'Win' ? 'winning' : 'losing';

  // Count consecutive wins/losses from the end
  for (let i = recentTrades.length - 2; i >= 0; i--) {
    const currentResult = recentTrades[i].result;
    const expectedResult = streakType === 'winning' ? 'Win' : 'Loss';
    
    if (currentResult === expectedResult) {
      currentStreak++;
    } else {
      break;
    }
  }

  if (currentStreak >= 3) {
    return {
      type: streakType,
      count: currentStreak,
      isActive: true
    };
  }

  return null;
};

export const getStreakAnalytics = (trades: Trade[], timeframe: 'day' | 'week' | 'month' | 'year' | 'all') => {
  if (trades.length === 0) return null;

  // Filter trades by timeframe
  const filteredTrades = trades.filter(trade => {
    if (timeframe === 'all') return true;
    
    const tradeDate = parseISO(trade.date);
    switch (timeframe) {
      case 'day': return isToday(tradeDate);
      case 'week': return isThisWeek(tradeDate);
      case 'month': return isThisMonth(tradeDate);
      case 'year': return isThisYear(tradeDate);
      default: return true;
    }
  });

  if (filteredTrades.length === 0) return null;

  // Analyze streaks
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let totalWinStreaks = 0;
  let totalLossStreaks = 0;
  
  const winningTrades = filteredTrades.filter(t => t.result === 'Win');
  const losingTrades = filteredTrades.filter(t => t.result === 'Loss');
  
  // Calculate average profits/losses
  const avgWinProfit = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
    : 0;
  
  const avgLossAmount = losingTrades.length > 0 
    ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length 
    : 0;

  // Find streaks
  filteredTrades.forEach((trade, index) => {
    if (trade.result === 'Win') {
      currentWinStreak++;
      if (currentLossStreak > 0) {
        if (currentLossStreak >= 2) totalLossStreaks++;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        currentLossStreak = 0;
      }
    } else if (trade.result === 'Loss') {
      currentLossStreak++;
      if (currentWinStreak > 0) {
        if (currentWinStreak >= 2) totalWinStreaks++;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        currentWinStreak = 0;
      }
    } else {
      // Break-even resets both streaks
      if (currentWinStreak >= 2) totalWinStreaks++;
      if (currentLossStreak >= 2) totalLossStreaks++;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });

  // Handle final streaks
  if (currentWinStreak >= 2) totalWinStreaks++;
  if (currentLossStreak >= 2) totalLossStreaks++;
  maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
  maxLossStreak = Math.max(maxLossStreak, currentLossStreak);

  return {
    maxWinStreak,
    maxLossStreak,
    totalWinStreaks,
    totalLossStreaks,
    avgWinProfit: Math.round(avgWinProfit * 100) / 100,
    avgLossAmount: Math.round(avgLossAmount * 100) / 100
  };
};

export const generateAIFeedback = (trade: Trade): AIFeedback => {
  const feedback: string[] = [];
  let score = 5; // Base score out of 10

  // R:R Analysis - UPDATED: Only if valid R:R exists (Stop Loss set)
  if (hasValidRR(trade)) {
    if (trade.rrRatio >= 2) {
      feedback.push("Excellent R:R ratio achieved");
      score += 2;
    } else if (trade.rrRatio >= 1.5) {
      feedback.push("Good R:R ratio achieved");
      score += 1;
    } else if (trade.rrRatio < 1) {
      feedback.push("R:R ratio below 1:1 - consider tighter stops or better exits");
      score -= 2;
    }

    // Result vs R:R
    if (trade.result === 'Win' && trade.rrRatio >= 2) {
      feedback.push("Perfect execution with great risk management");
      score += 1;
    } else if (trade.result === 'Loss' && trade.rrRatio >= 1.5) {
      feedback.push("Good setup despite the loss - stick to your plan");
    } else if (trade.result === 'Loss' && trade.rrRatio < 1) {
      feedback.push("Poor risk management led to unnecessary loss");
      score -= 1;
    }
  } else {
    // UPDATED: Only mentions Stop Loss for R:R tracking
    feedback.push("Consider adding a Stop Loss for better risk management and R:R tracking");
  }

  // A+ Setup analysis
  if (trade.isAPlusSetup && trade.result === 'Win') {
    feedback.push("A+ setup delivered as expected");
    score += 1;
  } else if (trade.isAPlusSetup && trade.result === 'Loss') {
    feedback.push("Even A+ setups can fail - review market conditions");
  }

  // Emotional state
  if (trade.emotionRating >= 8) {
    feedback.push("Great emotional control during trade");
    score += 1;
  } else if (trade.emotionRating <= 3) {
    feedback.push("Low emotional state may have affected performance");
    score -= 1;
  }

  const finalFeedback = feedback.length > 0 ? feedback.join('. ') + '.' : 'Standard trade execution.';

  return {
    tradeId: trade.id,
    feedback: finalFeedback,
    score: Math.max(1, Math.min(10, score))
  };
};

export const getBestWorstTrades = (trades: Trade[], timeframe: 'day' | 'week' | 'month' | 'year' | 'all' = 'week') => {
  const now = new Date();
  
  const filteredTrades = trades.filter(trade => {
    if (timeframe === 'all') return true;
    
    const tradeDate = parseISO(trade.date);
    switch (timeframe) {
      case 'day': return isToday(tradeDate);
      case 'week': return isThisWeek(tradeDate);
      case 'month': return isThisMonth(tradeDate);
      case 'year': return isThisYear(tradeDate);
      default: return true;
    }
  });

  if (filteredTrades.length === 0) return { best: null, worst: null };

  // Best trade: highest P&L among winning trades
  const winningTrades = filteredTrades.filter(t => t.result === 'Win');
  const bestTrade = winningTrades.length > 0 
    ? winningTrades.reduce((best, current) => current.pnl > best.pnl ? current : best)
    : null;

  // Worst trade: lowest P&L among losing trades (only if there are actual losses)
  const losingTrades = filteredTrades.filter(t => t.result === 'Loss');
  const worstTrade = losingTrades.length > 0 
    ? losingTrades.reduce((worst, current) => current.pnl < worst.pnl ? current : worst)
    : null;

  return { best: bestTrade, worst: worstTrade };
};

export const getTopTradedPairs = (trades: Trade[], timeframe: 'day' | 'week' | 'month' | 'year' | 'all' = 'all') => {
  const filteredTrades = trades.filter(trade => {
    if (timeframe === 'all') return true;
    
    const tradeDate = parseISO(trade.date);
    switch (timeframe) {
      case 'day': return isToday(tradeDate);
      case 'week': return isThisWeek(tradeDate);
      case 'month': return isThisMonth(tradeDate);
      case 'year': return isThisYear(tradeDate);
      default: return true;
    }
  });

  if (filteredTrades.length === 0) return { most: null, least: null };

  // Count trades per pair
  const pairCounts = filteredTrades.reduce((acc, trade) => {
    acc[trade.pair] = (acc[trade.pair] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pairs = Object.entries(pairCounts);
  if (pairs.length === 0) return { most: null, least: null };

  // Most traded pair
  const mostTraded = pairs.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );

  // Least traded pair
  const leastTraded = pairs.reduce((min, current) => 
    current[1] < min[1] ? current : min
  );

  return {
    most: {
      pair: mostTraded[0],
      count: mostTraded[1],
      percentage: (mostTraded[1] / filteredTrades.length) * 100
    },
    least: {
      pair: leastTraded[0],
      count: leastTraded[1],
      percentage: (leastTraded[1] / filteredTrades.length) * 100
    }
  };
};

export const getHoldTimeStats = (trades: Trade[], timeframe: 'day' | 'week' | 'month' | 'year' | 'all' = 'all'): HoldTimeStats | null => {
  const filteredTrades = trades.filter(trade => {
    if (timeframe === 'all') return true;
    
    const tradeDate = parseISO(trade.date);
    switch (timeframe) {
      case 'day': return isToday(tradeDate);
      case 'week': return isThisWeek(tradeDate);
      case 'month': return isThisMonth(tradeDate);
      case 'year': return isThisYear(tradeDate);
      default: return true;
    }
  });

  if (filteredTrades.length === 0) return null;

  const durations = filteredTrades.map(trade => trade.duration);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  // Find all trades with minimum duration
  const minTrades = filteredTrades.filter(trade => trade.duration === minDuration);
  const minPairs = [...new Set(minTrades.map(trade => trade.pair))];
  
  // Find all trades with maximum duration
  const maxTrades = filteredTrades.filter(trade => trade.duration === maxDuration);
  const maxPairs = [...new Set(maxTrades.map(trade => trade.pair))];
  
  return {
    average: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length),
    minimum: minDuration,
    maximum: maxDuration,
    total: durations.length,
    minPairs,
    maxPairs
  };
};