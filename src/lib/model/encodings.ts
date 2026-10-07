export const METFORMIN_LABELS: Record<number, string> = {
  0: 'Not on metformin',
  1: 'Dose decreased',
  2: 'Dose unchanged (steady)',
  3: 'Dose increased',
};

export const METFORMIN_OPTIONS = [
  { value: 0, label: 'Not on metformin' },
  { value: 1, label: 'Dose decreased' },
  { value: 2, label: 'Dose unchanged (steady)' },
  { value: 3, label: 'Dose increased' },
];

export const DISCHARGE_LABELS: Record<number, string> = {
  0: 'Home / other (default)',
  2: 'Transferred to another short-term hospital',
  3: 'Transferred to a skilled nursing facility (SNF)',
  5: 'Transferred to another type of inpatient care institution',
  6: 'Home with home health service',
  22: 'Transferred to a rehabilitation facility',
};

export const DISCHARGE_OPTIONS = [
  { value: 0, label: 'Home / other (default)' },
  { value: 2, label: 'Transferred to another short-term hospital' },
  { value: 3, label: 'Transferred to a skilled nursing facility (SNF)' },
  { value: 5, label: 'Transferred to another type of inpatient care institution' },
  { value: 6, label: 'Home with home health service' },
  { value: 22, label: 'Transferred to a rehabilitation facility' },
];

export const DISCHARGE_FEATURE_IDS = [2, 3, 5, 6, 11, 18, 22];

export function dischargeToOneHot(dischargeValue: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of DISCHARGE_FEATURE_IDS) {
    result[`discharge_disposition_id_${id}`] = dischargeValue === id ? 1 : 0;
  }
  return result;
}