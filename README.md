# Solana Account Closer

This Node.js TypeScript application facilitates the closure of Solana blockchain accounts.

**!!! I AM NOT RESPONSIBLE FOR RISKS AND FUNDS LOSS WHILE USING THIS TOOL !!!**

## Why

Each Solana account requires a fee of approximately 0.01 SOL, which can be recovered if the account is closed. Closing 100 accounts will return around 0.5 SOL back. [Read more](https://solana.com/docs/core/accounts)

## Prerequisites

Before running this application, ensure you have the following installed:

- Node.js (version 12.x or higher)
- npm (Node Package Manager)
- TypeScript
- Solana wallet
- (Optional) RPC endpoint

Set the environment variables in a `.env` file:

```dotenv
WALLET_PRIVATE_KEY=your_private_key_for_the_wallet
RPC_ENDPOINT=rpc_endpoint_url
```
For rpc you can use free ones listed [here](https://solana.com/rpc)

## Usage
There are 2 commands
- ```npm run clean``` Closes all accounts that do not have any tokens.
- ```npm run fullclean``` Closes **!!!ALL!!!** accounts. **!!! IF YOU HAVE ANY TOKENS ON THOSE ACCOUNTS THEY WILL BE LOST FOREVER!!!**

