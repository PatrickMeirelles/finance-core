export const IMPORT_FILE_FIELD = 'file';
export const IMPORT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const IMPORT_ALLOWED_EXTENSIONS = ['.csv', '.ofx'] as const;
export const CENTS_PER_UNIT = 100;
export const DEFAULT_IMPORT_DESCRIPTION = 'Imported transaction';
export const IMPORT_DESCRIPTION_MAX_LENGTH = 64;

export const CSV_DATE_HEADERS = [
  'date',
  'data',
  'dtposted',
  'transaction_date',
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
];
export const CSV_AMOUNT_HEADERS = ['amount', 'value', 'valor', 'trnamt'];
export const CSV_DELIMITERS = [',', ';', '\t'] as const;
