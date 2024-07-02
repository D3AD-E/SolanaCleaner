import { Commitment, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { solanaConnection, wallet } from './solana';
import { getTokenAccounts } from './cryptoQueries';
import logger from './utils/logger';
import { getMint, createBurnCheckedInstruction, createCloseAccountInstruction } from '@solana/spl-token';

export default async function clean(shouldForce: boolean): Promise<void> {
  logger.info(`Running ${shouldForce ? 'full ' : ''}clean`);
  const existingTokenAccounts = await getTokenAccounts(
    solanaConnection,
    wallet.publicKey,
    process.env.COMMITMENT as Commitment,
  );
  logger.info(`Got ${existingTokenAccounts.length} accounts`);
  for (const tokenAccount of existingTokenAccounts) {
    const mintAccount = await getMint(
      solanaConnection,
      tokenAccount.accountInfo.mint,
      process.env.COMMITMENT as Commitment,
    );
    if (mintAccount.freezeAuthority) {
      logger.warn(tokenAccount.accountInfo.mint.toString() + ' is frozen, skipping');
      continue;
    }
    if (!shouldForce && tokenAccount.accountInfo.amount > 0) {
      logger.warn(tokenAccount.accountInfo.mint.toString() + ' still has tokens, skipping');
      continue;
    }
    const burnIx = createBurnCheckedInstruction(
      tokenAccount.pubkey,
      tokenAccount.accountInfo.mint,
      wallet.publicKey,
      tokenAccount.accountInfo.amount,
      mintAccount.decimals,
    );
    const recentBlockhash = await solanaConnection.getLatestBlockhash('finalized');
    const closeAccount = createCloseAccountInstruction(tokenAccount.pubkey, wallet.publicKey, wallet.publicKey);
    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: shouldForce ? [burnIx, closeAccount] : [closeAccount],
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([wallet]);
    const signature = await solanaConnection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
    });
    logger.info('Sent ' + signature);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  logger.info(`Clean completed`);
}
