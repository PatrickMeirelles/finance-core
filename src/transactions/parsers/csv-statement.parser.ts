import {
  CENTS_PER_UNIT,
  CREDIT_MARKERS,
  CSV_AMOUNT_HEADERS,
  CSV_CREDIT_HEADERS,
  CSV_DATE_HEADERS,
  CSV_DEBIT_HEADERS,
  CSV_DELIMITERS,
  CSV_DESCRIPTION_HEADERS,
  CSV_TYPE_HEADERS,
  DEBIT_MARKERS,
} from '../constants/import.constants';
import { ParsedStatement, ParsedStatementRow } from './statement-parser.types';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})/;

/** Minus signs banks like to use instead of the ASCII hyphen. */
const DASHES = /[‐-―−]/g;
/** "R$", "BRL", "US$", "$", "€"... anywhere around the number. */
const CURRENCY = /(?:r\$|us\$|brl|usd|eur|[$€£])/gi;
/** A debit/credit letter or word glued to the amount: "12,50 D", "C 12,50", "12,50-DB". */
const MARKER_PREFIX = /^([a-zà-ú]{1,7})\b[\s:.-]*(?=[-+(]?\s*\d)/i;
const MARKER_SUFFIX = /(?<=\d[.,)]?)[\s-]*\b([a-zà-ú]{1,7})$/i;

export type Direction = 'debit' | 'credit' | null;

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/^"|"$/g, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim();
}

function detectDelimiter(headerLine: string): string {
  let best: string = CSV_DELIMITERS[0];
  let bestCount = -1;
  for (const delimiter of CSV_DELIMITERS) {
    const count = headerLine.split(delimiter).length;
    if (count > bestCount) {
      bestCount = count;
      best = delimiter;
    }
  }
  return best;
}

function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function findColumn(headers: string[], candidates: readonly string[]) {
  return headers.findIndex((header) => candidates.includes(header));
}

export function parseStatementDate(raw: string): Date | null {
  const value = raw.trim();
  const iso = ISO_DATE.exec(value);
  if (iso) {
    return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  }
  const br = BR_DATE.exec(value);
  if (br) {
    return new Date(Date.UTC(+br[3], +br[2] - 1, +br[1]));
  }
  return null;
}

/** Maps "D", "débito", "saída", "DEBIT"... to a direction; null when unknown. */
export function directionOf(raw: string | undefined): Direction {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (DEBIT_MARKERS.includes(value)) {
    return 'debit';
  }
  if (CREDIT_MARKERS.includes(value)) {
    return 'credit';
  }
  return null;
}

/**
 * Accepts "1234.56", "-1234,56", "1.234,56", "R$ 1.234,56", "(12.50)",
 * "12,50-" (trailing minus), "−12,50" (unicode minus), "12,50 D" / "C 12,50"
 * (debit/credit letters) and "+12,50". Negative means money out.
 */
export function parseAmountToCents(raw: string): number | null {
  let value = raw.trim().replace(DASHES, '-').replace(CURRENCY, '').trim();
  if (!value) {
    return null;
  }

  let direction: Direction = null;
  const prefix = MARKER_PREFIX.exec(value);
  if (prefix && directionOf(prefix[1])) {
    direction = directionOf(prefix[1]);
    value = value.slice(prefix[0].length).trim();
  }
  const suffix = MARKER_SUFFIX.exec(value);
  if (suffix && directionOf(suffix[1])) {
    direction = directionOf(suffix[1]);
    value = value.slice(0, suffix.index).trim();
  }

  const negativeByParentheses = /^\(.*\)$/.test(value);
  const negativeBySign = /^-|-$/.test(value.replace(/[\s()]/g, ''));
  const digits = value.replace(/[^0-9,.]/g, '');
  if (!/\d/.test(digits)) {
    return null;
  }

  const lastComma = digits.lastIndexOf(',');
  const lastDot = digits.lastIndexOf('.');
  const normalized =
    lastComma > lastDot
      ? digits.replace(/\./g, '').replace(',', '.')
      : digits.replace(/,/g, '');
  const magnitude = Number(normalized);
  if (!Number.isFinite(magnitude)) {
    return null;
  }

  const cents = Math.abs(Math.round(magnitude * CENTS_PER_UNIT));
  if (direction === 'debit' || negativeByParentheses || negativeBySign) {
    return -cents;
  }
  return cents;
}

/** Applies a direction read elsewhere (type column, OFX TRNTYPE) to an amount. */
export function applyDirection(
  amountInCents: number,
  direction: Direction,
): number {
  if (direction === 'debit') {
    return -Math.abs(amountInCents);
  }
  if (direction === 'credit') {
    return Math.abs(amountInCents);
  }
  return amountInCents;
}

type Columns = {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
  type: number;
};

function readAmount(cells: string[], columns: Columns): number | null {
  if (columns.amount !== -1) {
    const amount = parseAmountToCents(cells[columns.amount] ?? '');
    if (amount === null) {
      return null;
    }
    return applyDirection(
      amount,
      columns.type === -1 ? null : directionOf(cells[columns.type]),
    );
  }
  // Separate debit / credit columns: whichever is filled wins.
  const debit = parseAmountToCents(cells[columns.debit] ?? '');
  const credit = parseAmountToCents(cells[columns.credit] ?? '');
  if (debit) {
    return -Math.abs(debit);
  }
  if (credit) {
    return Math.abs(credit);
  }
  return debit === null && credit === null ? null : 0;
}

export function parseCsvStatement(content: string): ParsedStatement {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { rows: [], skipped: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter).map(normalizeHeader);
  const columns: Columns = {
    date: findColumn(headers, CSV_DATE_HEADERS),
    description: findColumn(headers, CSV_DESCRIPTION_HEADERS),
    amount: findColumn(headers, CSV_AMOUNT_HEADERS),
    debit: findColumn(headers, CSV_DEBIT_HEADERS),
    credit: findColumn(headers, CSV_CREDIT_HEADERS),
    type: findColumn(headers, CSV_TYPE_HEADERS),
  };

  const hasAmount =
    columns.amount !== -1 || (columns.debit !== -1 && columns.credit !== -1);
  if (columns.date === -1 || !hasAmount) {
    throw new Error(
      'CSV header must contain a date column and an amount column (or debit and credit columns)',
    );
  }

  const rows: ParsedStatementRow[] = [];
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cells = splitLine(line, delimiter);
    const date = parseStatementDate(cells[columns.date] ?? '');
    const amountInCents = readAmount(cells, columns);
    if (!date || amountInCents === null || amountInCents === 0) {
      skipped++;
      continue;
    }
    rows.push({
      date,
      description:
        columns.description === -1 ? '' : (cells[columns.description] ?? ''),
      amountInCents,
    });
  }

  return { rows, skipped };
}
