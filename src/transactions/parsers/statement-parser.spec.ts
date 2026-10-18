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
      ['12,50-', -1250],
      ['1.234,56-', -123456],
      ['\u221212,50', -1250],
      ['R$ -12,50', -1250],
      ['-R$ 12,50', -1250],
      ['+12,50', 1250],
      ['12,50 D', -1250],
      ['12,50 C', 1250],
      ['D 12,50', -1250],
      ['C 12,50', 1250],
      ['12,50 DB', -1250],
      ['12,50 CR', 1250],
      ['R$ 12,50 Débito', -1250],
      ['BRL 2.000,00', 200000],
    ])('parses %p as %p', (raw, expected) => {
      expect(parseAmountToCents(raw)).toBe(expected);
    });
  });

  describe('direction markers and column layouts', () => {
    it('uses a type column to decide the sign when amounts are unsigned', () => {
      const result = parseCsvStatement(
        'Data;Histórico;Valor;Tipo\n01/10/2026;Mercado;50,00;D\n05/10/2026;Salário;2000,00;C\n06/10/2026;Pix;30,00;Débito\n07/10/2026;Pix recebido;80,00;Crédito\n',
      );
      expect(result.rows.map((row) => row.amountInCents)).toEqual([
        -5000, 200000, -3000, 8000,
      ]);
    });

    it('keeps the explicit sign when the type column is unknown', () => {
      const result = parseCsvStatement(
        'data,descricao,valor,tipo\n2026-10-01,Mercado,-50.00,PIX\n2026-10-05,Salario,2000.00,TED\n',
      );
      expect(result.rows.map((row) => row.amountInCents)).toEqual([
        -5000, 200000,
      ]);
    });

    it('reads statements with separate debit and credit columns', () => {
      const result = parseCsvStatement(
        'Data;Lançamento;Débito;Crédito\n01/10/2026;Mercado;50,00;\n05/10/2026;Salário;;2.000,00\n06/10/2026;Zerado;;\n',
      );
      expect(result.skipped).toBe(1);
      expect(result.rows.map((row) => row.amountInCents)).toEqual([
        -5000, 200000,
      ]);
    });

    it('accepts headers with units and a BOM', () => {
      const result = parseCsvStatement(
        '\uFEFF"Data";"Descrição";"Valor (R$)"\n"01/10/2026";"Mercado";"-50,00"\n',
      );
      expect(result.rows[0].amountInCents).toBe(-5000);
    });

    it('uses TRNTYPE when the OFX amount has no sign', () => {
      const ofx = [
        '<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261001<TRNAMT>50.00<FITID>1<MEMO>Mercado',
        '<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261005<TRNAMT>2000.00<FITID>2<MEMO>Salario',
        '<STMTTRN><TRNTYPE>PAYMENT<DTPOSTED>20261006<TRNAMT>-30.00<FITID>3<MEMO>Boleto',
        '<STMTTRN><TRNTYPE>XFER<DTPOSTED>20261007<TRNAMT>-10.00<FITID>4<MEMO>Transf',
      ].join('\n');
      expect(
        parseOfxStatement(ofx).rows.map((row) => row.amountInCents),
      ).toEqual([-5000, 200000, -3000, -1000]);
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
