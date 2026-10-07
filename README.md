# Patient Readmission Risk Tool

A clinical decision-support web application that estimates hospital readmission risk for patients with diabetes, using a logistic regression model trained on the UCI Diabetes 130-US Hospitals dataset (1999-2008).

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Vitest** for testing
- **jsPDF** for client-side PDF generation
- No backend — all prediction logic runs in the browser

## How model_params.json is used

The file at `src/lib/model/model_params.json` contains all parameters needed to reproduce the logistic regression predictions:

| Field | Description |
|---|---|
| `features` | Ordered array of 16 feature names |
| `intercept` | Logistic regression intercept term |
| `coefficients` | Array of 16 coefficients, one per feature |
| `scaler_mean` | StandardScaler means from training data |
| `scaler_scale` | StandardScaler standard deviations from training data |
| `feature_ranges` | `{min, max}` for each feature (input validation) |
| `decision_threshold` | Score threshold for higher risk flag (default 0.5) |
| `test_roc_auc` | ROC-AUC on held-out test set (~0.68) |
| `trained_on` | Human-readable description of training data |
| `test_cases` | 5 test cases with inputs and expected_probability for verification |
| `display_stats` | Per-feature statistics (median, p25, p75, share_yes) for UI helper text |

The prediction formula (in `src/lib/model/predict.ts`):

```
z = intercept + sum( coef[f] * (x[f] - mean[f]) / scale[f] )
score = 1 / (1 + exp(-z))
```

## Swapping in a new model export

1. Train a new logistic regression in Python on the same feature set.
2. Export parameters to JSON matching the schema above (same `features` order, same 16 features).
3. Replace `src/lib/model/model_params.json`.
4. Run `npm test` — the 5 test_cases entries must pass (update them if the model changed).
5. Update `test_roc_auc` and `trained_on` fields accordingly.

**Important:** The 16 features must be in the same order. The `display_stats` field is used for UI helper text only and does not affect predictions.

## Running

```bash
npm install
npm run dev      # Start development server
npm test         # Run all tests
npm run build    # Production build
```

## TODOs

- [ ] **Risk band cutoffs** (`src/lib/config.ts`): Low < 0.35, Moderate 0.35-0.60, High >= 0.60 — these are placeholders and should be calibrated with clinical review.
- [ ] **Factor contribution thresholds** (`src/lib/config.ts`): Raising >= +0.05, Lowering <= -0.05 — these are placeholders and should be validated clinically.
- [ ] **Clinical validation**: The model was trained on 1999-2008 US hospital data. Performance on current patient populations has not been evaluated.
- [ ] **Discharge disposition ID 18**: In the source UCI dataset, ID 18 is a NULL/missing-data code, not a real discharge destination. In this tool, it is folded into Home / other (default) and never offered as a selection. The feature is always set to 0 in model input.

## Key design decisions

- **No patient identifiers collected** — the tool does not ask for names, IDs, MRNs, or dates of birth.
- **Pure functions** — `predictReadmission()` in `src/lib/model/predict.ts` has no UI or network dependencies, making it easy to add storage or API layers later.
- **Session storage only** — results are stored in sessionStorage and cleared on New assessment. Nothing is sent to any server.

## Project structure

```
src/
  app/
    page.tsx              # Home (/)
    calculator/page.tsx   # Multi-step wizard (/calculator)
    results/page.tsx      # Results display (/results)
  components/
    Navbar.tsx, Footer.tsx, ProgressBar.tsx, InfoButton.tsx
  lib/
    model/
      model_params.json   # Model parameters
      predict.ts          # Pure prediction function
      encodings.ts        # Feature encoding helpers
    clinical/
      bmi.ts              # BMI calculation + WHO categories
      bloodPressure.ts    # BP classification (AHA guidelines)
    pdf/
      generatePdf.ts      # Client-side PDF generation
    config.ts             # Risk bands, factor thresholds (with TODOs)
  __tests__/
    predict.test.ts       # Model accuracy, contribution sums, validation
    encodings.test.ts     # Discharge mapping, metformin encoding
    clinical.test.ts      # BMI and BP helpers
```
