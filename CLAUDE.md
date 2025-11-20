# CLAUDE.md - AI Assistant Guide for 13F Holdings Tracker

This document provides comprehensive guidance for AI assistants working with the 13F Holdings Tracker codebase.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Technology Stack](#technology-stack)
4. [Architecture Patterns](#architecture-patterns)
5. [Development Workflows](#development-workflows)
6. [Code Conventions](#code-conventions)
7. [Key Files Reference](#key-files-reference)
8. [API Integrations](#api-integrations)
9. [State Management](#state-management)
10. [Testing Guidelines](#testing-guidelines)
11. [Common Tasks](#common-tasks)
12. [Important Notes](#important-notes)

---

## Project Overview

**Project Name:** 13F Holdings Tracker
**Purpose:** Web application for tracking institutional fund holdings through SEC 13F filings with AI-powered investment rationale generation
**Location:** `/home/user/13-F/holdings-tracker/`

### What This Application Does

- Searches institutional funds by name or CIK (Central Index Key)
- Fetches and parses SEC 13F-HR filings (quarterly holdings reports)
- Compares holdings quarter-over-quarter
- Detects position changes (new, closed, increased, decreased)
- Generates AI-powered investment rationales using GPT-4o
- Exports data to CSV format
- Caches API responses to minimize costs

### Key Features

- 🔍 Fund search with autocomplete
- 📊 Side-by-side quarter comparison
- 📈 Automatic change detection (>5% threshold)
- 🤖 GPT-4o powered investment analysis
- 💾 Smart caching (localStorage)
- 📥 CSV export functionality
- ♿ WCAG 2.1 AA accessible
- 🎨 Comprehensive design system

---

## Codebase Structure

```
holdings-tracker/
├── public/                    # Static assets
│   └── vite.svg              # Favicon
├── src/
│   ├── assets/               # Images (React logo)
│   ├── components/           # React components
│   │   ├── FundSearch/
│   │   │   ├── FundSearch.tsx
│   │   │   ├── FundSearch.css
│   │   │   └── PopularFunds.tsx
│   │   ├── HoldingsTable/
│   │   │   ├── HoldingsTable.tsx
│   │   │   ├── HoldingsTable.css
│   │   │   └── RationaleModal.tsx
│   │   └── common/           # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorMessage.tsx
│   ├── config/               # Configuration
│   │   └── env.ts            # Environment variables
│   ├── services/             # External API integrations
│   │   ├── secService.ts     # SEC EDGAR API
│   │   └── openaiService.ts  # OpenAI GPT-4o API
│   ├── store/                # State management
│   │   └── holdingsStore.ts  # Zustand store (global state)
│   ├── styles/               # Global styles
│   │   └── design-system.css # Design tokens & CSS variables
│   ├── types/                # TypeScript definitions
│   │   └── index.ts          # All shared interfaces
│   ├── utils/                # Helper functions
│   │   ├── compareHoldings.ts
│   │   └── exportCSV.ts
│   ├── App.tsx               # Main application component
│   ├── App.css               # App-level styles
│   ├── main.tsx              # Entry point (React render)
│   └── index.css             # Global base styles
├── index.html                # HTML template
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript config (references)
├── tsconfig.app.json         # App TypeScript config
├── tsconfig.node.json        # Node TypeScript config
├── vite.config.ts            # Vite build configuration
├── eslint.config.js          # ESLint rules (flat config)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
└── README.md                 # User documentation
```

**Total Lines of Code:** ~1,612 lines of TypeScript/TSX

---

## Technology Stack

### Frontend Framework
- **React 19.1.1** - UI library with StrictMode enabled
- **TypeScript 5.9.3** - Type-safe development
- **Vite 7.1.7** - Fast build tool, HMR, dev server

### State Management
- **Zustand 5.0.8** - Lightweight alternative to Redux
  - No boilerplate
  - Direct store access
  - Minimal re-renders

### Styling Approach
- **CSS Modules** - Component-scoped styles
- **Custom Design System** - CSS variables for consistency
- **No CSS-in-JS libraries** - Plain CSS with variables
- **Desktop-first** - Minimum width 1280px

### Development Tools
- **ESLint 9.36.0** - Code linting (flat config format)
- **typescript-eslint 8.45.0** - TypeScript-specific rules
- **React Hooks linting** - Enforces hooks rules
- **React Fast Refresh** - HMR support

### External APIs
- **SEC EDGAR API** - 13F filings data (data.sec.gov)
  - Public API, no authentication required
  - Rate limited to 10 requests/second
  - CORS proxy required: allorigins.win
- **OpenAI GPT-4o** - AI-powered rationale generation
  - Requires API key
  - ~$0.01-0.02 per rationale
  - 7-day cache to reduce costs

---

## Architecture Patterns

### Component Architecture

**Pattern:** Functional components with hooks
**Style:** Component-scoped CSS modules
**State:** Zustand global store + local useState for UI

**Component Organization:**
```
ComponentName/
├── ComponentName.tsx    # Component logic
├── ComponentName.css    # Component styles
└── SubComponent.tsx     # Sub-components if needed
```

**Example Component Structure:**
```typescript
import React, { useState } from 'react';
import { useHoldingsStore } from '../../store/holdingsStore';
import { Button } from '../common';
import type { Fund } from '../../types';
import './ComponentName.css';

export function ComponentName() {
  // 1. Global state (Zustand)
  const { data, actions } = useHoldingsStore();

  // 2. Local state (React useState)
  const [localState, setLocalState] = useState('');

  // 3. Event handlers
  const handleClick = () => {
    // logic
  };

  // 4. JSX return
  return (
    <div className="component-name">
      {/* content */}
    </div>
  );
}
```

### Service Layer Pattern

**Pattern:** Singleton service classes
**Exports:** Single instance exported as const

**Example:**
```typescript
class ServiceName {
  private readonly CONFIG = 'value';

  async methodName(params: Type): Promise<ReturnType> {
    try {
      // implementation
    } catch (error) {
      console.error('Error context:', error);
      throw new Error('User-friendly message');
    }
  }
}

export const serviceName = new ServiceName();
```

### Store Pattern (Zustand)

**Pattern:** Single global store with typed interface
**Location:** `src/store/holdingsStore.ts`

**Structure:**
```typescript
interface StoreState {
  // State
  data: Type;

  // Actions
  setData: (data: Type) => void;
  fetchData: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  data: null,

  // Actions
  setData: (data) => set({ data }),

  fetchData: async () => {
    set({ loading: true });
    try {
      const result = await api.fetch();
      set({ data: result, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### Type System Patterns

**Centralized Types:** All shared types in `src/types/index.ts`
**Naming:** PascalCase interfaces with descriptive names
**Exports:** Named exports only

**Common Patterns:**
```typescript
// Domain models
export interface Fund { }
export interface Holding { }

// API responses
export interface Filing { }

// Computed data
export interface QuarterData { }

// UI state
export interface ComparisonResult { }

// Service requests
export interface RationaleRequest { }
```

---

## Development Workflows

### Initial Setup

```bash
cd holdings-tracker
npm install
cp .env.example .env
# Edit .env and add VITE_OPENAI_API_KEY
npm run dev
```

### Development Commands

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Environment Variables

**Required:**
- `VITE_OPENAI_API_KEY` - OpenAI API key from platform.openai.com

**Location:** `.env` file in project root (gitignored)
**Access:** `import.meta.env.VITE_OPENAI_API_KEY`

### Build Process

1. TypeScript compilation check (`tsc -b`)
2. Vite production build to `/dist`
3. Optimized assets with tree-shaking
4. ES modules output

### Git Workflow

**Current Branch:** `claude/claude-md-mi7nx5dgi3x7r9vg-01Peiqk2nTYRpGnyGAb2h1o9`

**Standard Flow:**
1. Make changes on feature branch
2. Test locally (`npm run dev`)
3. Run linter (`npm run lint`)
4. Build check (`npm run build`)
5. Commit with descriptive message
6. Push to branch: `git push -u origin <branch-name>`

**Recent Commits:**
- `a752768` - Fix CORS issue - Add proxy support for SEC API requests
- `37bb7b2` - Build complete 13F Holdings Tracker application

---

## Code Conventions

### TypeScript Conventions

**Strict Mode:** Enabled
**Target:** ES2022
**Module:** ESNext with bundler resolution

**Rules:**
- No unused locals
- No unused parameters
- No fallthrough cases in switch
- Explicit return types for public APIs
- Strict null checks

### Naming Conventions

**Files:**
- Components: PascalCase (`FundSearch.tsx`)
- Services: camelCase (`secService.ts`)
- Utils: camelCase (`compareHoldings.ts`)
- Types: camelCase (`index.ts`)
- Styles: Match component name (`FundSearch.css`)

**Variables:**
- `camelCase` for variables and functions
- `PascalCase` for components and types
- `UPPER_SNAKE_CASE` for constants
- Descriptive names (no abbreviations unless obvious)

**Examples:**
```typescript
// Good
const selectedFund = null;
const handleFundSelect = () => {};
const CACHE_DURATION = 24 * 60 * 60 * 1000;
interface Fund { }

// Avoid
const sf = null;
const handler = () => {};
const duration = 86400000;
```

### Component Conventions

**Exports:** Named exports only (no default exports for components)
```typescript
export function FundSearch() { }  // Good
export default FundSearch;        // Avoid
```

**Props:** Define inline or as type (not interface)
```typescript
type Props = {
  onSelect: (fund: Fund) => void;
  disabled?: boolean;
};

export function Component({ onSelect, disabled = false }: Props) { }
```

**Event Handlers:**
- Name: `handleEventName`
- Arrow functions in JSX only for inline callbacks

```typescript
const handleClick = () => { };
<Button onClick={handleClick} />
```

### CSS Conventions

**Design System:** Use CSS variables from `design-system.css`

**Variable Categories:**
- Colors: `--color-primary-*`, `--color-neutral-*`
- Typography: `--font-size-*`, `--font-weight-*`
- Spacing: `--spacing-*` (8px grid system)
- Shadows: `--shadow-*`
- Borders: `--border-*`

**Class Naming:** BEM-like structure
```css
.component-name { }
.component-name__element { }
.component-name--modifier { }
```

**Example:**
```css
.fund-search { }
.fund-search__input { }
.fund-search__results { }
.fund-search--loading { }
```

### Error Handling

**Pattern:** Try-catch with user-friendly messages

```typescript
try {
  const result = await api.call();
  return result;
} catch (error) {
  console.error('Technical context:', error);
  throw new Error('User-friendly message');
}
```

**Store Errors:** Set error state in Zustand store for UI display
```typescript
set({ error: 'User-friendly message', loading: false });
```

### Async Patterns

**Prefer:** async/await over .then()
**Always:** Handle errors in async functions
**State Updates:** Set loading before, clear after

```typescript
const fetchData = async () => {
  set({ loading: true, error: null });
  try {
    const result = await api.fetch();
    set({ data: result });
  } catch (error) {
    set({ error: error.message });
  } finally {
    set({ loading: false });
  }
};
```

---

## Key Files Reference

### Entry Points

**`/home/user/13-F/holdings-tracker/index.html`**
- HTML template
- Mounts React app to `<div id="root">`
- Loads `/src/main.tsx` as module

**`/home/user/13-F/holdings-tracker/src/main.tsx`**
- React application bootstrap
- Creates root and renders App
- Wraps App in React.StrictMode

**`/home/user/13-F/holdings-tracker/src/App.tsx`**
- Main application component
- Integrates FundSearch and HoldingsTable
- Displays summary statistics
- Handles fund selection and refresh

### Core Services

**`/home/user/13-F/holdings-tracker/src/services/secService.ts`**
- SEC EDGAR API integration
- Methods:
  - `searchFunds(query)` - Search funds by name
  - `getRecentFilings(cik, count)` - Get N recent 13F filings
  - `parseFilingXML(cik, accession)` - Parse holdings from XML
  - `getQuarterlyHoldings(cik, quarters)` - Get N quarters of data
  - `hasFilings(cik)` - Validate CIK has filings
- CORS proxy: allorigins.win
- XML parsing with namespace handling
- Amended filing support (13F-HR/A)

**`/home/user/13-F/holdings-tracker/src/services/openaiService.ts`**
- OpenAI GPT-4o API integration
- Methods:
  - `generateRationale(request)` - Generate investment analysis
  - `clearCache()` - Clear localStorage cache
  - `buildPrompt(request)` - Dynamic prompt generation
  - `callOpenAI(prompt)` - API call with error handling
- 7-day localStorage caching
- Position-aware analysis
- Professional financial tone

### State Management

**`/home/user/13-F/holdings-tracker/src/store/holdingsStore.ts`**
- Zustand global store
- State:
  - `selectedFund` - Current fund
  - `quarters` - Array of QuarterData
  - `currentQuarter` - Latest quarter
  - `previousQuarter` - Previous quarter
  - `comparisons` - ComparisonResult array
  - `loading`, `error` - UI state
  - `rationales` - Map of CUSIP -> rationale
  - `generatingRationale` - Set of CUSIPs being generated
- Actions:
  - `setSelectedFund(fund)`
  - `fetchHoldings(cik)` - Fetch from SEC
  - `generateRationale(holding)` - Generate AI rationale
  - `clearRationaleCache()` - Clear cache
  - `exportData()` - Export to CSV

### Type Definitions

**`/home/user/13-F/holdings-tracker/src/types/index.ts`**
- All shared TypeScript interfaces
- Key types:
  - `Fund` - Fund metadata
  - `Filing` - SEC filing metadata
  - `Holding` - Individual position
  - `QuarterData` - Quarter holdings + metadata
  - `ComparisonResult` - Position comparison
  - `RationaleRequest` - OpenAI request
  - `CachedRationale` - Cached rationale data

### Utilities

**`/home/user/13-F/holdings-tracker/src/utils/compareHoldings.ts`**
- `compareQuarters()` - Compare two quarters of holdings
- `calculatePortfolioMetrics()` - Calculate portfolio statistics
- `formatCurrency()` - Format dollar amounts
- `getQuarterLabel()` - Format date to "Q4 2024" format
- Change detection threshold: >5%

**`/home/user/13-F/holdings-tracker/src/utils/exportCSV.ts`**
- `exportToCSV()` - Export holdings to CSV file
- Includes current/previous quarter data
- Calculates deltas and percentages
- Automatic download to browser

### Design System

**`/home/user/13-F/holdings-tracker/src/styles/design-system.css`**
- Comprehensive CSS variable system
- Categories:
  - **Colors:** Primary, neutral, semantic (success, danger, warning, info)
  - **Typography:** Font sizes (xs to 2xl), weights (400-700), line heights
  - **Spacing:** 8px grid system (xs to 4xl)
  - **Shadows:** sm, md, lg
  - **Borders:** radius, width
  - **Transitions:** Standard durations
- WCAG 2.1 AA compliant (4.5:1 contrast)
- Focus states with visible indicators

---

## API Integrations

### SEC EDGAR API

**Base URLs:**
- `https://data.sec.gov` - JSON API
- `https://www.sec.gov/cgi-bin/browse-edgar` - Search
- `https://www.sec.gov/Archives/edgar/data` - Filing documents
- **CORS Proxy:** `https://api.allorigins.win/raw?url=`

**Authentication:** None required
**Rate Limits:** 10 requests per second (SEC enforced)
**Headers:** User-Agent required (contact email)

**Endpoints Used:**
1. **Search Funds**
   - URL: `/cgi-bin/browse-edgar?action=getcompany&company={query}&type=13F`
   - Returns: Atom feed with fund names and CIKs

2. **Get Filings**
   - URL: `/submissions/CIK{paddedCik}.json`
   - Returns: All filings for a CIK with metadata

3. **Get Filing XML**
   - URL: `/Archives/edgar/data/{cik}/{accession}/primary_doc.xml`
   - Alternative: `/Archives/edgar/data/{cik}/{accession}/form13fInfoTable.xml`
   - Returns: Information table with holdings

**XML Parsing Notes:**
- Namespace handling required (`ns1:` prefix)
- Values are in thousands (multiply by 1000)
- CUSIP is unique identifier for holdings
- Support for amended filings (13F-HR/A)

### OpenAI GPT-4o API

**Base URL:** `https://api.openai.com/v1/chat/completions`
**Model:** `gpt-4o`
**Authentication:** Bearer token (API key)

**Cost:** ~$0.01-0.02 per rationale
**Cache Duration:** 7 days (localStorage)
**Cache Key:** Hash of company name + fund name + position data

**Request Format:**
```typescript
{
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: 'You are an expert investment analyst...'
    },
    {
      role: 'user',
      content: 'Analyze why [fund] holds [company]...'
    }
  ],
  temperature: 0.7,
  max_tokens: 800
}
```

**Prompt Structure:**
- System: Expert investment analyst persona
- User: Context with fund name, company, position size, changes
- Expected output: 2-3 paragraph analysis

**Response Handling:**
- Extract `choices[0].message.content`
- Cache to localStorage
- Display in modal UI

---

## State Management

### Zustand Store Architecture

**Philosophy:** Single global store with minimal boilerplate

**Store Location:** `/home/user/13-F/holdings-tracker/src/store/holdingsStore.ts`

**Usage in Components:**
```typescript
import { useHoldingsStore } from '../store/holdingsStore';

function Component() {
  // Select only needed state (prevents unnecessary re-renders)
  const selectedFund = useHoldingsStore(state => state.selectedFund);
  const fetchHoldings = useHoldingsStore(state => state.fetchHoldings);

  // Or destructure multiple values
  const { loading, error, comparisons } = useHoldingsStore();
}
```

### State Structure

**Data State:**
- `selectedFund: Fund | null` - Current fund being viewed
- `quarters: QuarterData[]` - Array of quarter data (0-2 items)
- `currentQuarter: QuarterData | null` - Most recent quarter
- `previousQuarter: QuarterData | null` - Prior quarter
- `comparisons: ComparisonResult[]` - Position change analysis

**UI State:**
- `loading: boolean` - Async operation in progress
- `error: string | null` - User-facing error message

**Rationale State:**
- `rationales: Map<string, string>` - CUSIP -> generated rationale
- `generatingRationale: Set<string>` - CUSIPs currently generating

### Actions Pattern

**Async Actions:** Always follow this pattern
```typescript
actionName: async (params) => {
  set({ loading: true, error: null });
  try {
    const result = await service.method(params);
    set({ data: result });
  } catch (error) {
    console.error('Action failed:', error);
    set({ error: error.message });
  } finally {
    set({ loading: false });
  }
}
```

**Sync Actions:** Direct state updates
```typescript
setProperty: (value) => set({ property: value })
```

### Data Flow

1. **User selects fund** → `setSelectedFund(fund)` → state updates
2. **Auto-fetch triggered** → `fetchHoldings(cik)` → SEC API call
3. **Data received** → Parse & compare → Update state
4. **UI re-renders** → Display holdings table
5. **User clicks rationale** → `generateRationale(holding)` → OpenAI API
6. **Rationale cached** → Store in Map → Display in modal

---

## Testing Guidelines

**Current Status:** No testing framework configured

### Recommended Testing Setup

**Framework:** Vitest (Vite-native alternative to Jest)
**React Testing:** @testing-library/react
**Mocking:** msw (Mock Service Worker) for API mocks

**Installation:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw
```

**Test File Structure:**
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx    # Component tests
└── ComponentName.css

services/
├── secService.ts
└── secService.test.ts        # Service tests
```

### Testing Patterns

**Component Tests:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**Service Tests:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { secService } from './secService';

describe('secService', () => {
  it('fetches holdings', async () => {
    const holdings = await secService.getQuarterlyHoldings('0001649339', 2);
    expect(holdings).toHaveLength(2);
  });
});
```

**Store Tests:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useHoldingsStore } from './holdingsStore';

describe('holdingsStore', () => {
  it('fetches holdings', async () => {
    const { result } = renderHook(() => useHoldingsStore());

    await act(async () => {
      await result.current.fetchHoldings('0001649339');
    });

    expect(result.current.currentQuarter).toBeDefined();
  });
});
```

---

## Common Tasks

### Adding a New Component

1. **Create directory:**
   ```bash
   mkdir src/components/NewComponent
   cd src/components/NewComponent
   ```

2. **Create files:**
   ```bash
   touch NewComponent.tsx NewComponent.css
   ```

3. **Component template:**
   ```typescript
   import React from 'react';
   import './NewComponent.css';

   type Props = {
     // props
   };

   export function NewComponent({ }: Props) {
     return (
       <div className="new-component">
         {/* content */}
       </div>
     );
   }
   ```

4. **Export from parent:** Update `index.ts` if needed

### Adding a New Service Method

1. **Open service file:**
   ```bash
   # e.g., src/services/secService.ts
   ```

2. **Add method:**
   ```typescript
   async methodName(params: Type): Promise<ReturnType> {
     try {
       const response = await this.fetchWithProxy(url);
       if (!response.ok) throw new Error('...');
       return await response.json();
     } catch (error) {
       console.error('Error:', error);
       throw new Error('User-friendly message');
     }
   }
   ```

3. **Add types:** Update `src/types/index.ts` if needed

### Adding a Store Action

1. **Update interface:**
   ```typescript
   interface HoldingsState {
     newAction: (params: Type) => Promise<void>;
   }
   ```

2. **Implement action:**
   ```typescript
   export const useHoldingsStore = create<HoldingsState>((set, get) => ({
     newAction: async (params) => {
       set({ loading: true });
       try {
         const result = await service.method(params);
         set({ data: result });
       } catch (error) {
         set({ error: error.message });
       } finally {
         set({ loading: false });
       }
     },
   }));
   ```

### Adding CSS Variables

1. **Open design system:**
   ```bash
   # src/styles/design-system.css
   ```

2. **Add variable:**
   ```css
   :root {
     --new-variable: value;
   }
   ```

3. **Use in component:**
   ```css
   .component {
     property: var(--new-variable);
   }
   ```

### Debugging API Issues

**SEC API:**
1. Check CORS proxy status (allorigins.win)
2. Verify CIK format (10 digits, zero-padded)
3. Check SEC rate limits (10 req/sec)
4. Inspect network tab for actual responses
5. Check if fund has 13F filings (>$100M AUM required)

**OpenAI API:**
1. Verify API key in `.env`
2. Check OpenAI account has credits
3. Inspect console for error messages
4. Check OpenAI status page
5. Clear cache and retry

### Adding a Popular Fund

1. **Open FundSearch component:**
   ```bash
   # src/components/FundSearch/PopularFunds.tsx
   ```

2. **Add to array:**
   ```typescript
   const POPULAR_FUNDS: Fund[] = [
     {
       cik: '0001234567',
       name: 'Fund Name',
     },
     // ...
   ];
   ```

---

## Important Notes

### For AI Assistants

**When Making Changes:**
1. ✅ **ALWAYS** read files before editing
2. ✅ **PRESERVE** exact indentation and formatting
3. ✅ **USE** existing patterns and conventions
4. ✅ **ADD** types for new data structures
5. ✅ **HANDLE** errors with user-friendly messages
6. ✅ **TEST** locally before committing
7. ✅ **UPDATE** this CLAUDE.md if architecture changes

**Common Pitfalls:**
- ❌ Don't use `export default` for components
- ❌ Don't mix tabs and spaces (use 2 spaces)
- ❌ Don't hardcode values that should be in design system
- ❌ Don't skip error handling in async functions
- ❌ Don't add dependencies without discussing trade-offs
- ❌ Don't commit `.env` files
- ❌ Don't expose API keys in client code (use env vars)

**Best Practices:**
- 🎯 Keep components small and focused
- 🎯 Extract reusable logic to utils
- 🎯 Use design system variables for consistency
- 🎯 Write descriptive error messages for users
- 🎯 Cache expensive API calls
- 🎯 Optimize re-renders (zustand selectors)
- 🎯 Maintain accessibility (ARIA, keyboard nav)

### Performance Considerations

**API Calls:**
- SEC API: Use CORS proxy (adds latency)
- OpenAI API: Expensive (~$0.01-0.02 per call)
- Cache aggressively (7-day localStorage)
- Debounce search inputs

**State Updates:**
- Use Zustand selectors to prevent unnecessary re-renders
- Avoid large objects in state (normalize if needed)
- Batch related updates in single `set()` call

**Bundle Size:**
- Current: Minimal dependencies (React + Zustand only)
- Avoid large libraries (lodash, moment, etc.)
- Use tree-shaking compatible imports

### Security Considerations

**API Keys:**
- ✅ Store in `.env` (gitignored)
- ✅ Access via `import.meta.env.VITE_*`
- ❌ Never commit to git
- ❌ Never expose in client code
- ⚠️ Environment variables are still visible in client bundle

**Data Handling:**
- All data is public (SEC filings)
- No user authentication
- No personal information stored
- localStorage is per-browser

**CORS Proxy:**
- Using allorigins.win (third-party)
- Consider self-hosted proxy for production
- SEC API doesn't support CORS directly

### Accessibility Requirements

**WCAG 2.1 AA Compliance:**
- Color contrast: 4.5:1 for text, 3:1 for UI components
- Keyboard navigation: All interactive elements focusable
- Focus indicators: Visible on all interactive elements
- Screen reader: ARIA labels and roles
- Semantic HTML: Use proper HTML5 elements

**Testing Accessibility:**
- Keyboard only navigation
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Browser DevTools accessibility panel
- axe DevTools extension

### Known Limitations

**Platform:**
- Desktop-optimized (1280px+ width)
- Not mobile responsive
- Modern browsers only (ES2022)

**Data:**
- 13F filings released 45 days after quarter end
- No real-time data
- SEC rate limits (10 req/sec)
- No ticker symbols (CUSIPs only)

**Features:**
- Only last 2 quarters compared
- No historical trend analysis
- No portfolio analytics
- CSV export only (no PDF, Excel)

**Costs:**
- OpenAI API: ~$0.01-0.02 per rationale
- No backend costs (static SPA)
- CORS proxy is free (consider limits)

### Future Enhancement Ideas

**Features to Consider:**
- Mobile responsive design
- Historical trend charts
- Portfolio overlap analysis
- Multi-fund comparison
- Advanced filtering/sorting
- PDF export with charts
- Email alerts for new filings
- Ticker symbol resolution

**Technical Improvements:**
- Add testing framework (Vitest)
- Self-hosted CORS proxy
- Server-side rendering (SSR)
- Progressive Web App (PWA)
- Offline support
- Database for caching (vs localStorage)

### Related Documentation

**External Resources:**
- [SEC 13F FAQ](https://www.sec.gov/divisions/investment/13ffaq.htm)
- [SEC EDGAR Search](https://www.sec.gov/edgar/searchedgar/companysearch.html)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Zustand Docs](https://zustand-demo.pmnd.rs)

**Internal Documentation:**
- `README.md` - User-facing documentation
- This file (`CLAUDE.md`) - AI assistant guide
- Code comments - Inline documentation

---

## Changelog

**2025-11-20:**
- Initial CLAUDE.md creation
- Documented complete codebase structure
- Added development workflows
- Defined code conventions
- Provided comprehensive reference

---

## Questions or Issues?

When encountering issues:
1. Check this documentation first
2. Review relevant code in referenced files
3. Check console for error messages
4. Verify environment variables are set
5. Test API endpoints independently
6. Review git history for context

For architecture changes:
1. Discuss trade-offs before implementing
2. Update this CLAUDE.md file
3. Update README.md if user-facing
4. Consider backward compatibility
5. Test thoroughly before committing

---

**Document Version:** 1.0
**Last Updated:** 2025-11-20
**Maintainer:** AI Assistant (Claude)
