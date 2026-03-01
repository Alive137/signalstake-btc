// SignalStake BTC — Main Dashboard

import React from 'react';
import type { WalletState }    from '../hooks/useWallet';
import type { VaultHookState } from '../hooks/useVault';
import type { SignalInfo }     from '../../../shared/src/types';

interface Props {
  wallet:     WalletState;
  vault:      VaultHookState;
  onConnect:  () => void;
  onStake:    (sats: bigint) => void;
  onWithdraw: (sats: bigint) => void;
  onCompound: () => void;
}

const formatBtc = (sats: string | null | undefined): string => {
  if (!sats || sats === '0') return '0.00000000 BTC';
  return `${(Number(BigInt(sats)) / 1e8).toFixed(8)} BTC`;
};

const formatApy = (apy: number | null | undefined): string =>
  apy != null ? `${apy.toFixed(2)}%` : '—';

const truncate = (addr: string) =>
  `${addr.slice(0, 8)}...${addr.slice(-6)}`;

const LEVEL_COLORS: Record<string, string> = {
  strong:   '#22C55E',
  moderate: '#3B82F6',
  weak:     '#F59E0B',
  danger:   '#EF4444',
};

function SignalGauge({ signal }: { signal: SignalInfo | null }) {
  const score = signal?.signalScore ?? 0;
  const color = signal ? LEVEL_COLORS[signal.level] : '#4E5A6B';
  const r = 54; const cx = 70; const cy = 70;
  function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  const sweep = 180 * (score / 100);
  const s = polar(cx, cy, r, -180);
  const e = polar(cx, cy, r, -180 + sweep);
  const te = polar(cx, cy, r, 0);
  const arc = score > 0 ? `M ${s.x} ${s.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x} ${e.y}` : '';
  const track = `M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${te.x} ${te.y}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="140" height="80" viewBox="0 0 140 85">
        <path d={track} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
        {arc && <path d={arc} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}60)`, transition: 'all 0.6s ease' }} />}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="22" fontFamily="JetBrains Mono, monospace" fontWeight="600">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="Inter, sans-serif" letterSpacing="1.5">/100</text>
      </svg>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}40`, fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, animation: signal?.warning ? 'pulse-glow 1.5s infinite' : 'none' }} />
        {signal?.level ?? 'loading'}
      </div>
      {signal && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, width: '100%' }}>
          {[
            { label: 'Yield',     value: signal.yieldScore,     max: 50, color: '#22C55E' },
            { label: 'Risk',      value: signal.riskScore,      max: 30, color: '#EF4444' },
            { label: 'Liquidity', value: signal.liquidityScore, max: 20, color: '#3B82F6' },
          ].map(({ label, value, max, color: c }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c, fontFamily: 'JetBrains Mono, monospace' }}>{value}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>/{max}</span></div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.5px' }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const Dashboard: React.FC<Props> = ({ wallet, vault, onConnect, onStake, onWithdraw, onCompound }) => {
  const { stats, userInfo, signal, loading, txPending, error, txSuccess } = vault;
  const [tab, setTab] = React.useState<'stake' | 'withdraw'>('stake');
  const [amount, setAmount] = React.useState('');

  const handleAction = () => {
    const sats = BigInt(Math.round(parseFloat(amount) * 1e8));
    if (sats <= 0n) return;
    tab === 'stake' ? onStake(sats) : onWithdraw(sats);
    setAmount('');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px',
    background: active ? 'rgba(247,147,26,0.12)' : 'transparent',
    border: active ? '1px solid rgba(247,147,26,0.35)' : '1px solid transparent',
    borderRadius: 8, color: active ? '#F7931A' : 'rgba(255,255,255,0.4)',
    fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border-subtle)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#F7931A,#E8830A)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 20px rgba(247,147,26,0.3)' }}>₿</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>SignalStake BTC</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>DeFi on Bitcoin L1</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '4px 10px', background: 'rgba(247,147,26,0.08)', border: '1px solid rgba(247,147,26,0.2)', borderRadius: 20, fontSize: 11, color: '#F7931A', fontWeight: 600 }}>TESTNET</div>
          {wallet.connected
            ? <div style={{ padding: '8px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, fontSize: 12, color: '#22C55E', fontFamily: 'JetBrains Mono, monospace' }}>● {truncate(wallet.address!)}</div>
            : <button onClick={onConnect} disabled={wallet.connecting} style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#F7931A,#E8830A)', borderRadius: 6, color: '#000', fontWeight: 700, fontSize: 13 }}>{wallet.connecting ? 'Connecting...' : 'Connect OP_WALLET'}</button>
          }
        </div>
      </header>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 32px 32px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 11, letterSpacing: '3px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>The DeFi Signal</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 12 }}>Make Money Work on Bitcoin. <span style={{ color: '#F7931A' }}>DeFi on L1.</span></h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>Auto-compounding BTC staking vault with signal-based yield optimization on Bitcoin Layer 1.</p>
      </div>

      {/* Main */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 32, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Risk warning */}
          {signal?.warning && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#EF4444', fontSize: 13, marginBottom: 2 }}>Risk Warning — Signal Below Threshold</div>
                <div style={{ color: 'rgba(239,68,68,0.7)', fontSize: 12 }}>Signal score ({signal.signalScore}/100) is below 30. High risk conditions detected.</div>
              </div>
            </div>
          )}
          {error    && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)',  border: '1px solid rgba(239,68,68,0.3)',  borderRadius: 6, color: '#EF4444', fontSize: 13 }}>❌ {error}</div>}
          {txSuccess && <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, color: '#22C55E', fontSize: 13 }}>✅ {txSuccess}</div>}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {[
              { label: 'Total BTC Staked',    value: formatBtc(stats?.totalStaked),        accent: '#F7931A' },
              { label: 'Current APY',          value: formatApy(stats?.apy),                accent: '#22C55E' },
              { label: 'Your Stake',           value: wallet.connected ? formatBtc(userInfo?.stakedBalance) : '—', accent: undefined },
              { label: 'Accumulated Yield',    value: formatBtc(stats?.accumulatedYield),   accent: '#3B82F6' },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 20, position: 'relative', overflow: 'hidden' }}>
                {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }} />}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
                {loading && !stats
                  ? <div style={{ height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 4, animation: 'pulse-glow 1.5s infinite' }} />
                  : <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: accent ?? 'var(--text-primary)' }}>{value}</div>
                }
              </div>
            ))}
          </div>

          {/* Projections */}
          {stats && (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Yield Projections</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[{ label: '30-Day', value: stats.projection30d }, { label: '90-Day', value: stats.projection90d }].map(({ label, value }) => (
                  <div key={label} style={{ padding: 14, background: 'rgba(247,147,26,0.04)', border: '1px solid rgba(247,147,26,0.12)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label} Projection</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#F7931A' }}>{formatBtc(value)}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>* Estimates based on current APY. Not financial advice.</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Signal */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Signal Strength</div>
            <SignalGauge signal={signal} />
            {signal && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 16, textAlign: 'center' }}>{signal.label}</p>}
          </div>

          {/* Stake panel */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Manage Position</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <button style={tabStyle(tab === 'stake')}    onClick={() => setTab('stake')}>Stake</button>
              <button style={tabStyle(tab === 'withdraw')} onClick={() => setTab('withdraw')}>Withdraw</button>
            </div>
            <input
              type="number" step="0.00000001" min="0" placeholder="0.00000000"
              value={amount} onChange={e => setAmount(e.target.value)}
              disabled={!wallet.connected || txPending}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}
            />
            <button onClick={handleAction} disabled={!wallet.connected || txPending || !amount}
              style={{ width: '100%', padding: 13, background: wallet.connected && amount ? 'linear-gradient(135deg,#F7931A,#E8830A)' : 'rgba(255,255,255,0.06)', borderRadius: 6, color: wallet.connected && amount ? '#000' : 'var(--text-muted)', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
              {txPending ? 'Broadcasting...' : tab === 'stake' ? '⚡ Stake BTC' : '↩ Withdraw BTC'}
            </button>
            <button onClick={onCompound} disabled={!wallet.connected || txPending}
              style={{ width: '100%', padding: 11, background: 'transparent', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, color: wallet.connected ? '#22C55E' : 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>
              🔄 Compound Yield
            </button>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        SignalStake BTC — Built on OP_NET · Bitcoin Layer 1 · Testnet
      </footer>
    </div>
  );
};
