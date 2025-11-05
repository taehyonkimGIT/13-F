export interface Fund {
  cik: string;
  name: string;
  filingCount?: number;
  latestFilingDate?: string;
}

export interface Filing {
  filingDate: string;
  reportDate: string;
  form: string;
  primaryDocument: string;
  accessionNumber: string;
  periodOfReport: string;
}

export interface Holding {
  nameOfIssuer: string;
  titleOfClass: string;
  cusip: string;
  value: number;
  sshPrnamt: number; // Shares or principal amount
  sshPrnamtType: string;
  putCall?: string; // For options
  investmentDiscretion: string;
  votingAuthority: {
    sole: number;
    shared: number;
    none: number;
  };
}

export interface QuarterData {
  quarter: string; // e.g., "Q4 2024"
  filingDate: string;
  reportDate: string;
  holdings: Holding[];
  totalValue: number;
  holdingsCount: number;
}

export interface ComparisonResult {
  holding: Holding;
  status: 'new' | 'closed' | 'increased' | 'decreased' | 'unchanged';
  previousHolding?: Holding;
  deltas?: {
    shares: number;
    sharesPercent: number;
    value: number;
    valuePercent: number;
  };
}

export interface RationaleRequest {
  ticker: string;
  companyName: string;
  fundName: string;
  position: {
    shares: number;
    value: number;
    percentOfPortfolio: number;
  };
  quarterlyChange?: {
    sharesDelta: number;
    valueDelta: number;
    percentChange: number;
    isNew?: boolean;
    isClosed?: boolean;
  };
}

export interface CachedRationale {
  rationale: string;
  timestamp: number;
  request: RationaleRequest;
}
