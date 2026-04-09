interface PDITier {
  min: number;
  max: number;
  rate: number;
  fixedMonthly: number | null;
}

const PDI_RATE_TABLE: PDITier[] = [
  { min: 0, max: 11599, rate: 0, fixedMonthly: 70.00 },
  { min: 11600, max: 14999, rate: 7.42, fixedMonthly: null },
  { min: 15000, max: 19999, rate: 7.17, fixedMonthly: null },
  { min: 20000, max: 29999, rate: 6.67, fixedMonthly: null },
  { min: 30000, max: 39999, rate: 6.17, fixedMonthly: null },
  { min: 40000, max: 49999, rate: 5.90, fixedMonthly: null },
  { min: 50000, max: 59999, rate: 5.42, fixedMonthly: null },
  { min: 60000, max: 69999, rate: 5.42, fixedMonthly: null },
  { min: 70000, max: 79999, rate: 5.42, fixedMonthly: null },
  { min: 80000, max: 89999, rate: 5.42, fixedMonthly: null },
  { min: 90000, max: 99999, rate: 5.42, fixedMonthly: null },
  { min: 100000, max: 199999, rate: 4.92, fixedMonthly: null },
];

export interface PDIResult {
  pdiMonthly: number;
  pdiPercentage: number;
  pdiWeeklyDeposit: number;
}

export function calculatePDI(truckValue: number): PDIResult {
  if (!truckValue || truckValue <= 0) {
    return { pdiMonthly: 0, pdiPercentage: 0, pdiWeeklyDeposit: 0 };
  }

  const tier = PDI_RATE_TABLE.find((t) => truckValue >= t.min && truckValue <= t.max);
  if (!tier) {
    return { pdiMonthly: 0, pdiPercentage: 0, pdiWeeklyDeposit: 0 };
  }

  let pdiMonthly: number;
  let pdiPercentage: number;

  if (tier.fixedMonthly !== null) {
    pdiMonthly = tier.fixedMonthly;
    pdiPercentage = 0;
  } else {
    pdiMonthly = Math.round((truckValue * tier.rate / 100) / 12 * 100) / 100;
    pdiPercentage = tier.rate;
  }

  const pdiWeeklyDeposit = Math.round(pdiMonthly / 4 * 100) / 100;

  return { pdiMonthly, pdiPercentage, pdiWeeklyDeposit };
}
