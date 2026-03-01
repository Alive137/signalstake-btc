// SignalStake BTC — Wallet Hook
// OP_WALLET ONLY. Never MetaMask.

import { useState, useCallback, useEffect } from 'react';
import { WalletConnect } from '@btc-vision/walletconnect';

export interface WalletState {
  connected: boolean;
  address: string | null;
  connecting: boolean;
  error: string | null;
}

const walletConnect = new WalletConnect();

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    connecting: false,
    error: null,
  });

  useEffect(() => {
    const tryReconnect = async () => {
      try {
        const session = await walletConnect.getSession();
        if (session?.address) {
          setState(s => ({ ...s, connected: true, address: session.address }));
        }
      } catch {
        // No existing session
      }
    };
    tryReconnect();
  }, []);

  const connect = useCallback(async () => {
    setState(s => ({ ...s, connecting: true, error: null }));
    try {
      await walletConnect.connect();
      const session = await walletConnect.getSession();
      if (!session?.address) throw new Error('No address returned from wallet');
      setState({ connected: true, address: session.address, connecting: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setState(s => ({ ...s, connecting: false, error: message }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletConnect.disconnect();
    } catch {
      // Best-effort
    }
    setState({ connected: false, address: null, connecting: false, error: null });
  }, []);

  return { ...state, connect, disconnect, walletConnect };
}
