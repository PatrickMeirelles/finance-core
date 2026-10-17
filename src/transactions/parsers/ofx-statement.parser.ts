import { parseAmountToCents } from './csv-statement.parser';
import { ParsedStatement, ParsedStatementRow } from './statement-parser.types';

const TRANSACTION_BLOCK =
  /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi;
const OFX_DATE = /^(\d{4})(\d{2})(\d{2})/;

function readTag(block: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i').exec(block);
  return match?.[1].trim();
}

export function parseOfxDate(raw: string | undefined): Date | null {
  if (!raw) {
    return null;
  }
  const match = OFX_DATE.exec(raw.trim());
  if (!match) {
    return null;
  }
  return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
}

/**
 * Handles both SGML (OFX 1.x, tags without closing) and XML (OFX 2.x) files.
 */
export function parseOfxStatement(content: string): ParsedStatement {
  const rows: ParsedStatementRow[] = [];
  let skipped = 0;

  for (const match of content.matchAll(TRANSACTION_BLOCK)) {
    const block = match[1];
    const date = parseOfxDate(readTag(block, 'DTPOSTED'));
    const amountInCents = parseAmountToCents(readTag(block, 'TRNAMT') ?? '');
    if (!date || amountInCents === null || amountInCents === 0) {
      skipped++;
      continue;
    }
    rows.push({
      date,
      description: readTag(block, 'MEMO') ?? readTag(block, 'NAME') ?? '',
      amountInCents,
      externalId: readTag(block, 'FITID'),
    });
  }

  return { rows, skipped };
}
