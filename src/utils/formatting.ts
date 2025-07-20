/**
 * Safe number utility to handle NaN and undefined values
 */
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '' || isNaN(value) || !isFinite(value)) {
    return 0;
  }
  const num = Number(value);
  return isFinite(num) ? num : 0;
};

/**
 * Format currency with proper error handling
 */
export const formatCurrency = (value: any, currency: string = 'USD'): string => {
  const safeValue = safeNumber(value);
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeValue);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return `$${safeValue.toFixed(2)}`;
  }
};

/**
 * Format percentage with proper error handling
 */
export const formatPercentage = (value: any, decimals: number = 1): string => {
  const safeValue = safeNumber(value);
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(safeValue / 100);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return `${safeValue.toFixed(decimals)}%`;
  }
};

/**
 * Format large numbers with K/M suffixes - NEW CONSISTENT RULE
 * If value < 1M → show full number (e.g. 96253)
 * If value ≥ 1M → use compact (e.g. 1.4M)
 */
export const formatCompactCurrency = (value: any, currency: string = 'USD'): string => {
  const safeValue = safeNumber(value);
  const absValue = Math.abs(safeValue);
  
  // NEW RULE: Only compact if >= 1M
  if (absValue >= 1000000) {
    return `${safeValue >= 0 ? '' : '-'}$${(absValue / 1000000).toFixed(1)}M`;
  }
  
  // Show full number for anything below 1M
  return formatCurrency(safeValue, currency);
};

/**
 * Format compact numbers (non-currency) with same rule
 */
export const formatCompactNumber = (value: any): string => {
  const safeValue = safeNumber(value);
  const absValue = Math.abs(safeValue);
  
  if (absValue >= 1000000) {
    return `${safeValue >= 0 ? '' : '-'}${(absValue / 1000000).toFixed(1)}M`;
  }
  
  return safeValue.toLocaleString('en-US');
};

/**
 * Format number with proper decimal places
 */
export const formatNumber = (value: any, decimals: number = 2): string => {
  const safeValue = safeNumber(value);
  return safeValue.toFixed(decimals);
};

/**
 * Format ratio (like R:R ratio)
 */
export const formatRatio = (value: any): string => {
  const safeValue = safeNumber(value);
  if (safeValue <= 0) return '—';
  return safeValue.toFixed(2);
};

/**
 * Format duration in a human-readable way
 */
export const formatDuration = (minutes: number): string => {
  const safeMinutes = safeNumber(minutes);
  
  if (safeMinutes < 60) {
    // Round to 1 decimal place for minutes under 60
    const roundedMinutes = Math.round(safeMinutes * 10) / 10;
    return `${roundedMinutes}m`;
  } else if (safeMinutes < 1440) { // Less than 24 hours
    const hours = Math.floor(safeMinutes / 60);
    const remainingMinutes = safeMinutes % 60;
    // Round remaining minutes to 1 decimal place
    const roundedRemainingMinutes = Math.round(remainingMinutes * 10) / 10;
    return roundedRemainingMinutes > 0 ? `${hours}h ${roundedRemainingMinutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(safeMinutes / 1440);
    const remainingHours = Math.floor((safeMinutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
};

/**
 * Format lot size for display with ceiling rounding to 2 decimal places
 * This function is used ONLY for presentation layer display
 * The underlying data maintains full precision
 */
export const formatLotSizeDisplayRoundedUp = (value: any): string => {
  const safeValue = safeNumber(value);
  if (safeValue === 0) return '0.00';
  
  // Apply ceiling rounding to 2 decimal places
  // Multiply by 100, apply Math.ceil, then divide by 100
  const roundedUp = Math.ceil(safeValue * 100) / 100;
  
  // Format to exactly 2 decimal places
  return roundedUp.toFixed(2);
};

/**
 * Format lot size for trades history display - removes trailing zeros
 * Examples: 1.000000000213 → "1", 1.8900000132 → "1.89", 1.8990000123 → "1.9"
 */
export const formatLotSizeForTradesHistory = (value: any): string => {
  const safeValue = safeNumber(value);
  if (safeValue === 0) return '0';
  
  // Round to 2 decimal places first
  const rounded = Math.round(safeValue * 100) / 100;
  
  // Convert to string and remove trailing zeros
  const formatted = rounded.toString();
  
  // If it's a whole number, return without decimal
  if (rounded % 1 === 0) {
    return Math.floor(rounded).toString();
  }
  
  // For decimal numbers, remove trailing zeros
  return formatted.replace(/\.?0+$/, '');
};

/**
 * Format lot size with ultra-clean rounding for display only
 * Eliminates floating point noise and shows up to 3 decimal places
 * Examples: 0.349999999999993 → "0.35", 2.0000000000123 → "2", 1.000000000000253 → "1"
 */
export const formatCleanNumberDisplay = (value: any): string => {
  const safeValue = safeNumber(value);
  if (safeValue === 0) return '0';
  
  // Use precision-safe rounding to 3 decimal places
  // Multiply by 1000, round, then divide by 1000
  const rounded = Math.round(safeValue * 1000) / 1000;
  
  // Convert to string and remove trailing zeros
  let formatted = rounded.toFixed(3);
  
  // Remove trailing zeros and decimal point if not needed
  formatted = formatted.replace(/\.?0+$/, '');
  
  return formatted;
};