# Patient Readmission Risk Tool

A clinical decision-support web application that estimates hospital readmission risk for patients with diabetes, using a logistic regression model trained on the UCI Diabetes 130-US Hospitals dataset (1999-2008).

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Vitest** for testing
- **jsPDF** for client-side PDF generation
- No backend — all prediction logic runs in the browser

## How model_params.json is used

The file at `src/lib/model/model_params.v1.json` contains all parameters needed to reproduce the logistic regression predictions:

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
3. Place the new file as `src/lib/model/model_params.v2.json` (do not edit v1).
4. Create a new route group under `src/app/(v2)/v2/` and wire up the new params.
5. Add the new version to `src/lib/versions.ts`.
6. Run `npm test` — the v1 test_cases must still pass unchanged.

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

## Versioning

The app supports multiple model versions side by side. Each version lives under its own route prefix (`/v1`, `/v2`, etc.) with its own layout, pages, and model params file.

- **Version config**: `src/lib/versions.ts` — array of `{id, label, prefix}` entries that power the navbar dropdown.
- **Route groups**: `src/app/(v1)/` is a Next.js *route group* — the parentheses mean the folder name does not appear in the URL. Inside it, `v1/` provides the actual `/v1` prefix.
- **Shared maths**: `src/lib/model/predict.ts` exports `calculateScore(params, inputs)` which any version can call with its own params file. The v1 wrapper `predictReadmission()` is a thin convenience function.
- **Root redirects**: `src/app/page.tsx`, `src/app/calculator/page.tsx`, and `src/app/results/page.tsx` redirect un-prefixed routes to `/v1/...` so the live site keeps working.

## Key design decisions

- **No patient identifiers collected** — the tool does not ask for names, IDs, MRNs, or dates of birth.
- **Pure functions** — `predictReadmission()` in `src/lib/model/predict.ts` has no UI or network dependencies, making it easy to add storage or API layers later.
- **Session storage only** — results are stored in sessionStorage and cleared on New assessment. Nothing is sent to any server.

## Project structure

```
src/
  app/
    page.tsx                    # Redirects / → /v1
    calculator/page.tsx         # Redirects /calculator → /v1/calculator
    results/page.tsx            # Redirects /results → /v1/results
    (v1)/
      layout.tsx                # V1 layout: Navbar + version banner + Footer
      v1/
        page.tsx                # V1 home (/v1)
        calculator/
          page.tsx              # V1 multi-step wizard (/v1/calculator)
          CalculatorStep.tsx    # Step renderer component
        results/
          page.tsx              # V1 results display (/v1/results)
  components/
    Navbar.tsx                  # Shared navbar with versionPrefix prop + dropdown
    Footer.tsx, ProgressBar.tsx, InfoButton.tsx
  lib/
    model/
      model_params.v1.json      # Version 1 model parameters
      predict.ts                # Shared calculateScore() + predictReadmission() v1 wrapper
      encodings.ts              # Feature encoding helpers
    clinical/
      bmi.ts                    # BMI calculation + WHO categories
      bloodPressure.ts          # BP classification (AHA guidelines)
    pdf/
      generatePdf.ts            # Client-side PDF generation
    config.ts                   # Risk bands, factor thresholds (with TODOs)
    versions.ts                 # Version config array for dropdown
  __tests__/
    predict.test.ts             # Model accuracy, contribution sums, validation
    encodings.test.ts           # Discharge mapping, metformin encoding
    clinical.test.ts            # BMI and BP helpers
```
