// SignalStake BTC — Vault Service

import { getContract } from 'opnet';
import { provider, network } from './provider';
import { cache, TTL } from './cache';
import { SIGNAL_STAKE_ABI } from '../../shared/src/abi';
import {
  VaultStats, UserVaultInfo, SignalInfo,
  getSignalLevel, getSignalLabel,
} from '../../shared/src/types';

const contractAddress = process.env.CONTRACT_ADDRESS ?? '';

const BLOCKS_PER_YEAR = 52_560;

function computeApy(
  totalStaked: bigint,
  accumulatedYield: bigint,
  blocksSinceCompound: number,
): number {
  if (totalStaked === 0n || blocksSinceCompound === 0) return 0;
  const yieldPerBlock = accumulatedYield / BigInt(blocksSinceCompound);
  const annualYield = yieldPerBlock * BigInt(BLOCKS_PER_YEAR);
  const apy = Number((annualYield * 10_000n) / totalStaked) / 100;
  return Math.min(apy, 999);
}

function computeProjection(
  stakedSats: bigint,
  apy: number,
  days: number,
): string {
  const yearFraction = days / 365;
  const projected = Number(stakedSats) * (1 + apy / 100) ** yearFraction;
  return BigInt(Math.round(projected)).toString();
}

export async function getVaultStats(): Promise<VaultStats> {
  const cached = cache.get<VaultStats>('vault:stats');
  if (cached) return cached;

  const contract = getContract(contractAddress, SIGNAL_STAKE_ABI, provider, network);

  const [
    totalStakedRaw,
    accYieldRaw,
    lastCompoundRaw,
    signalScoreRaw,
    currentBlockRaw,
  ] = await Promise.all([
    contract.totalStaked(),
    contract.accumulatedYield(),
    contract.lastCompoundBlock(),
    contract.signalScore(),
    provider.getBlockNumber(),
  ]);

  const totalStaked:      bigint = BigInt(totalStakedRaw.toString());
  const accumulatedYield: bigint = BigInt(accYieldRaw.toString());
  const lastCompound:     number = Number(lastCompoundRaw);
  const currentBlock:     number = Number(currentBlockRaw);
  const signalScore:      number = Number(signalScoreRaw);

  const blocksSinceCompound = Math.max(currentBlock - lastCompound, 1);
  const apy = computeApy(totalStaked, accumulatedYield, blocksSinceCompound);

  const stats: VaultStats = {
    totalStaked:       totalStaked.toString(),
    accumulatedYield:  accumulatedYield.toString(),
    lastCompoundBlock: lastCompound,
    signalScore,
    apy,
    projection30d: computeProjection(totalStaked, apy, 30),
    projection90d: computeProjection(totalStaked, apy, 90),
  };

  cache.set('vault:stats', stats, TTL.VAULT_STATS);
  return stats;
}

export async function getUserInfo(address: string): Promise<UserVaultInfo> {
  const cacheKey = `vault:user:${address}`;
  const cached = cache.get<UserVaultInfo>(cacheKey);
  if (cached) return cached;

  const contract = getContract(contractAddress, SIGNAL_STAKE_ABI, provider, network);

  const [balanceRaw, stats] = await Promise.all([
    contract.balanceOf(address),
    getVaultStats(),
  ]);

  const stakedBalance: bigint = BigInt(balanceRaw.toString());
  const totalStaked:   bigint = BigInt(stats.totalStaked);

  const sharePercent = totalStaked > 0n
    ? Number((stakedBalance * 10_000n) / totalStaked) / 100
    : 0;

  const estimatedYield30d = computeProjection(stakedBalance, stats.apy, 30);

  const info: UserVaultInfo = {
    address,
    stakedBalance: stakedBalance.toString(),
    sharePercent,
    estimatedYield30d,
  };

  cache.set(cacheKey, info, TTL.USER_INFO);
  return info;
}

export async function getSignalInfo(): Promise<SignalInfo> {
  const cached = cache.get<SignalInfo>('vault:signal');
  if (cached) return cached;

  const contract = getContract(contractAddress, SIGNAL_STAKE_ABI, provider, network);

  const [signalRaw, yieldRaw, riskRaw, liqRaw] = await Promise.all([
    contract.signalScore(),
    contract.yieldScore(),
    contract.riskScore(),
    contract.liquidityScore(),
  ]);

  const signalScore    = Number(signalRaw);
  const yieldScore     = Number(yieldRaw);
  const riskScore      = Number(riskRaw);
  const liquidityScore = Number(liqRaw);

  const level = getSignalLevel(signalScore);
  const info: SignalInfo = {
    signalScore,
    yieldScore,
    riskScore,
    liquidityScore,
    level,
    warning: signalScore < 30,
    label: getSignalLabel(level),
  };

  cache.set('vault:signal', info, TTL.SIGNAL);
  return info;
}
