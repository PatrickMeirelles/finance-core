import { BadRequestException } from '@nestjs/common';
import { parseAmountToCents, parseCsvStatement } from './csv-statement.parser';
import { parseOfxStatement } from './ofx-statement.parser';
import { parseStatementFile } from './statement-parser';

describe('statement parsers', () => {
  describe('parseAmountToCents', () => {
    it.each([
      ['1234.56', 123456],
      ['-1234,56', -123456],
      ['1.234,56', 123456],
      ['R$ 1.234,56', 123456],
      ['(12.50)', -1250],
      ['abc', null],
      ['', null],
    ])('parses %p as %p', (raw, expected) => {
      expect(parseAmountToCents(raw)).toBe(expected);
    });
  });

  describe('parseCsvStatement', () => {
    it('reads comma separated files with ISO dates', () => {
      const result = parseCsvStatement(
        'date,description,amount\n2026-10-01,Supermarket,-50.00\n2026-10-05,Salary,2000.00\n',
      );
      expect(result.skipped).toBe(0);
      expect(result.rows).toEqual([
        {
          date: new Date('2026-10-01T00:00:00Z'),
          description: 'Supermarket',
          amountInCents: -5000,
        },
        {
          date: new Date('2026-10-05T00:00:00Z'),
          description: 'Salary',
          amountInCents: 200000,
        },
      ]);
    });

    it('reads semicolon separated files with Brazilian dates and decimals', () => {
      const result = parseCsvStatement(
        'Data;Histórico;Valor\n01/10/2026;"Mercado; compra";-1.250,30\n',
      );
      expect(result.rows).toEqual([
        {
          date: new Date('2026-10-01T00:00:00Z'),
          description: 'Mercado; compra',
          amountInCents: -125030,
        },
      ]);
    });

    it('skips rows with invalid date or amount', () => {
      const result = parseCsvStatement(
        'date,description,amount\nnot-a-date,X,10\n2026-10-01,Y,zero\n2026-10-01,Z,0\n',
      );
      expect(result.rows).toHaveLength(0);
      expect(result.skipped).toBe(3);
    });

    it('rejects files without the required columns', () => {
      expect(() => parseCsvStatement('foo,bar\n1,2\n')).toThrow(
        'CSV header must contain a date column and an amount column',
      );
    });
  });

  describe('parseOfxStatement', () => {
    const sgml = `OFXHEADER:100
<OFX>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261003120000[-3:BRT]
<TRNAMT>-75.00
<FITID>abc123
<MEMO>Restaurant
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20261004
<TRNAMT>500.00
<FITID>def456
<NAME>Client
</STMTTRN>
</BANKTRANLIST>
</OFX>`;

    it('reads SGML statements', () => {
      const result = parseOfxStatement(sgml);
      expect(result.skipped).toBe(0);
      expect(result.rows).toEqual([
        {
          date: new Date('2026-10-03T00:00:00Z'),
          description: 'Restaurant',
          amountInCents: -7500,
          externalId: 'abc123',
        },
        {
          date: new Date('2026-10-04T00:00:00Z'),
          description: 'Client',
          amountInCents: 50000,
          externalId: 'def456',
        },
      ]);
    });

    it('reads XML statements', () => {
      const xml =
        '<OFX><STMTTRN><DTPOSTED>20261010</DTPOSTED><TRNAMT>-5.00</TRNAMT><MEMO>Cafe</MEMO></STMTTRN></OFX>';
      expect(parseOfxStatement(xml).rows).toEqual([
        {
          date: new Date('2026-10-10T00:00:00Z'),
          description: 'Cafe',
          amountInCents: -500,
          externalId: undefined,
        },
      ]);
    });
  });

  describe('parseStatementFile', () => {
    it('dispatches by extension', () => {
      expect(
        parseStatementFile('x.CSV', 'date,amount\n2026-10-01,1\n').rows,
      ).toHaveLength(1);
      expect(
        parseStatementFile(
          'x.ofx',
          '<STMTTRN><DTPOSTED>20261001<TRNAMT>1</STMTTRN>',
        ).rows,
      ).toHaveLength(1);
    });

    it('rejects unsupported extensions', () => {
      expect(() => parseStatementFile('x.pdf', '')).toThrow(
        BadRequestException,
      );
    });
  });
});
