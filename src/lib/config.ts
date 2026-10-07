// Risk band thresholds — TODO: calibrate with clinical team
export const RISK_BANDS = {
  LOW_THRESHOLD: 0.35,
  MODERATE_THRESHOLD: 0.60,
} as const;

// Factor contribution thresholds — TODO: validate with clinical review
export const FACTOR_THRESHOLDS = {
  RAISING_THRESHOLD: 0.05,
  LOWERING_THRESHOLD: -0.05,
  MAX_RAISING_FACTORS: 5,
} as const;

export function getRiskBand(score: number): 'Low' | 'Moderate' | 'High' {
  if (score < RISK_BANDS.LOW_THRESHOLD) return 'Low';
  if (score < RISK_BANDS.MODERATE_THRESHOLD) return 'Moderate';
  return 'High';
}

export function getRiskBandColor(band: string): string {
  switch (band) {
    case 'Low': return 'text-green-700 bg-green-50 border-green-200';
    case 'Moderate': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'High': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}