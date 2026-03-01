// SignalStake BTC — Shared Types

export interface VaultStats {
  totalStaked: string;
  accumulatedYield: string;
  lastCompoundBlock: number;
  signalScore: number;
  apy: number;
  projection30d: string;
  projection90d: string;
}

export interface UserVaultInfo {
  address: string;
  stakedBalance: string;
  sharePercent: number;
  estimatedYield30d: string;
}

export interface SignalInfo {
  signalScore: number;
  yieldScore: number;
  riskScore: number;
  liquidityScore: number;
  level: 'strong' | 'moderate' | 'weak' | 'danger';
  warning: boolean;
  label: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function getSignalLevel(score: number): SignalInfo['level'] {
  if (score >= 70) return 'strong';
  if (score >= 50) return 'moderate';
  if (score >= 30) return 'weak';
  return 'danger';
}

export function getSignalLabel(level: SignalInfo['level']): string {
  switch (level) {
    case 'strong':   return 'Strong Signal — Optimal Conditions';
    case 'moderate': return 'Moderate Signal — Stable';
    case 'weak':     return 'Weak Signal — Monitor Closely';
    case 'danger':   return 'Danger Zone — High Risk';
  }
}
