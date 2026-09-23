import { ParsedSmsTransaction } from './smsParser';

export function matchAccount(parsed: ParsedSmsTransaction, accounts: any[]): any | null {
  if (!parsed.accountLast4 && !parsed.bank) return null;
  
  // Try to match based on last4
  if (parsed.accountLast4) {
    const matches = accounts.filter(a => a.lastFour === parsed.accountLast4);
    if (matches.length === 1) return matches[0];
    
    // If multiple matches, try to narrow down by bank/name
    if (matches.length > 1 && parsed.bank) {
      const refined = matches.filter(a => a.name.toLowerCase().includes(parsed.bank!.toLowerCase()));
      if (refined.length === 1) return refined[0];
    }
  }

  // If no last4 but we have a bank name, and they only have one account with that bank
  if (!parsed.accountLast4 && parsed.bank) {
    const matches = accounts.filter(a => a.name.toLowerCase().includes(parsed.bank!.toLowerCase()));
    if (matches.length === 1) return matches[0];
  }

  // Credit card specific matching if last4 matches and it's marked as credit card
  if (parsed.isCreditCard && parsed.accountLast4) {
    const ccMatches = accounts.filter(a => a.type === 'CREDIT_CARD' && a.lastFour === parsed.accountLast4);
    if (ccMatches.length > 0) return ccMatches[0];
  }

  return null;
}

export function detectDuplicate(parsed: ParsedSmsTransaction, existingTransactions: any[]): any | null {
  // 1. Strongest match: Reference Number
  if (parsed.reference) {
    // Some metadata might store reference in `notes` or `sourceMetadata.reference`
    // Wait, in our schema we don't have a dedicated reference field. 
    // We will assume it gets saved in `notes` as `Ref: 12345` or similar, 
    // but better yet, we can check if any existing transaction has the exact amount and date.
    const refMatches = existingTransactions.filter(t => 
      t.notes?.includes(parsed.reference!) || 
      (t.sourceMetadata && typeof t.sourceMetadata === 'object' && (t.sourceMetadata as any).reference === parsed.reference)
    );
    if (refMatches.length > 0) return refMatches[0];
  }

  // 2. Date + Amount + Account Match (likely duplicate)
  if (parsed.date && parsed.amount) {
    const matches = existingTransactions.filter(t => 
      t.transactionDate === parsed.date && 
      t.amount === parsed.amount
      // We could also check t.accountId, but the parsed accountId isn't on `parsed` object yet.
      // It will be added in the API layer before duplicate detection.
    );
    if (matches.length > 0) {
      // If we also matched the account ID externally, it's very likely.
      return matches[0];
    }
  }

  return null;
}
