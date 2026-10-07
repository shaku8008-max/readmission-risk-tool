import { describe, it, expect } from 'vitest';
import { computeBMI } from '@/lib/clinical/bmi';
import { classifyBloodPressure } from '@/lib/clinical/bloodPressure';

describe('computeBMI', () => {
  it('returns underweight for BMI < 18.5', () => {
    // 170cm, 50kg => BMI = 50 / 1.7^2 = 17.3
    const result = computeBMI(170, 50);
    expect(result.bmi).toBe(17.3);
    expect(result.category).toBe('Underweight');
  });

  it('returns normal weight for BMI 18.5-24.9', () => {
    // 170cm, 65kg => BMI = 65 / 1.7^2 = 22.5
    const result = computeBMI(170, 65);
    expect(result.bmi).toBe(22.5);
    expect(result.category).toBe('Normal weight');
  });

  it('returns overweight for BMI 25-29.9', () => {
    // 170cm, 75kg => BMI = 75 / 1.7^2 = 25.95 => 26.0
    const result = computeBMI(170, 75);
    expect(result.bmi).toBe(26);
    expect(result.category).toBe('Overweight');
  });

  it('returns obesity for BMI >= 30', () => {
    // 170cm, 90kg => BMI = 90 / 1.7^2 = 31.14 => 31.1
    const result = computeBMI(170, 90);
    expect(result.bmi).toBe(31.1);
    expect(result.category).toBe('Obesity');
  });

  it('handles exact boundary at 18.5', () => {
    // 180cm, 59.95kg => BMI = 59.95 / 1.8^2 = 18.503... rounds to 18.5
    const result = computeBMI(180, 59.95);
    expect(result.bmi).toBe(18.5);
    expect(result.category).toBe('Normal weight');
  });

  it('handles exact boundary at 25', () => {
    // 180cm, 81kg => BMI = 81 / 1.8^2 = 25.0
    const result = computeBMI(180, 81);
    expect(result.bmi).toBe(25);
    expect(result.category).toBe('Overweight');
  });

  it('handles exact boundary at 30', () => {
    // 180cm, 97.2kg => BMI = 97.2 / 1.8^2 = 30.0
    const result = computeBMI(180, 97.2);
    expect(result.bmi).toBe(30);
    expect(result.category).toBe('Obesity');
  });

  it('throws for non-positive height', () => {
    expect(() => computeBMI(0, 70)).toThrow('Height and weight must be positive numbers');
    expect(() => computeBMI(-170, 70)).toThrow('Height and weight must be positive numbers');
  });

  it('throws for non-positive weight', () => {
    expect(() => computeBMI(170, 0)).toThrow('Height and weight must be positive numbers');
    expect(() => computeBMI(170, -70)).toThrow('Height and weight must be positive numbers');
  });
});

describe('classifyBloodPressure', () => {
  it('returns Normal for <120/<80', () => {
    const result = classifyBloodPressure(110, 70);
    expect(result.category).toBe('Normal');
  });

  it('returns Elevated for 120-129/<80', () => {
    const result = classifyBloodPressure(125, 75);
    expect(result.category).toBe('Elevated');
  });

  it('returns Stage 1 hypertension for 130-139 or 80-89', () => {
    expect(classifyBloodPressure(130, 75).category).toBe('Stage 1 hypertension');
    expect(classifyBloodPressure(120, 85).category).toBe('Stage 1 hypertension');
  });

  it('returns Stage 2 hypertension for >=140 or >=90', () => {
    expect(classifyBloodPressure(140, 80).category).toBe('Stage 2 hypertension');
    expect(classifyBloodPressure(120, 90).category).toBe('Stage 2 hypertension');
  });

  it('returns Hypertensive crisis for >180 systolic', () => {
    const result = classifyBloodPressure(190, 80);
    expect(result.category).toBe('Hypertensive crisis');
  });

  it('returns Hypertensive crisis for >120 diastolic', () => {
    const result = classifyBloodPressure(150, 130);
    expect(result.category).toBe('Hypertensive crisis');
  });

  it('returns Stage 2 hypertension for exactly 180 systolic and normal diastolic', () => {
    const result = classifyBloodPressure(180, 75);
    expect(result.category).toBe('Stage 2 hypertension');
  });

  it('returns Normal for exactly 120/80 boundary (119/79)', () => {
    const result = classifyBloodPressure(119, 79);
    expect(result.category).toBe('Normal');
  });

  it('throws for non-positive values', () => {
    expect(() => classifyBloodPressure(0, 80)).toThrow('Blood pressure values must be positive numbers');
    expect(() => classifyBloodPressure(120, 0)).toThrow('Blood pressure values must be positive numbers');
  });
});