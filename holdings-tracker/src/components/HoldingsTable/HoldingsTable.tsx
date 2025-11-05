import React, { useState, useMemo } from 'react';
import type { ComparisonResult, QuarterData } from '../../types';
import { useHoldingsStore } from '../../store/holdingsStore';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/compareHoldings';
import { Button, Loading } from '../common';
import styles from './HoldingsTable.module.css';

interface HoldingsTableProps {
  comparisons: ComparisonResult[];
  currentQuarter: QuarterData;
  previousQuarter: QuarterData | null;
}

type SortColumn = 'company' | 'value' | 'change' | 'portfolio';
type SortDirection = 'asc' | 'desc';

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  comparisons,
  currentQuarter,
  previousQuarter,
}) => {
  const [filter, setFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { rationales, generatingRationale, generateRationale, selectedFund } = useHoldingsStore();

  // Filter and sort data
  const filteredAndSorted = useMemo(() => {
    let data = [...comparisons];

    // Filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      data = data.filter(
        (comp) =>
          comp.holding.nameOfIssuer.toLowerCase().includes(lowerFilter) ||
          comp.holding.cusip.toLowerCase().includes(lowerFilter)
      );
    }

    // Sort
    data.sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortColumn) {
        case 'company':
          return sortDirection === 'asc'
            ? a.holding.nameOfIssuer.localeCompare(b.holding.nameOfIssuer)
            : b.holding.nameOfIssuer.localeCompare(a.holding.nameOfIssuer);

        case 'value':
          aVal = a.holding.value;
          bVal = b.holding.value;
          break;

        case 'change':
          aVal = a.deltas?.valuePercent || 0;
          bVal = b.deltas?.valuePercent || 0;
          break;

        case 'portfolio':
          aVal = (a.holding.value / currentQuarter.totalValue) * 100;
          bVal = (b.holding.value / currentQuarter.totalValue) * 100;
          break;

        default:
          return 0;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return data;
  }, [comparisons, filter, sortColumn, sortDirection, currentQuarter.totalValue]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const toggleExpanded = (cusip: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(cusip)) {
      newExpanded.delete(cusip);
    } else {
      newExpanded.add(cusip);
    }
    setExpandedRows(newExpanded);
  };

  const handleGenerateRationale = async (comparison: ComparisonResult) => {
    await generateRationale(comparison.holding);
    // Expand row to show rationale
    setExpandedRows(new Set(expandedRows).add(comparison.holding.cusip));
  };

  const getStatusClass = (status: ComparisonResult['status']) => {
    switch (status) {
      case 'new':
        return styles.rowNew;
      case 'closed':
        return styles.rowClosed;
      default:
        return '';
    }
  };

  const getChangeIcon = (status: ComparisonResult['status'], percent?: number) => {
    if (status === 'new') return '🟢';
    if (status === 'closed') return '🔴';
    if (!percent) return '';
    if (percent > 5) return '🔵 ↑';
    if (percent < -5) return '🟡 ↓';
    return '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Holdings Comparison</h2>
        <input
          type="text"
          className={styles.filterInput}
          placeholder="Filter by company name or CUSIP..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter holdings"
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.expandCol}></th>
              <th
                className={`${styles.sortable} ${sortColumn === 'company' ? styles.sorted : ''}`}
                onClick={() => handleSort('company')}
              >
                Company {sortColumn === 'company' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th>CUSIP</th>
              <th
                className={`${styles.sortable} ${sortColumn === 'value' ? styles.sorted : ''}`}
                onClick={() => handleSort('value')}
              >
                Current Value {sortColumn === 'value' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th>Shares</th>
              {previousQuarter && (
                <>
                  <th>Previous Value</th>
                  <th
                    className={`${styles.sortable} ${sortColumn === 'change' ? styles.sorted : ''}`}
                    onClick={() => handleSort('change')}
                  >
                    Change {sortColumn === 'change' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                </>
              )}
              <th
                className={`${styles.sortable} ${sortColumn === 'portfolio' ? styles.sorted : ''}`}
                onClick={() => handleSort('portfolio')}
              >
                Portfolio % {sortColumn === 'portfolio' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((comparison) => {
              const { holding, status, previousHolding, deltas } = comparison;
              const isExpanded = expandedRows.has(holding.cusip);
              const portfolioPercent = (holding.value / currentQuarter.totalValue) * 100;
              const isGenerating = generatingRationale.has(holding.cusip);
              const rationale = rationales.get(holding.cusip);

              return (
                <React.Fragment key={holding.cusip}>
                  <tr className={`${styles.row} ${getStatusClass(status)}`}>
                    <td>
                      <button
                        className={styles.expandButton}
                        onClick={() => toggleExpanded(holding.cusip)}
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </td>
                    <td className={styles.companyName}>{holding.nameOfIssuer}</td>
                    <td className={styles.cusip}>{holding.cusip}</td>
                    <td className={styles.value}>{formatCurrency(holding.value)}</td>
                    <td>{formatNumber(holding.sshPrnamt)}</td>
                    {previousQuarter && (
                      <>
                        <td className={styles.value}>
                          {previousHolding ? formatCurrency(previousHolding.value) : '-'}
                        </td>
                        <td className={deltas && deltas.valuePercent > 0 ? styles.changePositive : styles.changeNegative}>
                          {getChangeIcon(status, deltas?.valuePercent)}
                          {deltas ? formatPercent(deltas.valuePercent) : status === 'new' ? 'NEW' : 'CLOSED'}
                        </td>
                      </>
                    )}
                    <td>{portfolioPercent.toFixed(2)}%</td>
                    <td>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => handleGenerateRationale(comparison)}
                        disabled={isGenerating || !!rationale}
                      >
                        {isGenerating ? <Loading size="small" /> : rationale ? '✓ Generated' : '📝 Rationale'}
                      </Button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={previousQuarter ? 9 : 7}>
                        <div className={styles.expandedContent}>
                          <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                              <strong>Title of Class:</strong> {holding.titleOfClass}
                            </div>
                            <div className={styles.detailItem}>
                              <strong>Investment Discretion:</strong> {holding.investmentDiscretion}
                            </div>
                            <div className={styles.detailItem}>
                              <strong>Voting Authority (Sole):</strong> {formatNumber(holding.votingAuthority.sole)}
                            </div>
                            <div className={styles.detailItem}>
                              <strong>Voting Authority (Shared):</strong> {formatNumber(holding.votingAuthority.shared)}
                            </div>
                          </div>

                          {rationale && (
                            <div className={styles.rationalePanel}>
                              <h4 className={styles.rationaleTitle}>Investment Rationale</h4>
                              <p className={styles.rationaleText}>{rationale}</p>
                            </div>
                          )}

                          {isGenerating && (
                            <div className={styles.generatingMessage}>
                              <Loading size="medium" text="Generating investment rationale..." />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filteredAndSorted.length === 0 && (
          <div className={styles.emptyState}>
            <p>No holdings found matching your filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
