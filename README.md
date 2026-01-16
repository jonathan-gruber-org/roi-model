## ROI Calculator (React + Excel engine)

Single-page ROI calculator that uses an Excel workbook as the calculation engine (no backend).

### Tech

- Vite + React + TypeScript
- `xlsx` (SheetJS) to parse the workbook
- `hyperformula` to evaluate formulas client-side
- `recharts` for the 36-month cumulative ROI line chart

### Workbook

Place your workbook at:

- `public/roi_model.xlsx`

Sheets expected:

- `MODEL_INPUTS`
- `MODEL_OUTPUTS`

The app fetches it at runtime from `'/roi_model.xlsx'`.

### Run locally

```bash
cd roi-calculator
npm install
npm run dev
```

Then open the URL printed by Vite.

### Notes

- Inputs (including assumptions) are only written to Excel when you click **Calculate ROI** (no recalculation on every keystroke).
