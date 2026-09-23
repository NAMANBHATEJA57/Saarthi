import { describe, it, expect } from 'vitest';
import { parseSingleSms } from '../smsParser';

describe('SMS Parser', () => {
  it('TEST 1 — Single debit SMS', () => {
    const msg = 'ICICI Bank Acct XX006 debited for Rs 900.00 on 01-Sep-26; KUNAAL WADHWA credited. UPI:211545899748. Call 18002662 for dispute. SMS BLOCK 006 to 9215676766';
    const result = parseSingleSms(msg);
    expect(result.type).toBe('EXPENSE');
    expect(result.amount).toBe(900);
    expect(result.date).toBe('2026-09-01');
    expect(result.bank).toBe('ICICI Bank');
    expect(result.accountLast4).toBe('006');
    expect(result.merchant).toBe('KUNAAL WADHWA');
    expect(result.paymentMethod).toBe('UPI');
    expect(result.reference).toBe('211545899748');
    expect(result.source).toBe('SMS');
  });

  it('TEST 2 — UPI DEBIT WITH ₹ (SAMPLE 2)', () => {
    const msg = 'Your A/C XX1234 has been debited by Rs.1,250.00 on 02-09-26 for UPI transaction to SWIGGY. UPI Ref No 987654321012.';
    const result = parseSingleSms(msg);
    expect(result.type).toBe('EXPENSE');
    expect(result.amount).toBe(1250);
    expect(result.date).toBe('2026-09-02');
    expect(result.accountLast4).toBe('1234');
    expect(result.merchant).toBe('SWIGGY');
    expect(result.paymentMethod).toBe('UPI');
    expect(result.reference).toBe('987654321012');
  });

  it('TEST 3 — UPI CREDIT (SAMPLE 3)', () => {
    const msg = 'ICICI Bank Acct XX006 credited with Rs 5,000.00 on 02-Sep-26. UPI Ref No: 123456789012.';
    const result = parseSingleSms(msg);
    expect(result.type).toBe('INCOME');
    expect(result.amount).toBe(5000);
    expect(result.date).toBe('2026-09-02');
    expect(result.bank).toBe('ICICI Bank');
    expect(result.accountLast4).toBe('006');
    expect(result.paymentMethod).toBe('UPI');
    expect(result.reference).toBe('123456789012');
  });

  it('TEST 4 — DEBIT WITH MERCHANT (SAMPLE 4)', () => {
    const msg = 'Rs 450.00 debited from A/c XX4587 on 02-Sep-26 at AMAZON via UPI. Ref: 456789123456.';
    const result = parseSingleSms(msg);
    expect(result.type).toBe('EXPENSE');
    expect(result.amount).toBe(450);
    expect(result.date).toBe('2026-09-02');
    expect(result.accountLast4).toBe('4587');
    expect(result.merchant).toBe('AMAZON');
    expect(result.paymentMethod).toBe('UPI');
    expect(result.reference).toBe('456789123456');
  });

  it('TEST 5 — CREDIT / MONEY RECEIVED (SAMPLE 5)', () => {
    const msg = 'INR 10,000 credited to your A/C XX006 on 02-Sep-26. UPI Ref 998877665544.';
    const result = parseSingleSms(msg);
    expect(result.type).toBe('INCOME');
    expect(result.amount).toBe(10000);
    expect(result.date).toBe('2026-09-02');
    expect(result.accountLast4).toBe('006');
    expect(result.paymentMethod).toBe('UPI');
    expect(result.reference).toBe('998877665544');
  });

  it('TEST 6 — CARD TRANSACTION (SAMPLE 6)', () => {
    const msg = 'ICICI Bank Credit Card XX4321 used for Rs 2,499.00 at AMAZON on 02-Sep-26. Available credit limit Rs 97,501.';
    const result = parseSingleSms(msg);
    expect(result.type).toBe('EXPENSE');
    expect(result.amount).toBe(2499);
    expect(result.date).toBe('2026-09-02');
    expect(result.accountLast4).toBe('4321');
    expect(result.merchant).toBe('AMAZON');
    expect(result.paymentMethod).toBe('CREDIT_CARD');
  });

  it('TEST 7 — DIFFERENT WORDING (SAMPLE 7)', () => {
    const msg = 'Your A/c XX006 has been debited with INR 750 on 01/09/2026 for UPI payment to UBER. UPI Ref: 445566778899.';
    const result = parseSingleSms(msg);
    expect(result.type).toBe('EXPENSE');
    expect(result.amount).toBe(750);
    expect(result.date).toBe('2026-09-01');
    expect(result.accountLast4).toBe('006');
    expect(result.merchant).toBe('UBER');
    expect(result.paymentMethod).toBe('UPI');
    expect(result.reference).toBe('445566778899');
  });

  it('TEST 8 — ATM / CASH WITHDRAWAL (SAMPLE 8)', () => {
    const msg = 'Rs 5,000 withdrawn from A/C XX006 on 01-Sep-26 at ATM.';
    const result = parseSingleSms(msg);
    expect(result.type).toBe('UNSUPPORTED');
    expect(result.amount).toBe(5000);
    expect(result.date).toBe('2026-09-01');
    expect(result.accountLast4).toBe('006');
    expect(result.paymentMethod).toBe('ATM');
  });
});
