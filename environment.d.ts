import { Commitment, Connection, PublicKey } from '@solana/web3.js';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      RPC_ENDPOINT: string;
      WALLET_PRIVATE_KEY: string;
    }
  }
}
export {};
