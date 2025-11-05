import { create } from 'zustand';
import type { Fund, QuarterData, Holding, ComparisonResult } from '../types';
import { secService } from '../services/secService';
import { openaiService } from '../services/openaiService';
import { compareQuarters } from '../utils/compareHoldings';
import { exportToCSV } from '../utils/exportCSV';

interface HoldingsState {
  // Selected fund
  selectedFund: Fund | null;
  setSelectedFund: (fund: Fund | null) => void;

  // Quarter data
  quarters: QuarterData[];
  currentQuarter: QuarterData | null;
  previousQuarter: QuarterData | null;
  comparisons: ComparisonResult[];

  // UI state
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;

  // Rationales
  rationales: Map<string, string>; // cusip -> rationale
  generatingRationale: Set<string>; // cusips currently generating

  // Actions
  fetchHoldings: (cik: string) => Promise<void>;
  generateRationale: (holding: Holding) => Promise<void>;
  clearRationaleCache: () => void;
  exportData: () => void;
}

export const useHoldingsStore = create<HoldingsState>((set, get) => ({
  // Initial state
  selectedFund: null,
  quarters: [],
  currentQuarter: null,
  previousQuarter: null,
  comparisons: [],
  loading: false,
  error: null,
  rationales: new Map(),
  generatingRationale: new Set(),

  // Setters
  setSelectedFund: (fund) => set({ selectedFund: fund }),
  setError: (error) => set({ error }),

  // Fetch holdings from SEC
  fetchHoldings: async (cik: string) => {
    set({ loading: true, error: null, comparisons: [] });

    try {
      const quarters = await secService.getQuarterlyHoldings(cik, 2);

      if (quarters.length === 0) {
        throw new Error('No 13F filings found for this fund.');
      }

      const currentQuarter = quarters[0] || null;
      const previousQuarter = quarters[1] || null;

      // Generate comparisons
      const comparisons = previousQuarter
        ? compareQuarters(currentQuarter.holdings, previousQuarter.holdings)
        : currentQuarter.holdings.map(holding => ({
            holding,
            status: 'unchanged' as const,
          }));

      set({
        quarters,
        currentQuarter,
        previousQuarter,
        comparisons,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching holdings:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch holdings',
      });
    }
  },

  // Generate AI rationale for a holding
  generateRationale: async (holding: Holding) => {
    const { selectedFund, currentQuarter, previousQuarter, generatingRationale } = get();

    if (!selectedFund || !currentQuarter) return;

    // Prevent duplicate requests
    if (generatingRationale.has(holding.cusip)) return;

    // Mark as generating
    const newGenerating = new Set(generatingRationale);
    newGenerating.add(holding.cusip);
    set({ generatingRationale: newGenerating });

    try {
      // Find comparison data
      const comparison = get().comparisons.find(c => c.holding.cusip === holding.cusip);

      // Calculate portfolio percentage
      const percentOfPortfolio = (holding.value / currentQuarter.totalValue) * 100;

      // Build request
      const request = {
        ticker: '', // SEC doesn't provide tickers in 13F
        companyName: holding.nameOfIssuer,
        fundName: selectedFund.name,
        position: {
          shares: holding.sshPrnamt,
          value: holding.value,
          percentOfPortfolio,
        },
        quarterlyChange: comparison?.deltas ? {
          sharesDelta: comparison.deltas.shares,
          valueDelta: comparison.deltas.value,
          percentChange: comparison.deltas.sharesPercent,
          isNew: comparison.status === 'new',
          isClosed: comparison.status === 'closed',
        } : undefined,
      };

      const rationale = await openaiService.generateRationale(request);

      // Store rationale
      const newRationales = new Map(get().rationales);
      newRationales.set(holding.cusip, rationale);
      set({ rationales: newRationales });
    } catch (error) {
      console.error('Error generating rationale:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to generate rationale' });
    } finally {
      // Remove from generating set
      const newGenerating = new Set(get().generatingRationale);
      newGenerating.delete(holding.cusip);
      set({ generatingRationale: newGenerating });
    }
  },

  // Clear all cached rationales
  clearRationaleCache: () => {
    openaiService.clearCache();
    set({ rationales: new Map() });
  },

  // Export data to CSV
  exportData: () => {
    const { selectedFund, currentQuarter, previousQuarter, comparisons } = get();

    if (!selectedFund || !currentQuarter || !previousQuarter) {
      set({ error: 'Cannot export: missing data' });
      return;
    }

    try {
      exportToCSV(selectedFund.name, currentQuarter, previousQuarter, comparisons);
    } catch (error) {
      console.error('Error exporting data:', error);
      set({ error: 'Failed to export data' });
    }
  },
}));
