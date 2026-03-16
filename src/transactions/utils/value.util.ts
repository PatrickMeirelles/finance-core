export class ValueUtil {
  static formatToCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  static formatValue(value: number) {
    return value / 10;
  }
}
