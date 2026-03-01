// SignalStake BTC — JSONRpcProvider
// CLAUDE.md: Use JSONRpcProvider from opnet.
// NEVER use fetch/axios for chain data.

import { JSONRpcProvider } from 'opnet';
import { RPC_URLS } from '../../shared/src/config';

const network = (process.env.OPNET_NETWORK ?? 'testnet') as 'testnet' | 'mainnet';
const rpcUrl = RPC_URLS[network];

// Singleton provider — all backend chain reads go through this
export const provider = new JSONRpcProvider(rpcUrl);

export { network };
