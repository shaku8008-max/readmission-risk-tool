export function computeBMI(
  heightCm: number,
  weightKg: number
): { bmi: number; category: string } {
  if (heightCm <= 0 || weightKg <= 0) {
    throw new Error('Height and weight must be positive numbers');
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category: string;
  if (bmi < 18.5) {
    category = 'Underweight';
  } else if (bmi < 25) {
    category = 'Normal weight';
  } else if (bmi < 30) {
    category = 'Overweight';
  } else {
    category = 'Obesity';
  }
  return { bmi: Math.round(bmi * 10) / 10, category };
}