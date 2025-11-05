# 13F Holdings Tracker

A dynamic web application for tracking institutional fund holdings through SEC 13F filings with AI-powered investment rationale generation.

## Features

- 🔍 **Fund Search**: Search any institutional fund by name or CIK
- 📊 **Quarter Comparison**: Side-by-side holdings comparison for last 2 quarters
- 📈 **Change Tracking**: Automatic detection of new, closed, increased, and decreased positions
- 🤖 **AI Rationale**: GPT-4o powered investment rationale generation
- 💾 **Smart Caching**: localStorage caching to minimize API costs
- 📥 **CSV Export**: Export holdings data for further analysis
- ♿ **Accessible**: WCAG 2.1 AA compliant
- 🎨 **Design System**: Comprehensive CSS variables for consistent styling

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd holdings-tracker
npm install
```

### 2. Configure API Key

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

In `.env`:
```
VITE_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Build for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Search for a fund**: Type the fund name (e.g., "Scion Asset Management") or select from popular funds
2. **View holdings**: See the last 2 quarters of 13F filings side-by-side
3. **Analyze changes**: Visual indicators show new positions, closed positions, increases, and decreases
4. **Generate rationales**: Click "📝 Rationale" on any holding to get AI-powered investment analysis
5. **Export data**: Download CSV for further analysis in Excel or other tools
6. **Refresh data**: Click "🔄 Refresh Data" to fetch the latest filings from SEC

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: CSS Modules with design system variables
- **APIs**: SEC EDGAR + OpenAI GPT-4o

## Architecture

```
src/
├── components/          # UI components
│   ├── FundSearch/      # Fund search and selection
│   ├── HoldingsTable/   # Holdings comparison table
│   └── common/          # Reusable components (Button, Loading, Error)
├── services/            # API services
│   ├── secService.ts    # SEC EDGAR API integration
│   └── openaiService.ts # OpenAI GPT-4o API with caching
├── store/               # Zustand state management
│   └── holdingsStore.ts # Global application state
├── types/               # TypeScript type definitions
│   └── index.ts         # Shared interfaces
├── utils/               # Helper functions
│   ├── compareHoldings.ts # Comparison logic
│   └── exportCSV.ts     # CSV export functionality
├── styles/              # Global styles
│   └── design-system.css # Design tokens and variables
└── App.tsx              # Main application component
```

## Environment Variables

### Required

- `VITE_OPENAI_API_KEY`: Your OpenAI API key (get from https://platform.openai.com)

## Security Notes

⚠️ **Never commit your `.env` file or API keys to version control!**

- API keys are stored in environment variables
- `.env` is gitignored by default
- Rationales are cached locally to minimize API usage
- OpenAI API calls cost approximately $0.01-0.02 per rationale

## Key Features Explained

### SEC EDGAR Integration

The app fetches 13F-HR filings from the SEC EDGAR database:
- Searches for funds by name or CIK
- Retrieves the last 2 quarterly filings
- Parses XML information tables to extract holdings
- Handles amended filings (13F-HR/A)
- Respects SEC rate limits (10 requests/second)

### AI-Powered Rationales

Investment rationales are generated using OpenAI's GPT-4o model:
- Analyzes position size, portfolio weight, and quarterly changes
- Provides 2-3 paragraph analysis covering:
  - Why the fund might find the position attractive
  - Key business fundamentals or market factors
  - Potential risks and considerations
- Cached for 7 days to minimize API costs
- Estimated cost: $0.01-0.02 per rationale

### Quarter-over-Quarter Comparison

The app automatically compares holdings between quarters:
- 🟢 **New Positions**: Holdings added in the current quarter
- 🔴 **Closed Positions**: Holdings sold completely
- 🔵 **Increased Stakes**: Positions increased by >5%
- 🟡 **Decreased Stakes**: Positions decreased by >5%
- ⚪ **Unchanged**: Positions with <5% change

### Accessibility Features

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios (4.5:1 for text, 3:1 for UI components)
- Focus indicators on all interactive elements
- Semantic HTML structure

## Known Limitations

- **Desktop-optimized**: Minimum 1280px width recommended
- **13F Filing Delay**: Filings are released 45 days after quarter end
- **SEC Rate Limits**: Maximum 10 requests per second
- **No Tickers**: SEC 13F filings don't include ticker symbols (only CUSIPs)
- **API Costs**: OpenAI rationale generation incurs costs (~$0.01-0.02 per request)
- **Browser Storage**: Cached rationales stored in localStorage (subject to browser limits)

## Popular Funds (Pre-configured)

The app includes quick access to these well-known funds:

- **Scion Asset Management** (CIK: 0001649339) - Michael Burry
- **Berkshire Hathaway** (CIK: 0001067983) - Warren Buffett
- **Icahn Enterprises** (CIK: 0000050031) - Carl Icahn
- **Pershing Square** (CIK: 0001336528) - Bill Ackman

## CSV Export Format

Exported CSV files include:
- Company name and CUSIP
- Current quarter shares, value, and portfolio percentage
- Previous quarter shares and value
- Shares and value change (absolute and percentage)
- Position status (new, closed, increased, decreased, unchanged)

## Troubleshooting

### "Missing VITE_OPENAI_API_KEY" warning
- Make sure you've created a `.env` file in the project root
- Add your OpenAI API key: `VITE_OPENAI_API_KEY=sk-proj-...`
- Restart the dev server

### "Failed to fetch filings from SEC"
- Check your internet connection
- The fund may not have 13F filings (only institutional investment managers with >$100M AUM are required to file)
- SEC EDGAR may be temporarily unavailable

### "OpenAI API error"
- Verify your API key is valid
- Check your OpenAI account has credits
- Check the OpenAI status page: https://status.openai.com

### Rationales not generating
- Check browser console for errors
- Verify your OpenAI API key is configured correctly
- Try clearing the cache and regenerating

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Data sourced from [SEC EDGAR](https://www.sec.gov/edgar)
- AI rationales powered by [OpenAI GPT-4o](https://openai.com)
- Built with [React](https://react.dev) + [Vite](https://vitejs.dev)

## Learn More

- [About 13F Filings](https://www.sec.gov/divisions/investment/13ffaq.htm)
- [SEC EDGAR Search](https://www.sec.gov/edgar/searchedgar/companysearch.html)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Support

If you encounter issues or have questions:
1. Check the Troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information
