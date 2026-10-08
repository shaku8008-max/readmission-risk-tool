import v1Params from './model_params.v1.json';

export type FeatureName = (typeof v1Params.features)[number];

export type PredictionInput = Record<FeatureName, number>;

export interface Contribution {
  feature: FeatureName;
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
  coefficients: readonly number[];
  scaler_mean: readonly number[];
  scaler_scale: readonly number[];
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
  const { features, intercept, coefficients, scaler_mean, scaler_scale } = params;

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
    const feature = features[i] as FeatureName;
    const x = inputs[feature];
    const mean = scaler_mean[i];
    const scale = scaler_scale[i];
    const coef = coefficients[i];
    const contribution = coef * (x - mean) / scale;
    contributions.push({ feature, contribution });
    z += contribution;
  }

  const score = 1 / (1 + Math.exp(-z));

  return { score, z, contributions };
}

/** Version 1 scoring — passes v1 params to the shared calculator. */
export function predictReadmission(inputs: PredictionInput): PredictionResult {
  return calculateScore(v1Params as ModelParams, inputs);
}