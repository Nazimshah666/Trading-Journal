export interface Trade {
  id: string;
  user_id?: string;
  journal_id?: string;
  date: string;
  exitDate?: string;
  entryTime: string;
  exitTime: string;
  direction: 'Buy' | 'Sell';
  pair: string;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice: number;
  lotSize: number;
  strategy: string;
  setupTags: string[];
  notes: string;
  screenshotLink: string;
  emotionRating: number;
  isAPlusSetup: boolean;
  isMultiDay?: boolean;
  pipSize: number; // Industry-standard pip size for this pair
  pipValuePerStandardLot: number; // Dollar value per pip per standard lot (e.g., $10 for EURUSD)
  
  // Auto-calculated fields
  duration: number; // in minutes
  risk: number;
  reward: number;
  rrRatio: number;
  result: 'Win' | 'Loss' | 'Break-even';
  pnl: number;
  changeInCapital: number;
  equity: number;
  created_at?: string;
  updated_at?: string;
}

export interface PendingTrade {
  id: string;
  user_id?: string;
  journal_id?: string;
  date: string;
  entryTime: string;
  direction: 'Buy' | 'Sell';
  pair: string;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize: number;
  strategy: string;
  setupTags: string[];
  notes: string;
  screenshotLink: string;
  emotionRating: number;
  isAPlusSetup: boolean;
  pipSize: number; // Industry-standard pip size for this pair
  pipValuePerStandardLot: number; // Dollar value per pip per standard lot
  
  // Original SL/TP for tracking changes
  originalStopLoss?: number;
  originalTakeProfit?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PairSettings {
  customPipSize?: number; // Custom pip size override for this pair
  customPipValuePerStandardLot?: number; // Custom pip value per standard lot override for this pair
}

export interface AppSettings {
  startingCapital: number;
  currency: string;
  enableAPlusTracking: boolean;
  enablePsychologyTracking: boolean;
  enableScreenshotUpload: boolean;
  timezone: string;
  dataExportFormat: 'CSV' | 'Excel';
  pairSettings?: Record<string, PairSettings>; // Per-pair settings
  customStrategies: string[]; // User-defined custom strategies
  customSetupTags: string[]; // User-defined custom setup tags
}

export interface Journal {
  id: string;
  user_id?: string;
  name: string;
  type: 'Forex' | 'Crypto' | 'Stocks' | 'Indices' | 'Commodities' | 'Mixed';
  createdAt: string;
  trades: Trade[];
  pendingTrades: PendingTrade[];
  settings: AppSettings;
  created_at?: string;
  updated_at?: string;
}

export interface Summary {
  totalTrades: number;
  totalPnL: number;
  avgRR: number;
  winRate: number;
  mostProfitablePair: string;
  bestDay: string;
  worstDay: string;
  maxDrawdown: number;
  profitFactor: number;
  aPlusSetups: number;
  totalRiskUsed: number;
}

export interface SmartInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  icon: string;
}

export interface Streak {
  type: 'winning' | 'losing';
  count: number;
  isActive: boolean;
}

export interface AIFeedback {
  tradeId: string;
  feedback: string;
  score: number;
}

export interface StreakAnalytics {
  maxWinStreak: number;
  maxLossStreak: number;
  totalWinStreaks: number;
  totalLossStreaks: number;
  avgWinProfit: number;
  avgLossAmount: number;
}

export interface HoldTimeStats {
  average: number;
  minimum: number;
  maximum: number;
  total: number;
  minPairs: string[];
  maxPairs: string[];
}

export interface PeriodData {
  periodKey: string;
  periodLabel: string;
  netPnL: number;
  winRate: number;
  avgRR: number;
  expectancy: number;
  maxDrawdown: number;
  equitySparklineData: Array<{ index: number; equity: number }>;
  smartInsight: string;
  isBestPeriod: boolean;
  tradeCount: number;
  startingEquity: number;
  endingEquity: number;
  avgProfit: number;
  avgLoss: number;
  maxProfit: number;
  maxLoss: number;
  bestDay?: string;
  underperformingDay?: string;
}