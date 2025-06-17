import {
  Commitment,
  TransactionConfirmationStrategy,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { solanaConnection, wallet } from './solana';
import { getTokenAccounts } from './cryptoQueries';
import logger from './utils/logger';
import { getMint, createBurnCheckedInstruction, createCloseAccountInstruction } from '@solana/spl-token';

const MAX_INSTRUCTIONS_PER_TX = 8;

async function sendBatchedTransaction(instructions: TransactionInstruction[]): Promise<void> {
  if (instructions.length === 0) return;

  const { blockhash, lastValidBlockHeight } = await solanaConnection.getLatestBlockhash('finalized');

  const message = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(message);
  tx.sign([wallet]);

  const signature = await solanaConnection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  logger.info(`Batch tx sent: ${signature} (${instructions.length} insts)`);

  const strategy: TransactionConfirmationStrategy = {
    signature,
    blockhash,
    lastValidBlockHeight,
  };

  const result = await solanaConnection.confirmTransaction(strategy);

  logger.info(`Confirmed: ${signature} status=${result.value.err ?? 'ok'}`);
}

export default async function clean(shouldForce: boolean): Promise<void> {
  logger.info(`Running ${shouldForce ? 'full ' : ''}clean`);

  const existingTokenAccounts = await getTokenAccounts(
    solanaConnection,
    wallet.publicKey,
    process.env.COMMITMENT as Commitment,
  );
  logger.info(`Got ${existingTokenAccounts.length} accounts`);

  const pendingInstructions: TransactionInstruction[] = [];

  for (const tokenAccount of existingTokenAccounts) {
    const mintAccount = await getMint(
      solanaConnection,
      tokenAccount.accountInfo.mint,
      process.env.COMMITMENT as Commitment,
    );

    if (mintAccount.freezeAuthority) {
      logger.warn(`${tokenAccount.accountInfo.mint.toString()} is frozen, skipping`);
      continue;
    }
    if (!shouldForce && tokenAccount.accountInfo.amount > 0) {
      logger.warn(`${tokenAccount.accountInfo.mint.toString()} still has tokens, skipping`);
      continue;
    }

    if (shouldForce && tokenAccount.accountInfo.amount > 0) {
      const burnIx = createBurnCheckedInstruction(
        tokenAccount.pubkey,
        tokenAccount.accountInfo.mint,
        wallet.publicKey,
        tokenAccount.accountInfo.amount,
        mintAccount.decimals,
      );
      pendingInstructions.push(burnIx);
    }

    const closeIx = createCloseAccountInstruction(tokenAccount.pubkey, wallet.publicKey, wallet.publicKey);
    pendingInstructions.push(closeIx);

    if (pendingInstructions.length >= MAX_INSTRUCTIONS_PER_TX) {
      await sendBatchedTransaction(pendingInstructions.splice(0, pendingInstructions.length));
    }
  }

  // send any remaining instructions
  if (pendingInstructions.length > 0) {
    await sendBatchedTransaction(pendingInstructions);
  }

  logger.info(`Clean completed`);
}
