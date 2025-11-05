import type { Holding, ComparisonResult } from '../types';

/**
 * Compare two quarters and generate comparison results
 */
export function compareQuarters(
  current: Holding[],
  previous: Holding[]
): ComparisonResult[] {
  const results: ComparisonResult[] = [];
  const previousMap = new Map(previous.map(h => [h.cusip, h]));
  const processedCusips = new Set<string>();

  // Process current holdings
  for (const holding of current) {
    const prevHolding = previousMap.get(holding.cusip);

    if (!prevHolding) {
      // New position
      results.push({
        holding,
        status: 'new',
      });
    } else {
      // Existing position - calculate deltas
      const sharesDelta = holding.sshPrnamt - prevHolding.sshPrnamt;
      const valueDelta = holding.value - prevHolding.value;
      const sharesPercent = (sharesDelta / prevHolding.sshPrnamt) * 100;
      const valuePercent = (valueDelta / prevHolding.value) * 100;

      let status: ComparisonResult['status'] = 'unchanged';
      if (Math.abs(sharesPercent) > 5) {
        status = sharesPercent > 0 ? 'increased' : 'decreased';
      }

      results.push({
        holding,
        status,
        previousHolding: prevHolding,
        deltas: {
          shares: sharesDelta,
          sharesPercent,
          value: valueDelta,
          valuePercent,
        },
      });
    }

    processedCusips.add(holding.cusip);
  }

  // Find closed positions
  for (const prevHolding of previous) {
    if (!processedCusips.has(prevHolding.cusip)) {
      results.push({
        holding: prevHolding,
        status: 'closed',
      });
    }
  }

  // Sort by current value (or previous value for closed positions)
  results.sort((a, b) => {
    const aValue = a.status === 'closed' ? (a.previousHolding?.value || a.holding.value) : a.holding.value;
    const bValue = b.status === 'closed' ? (b.previousHolding?.value || b.holding.value) : b.holding.value;
    return bValue - aValue;
  });

  return results;
}

/**
 * Calculate portfolio metrics
 */
export function calculatePortfolioMetrics(holdings: Holding[]) {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  return {
    totalValue,
    holdingsCount: holdings.length,
    largestPosition: holdings.length > 0 ? Math.max(...holdings.map(h => h.value)) : 0,
    averagePosition: holdings.length > 0 ? totalValue / holdings.length : 0,
    top10Value: holdings
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .reduce((sum, h) => sum + h.value, 0),
  };
}

/**
 * Format currency values
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format percentage change
 */
export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Extract quarter label from date (e.g., "Q4 2024")
 */
export function getQuarterLabel(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();

  let quarter: number;
  if (month <= 2) quarter = 1;
  else if (month <= 5) quarter = 2;
  else if (month <= 8) quarter = 3;
  else quarter = 4;

  return `Q${quarter} ${year}`;
}
