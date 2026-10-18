export const IMPORT_FILE_FIELD = 'file';
export const IMPORT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const IMPORT_ALLOWED_EXTENSIONS = ['.csv', '.ofx'] as const;
export const CENTS_PER_UNIT = 100;
export const DEFAULT_IMPORT_DESCRIPTION = 'Imported transaction';
export const IMPORT_DESCRIPTION_MAX_LENGTH = 64;

/** Column names are compared after lower-casing and dropping anything in parentheses, e.g. "Valor (R$)" => "valor". */
export const CSV_DATE_HEADERS = [
  'date',
  'data',
  'dtposted',
  'transaction_date',
  'data lancamento',
  'data lançamento',
  'data da transacao',
  'data da transação',
];
export const CSV_DESCRIPTION_HEADERS = [
  'description',
  'descricao',
  'descrição',
  'memo',
  'historico',
  'histórico',
  'title',
  'name',
  'lancamento',
  'lançamento',
  'estabelecimento',
];
export const CSV_AMOUNT_HEADERS = [
  'amount',
  'value',
  'valor',
  'trnamt',
  'quantia',
  'montante',
];

/** Statements that split money out and money in into two columns. */
export const CSV_DEBIT_HEADERS = [
  'debito',
  'débito',
  'debit',
  'saida',
  'saída',
  'saidas',
  'saídas',
  'withdrawal',
  'despesa',
  'pagamento',
];
export const CSV_CREDIT_HEADERS = [
  'credito',
  'crédito',
  'credit',
  'entrada',
  'entradas',
  'deposit',
  'receita',
  'recebimento',
];

/** Statements that carry the direction in its own column. */
export const CSV_TYPE_HEADERS = [
  'tipo',
  'type',
  'd/c',
  'dc',
  'natureza',
  'operacao',
  'operação',
  'movimento',
  'trntype',
];

/** Values of a type column (or a letter next to the amount) that mean money out. */
export const DEBIT_MARKERS = [
  'd',
  'db',
  'deb',
  'debito',
  'débito',
  'debit',
  'saida',
  'saída',
  'despesa',
  'pagamento',
  'payment',
  'fee',
  'srvchg',
];
/** Values that mean money in. */
export const CREDIT_MARKERS = [
  'c',
  'cr',
  'cred',
  'credito',
  'crédito',
  'credit',
  'entrada',
  'receita',
  'deposito',
  'depósito',
  'dep',
  'directdep',
  'int',
];

export const CSV_DELIMITERS = [',', ';', '\t'] as const;
