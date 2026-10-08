import { describe, it, expect } from 'vitest';
import { calculateScore, predictReadmissionV2 } from '@/lib/model/predict';
import type { PredictionInput, ModelParams } from '@/lib/model/predict';
import v2Params from '@/lib/model/model_params.v2.json';
import { getTier, oneInN } from '@/lib/tiers';

const params = v2Params as unknown as ModelParams & {
  test_cases: { inputs: Record<string, number>; expected_probability: number }[];
  risk_tiers: Record<string, { min_score: number; share_of_patients: number; readmission_rate: number; share_of_all_readmissions: number }>;
};

describe('predictReadmissionV2', () => {
  const { test_cases, features } = params;

  // Test 1: Every test_cases entry: score within 1e-6 of expected_probability
  describe('accuracy against test_cases', () => {
    test_cases.forEach((tc, index) => {
      it(`test case ${index + 1}: score matches expected_probability`, () => {
        const result = predictReadmissionV2(tc.inputs as PredictionInput);
        expect(Math.abs(result.score - tc.expected_probability)).toBeLessThan(1e-6);
      });
    });
  });

  // Test 2: Grouped contributions + intercept == z (within 1e-9)
  describe('contributions sum correctly', () => {
    test_cases.forEach((tc, index) => {
      it(`test case ${index + 1}: sum(contributions) + intercept === z`, () => {
        const result = predictReadmissionV2(tc.inputs as PredictionInput);
        const contributionSum = result.contributions.reduce((sum, c) => sum + c.contribution, 0);
        expect(Math.abs(contributionSum + params.intercept - result.z)).toBeLessThan(1e-9);
      });
    });
  });

  // Test 3: All 15 features present in contributions
  it('returns contributions for all 15 features', () => {
    const result = predictReadmissionV2(test_cases[0].inputs as PredictionInput);
    expect(result.contributions).toHaveLength(features.length);
    const featureNames = result.contributions.map((c) => c.feature);
    features.forEach((f) => {
      expect(featureNames).toContain(f);
    });
  });

  // Test 4: Score is between 0 and 1
  it('returns a score between 0 and 1', () => {
    test_cases.forEach((tc) => {
      const result = predictReadmissionV2(tc.inputs as PredictionInput);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(1);
    });
  });

  // Test 5: 15 features, not 16 (no discharge_disposition_id_11)
  it('has exactly 15 features (no discharge_disposition_id_11)', () => {
    expect(features).toHaveLength(15);
    expect(features).not.toContain('discharge_disposition_id_11');
  });
});

describe('tier boundaries', () => {
  const tiers = params.risk_tiers;

  it('score 0.6329 is High', () => {
    expect(getTier(0.6329, tiers).key).toBe('high');
  });

  it('score just below 0.6329 is Moderate', () => {
    expect(getTier(0.6328, tiers).key).toBe('moderate');
  });

  it('score 0.4455 is Moderate', () => {
    expect(getTier(0.4455, tiers).key).toBe('moderate');
  });

  it('score just below 0.4455 is Lower', () => {
    expect(getTier(0.4454, tiers).key).toBe('low');
  });

  it('tier labels are correct', () => {
    expect(getTier(0.9, tiers).label).toBe('High');
    expect(getTier(0.5, tiers).label).toBe('Moderate');
    expect(getTier(0.1, tiers).label).toBe('Lower');
  });
});

describe('oneInN helper', () => {
  const tiers = params.risk_tiers;

  it('high tier: 1 in 4', () => {
    expect(oneInN(tiers.high.readmission_rate)).toBe(4);
  });

  it('moderate tier: 1 in 7', () => {
    expect(oneInN(tiers.moderate.readmission_rate)).toBe(7);
  });

  it('low tier: 1 in 14', () => {
    expect(oneInN(tiers.low.readmission_rate)).toBe(14);
  });
});
