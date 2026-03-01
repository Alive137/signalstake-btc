// SignalStake BTC — Shared Network Config

export const NETWORK = (process?.env?.OPNET_NETWORK ?? 'testnet') as 'testnet' | 'mainnet';

export const RPC_URLS = {
  testnet: 'https://testnet.opnet.org',
  mainnet: 'https://mainnet.opnet.org',
} as const;

export const RPC_URL = RPC_URLS[NETWORK];

// Replace with deployed contract address after running opnet-cli deploy
export const CONTRACT_ADDRESS: Record<'testnet' | 'mainnet', string> = {
  testnet: 'REPLACE_AFTER_DEPLOY',
  mainnet: 'REPLACE_AFTER_MAINNET_DEPLOY',
};

export const SIGNAL_THRESHOLD = 30;

export const COMPOUND_INTERVAL_BLOCKS = 144;
