import modelParams from './model_params.json';

export type FeatureName = (typeof modelParams.features)[number];

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

export function predictReadmission(inputs: PredictionInput): PredictionResult {
  const { features, intercept, coefficients, scaler_mean, scaler_scale } = modelParams;

  // Validate all 16 features are present and finite
  for (const feature of features) {
    if (!(feature in inputs)) {
      throw new Error(`Missing required feature: ${feature}`);
    }
    if (!Number.isFinite(inputs[feature as FeatureName])) {
      throw new Error(`Feature ${feature} must be a finite number, got: ${inputs[feature as FeatureName]}`);
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