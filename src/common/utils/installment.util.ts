import { safeAddMonths } from './date.util';

type GeneratedInstallment = {
  installment: number;
  value: number;
  transactionDate: Date;
};

type InstallmentInput = {
  value: number;
  amountInstallments: number;
  installment: number;
  transactionDate: Date;
  status: string;
};

export function generateInstallments(
  dto: InstallmentInput,
): GeneratedInstallment[] {
  const { value, amountInstallments, installment, transactionDate } = dto;

  const baseDate = new Date(transactionDate);

  const installmentValue = Math.floor(value / amountInstallments);
  const remainder = value % amountInstallments;

  const installments: GeneratedInstallment[] = [];

  for (let i = 1; i <= amountInstallments; i++) {
    const diff = i - installment;

    const date = safeAddMonths(baseDate, diff);

    let currentValue = installmentValue;

    if (i === amountInstallments) {
      currentValue += remainder;
    }

    installments.push({
      installment: i,
      value: currentValue,
      transactionDate: date,
    });
  }

  return installments;
}
