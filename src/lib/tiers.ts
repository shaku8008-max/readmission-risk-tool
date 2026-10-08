/** Tier lookup and helpers for Version 2 risk tiers. */

export interface RiskTier {
  key: string;
  label: string;
  min_score: number;
  share_of_patients: number;
  readmission_rate: number;
  share_of_all_readmissions: number;
}

export function getTier(
  score: number,
  tiers: Record<string, { min_score: number; share_of_patients: number; readmission_rate: number; share_of_all_readmissions: number }>,
): RiskTier {
  if (score >= tiers.high.min_score) {
    return { key: 'high', label: 'High', ...tiers.high };
  }
  if (score >= tiers.moderate.min_score) {
    return { key: 'moderate', label: 'Moderate', ...tiers.moderate };
  }
  return { key: 'low', label: 'Lower', ...tiers.low };
}

/** Returns "1 in N" rounded from the tier's readmission rate. */
export function oneInN(rate: number): number {
  return Math.round(1 / rate);
}

/** Tier color classes matching the project's Tailwind patterns. */
export function getTierColor(key: string): string {
  switch (key) {
    case 'high': return 'text-red-700 bg-red-50 border-red-200';
    case 'moderate': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'low': return 'text-green-700 bg-green-50 border-green-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}
