export function classifyBloodPressure(
  systolic: number,
  diastolic: number
): { category: string; detail: string } {
  if (systolic <= 0 || diastolic <= 0) {
    throw new Error('Blood pressure values must be positive numbers');
  }

  // Hypertensive crisis
  if (systolic > 180 || diastolic > 120) {
    return { category: 'Hypertensive crisis', detail: 'Seek emergency care' };
  }

  // Stage 2 hypertension
  if (systolic >= 140 || diastolic >= 90) {
    return { category: 'Stage 2 hypertension', detail: 'Consult a healthcare provider' };
  }

  // Stage 1 hypertension
  if (systolic >= 130 || diastolic >= 80) {
    return { category: 'Stage 1 hypertension', detail: 'Lifestyle changes and monitoring recommended' };
  }

  // Elevated
  if (systolic >= 120 && diastolic < 80) {
    return { category: 'Elevated', detail: 'Lifestyle changes recommended' };
  }

  // Normal
  return { category: 'Normal', detail: 'Maintain healthy lifestyle' };
}