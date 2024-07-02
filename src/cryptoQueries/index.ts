import { TOKEN_PROGRAM_ID, TokenAccount, SPL_ACCOUNT_LAYOUT } from '@raydium-io/raydium-sdk';
import { Connection, PublicKey, Commitment } from '@solana/web3.js';

export async function getTokenAccounts(connection: Connection, owner: PublicKey, commitment: Commitment) {
  const tokenResp = await connection.getTokenAccountsByOwner(
    owner,
    {
      programId: TOKEN_PROGRAM_ID,
    },
    commitment,
  );

  const accounts: TokenAccount[] = [];
  for (const { pubkey, account } of tokenResp.value) {
    accounts.push({
      pubkey,
      programId: account.owner,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
    });
  }

  return accounts;
}
