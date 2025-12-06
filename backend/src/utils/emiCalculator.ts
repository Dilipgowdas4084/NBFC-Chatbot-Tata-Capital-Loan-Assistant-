export const calculateEMI = (principal: number, annualRate: number, months: number): number => {
    const r = annualRate / 12; // Monthly interest rate
    // EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]

    if (annualRate === 0) return principal / months;

    const numerator = principal * r * Math.pow(1 + r, months);
    const denominator = Math.pow(1 + r, months) - 1;

    return Math.round(numerator / denominator);
};
