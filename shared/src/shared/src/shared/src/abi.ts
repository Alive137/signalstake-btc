// SignalStake BTC — Contract ABI

import { ABIDataTypes } from '@btc-vision/transaction';

export const SIGNAL_STAKE_ABI = [
  {
    name: 'stake',
    inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
    outputs: [],
  },
  {
    name: 'withdraw',
    inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
    outputs: [],
  },
  {
    name: 'compound',
    inputs: [],
    outputs: [],
  },
  {
    name: 'updateSignal',
    inputs: [
      { name: 'yieldScore',     type: ABIDataTypes.UINT32 },
      { name: 'riskScore',      type: ABIDataTypes.UINT32 },
      { name: 'liquidityScore', type: ABIDataTypes.UINT32 },
    ],
    outputs: [],
  },
  {
    name: 'totalStaked',
    inputs: [],
    outputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
  },
  {
    name: 'accumulatedYield',
    inputs: [],
    outputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
  },
  {
    name: 'lastCompoundBlock',
    inputs: [],
    outputs: [{ name: 'block', type: ABIDataTypes.UINT64 }],
  },
  {
    name: 'signalScore',
    inputs: [],
    outputs: [{ name: 'score', type: ABIDataTypes.UINT32 }],
  },
  {
    name: 'yieldScore',
    inputs: [],
    outputs: [{ name: 'score', type: ABIDataTypes.UINT32 }],
  },
  {
    name: 'riskScore',
    inputs: [],
    outputs: [{ name: 'score', type: ABIDataTypes.UINT32 }],
  },
  {
    name: 'liquidityScore',
    inputs: [],
    outputs: [{ name: 'score', type: ABIDataTypes.UINT32 }],
  },
  {
    name: 'balanceOf',
    inputs: [{ name: 'account', type: ABIDataTypes.ADDRESS }],
    outputs: [{ name: 'balance', type: ABIDataTypes.UINT256 }],
  },
] as const;
