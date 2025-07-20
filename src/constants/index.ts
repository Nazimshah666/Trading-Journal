export const TRADING_PAIRS = {
  forex: {
    major: [
      'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'
    ],
    minor: [
      'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
      'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD',
      'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD',
      'NZDJPY', 'NZDCHF', 'NZDCAD',
      'CADJPY', 'CADCHF', 'CHFJPY'
    ],
    exotic: [
      'USDTRY', 'USDZAR', 'USDMXN', 'USDBRL', 'USDRUB',
      'EURPLN', 'EURHUF', 'EURCZK', 'EURTRY',
      'GBPTRY', 'GBPZAR', 'GBPPLN'
    ]
  },
  crypto: {
    major: [
      'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'SOLUSD', 'DOTUSD', 'AVAXUSD', 'MATICUSD', 'LINKUSD'
    ],
    altcoins: [
      'LTCUSD', 'BCHUSD', 'XLMUSD', 'VETUSD', 'FILUSD', 'TRXUSD', 'ETCUSD', 'ALGOUSD', 'ATOMUSD', 'XTZUSD',
      'COMPUSD', 'YFIUSD', 'UNIUSD', 'AAVEUSD', 'MKRUSD', 'SNXUSD', 'CRVUSD', 'SUSHIUSD', 'BALUSD', 'RENUSD'
    ],
    defi: [
      'UNIUSD', 'AAVEUSD', 'COMPUSD', 'MKRUSD', 'YFIUSD', 'SNXUSD', 'CRVUSD', 'SUSHIUSD', 'BALUSD', 'PANCAKEUSD'
    ]
  },
  stocks: {
    tech: [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM',
      'ORCL', 'INTC', 'AMD', 'PYPL', 'UBER', 'ZOOM', 'SHOP', 'SQ', 'TWTR', 'SNAP'
    ],
    sp500: [
      'SPY', 'VOO', 'IVV', 'VTI', 'QQQ', 'DIA', 'IWM', 'VEA', 'VWO', 'AGG',
      'BND', 'VNQ', 'GLD', 'SLV', 'USO', 'TLT', 'HYG', 'LQD', 'EFA', 'EEM'
    ],
    banking: [
      'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'USB', 'PNC', 'TFC', 'COF'
    ],
    healthcare: [
      'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'AMGN'
    ]
  },
  indices: {
    us: [
      'US30', 'NAS100', 'SPX500', 'US2000', 'VIX'
    ],
    international: [
      'GER40', 'UK100', 'FRA40', 'ESP35', 'ITA40', 'AUS200', 'JPN225', 'HK50', 'CHINA50'
    ]
  },
  commodities: {
    metals: [
      'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'COPPER'
    ],
    energy: [
      'USOIL', 'UKOIL', 'NGAS', 'GASOIL'
    ],
    agriculture: [
      'WHEAT', 'CORN', 'SOYBEAN', 'SUGAR', 'COFFEE', 'COCOA', 'COTTON'
    ]
  }
};

export const STRATEGIES = [
  { name: 'Breakout', icon: '🚀' },
  { name: 'Trend Following', icon: '📈' },
  { name: 'Support & Resistance', icon: '⚖️' },
  { name: 'Scalping', icon: '⚡' },
  { name: 'Swing Trading', icon: '🌊' },
  { name: 'News Trading', icon: '📰' },
  { name: 'ICT Concepts', icon: '🎯' },
  { name: 'Supply & Demand', icon: '📊' },
  { name: 'Fibonacci', icon: '🌀' },
  { name: 'Moving Averages', icon: '📉' },
  { name: 'Divergence', icon: '🔄' },
  { name: 'Pattern Trading', icon: '🔺' },
  { name: 'Mean Reversion', icon: '↩️' },
  { name: 'Momentum', icon: '💨' },
  { name: 'Grid Trading', icon: '⚡' },
  { name: 'Martingale', icon: '🎲' },
  { name: 'Price Action', icon: '📊' },
  { name: 'Elliott Wave', icon: '🌊' },
  { name: 'Harmonic Patterns', icon: '🎵' },
  { name: 'Volume Analysis', icon: '📊' }
];

export const SETUP_TAGS = [
  { name: 'High Probability', icon: '🎯' },
  { name: 'Perfect Entry', icon: '✨' },
  { name: 'News Event', icon: '📰' },
  { name: 'Confluence', icon: '🔗' },
  { name: 'Clean Structure', icon: '🏗️' },
  { name: 'Strong Momentum', icon: '💪' },
  { name: 'Low Risk', icon: '🛡️' },
  { name: 'Multiple Timeframes', icon: '⏰' },
  { name: 'Market Open', icon: '🔔' },
  { name: 'Session Close', icon: '🔚' },
  { name: 'Breakout Retest', icon: '🔄' },
  { name: 'Reversal', icon: '↩️' },
  { name: 'Trend Continuation', icon: '➡️' },
  { name: 'Support Bounce', icon: '⬆️' },
  { name: 'Resistance Rejection', icon: '⬇️' },
  { name: 'Liquidity Grab', icon: '💧' }
];

export const CATEGORY_ICONS = {
  forex: '💱',
  crypto: '₿',
  stocks: '📈',
  indices: '📊',
  commodities: '🥇'
};

export const SUBCATEGORY_LABELS = {
  forex: {
    major: 'Major Pairs',
    minor: 'Minor Pairs', 
    exotic: 'Exotic Pairs'
  },
  crypto: {
    major: 'Top 10',
    altcoins: 'Altcoins',
    defi: 'DeFi Tokens'
  },
  stocks: {
    tech: 'Technology',
    sp500: 'S&P 500 ETFs',
    banking: 'Banking',
    healthcare: 'Healthcare'
  },
  indices: {
    us: 'US Indices',
    international: 'International'
  },
  commodities: {
    metals: 'Precious Metals',
    energy: 'Energy',
    agriculture: 'Agriculture'
  }
};

/**
 * Industry-standard pip sizes for trading instruments
 * These values are based on standard market conventions
 */
export const PIP_SIZES: Record<string, number> = {
  // Forex Major Pairs (4-decimal precision)
  'EURUSD': 0.0001,
  'GBPUSD': 0.0001,
  'USDCHF': 0.0001,
  'AUDUSD': 0.0001,
  'USDCAD': 0.0001,
  'NZDUSD': 0.0001,
  
  // JPY Pairs (2-decimal precision)
  'USDJPY': 0.01,
  'EURJPY': 0.01,
  'GBPJPY': 0.01,
  'AUDJPY': 0.01,
  'NZDJPY': 0.01,
  'CADJPY': 0.01,
  'CHFJPY': 0.01,
  
  // Forex Minor Pairs (4-decimal precision)
  'EURGBP': 0.0001,
  'EURCHF': 0.0001,
  'EURAUD': 0.0001,
  'EURCAD': 0.0001,
  'EURNZD': 0.0001,
  'GBPCHF': 0.0001,
  'GBPAUD': 0.0001,
  'GBPCAD': 0.0001,
  'GBPNZD': 0.0001,
  'AUDCHF': 0.0001,
  'AUDCAD': 0.0001,
  'AUDNZD': 0.0001,
  'NZDCHF': 0.0001,
  'NZDCAD': 0.0001,
  'CADCHF': 0.0001,
  
  // Forex Exotic Pairs (4-decimal precision, some exceptions)
  'USDTRY': 0.0001,
  'USDZAR': 0.0001,
  'USDMXN': 0.0001,
  'USDBRL': 0.0001,
  'USDRUB': 0.0001,
  'EURPLN': 0.0001,
  'EURHUF': 0.01,
  'EURCZK': 0.0001,
  'EURTRY': 0.0001,
  'GBPTRY': 0.0001,
  'GBPZAR': 0.0001,
  'GBPPLN': 0.0001,
  
  // Precious Metals
  'XAUUSD': 0.1,    // Gold
  'XAGUSD': 0.001,  // Silver
  'XPTUSD': 0.1,    // Platinum
  'XPDUSD': 0.1,    // Palladium
  'COPPER': 0.0001,
  
  // Energy
  'USOIL': 0.01,    // Crude Oil
  'UKOIL': 0.01,    // Brent Oil
  'NGAS': 0.001,    // Natural Gas
  'GASOIL': 0.25,
  
  // Agriculture
  'WHEAT': 0.25,
  'CORN': 0.25,
  'SOYBEAN': 0.25,
  'SUGAR': 0.01,
  'COFFEE': 0.05,
  'COCOA': 1,
  'COTTON': 0.01,
  
  // Cryptocurrency (1 pip = 1 USD for most)
  'BTCUSD': 1,
  'ETHUSD': 0.01,
  'BNBUSD': 0.001,
  'XRPUSD': 0.0001,
  'ADAUSD': 0.0001,
  'SOLUSD': 0.001,
  'DOTUSD': 0.001,
  'AVAXUSD': 0.001,
  'MATICUSD': 0.0001,
  'LINKUSD': 0.001,
  'LTCUSD': 0.01,
  'BCHUSD': 0.01,
  'XLMUSD': 0.00001,
  'VETUSD': 0.00001,
  'FILUSD': 0.001,
  'TRXUSD': 0.00001,
  'ETCUSD': 0.001,
  'ALGOUSD': 0.0001,
  'ATOMUSD': 0.001,
  'XTZUSD': 0.0001,
  'COMPUSD': 0.01,
  'YFIUSD': 1,
  'UNIUSD': 0.001,
  'AAVEUSD': 0.001,
  'MKRUSD': 0.01,
  'SNXUSD': 0.001,
  'CRVUSD': 0.0001,
  'SUSHIUSD': 0.0001,
  'BALUSD': 0.001,
  'RENUSD': 0.0001,
  'PANCAKEUSD': 0.001,
  
  // US Indices
  'US30': 1,        // Dow Jones
  'NAS100': 0.25,   // Nasdaq 100
  'SPX500': 0.1,    // S&P 500
  'US2000': 0.1,    // Russell 2000
  'VIX': 0.01,
  
  // International Indices
  'GER40': 0.5,     // DAX
  'UK100': 0.5,     // FTSE 100
  'FRA40': 0.5,     // CAC 40
  'ESP35': 0.5,     // IBEX 35
  'ITA40': 1,       // FTSE MIB
  'AUS200': 0.5,    // ASX 200
  'JPN225': 1,      // Nikkei 225
  'HK50': 0.5,      // Hang Seng
  'CHINA50': 0.5,   // China A50
  
  // Individual Stocks (typically 0.01 for most)
  'AAPL': 0.01,
  'MSFT': 0.01,
  'GOOGL': 0.01,
  'AMZN': 0.01,
  'TSLA': 0.01,
  'META': 0.01,
  'NVDA': 0.01,
  'NFLX': 0.01,
  'ADBE': 0.01,
  'CRM': 0.01,
  'ORCL': 0.01,
  'INTC': 0.01,
  'AMD': 0.01,
  'PYPL': 0.01,
  'UBER': 0.01,
  'ZOOM': 0.01,
  'SHOP': 0.01,
  'SQ': 0.01,
  'TWTR': 0.01,
  'SNAP': 0.01,
  
  // ETFs
  'SPY': 0.01,
  'VOO': 0.01,
  'IVV': 0.01,
  'VTI': 0.01,
  'QQQ': 0.01,
  'DIA': 0.01,
  'IWM': 0.01,
  'VEA': 0.01,
  'VWO': 0.01,
  'AGG': 0.01,
  'BND': 0.01,
  'VNQ': 0.01,
  'GLD': 0.01,
  'SLV': 0.01,
  'USO': 0.01,
  'TLT': 0.01,
  'HYG': 0.01,
  'LQD': 0.01,
  'EFA': 0.01,
  'EEM': 0.01,
  
  // Banking Stocks
  'JPM': 0.01,
  'BAC': 0.01,
  'WFC': 0.01,
  'C': 0.01,
  'GS': 0.01,
  'MS': 0.01,
  'USB': 0.01,
  'PNC': 0.01,
  'TFC': 0.01,
  'COF': 0.01,
  
  // Healthcare Stocks
  'JNJ': 0.01,
  'PFE': 0.01,
  'UNH': 0.01,
  'ABBV': 0.01,
  'MRK': 0.01,
  'TMO': 0.01,
  'ABT': 0.01,
  'DHR': 0.01,
  'BMY': 0.01,
  'AMGN': 0.01
};

/**
 * Industry-standard pip values per standard lot for trading instruments
 * These values represent the dollar value of one pip for one standard lot
 */
export const PIP_VALUE_PER_STANDARD_LOT_MAP: Record<string, number> = {
  // Forex Major Pairs - Standard $10 per pip per lot
  'EURUSD': 10,
  'GBPUSD': 10,
  'AUDUSD': 10,
  'NZDUSD': 10,
  'USDCAD': 10,
  'USDCHF': 10,
  
  // JPY Pairs - Standard $9.3 per pip per lot (adjusted for JPY strength)
  'USDJPY': 9.3,
  'EURJPY': 9.3,
  'GBPJPY': 9.3,
  'AUDJPY': 9.3,
  'NZDJPY': 9.3,
  'CADJPY': 9.3,
  'CHFJPY': 9.3,
  
  // Forex Minor Pairs - Standard $10 per pip per lot
  'EURGBP': 10,
  'EURCHF': 10,
  'EURAUD': 10,
  'EURCAD': 10,
  'EURNZD': 10,
  'GBPCHF': 10,
  'GBPAUD': 10,
  'GBPCAD': 10,
  'GBPNZD': 10,
  'AUDCHF': 10,
  'AUDCAD': 10,
  'AUDNZD': 10,
  'NZDCHF': 10,
  'NZDCAD': 10,
  'CADCHF': 10,
  
  // Forex Exotic Pairs - Standard $10 per pip per lot
  'USDTRY': 10,
  'USDZAR': 10,
  'USDMXN': 10,
  'USDBRL': 10,
  'USDRUB': 10,
  'EURPLN': 10,
  'EURHUF': 10,
  'EURCZK': 10,
  'EURTRY': 10,
  'GBPTRY': 10,
  'GBPZAR': 10,
  'GBPPLN': 10,
  
  // Precious Metals - Real-world values
  'XAUUSD': 1,     // Gold - $1 per 0.1 pip
  'XAGUSD': 5,     // Silver - $5 per 0.001 pip
  'XPTUSD': 1,     // Platinum
  'XPDUSD': 1,     // Palladium
  'COPPER': 2.5,   // Copper
  
  // Energy - Real-world values
  'USOIL': 10,     // Crude Oil - $10 per 0.01 pip
  'UKOIL': 10,     // Brent Oil
  'NGAS': 10,      // Natural Gas
  'GASOIL': 10,
  
  // Agriculture - Real-world values
  'WHEAT': 50,     // $50 per 0.25 pip
  'CORN': 50,
  'SOYBEAN': 50,
  'SUGAR': 112,    // $112 per 0.01 pip
  'COFFEE': 37.5,  // $37.5 per 0.05 pip
  'COCOA': 10,     // $10 per 1 pip
  'COTTON': 50,    // $50 per 0.01 pip
  
  // Cryptocurrency - $1 per pip for most
  'BTCUSD': 1,     // $1 per $1 movement
  'ETHUSD': 1,     // $1 per $0.01 movement
  'BNBUSD': 1,
  'XRPUSD': 1,
  'ADAUSD': 1,
  'SOLUSD': 1,
  'DOTUSD': 1,
  'AVAXUSD': 1,
  'MATICUSD': 1,
  'LINKUSD': 1,
  'LTCUSD': 1,
  'BCHUSD': 1,
  'XLMUSD': 1,
  'VETUSD': 1,
  'FILUSD': 1,
  'TRXUSD': 1,
  'ETCUSD': 1,
  'ALGOUSD': 1,
  'ATOMUSD': 1,
  'XTZUSD': 1,
  'COMPUSD': 1,
  'YFIUSD': 1,
  'UNIUSD': 1,
  'AAVEUSD': 1,
  'MKRUSD': 1,
  'SNXUSD': 1,
  'CRVUSD': 1,
  'SUSHIUSD': 1,
  'BALUSD': 1,
  'RENUSD': 1,
  'PANCAKEUSD': 1,
  
  // US Indices - $1 per pip
  'US30': 1,       // Dow Jones - $1 per 1 point
  'NAS100': 1,     // Nasdaq 100 - $1 per 0.25 point
  'SPX500': 1,     // S&P 500 - $1 per 0.1 point
  'US2000': 1,     // Russell 2000
  'VIX': 1,
  
  // International Indices - $1 per pip
  'GER40': 1,      // DAX - €1 per 0.5 point
  'UK100': 1,      // FTSE 100 - £1 per 0.5 point
  'FRA40': 1,      // CAC 40
  'ESP35': 1,      // IBEX 35
  'ITA40': 1,      // FTSE MIB
  'AUS200': 1,     // ASX 200
  'JPN225': 1,     // Nikkei 225
  'HK50': 1,       // Hang Seng
  'CHINA50': 1,    // China A50
  
  // Individual Stocks - $1 per $0.01 movement = $100 per $1 movement
  'AAPL': 100,
  'MSFT': 100,
  'GOOGL': 100,
  'AMZN': 100,
  'TSLA': 100,
  'META': 100,
  'NVDA': 100,
  'NFLX': 100,
  'ADBE': 100,
  'CRM': 100,
  'ORCL': 100,
  'INTC': 100,
  'AMD': 100,
  'PYPL': 100,
  'UBER': 100,
  'ZOOM': 100,
  'SHOP': 100,
  'SQ': 100,
  'TWTR': 100,
  'SNAP': 100,
  
  // ETFs - $1 per $0.01 movement = $100 per $1 movement
  'SPY': 100,
  'VOO': 100,
  'IVV': 100,
  'VTI': 100,
  'QQQ': 100,
  'DIA': 100,
  'IWM': 100,
  'VEA': 100,
  'VWO': 100,
  'AGG': 100,
  'BND': 100,
  'VNQ': 100,
  'GLD': 100,
  'SLV': 100,
  'USO': 100,
  'TLT': 100,
  'HYG': 100,
  'LQD': 100,
  'EFA': 100,
  'EEM': 100,
  
  // Banking Stocks
  'JPM': 100,
  'BAC': 100,
  'WFC': 100,
  'C': 100,
  'GS': 100,
  'MS': 100,
  'USB': 100,
  'PNC': 100,
  'TFC': 100,
  'COF': 100,
  
  // Healthcare Stocks
  'JNJ': 100,
  'PFE': 100,
  'UNH': 100,
  'ABBV': 100,
  'MRK': 100,
  'TMO': 100,
  'ABT': 100,
  'DHR': 100,
  'BMY': 100,
  'AMGN': 100
};

/**
 * Get pip size for a trading pair with optional custom override
 * Returns the custom pip size if provided, otherwise falls back to industry standard
 */
export const getPipSize = (pair: string, customPipSize?: number): number => {
  if (customPipSize !== undefined && customPipSize > 0) {
    return customPipSize;
  }
  return PIP_SIZES[pair] || 1; // Default to 1 if pair not found
};

/**
 * Get pip value per standard lot for a trading pair with optional custom override
 * Returns the custom pip value if provided, otherwise falls back to industry standard
 */
export const getPipValuePerStandardLot = (pair: string, customPipValue?: number): number => {
  if (customPipValue !== undefined && customPipValue > 0) {
    return customPipValue;
  }
  return PIP_VALUE_PER_STANDARD_LOT_MAP[pair] || 10; // Default to $10 if pair not found
};

/**
 * Check if a pair has a custom pip size defined
 */
export const hasCustomPipSize = (pair: string): boolean => {
  return pair in PIP_SIZES;
};

/**
 * Check if a pair has a custom pip value per standard lot defined
 */
export const hasCustomPipValuePerStandardLot = (pair: string): boolean => {
  return pair in PIP_VALUE_PER_STANDARD_LOT_MAP;
};