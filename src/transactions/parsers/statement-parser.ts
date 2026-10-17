import { extname } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { IMPORT_ALLOWED_EXTENSIONS } from '../constants/import.constants';
import { parseCsvStatement } from './csv-statement.parser';
import { parseOfxStatement } from './ofx-statement.parser';
import { ParsedStatement } from './statement-parser.types';

export function parseStatementFile(
  fileName: string,
  content: string,
): ParsedStatement {
  const extension = extname(fileName).toLowerCase();

  if (extension === '.csv') {
    try {
      return parseCsvStatement(content);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  if (extension === '.ofx') {
    return parseOfxStatement(content);
  }

  throw new BadRequestException(
    `Unsupported file type. Allowed: ${IMPORT_ALLOWED_EXTENSIONS.join(', ')}`,
  );
}
