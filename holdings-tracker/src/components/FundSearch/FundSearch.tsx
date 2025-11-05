import React, { useState, useEffect, useRef } from 'react';
import type { Fund } from '../../types';
import { secService } from '../../services/secService';
import { Button, Loading } from '../common';
import styles from './FundSearch.module.css';

interface FundSearchProps {
  onFundSelect: (fund: Fund) => void;
  selectedFund: Fund | null;
}

const DEFAULT_FUNDS: Fund[] = [
  { cik: '0001649339', name: 'Scion Asset Management LLC' },
  { cik: '0001067983', name: 'Berkshire Hathaway Inc' },
  { cik: '0000050031', name: 'Icahn Carl C' },
  { cik: '0001336528', name: 'Pershing Square Capital Management, L.P.' },
];

export const FundSearch: React.FC<FundSearchProps> = ({ onFundSelect, selectedFund }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle search with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const funds = await secService.searchFunds(query);
        setResults(funds);
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFund = (fund: Fund) => {
    onFundSelect(fund);
    setQuery('');
    setShowDropdown(false);
    setResults([]);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Search Investment Fund</h2>

      <div className={styles.searchWrapper} ref={containerRef}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by fund name (e.g., 'Scion', 'Berkshire')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          aria-label="Search for investment fund"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={showDropdown}
        />

        {loading && (
          <div className={styles.searchSpinner}>
            <Loading size="small" />
          </div>
        )}

        {showDropdown && results.length > 0 && (
          <div className={styles.dropdown} id="search-results" role="listbox">
            {results.map((fund) => (
              <button
                key={fund.cik}
                className={styles.dropdownItem}
                onClick={() => handleSelectFund(fund)}
                role="option"
                aria-selected={selectedFund?.cik === fund.cik}
              >
                <div className={styles.fundName}>{fund.name}</div>
                <div className={styles.fundCik}>CIK: {fund.cik}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.defaultFunds}>
        <h3 className={styles.subtitle}>Popular Funds</h3>
        <div className={styles.fundButtons}>
          {DEFAULT_FUNDS.map((fund) => (
            <Button
              key={fund.cik}
              variant={selectedFund?.cik === fund.cik ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleSelectFund(fund)}
            >
              {fund.name.split(/\s+/).slice(0, 2).join(' ')}
            </Button>
          ))}
        </div>
      </div>

      {selectedFund && (
        <div className={styles.selectedFund}>
          <div className={styles.selectedIcon}>📊</div>
          <div className={styles.selectedInfo}>
            <div className={styles.selectedName}>{selectedFund.name}</div>
            <div className={styles.selectedCik}>CIK: {selectedFund.cik}</div>
          </div>
        </div>
      )}
    </div>
  );
};
