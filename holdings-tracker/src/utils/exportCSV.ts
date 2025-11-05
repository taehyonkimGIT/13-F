import type { QuarterData, ComparisonResult } from '../types';

/**
 * Export comparison data to CSV
 */
export function exportToCSV(
  fundName: string,
  currentQuarter: QuarterData,
  previousQuarter: QuarterData,
  comparisons: ComparisonResult[]
): void {
  const headers = [
    'Company',
    'Ticker',
    'CUSIP',
    'Current Shares',
    'Current Value',
    'Current % of Portfolio',
    'Previous Shares',
    'Previous Value',
    'Shares Change',
    'Value Change',
    'Change %',
    'Status',
  ];

  const rows = comparisons.map(comp => {
    const current = comp.holding;
    const previous = comp.previousHolding;
    const currentTotal = currentQuarter.totalValue;
    const currentPercent = (current.value / currentTotal) * 100;

    return [
      current.nameOfIssuer,
      extractTicker(current.titleOfClass) || 'N/A',
      current.cusip,
      current.sshPrnamt.toLocaleString(),
      current.value.toLocaleString(),
      currentPercent.toFixed(2),
      previous?.sshPrnamt.toLocaleString() || '0',
      previous?.value.toLocaleString() || '0',
      comp.deltas?.shares.toLocaleString() || 'N/A',
      comp.deltas?.value.toLocaleString() || 'N/A',
      comp.deltas?.valuePercent.toFixed(2) || 'N/A',
      comp.status,
    ];
  });

  const csvContent = [
    `"${fundName} - 13F Holdings Comparison"`,
    `"${currentQuarter.quarter} vs ${previousQuarter.quarter}"`,
    `"Generated: ${new Date().toISOString()}"`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${fundName.replace(/\s+/g, '_')}_13F_${currentQuarter.quarter.replace(/\s+/g, '_')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Extract ticker symbol from title of class
 * Note: SEC 13F filings don't always include tickers, so this is best-effort
 */
function extractTicker(titleOfClass: string): string | null {
  // Common patterns: "COM", "COM STK", "COMMON STOCK"
  // Ticker is usually not in the title, need separate lookup
  // For now, return null and handle ticker display separately
  return null;
}
