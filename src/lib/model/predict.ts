import v1Params from './model_params.v1.json';

export type FeatureName = string;

export type PredictionInput = Record<string, number>;

export interface Contribution {
  feature: string;
  contribution: number;
}

export interface PredictionResult {
  score: number;
  z: number;
  contributions: Contribution[];
}

/** Shape of a model params file — shared across all model versions. */
export interface ModelParams {
  features: readonly string[];
  intercept: number;
  coefficients: readonly number[] | Record<string, number>;
  scaler_mean: readonly number[] | Record<string, number>;
  scaler_scale: readonly number[] | Record<string, number>;
}

/**
 * Core scoring function. Takes any model params object and computes
 * the risk score. This is the single shared implementation of the maths:
 *   z = intercept + sum(coef * (x - mean) / scale)
 *   score = 1 / (1 + exp(-z))
 *
 * Each model version passes its own params file.
 */
export function calculateScore(
  params: ModelParams,
  inputs: Record<string, number>,
): PredictionResult {
  const { features, intercept } = params;

  // Normalize arrays/objects to per-feature lookups
  const getVal = (arr: readonly number[] | Record<string, number>, feature: string, i: number): number => {
    return Array.isArray(arr) ? arr[i] : arr[feature];
  };

  // Validate all features are present and finite
  for (const feature of features) {
    if (!(feature in inputs)) {
      throw new Error(`Missing required feature: ${feature}`);
    }
    if (!Number.isFinite(inputs[feature])) {
      throw new Error(`Feature ${feature} must be a finite number, got: ${inputs[feature]}`);
    }
  }

  const contributions: Contribution[] = [];
  let z = intercept;

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const x = inputs[feature];
    const mean = getVal(params.scaler_mean, feature, i);
    const scale = getVal(params.scaler_scale, feature, i);
    const coef = getVal(params.coefficients, feature, i);
    const contribution = coef * (x - mean) / scale;
    contributions.push({ feature, contribution });
    z += contribution;
  }

  const score = 1 / (1 + Math.exp(-z));

  return { score, z, contributions };
}

/** Version 1 scoring — passes v1 params to the shared calculator. */
export function predictReadmission(inputs: PredictionInput): PredictionResult {
  return calculateScore(v1Params as unknown as ModelParams, inputs);
}
import v2Params from "./model_params.v2.json";

/** Version 2 scoring — passes v2 params to the shared calculator. */
export function predictReadmissionV2(inputs: PredictionInput): PredictionResult {
  return calculateScore(v2Params as unknown as ModelParams, inputs);
}
