# Private Market Investment Analysis n8n Workflows

## Overview

These workflows enable investment risk analysts to process investment documents:
- **Excel files**: Automatically adds a `compute_marker` column set to 1
- **PDF files (IC Memos)**: Uses AI to extract investment amounts and adds them to Excel

## Workflows

### 1. `investment-analysis-workflow.json` (Webhook-Based)

**Upload Method: HTTP POST Request**

```bash
# Upload Excel file
curl -X POST \
  http://your-n8n-instance/webhook/investment-upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/investment_data.xlsx"

# Upload PDF file
curl -X POST \
  http://your-n8n-instance/webhook/investment-upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/ic_memo.pdf"
```

### 2. `investment-analysis-form-workflow.json` (Form-Based)

**Upload Method: Web Form Interface**

1. Navigate to: `http://your-n8n-instance/form/investment-form`
2. Fill out the form:
   - **Analyst Name** (required): Your name
   - **Investment File (Excel)**: Click to upload `.xlsx` or `.xls` file
   - **IC Memo (PDF)**: Click to upload `.pdf` file
   - **Deal Name** (required): Name of the investment deal
   - **Notes** (optional): Additional notes

3. Click Submit

## How File Upload Works

### Form Trigger Method (Recommended)
The Form Trigger node in n8n creates a web form that users can access via browser:

```
┌─────────────────────────────────────────┐
│  Private Market Investment File Upload  │
├─────────────────────────────────────────┤
│  Analyst Name: [_______________]        │
│  Investment File (Excel): [Choose File] │
│  IC Memo (PDF): [Choose File]           │
│  Deal Name: [_______________]           │
│  Notes: [________________________]      │
│                          [Submit]       │
└─────────────────────────────────────────┘
```

### Webhook Method
For programmatic uploads or integration with other systems:

```javascript
// JavaScript example
const formData = new FormData();
formData.append('file', excelFile);

fetch('http://your-n8n-instance/webhook/investment-upload', {
  method: 'POST',
  body: formData
});
```

## Processing Logic

### Excel File Processing
```
Excel Upload → Read Spreadsheet → Add compute_marker = 1 → Save New Excel
```

### PDF IC Memo Processing
```
PDF Upload → Extract Text → AI Analysis → Extract Investment Amount → Create/Update Excel
```

### Combined Upload (Form Workflow)
```
Both Files → Read Excel + Extract PDF → AI Analysis → Merge Data → Save Combined Excel
```

## Output Files

| Scenario | Output File Name |
|----------|-----------------|
| Excel only | `{deal_name}_processed.xlsx` |
| PDF only | `{deal_name}_ic_memo_extract.xlsx` |
| Both files | `{deal_name}_combined.xlsx` |

## Excel Output Columns

When processing is complete, the Excel file will contain:

| Column | Description |
|--------|-------------|
| `compute_marker` | Always set to `1` |
| `ic_memo_investment_amount` | Extracted from PDF (if provided) |
| `ic_memo_currency` | Currency code (USD, EUR, etc.) |
| `ic_memo_target_company` | Company name from IC Memo |
| `ic_memo_investment_type` | Type of investment |
| `ic_memo_confidence` | AI extraction confidence (0-1) |
| `_analyst` | Analyst who uploaded |
| `_deal_name` | Deal name |
| `_processed_at` | Processing timestamp |

## Setup Requirements

### n8n Configuration
1. Import the workflow JSON into n8n
2. Configure OpenAI credentials (for AI text extraction)
3. Activate the workflow

### Required n8n Nodes
- `n8n-nodes-base.webhook` or `n8n-nodes-base.formTrigger`
- `n8n-nodes-base.spreadsheetFile`
- `n8n-nodes-base.extractFromFile`
- `@n8n/n8n-nodes-langchain.openAi`
- `n8n-nodes-base.code`
- `n8n-nodes-base.switch`
- `n8n-nodes-base.merge`

## API Responses

### Success Response (Excel)
```json
{
  "success": true,
  "type": "excel",
  "message": "Excel processed with compute_marker column added",
  "deal": "Deal ABC",
  "rows": 150
}
```

### Success Response (PDF)
```json
{
  "success": true,
  "type": "pdf",
  "message": "PDF IC Memo processed and investment amount extracted",
  "deal": "Deal ABC",
  "data": {
    "investment_amount": 25000000,
    "currency": "USD",
    "target_company": "TechCorp Inc",
    "investment_type": "Series B Equity"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Unsupported file type. Please upload an Excel (.xlsx, .xls) or PDF file."
}
```
