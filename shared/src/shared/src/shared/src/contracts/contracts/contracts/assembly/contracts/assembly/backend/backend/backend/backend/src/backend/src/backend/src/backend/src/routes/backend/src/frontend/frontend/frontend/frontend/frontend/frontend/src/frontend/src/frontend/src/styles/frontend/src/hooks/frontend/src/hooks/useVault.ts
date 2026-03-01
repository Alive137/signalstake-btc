// SignalStake BTC — Vault Hook
// Separate JSONRpcProvider for reads. Always simulate before sending.

import { useState, useEffect, useCallback } from 'react';
import { JSONRpcProvider, getContract } from 'opnet';
import { WalletConnect } from '@btc-vision/walletconnect';
import { SIGNAL_STAKE_ABI } from '../../../shared/src/abi';
import { CONTRACT_ADDRESS, RPC_URL, NETWORK } from '../../../shared/src/config';
import type { VaultStats, UserVaultInfo, SignalInfo } from '../../../shared/src/types';

const readProvider = new JSONRpcProvider(RPC_URL);
const contractAddress = CONTRACT_ADDRESS[NETWORK];
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

async function fetchVaultStats(): Promise<VaultStats> {
  const res = await fetch(`${BACKEND_URL}/vault/stats`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as VaultStats;
}

async function fetchUserInfo(address: string): Promise<UserVaultInfo> {
  const res = await fetch(`${BACKEND_URL}/vault/user/${address}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as UserVaultInfo;
}

async function fetchSignal(): Promise<SignalInfo> {
  const res = await fetch(`${BACKEND_URL}/vault/signal`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as SignalInfo;
}

export interface VaultHookState {
  stats:       VaultStats | null;
  userInfo:    UserVaultInfo | null;
  signal:      SignalInfo | null;
  loading:     boolean;
  txPending:   boolean;
  error:       string | null;
  txSuccess:   string | null;
}

export function useVault(address: string | null, walletConnect: WalletConnect) {
  const [state, setState] = useState<VaultHookState>({
    stats: null, userInfo: null, signal: null,
    loading: false, txPending: false, error: null, txSuccess: null,
  });

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const [stats, signal, userInfo] = await Promise.all([
        fetchVaultStats(),
        fetchSignal(),
        address ? fetchUserInfo(address) : Promise.resolve(null),
      ]);
      setState(s => ({ ...s, stats, signal, userInfo, loading: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load vault data';
      setState(s => ({ ...s, loading: false, error: message }));
    }
  }, [address]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const clearMessages = () =>
    setState(s => ({ ...s, error: null, txSuccess: null }));

  const runTx = useCallback(async (
    methodName: 'stake' | 'withdraw' | 'compound',
    args: unknown[],
  ) => {
    if (!address) return;
    clearMessages();
    setState(s => ({ ...s, txPending: true }));

    try {
      const readContract = getContract(contractAddress, SIGNAL_STAKE_ABI, readProvider, NETWORK, address);
      const simulation = await (readContract as any)[methodName](...args);
      if ('error' in simulation) {
        throw new Error(`Simulation failed: ${simulation.error}`);
      }
      const walletProvider = walletConnect.getProvider();
      const writeContract = getContract(contractAddress, SIGNAL_STAKE_ABI, walletProvider, NETWORK, address);
      const tx = await (writeContract as any)[methodName](...args);
      setState(s => ({
        ...s,
        txPending: false,
        txSuccess: `Transaction sent: ${tx?.hash ?? 'confirmed'}`,
      }));
      setTimeout(refresh, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setState(s => ({ ...s, txPending: false, error: message }));
    }
  }, [address, walletConnect, refresh]);

  const stake    = useCallback((sats: bigint) => runTx('stake',    [sats]), [runTx]);
  const withdraw = useCallback((sats: bigint) => runTx('withdraw', [sats]), [runTx]);
  const compound = useCallback(()             => runTx('compound', []),     [runTx]);

  return { ...state, refresh, stake, withdraw, compound };
    }
