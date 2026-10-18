export type ParsedStatementRow = {
  date: Date;
  description: string;
  /** Signed amount in cents. Negative values are expenses. */
  amountInCents: number;
  externalId?: string;
};

export type ParsedStatement = {
  rows: ParsedStatementRow[];
  skipped: number;
};
