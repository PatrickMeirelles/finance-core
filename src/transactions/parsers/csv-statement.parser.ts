import {
  CENTS_PER_UNIT,
  CSV_AMOUNT_HEADERS,
  CSV_DATE_HEADERS,
  CSV_DELIMITERS,
  CSV_DESCRIPTION_HEADERS,
} from '../constants/import.constants';
import { ParsedStatement, ParsedStatementRow } from './statement-parser.types';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})/;

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/^"|"$/g, '');
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

/**
 * Accepts "1234.56", "-1234,56", "1.234,56", "R$ 1.234,56" and "(12.50)".
 */
export function parseAmountToCents(raw: string): number | null {
  let value = raw.trim();
  if (!value) {
    return null;
  }
  const negativeByParentheses = /^\(.*\)$/.test(value);
  value = value.replace(/[^0-9,.-]/g, '');
  if (!/\d/.test(value)) {
    return null;
  }
  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  if (lastComma > lastDot) {
    value = value.replace(/\./g, '').replace(',', '.');
  } else {
    value = value.replace(/,/g, '');
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const cents = Math.round(parsed * CENTS_PER_UNIT);
  return negativeByParentheses ? -Math.abs(cents) : cents;
}

export function parseCsvStatement(content: string): ParsedStatement {
  const lines = content
    .replace(/^ /, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { rows: [], skipped: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter).map(normalizeHeader);
  const dateIndex = findColumn(headers, CSV_DATE_HEADERS);
  const descriptionIndex = findColumn(headers, CSV_DESCRIPTION_HEADERS);
  const amountIndex = findColumn(headers, CSV_AMOUNT_HEADERS);

  if (dateIndex === -1 || amountIndex === -1) {
    throw new Error(
      'CSV header must contain a date column and an amount column',
    );
  }

  const rows: ParsedStatementRow[] = [];
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cells = splitLine(line, delimiter);
    const date = parseStatementDate(cells[dateIndex] ?? '');
    const amountInCents = parseAmountToCents(cells[amountIndex] ?? '');
    if (!date || amountInCents === null || amountInCents === 0) {
      skipped++;
      continue;
    }
    rows.push({
      date,
      description:
        descriptionIndex === -1 ? '' : (cells[descriptionIndex] ?? ''),
      amountInCents,
    });
  }

  return { rows, skipped };
}
