import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financeAccounts, financeTransactions } from '@/lib/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { splitSmsMessages, parseSingleSms, ParsedSmsTransaction } from '@/lib/finance/smsParser';
import { matchAccount, detectDuplicate } from '@/lib/finance/smsMatcher';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const messages = splitSmsMessages(text);
    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages found' }, { status: 400 });
    }

    if (messages.length > 10) {
      return NextResponse.json({ error: 'You can add up to 10 SMS messages at a time.' }, { status: 400 });
    }

    // Fetch accounts to match against
    const accounts = await db.query.financeAccounts.findMany({
      where: eq(financeAccounts.userId, userId),
    });

    // Fetch recent transactions to check for duplicates (last 30 days is usually enough for SMS import)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentTxs = await db.query.financeTransactions.findMany({
      where: and(
        eq(financeTransactions.userId, userId),
        gte(financeTransactions.transactionDate, thirtyDaysAgoStr)
      ),
      orderBy: [desc(financeTransactions.transactionDate)],
    });

    const parsedResults = messages.map(msg => {
      const parsed = parseSingleSms(msg);
      const matchedAccount = matchAccount(parsed, accounts);
      
      let accountId = null;
      let accountName = null;
      
      if (matchedAccount) {
        accountId = matchedAccount.id;
        accountName = matchedAccount.name;
        parsed.confidence.account = 'detected';
      }

      // We attach accountId temporarily to help with duplicate detection or frontend state
      const enrichedTx = {
        ...parsed,
        accountId,
        accountName,
        duplicateOf: null as any
      };

      const duplicate = detectDuplicate(parsed, recentTxs);
      if (duplicate && duplicate.accountId === accountId) {
        enrichedTx.duplicateOf = duplicate.id;
      }

      return enrichedTx;
    });

    return NextResponse.json({ parsed: parsedResults });

  } catch (error) {
    console.error('SMS Parse Error:', error);
    return NextResponse.json({ error: 'Failed to parse SMS' }, { status: 500 });
  }
}
