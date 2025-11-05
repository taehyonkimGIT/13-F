import React from 'react';
import { useHoldingsStore } from './store/holdingsStore';
import { FundSearch } from './components/FundSearch/FundSearch';
import { HoldingsTable } from './components/HoldingsTable/HoldingsTable';
import { Button, Loading, ErrorMessage } from './components/common';
import { formatCurrency, calculatePortfolioMetrics } from './utils/compareHoldings';
import type { Fund } from './types';
import './styles/design-system.css';
import './App.css';

function App() {
  const {
    selectedFund,
    setSelectedFund,
    currentQuarter,
    previousQuarter,
    comparisons,
    loading,
    error,
    setError,
    fetchHoldings,
    exportData,
    clearRationaleCache,
  } = useHoldingsStore();

  const handleFundSelect = async (fund: Fund) => {
    setSelectedFund(fund);
    await fetchHoldings(fund.cik);
  };

  const handleRefresh = () => {
    if (selectedFund) {
      fetchHoldings(selectedFund.cik);
    }
  };

  // Calculate summary statistics
  const newHoldings = comparisons.filter((c) => c.status === 'new').length;
  const closedHoldings = comparisons.filter((c) => c.status === 'closed').length;
  const increasedHoldings = comparisons.filter((c) => c.status === 'increased').length;
  const decreasedHoldings = comparisons.filter((c) => c.status === 'decreased').length;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">13F Holdings Tracker</h1>
        <p className="app-subtitle">Compare institutional fund holdings over time</p>
      </header>

      <main className="app-main">
        <FundSearch onFundSelect={handleFundSelect} selectedFund={selectedFund} />

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {selectedFund && (
          <div className="controls-panel">
            <div className="controls-left">
              <h3 className="controls-title">Selected Fund: {selectedFund.name}</h3>
            </div>
            <div className="controls-right">
              <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
                🔄 Refresh Data
              </Button>
              <Button
                variant="secondary"
                onClick={exportData}
                disabled={!currentQuarter || !previousQuarter}
              >
                💾 Export CSV
              </Button>
              <Button variant="secondary" onClick={clearRationaleCache}>
                🗑️ Clear Cache
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <Loading size="large" text="Fetching 13F filings from SEC EDGAR..." />
          </div>
        )}

        {!loading && currentQuarter && (
          <>
            <div className="summary-panel">
              <div className="summary-quarter">
                <h3 className="summary-quarter-title">{currentQuarter.quarter}</h3>
                <div className="summary-stat">
                  <span className="summary-label">Total Value:</span>
                  <span className="summary-value">{formatCurrency(currentQuarter.totalValue)}</span>
                </div>
                <div className="summary-stat">
                  <span className="summary-label">Holdings:</span>
                  <span className="summary-value">{currentQuarter.holdingsCount}</span>
                </div>
                <div className="summary-stat">
                  <span className="summary-label">Filing Date:</span>
                  <span className="summary-value">{currentQuarter.filingDate}</span>
                </div>
              </div>

              {previousQuarter && (
                <>
                  <div className="summary-divider">vs</div>

                  <div className="summary-quarter">
                    <h3 className="summary-quarter-title">{previousQuarter.quarter}</h3>
                    <div className="summary-stat">
                      <span className="summary-label">Total Value:</span>
                      <span className="summary-value">{formatCurrency(previousQuarter.totalValue)}</span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-label">Holdings:</span>
                      <span className="summary-value">{previousQuarter.holdingsCount}</span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-label">Filing Date:</span>
                      <span className="summary-value">{previousQuarter.filingDate}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {previousQuarter && (
              <div className="changes-panel">
                <h3 className="changes-title">Changes Summary</h3>
                <div className="changes-grid">
                  <div className="change-stat">
                    <span className="change-icon new">🟢</span>
                    <span className="change-value">{newHoldings}</span>
                    <span className="change-label">New Positions</span>
                  </div>
                  <div className="change-stat">
                    <span className="change-icon closed">🔴</span>
                    <span className="change-value">{closedHoldings}</span>
                    <span className="change-label">Closed Positions</span>
                  </div>
                  <div className="change-stat">
                    <span className="change-icon increased">🔵</span>
                    <span className="change-value">{increasedHoldings}</span>
                    <span className="change-label">Increased Stakes</span>
                  </div>
                  <div className="change-stat">
                    <span className="change-icon decreased">🟡</span>
                    <span className="change-value">{decreasedHoldings}</span>
                    <span className="change-label">Decreased Stakes</span>
                  </div>
                </div>
              </div>
            )}

            <HoldingsTable
              comparisons={comparisons}
              currentQuarter={currentQuarter}
              previousQuarter={previousQuarter}
            />
          </>
        )}

        {!loading && !currentQuarter && selectedFund && (
          <div className="empty-state">
            <p>No 13F filings found for this fund. Please try a different fund.</p>
          </div>
        )}

        {!loading && !selectedFund && (
          <div className="empty-state">
            <p>Select a fund above to view their 13F holdings and compare quarters.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Data sourced from SEC EDGAR | Investment rationales generated by OpenAI GPT-4o |{' '}
          <a
            href="https://www.sec.gov/edgar"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            About 13F Filings
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
