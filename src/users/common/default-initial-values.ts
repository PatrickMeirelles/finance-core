import { PaymentMethod } from 'src/accounts/entities/enum/payment-method.enum';
import { IncomeExpensive } from 'src/common/enums/income-expensive.enum';

export const defaultValues = {
  accounts: [
    {
      name: 'Conta Corrente',
      type: PaymentMethod.CHECKING_ACCOUNT,
      closing_day: 12,
      due_day: 20,
      credit_limit: 5000,
    },
    {
      name: 'Carteira',
      type: PaymentMethod.CASH,
    },
  ],
  categories: [
    {
      name: 'Alimentação',
      type: IncomeExpensive.EXPENSIVE,
      color: '#F03913',
      icon: 'https://img.icons8.com/?size=100&id=CZkaOXsmy7I2&format=png&color=000000',
    },
    {
      name: 'Salário',
      type: IncomeExpensive.INCOME,
      color: '#219E23',
      icon: 'https://img.icons8.com/?size=100&id=123504&format=png&color=000000',
    },
    {
      name: 'Sonhos',
      type: IncomeExpensive.EXPENSIVE,
      color: '#243B9E',
      icon: 'https://img.icons8.com/?size=100&id=60097&format=png&color=000000',
    },
  ],
};
