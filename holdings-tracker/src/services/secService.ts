import type { Fund, Filing, Holding, QuarterData } from '../types';
import { getQuarterLabel } from '../utils/compareHoldings';

class SECService {
  private readonly BASE_URL = 'https://data.sec.gov';
  private readonly BROWSE_URL = 'https://www.sec.gov/cgi-bin/browse-edgar';
  private readonly ARCHIVES_URL = 'https://www.sec.gov/Archives/edgar/data';
  private readonly HEADERS = {
    'User-Agent': '13F Holdings Tracker contact@example.com',
    'Accept-Encoding': 'gzip, deflate',
  };
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Search for funds by name
   */
  async searchFunds(query: string): Promise<Fund[]> {
    try {
      const url = `${this.BROWSE_URL}?action=getcompany&company=${encodeURIComponent(query)}&type=13F&count=40&output=atom`;

      const response = await fetch(url, { headers: this.HEADERS });

      if (!response.ok) {
        throw new Error(`SEC search failed: ${response.status}`);
      }

      const text = await response.text();

      // Parse XML/Atom feed
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      const entries = doc.querySelectorAll('entry');

      const fundsMap = new Map<string, Fund>();

      entries.forEach(entry => {
        const title = entry.querySelector('title')?.textContent || '';
        const cikMatch = title.match(/\((\d+)\)/);
        const cik = cikMatch ? cikMatch[1].padStart(10, '0') : '';

        // Extract company name (remove CIK from title)
        const name = title.replace(/\s*\(\d+\)\s*\(.*?\)/, '').trim();

        if (cik && name && !fundsMap.has(cik)) {
          fundsMap.set(cik, {
            cik,
            name,
            filingCount: 0,
          });
        }
      });

      return Array.from(fundsMap.values()).slice(0, 10);
    } catch (error) {
      console.error('SEC search error:', error);
      throw new Error('Failed to search funds. Please try again.');
    }
  }

  /**
   * Get recent 13F filings for a specific CIK
   */
  async getRecentFilings(cik: string, count: number = 2): Promise<Filing[]> {
    try {
      const paddedCik = cik.padStart(10, '0');
      const url = `${this.BASE_URL}/submissions/CIK${paddedCik}.json`;

      const response = await fetch(url, { headers: this.HEADERS });

      if (!response.ok) {
        throw new Error(`Failed to fetch filings: ${response.status}`);
      }

      const data = await response.json();
      const filings: Filing[] = [];

      if (data.filings && data.filings.recent) {
        const recent = data.filings.recent;
        const forms = recent.form || [];
        const dates = recent.filingDate || [];
        const accessions = recent.accessionNumber || [];
        const primaryDocs = recent.primaryDocument || [];
        const reportDates = recent.reportDate || [];

        for (let i = 0; i < forms.length && filings.length < count; i++) {
          // Look for 13F-HR or 13F-HR/A (amended), skip 13F-NT (notice)
          if (forms[i] === '13F-HR' || forms[i] === '13F-HR/A') {
            filings.push({
              filingDate: dates[i],
              reportDate: reportDates[i],
              form: forms[i],
              primaryDocument: primaryDocs[i],
              accessionNumber: accessions[i],
              periodOfReport: reportDates[i],
            });
          }
        }
      }

      return filings;
    } catch (error) {
      console.error('Error fetching filings:', error);
      throw new Error('Failed to fetch filings from SEC.');
    }
  }

  /**
   * Parse 13F XML filing to extract holdings
   */
  async parseFilingXML(cik: string, accessionNumber: string): Promise<Holding[]> {
    try {
      // Remove hyphens from accession number for URL
      const accessionNoHyphens = accessionNumber.replace(/-/g, '');

      // Construct URL to information table XML
      const url = `${this.ARCHIVES_URL}/${cik}/${accessionNoHyphens}/primary_doc.xml`;

      const response = await fetch(url, { headers: this.HEADERS });

      if (!response.ok) {
        // Try alternative naming convention
        const altUrl = `${this.ARCHIVES_URL}/${cik}/${accessionNoHyphens}/form13fInfoTable.xml`;
        const altResponse = await fetch(altUrl, { headers: this.HEADERS });

        if (!altResponse.ok) {
          throw new Error(`Failed to fetch XML: ${response.status}`);
        }

        return this.parseXMLToHoldings(await altResponse.text());
      }

      return this.parseXMLToHoldings(await response.text());
    } catch (error) {
      console.error('Error parsing filing XML:', error);
      throw new Error('Failed to parse 13F filing data.');
    }
  }

  /**
   * Parse XML text to holdings array
   */
  private parseXMLToHoldings(xmlText: string): Holding[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // Handle both namespaced and non-namespaced XML
    const infoTables = doc.querySelectorAll('infoTable');
    const holdings: Holding[] = [];

    infoTables.forEach(table => {
      try {
        // Extract values with namespace handling
        const getValue = (tagName: string): string => {
          const el = table.querySelector(tagName) || table.querySelector(`ns1\\:${tagName}`);
          return el?.textContent?.trim() || '';
        };

        const nameOfIssuer = getValue('nameOfIssuer');
        const titleOfClass = getValue('titleOfClass');
        const cusip = getValue('cusip');
        const value = parseInt(getValue('value')) || 0;
        const sshPrnamt = parseInt(getValue('sshPrnamt')) || 0;
        const sshPrnamtType = getValue('sshPrnamtType');
        const investmentDiscretion = getValue('investmentDiscretion');
        const putCall = getValue('putCall');

        // Voting authority
        const sole = parseInt(getValue('Sole')) || 0;
        const shared = parseInt(getValue('Shared')) || 0;
        const none = parseInt(getValue('None')) || 0;

        if (nameOfIssuer && cusip) {
          holdings.push({
            nameOfIssuer,
            titleOfClass,
            cusip,
            value: value * 1000, // SEC values are in thousands
            sshPrnamt,
            sshPrnamtType,
            putCall,
            investmentDiscretion,
            votingAuthority: {
              sole,
              shared,
              none,
            },
          });
        }
      } catch (error) {
        console.warn('Error parsing holding entry:', error);
      }
    });

    return holdings;
  }

  /**
   * Get holdings for last N quarters with metadata
   */
  async getQuarterlyHoldings(cik: string, quarters: number = 2): Promise<QuarterData[]> {
    try {
      const filings = await this.getRecentFilings(cik, quarters);
      const quarterDataPromises = filings.map(async (filing) => {
        const holdings = await this.parseFilingXML(cik, filing.accessionNumber);
        const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

        return {
          quarter: getQuarterLabel(filing.reportDate),
          filingDate: filing.filingDate,
          reportDate: filing.reportDate,
          holdings,
          totalValue,
          holdingsCount: holdings.length,
        };
      });

      return await Promise.all(quarterDataPromises);
    } catch (error) {
      console.error('Error fetching quarterly holdings:', error);
      throw error;
    }
  }

  /**
   * Validate if a CIK has 13F filings
   */
  async hasFilings(cik: string): Promise<boolean> {
    try {
      const filings = await this.getRecentFilings(cik, 1);
      return filings.length > 0;
    } catch {
      return false;
    }
  }
}

export const secService = new SECService();
