import { describe, it, expect } from 'vitest';
import { predictReadmission } from '@/lib/model/predict';
import type { PredictionInput } from '@/lib/model/predict';
import modelParams from '@/lib/model/model_params.json';

describe('predictReadmission', () => {
  const { test_cases, features, intercept } = modelParams;

  // Test 1: Every test_cases entry: score within 1e-6 of expected_probability
  describe('accuracy against test_cases', () => {
    test_cases.forEach((tc, index) => {
      it(`test case ${index + 1}: score matches expected_probability`, () => {
        const result = predictReadmission(tc.inputs as PredictionInput);
        expect(Math.abs(result.score - tc.expected_probability)).toBeLessThan(1e-6);
      });
    });
  });

  // Test 2: Grouped contributions + intercept == z (within 1e-9)
  describe('contributions sum correctly', () => {
    test_cases.forEach((tc, index) => {
      it(`test case ${index + 1}: sum(contributions) + intercept === z`, () => {
        const result = predictReadmission(tc.inputs as PredictionInput);
        const contributionSum = result.contributions.reduce(
          (sum, c) => sum + c.contribution,
          0
        );
        // The intercept is added separately in the predict function.
        // contributions contain only coef * (x - mean) / scale terms.
        // So: sum(contributions) + intercept should equal z
        expect(Math.abs(contributionSum + intercept - result.z)).toBeLessThan(1e-9);
      });
    });
  });

  // Test 3: Validation - missing feature throws
  describe('input validation', () => {
    it('throws when a feature is missing', () => {
      const incomplete = { ...test_cases[0].inputs };
      delete (incomplete as Record<string, number>).number_inpatient;
      expect(() => predictReadmission(incomplete as PredictionInput)).toThrow(
        'Missing required feature: number_inpatient'
      );
    });

    it('throws when a feature is not finite', () => {
      const badInput = {
        ...test_cases[0].inputs,
        number_inpatient: Infinity,
      } as PredictionInput;
      expect(() => predictReadmission(badInput)).toThrow('must be a finite number');
    });

    it('throws when a feature is NaN', () => {
      const badInput = {
        ...test_cases[0].inputs,
        number_emergency: NaN,
      } as PredictionInput;
      expect(() => predictReadmission(badInput)).toThrow('must be a finite number');
    });
  });

  // Test 4: All features present in contributions
  it('returns contributions for all 16 features', () => {
    const result = predictReadmission(test_cases[0].inputs as PredictionInput);
    expect(result.contributions).toHaveLength(features.length);
    const featureNames = result.contributions.map((c) => c.feature);
    features.forEach((f) => {
      expect(featureNames).toContain(f);
    });
  });

  // Test 5: Score is between 0 and 1
  it('returns a score between 0 and 1', () => {
    test_cases.forEach((tc) => {
      const result = predictReadmission(tc.inputs as PredictionInput);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(1);
    });
  });
});