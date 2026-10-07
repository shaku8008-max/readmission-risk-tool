import { describe, it, expect } from 'vitest';
import { dischargeToOneHot, DISCHARGE_OPTIONS, METFORMIN_OPTIONS } from '@/lib/model/encodings';

describe('dischargeToOneHot', () => {
  it('Home / other (0) sets all discharge features to 0', () => {
    const result = dischargeToOneHot(0);
    expect(result).toEqual({
      discharge_disposition_id_2: 0,
      discharge_disposition_id_3: 0,
      discharge_disposition_id_5: 0,
      discharge_disposition_id_6: 0,
      discharge_disposition_id_11: 0,
      discharge_disposition_id_18: 0,
      discharge_disposition_id_22: 0,
    });
  });

  it('discharge 2 sets only id_2 to 1', () => {
    const result = dischargeToOneHot(2);
    expect(result.discharge_disposition_id_2).toBe(1);
    expect(result.discharge_disposition_id_3).toBe(0);
    expect(result.discharge_disposition_id_5).toBe(0);
    expect(result.discharge_disposition_id_6).toBe(0);
    expect(result.discharge_disposition_id_11).toBe(0);
    expect(result.discharge_disposition_id_18).toBe(0);
    expect(result.discharge_disposition_id_22).toBe(0);
  });

  it('discharge 3 sets only id_3 to 1', () => {
    const result = dischargeToOneHot(3);
    expect(result.discharge_disposition_id_3).toBe(1);
    expect(result.discharge_disposition_id_2).toBe(0);
    expect(result.discharge_disposition_id_5).toBe(0);
    expect(result.discharge_disposition_id_6).toBe(0);
    expect(result.discharge_disposition_id_22).toBe(0);
  });

  it('discharge 5 sets only id_5 to 1', () => {
    const result = dischargeToOneHot(5);
    expect(result.discharge_disposition_id_5).toBe(1);
    expect(result.discharge_disposition_id_2).toBe(0);
    expect(result.discharge_disposition_id_3).toBe(0);
    expect(result.discharge_disposition_id_6).toBe(0);
    expect(result.discharge_disposition_id_22).toBe(0);
  });

  it('discharge 6 sets only id_6 to 1', () => {
    const result = dischargeToOneHot(6);
    expect(result.discharge_disposition_id_6).toBe(1);
    expect(result.discharge_disposition_id_2).toBe(0);
    expect(result.discharge_disposition_id_3).toBe(0);
    expect(result.discharge_disposition_id_5).toBe(0);
    expect(result.discharge_disposition_id_22).toBe(0);
  });

  it('discharge 22 sets only id_22 to 1', () => {
    const result = dischargeToOneHot(22);
    expect(result.discharge_disposition_id_22).toBe(1);
    expect(result.discharge_disposition_id_2).toBe(0);
    expect(result.discharge_disposition_id_3).toBe(0);
    expect(result.discharge_disposition_id_5).toBe(0);
    expect(result.discharge_disposition_id_6).toBe(0);
  });

  it('at most one discharge feature is 1 for any non-zero value', () => {
    [2, 3, 5, 6, 22].forEach((val) => {
      const result = dischargeToOneHot(val);
      const ones = Object.values(result).filter((v) => v === 1);
      expect(ones).toHaveLength(1);
    });
  });
});

describe('DISCHARGE_OPTIONS', () => {
  it('has exactly 6 options', () => {
    expect(DISCHARGE_OPTIONS).toHaveLength(6);
  });

  it('includes Home / other as default', () => {
    expect(DISCHARGE_OPTIONS[0]).toEqual({ value: 0, label: 'Home / other (default)' });
  });

  it('does not include expired (11) or NULL (18) as options', () => {
    const values = DISCHARGE_OPTIONS.map((o) => o.value);
    expect(values).not.toContain(11);
    expect(values).not.toContain(18);
  });
});

describe('METFORMIN_OPTIONS', () => {
  it('has exactly 4 options (0-3)', () => {
    expect(METFORMIN_OPTIONS).toHaveLength(4);
  });

  it('option 0 is "Not on metformin"', () => {
    expect(METFORMIN_OPTIONS[0]).toEqual({ value: 0, label: 'Not on metformin' });
  });

  it('option 2 is "Dose unchanged (steady)"', () => {
    expect(METFORMIN_OPTIONS[2]).toEqual({ value: 2, label: 'Dose unchanged (steady)' });
  });

  it('option 3 is "Dose increased"', () => {
    expect(METFORMIN_OPTIONS[3]).toEqual({ value: 3, label: 'Dose increased' });
  });
});