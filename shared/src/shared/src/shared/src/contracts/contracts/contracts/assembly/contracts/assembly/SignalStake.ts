import {
  Address,
  Blockchain,
  BytesWriter,
  Calldata,
  encodeSelector,
  OP_NET,
  Revert,
  Selector,
  StoredU256,
  StoredU64,
  StoredU32,
} from '@btc-vision/btc-runtime/runtime';

import { u256 } from '@btc-vision/as-bignum/assembly';
import { SafeMath } from '@btc-vision/btc-runtime/runtime/math/SafeMath';

// Storage Pointers (all unique)
const PTR_TOTAL_STAKED:       u16 = 1;
const PTR_ACCUMULATED_YIELD:  u16 = 2;
const PTR_LAST_COMPOUND:      u16 = 3;
const PTR_SIGNAL_SCORE:       u16 = 4;
const PTR_YIELD_SCORE:        u16 = 5;
const PTR_RISK_SCORE:         u16 = 6;
const PTR_LIQUIDITY_SCORE:    u16 = 7;

// Function Selectors
const SEL_STAKE             = encodeSelector('stake(uint256)');
const SEL_WITHDRAW          = encodeSelector('withdraw(uint256)');
const SEL_COMPOUND          = encodeSelector('compound()');
const SEL_UPDATE_SIGNAL     = encodeSelector('updateSignal(uint32,uint32,uint32)');
const SEL_TOTAL_STAKED      = encodeSelector('totalStaked()');
const SEL_ACCUMULATED_YIELD = encodeSelector('accumulatedYield()');
const SEL_LAST_COMPOUND     = encodeSelector('lastCompoundBlock()');
const SEL_SIGNAL_SCORE      = encodeSelector('signalScore()');
const SEL_YIELD_SCORE       = encodeSelector('yieldScore()');
const SEL_RISK_SCORE        = encodeSelector('riskScore()');
const SEL_LIQUIDITY_SCORE   = encodeSelector('liquidityScore()');
const SEL_BALANCE_OF        = encodeSelector('balanceOf(address)');

const MAX_YIELD_SCORE:     u32 = 50;
const MAX_RISK_SCORE:      u32 = 30;
const MAX_LIQUIDITY_SCORE: u32 = 20;
const SIGNAL_PRECISION:    u32 = 100;

@final
export class SignalStake extends OP_NET {
  private readonly _totalStaked:      StoredU256;
  private readonly _accumulatedYield: StoredU256;
  private readonly _lastCompound:     StoredU64;
  private readonly _signalScore:      StoredU32;
  private readonly _yieldScore:       StoredU32;
  private readonly _riskScore:        StoredU32;
  private readonly _liquidityScore:   StoredU32;

  constructor() {
    super();
    this._totalStaked      = new StoredU256(PTR_TOTAL_STAKED,      u256.Zero);
    this._accumulatedYield = new StoredU256(PTR_ACCUMULATED_YIELD, u256.Zero);
    this._lastCompound     = new StoredU64(PTR_LAST_COMPOUND,      0);
    this._signalScore      = new StoredU32(PTR_SIGNAL_SCORE,       0);
    this._yieldScore       = new StoredU32(PTR_YIELD_SCORE,        0);
    this._riskScore        = new StoredU32(PTR_RISK_SCORE,         0);
    this._liquidityScore   = new StoredU32(PTR_LIQUIDITY_SCORE,    0);
  }

  public override onDeployment(_calldata: Calldata): void {
    this._yieldScore.value     = 25;
    this._riskScore.value      = 10;
    this._liquidityScore.value = 10;
    this._signalScore.value    = this._computeSignalScore(25, 10, 10);
    this._lastCompound.value   = Blockchain.block.numberU64;
  }

  public override execute(method: Selector, calldata: Calldata): BytesWriter {
    switch (method) {
      case SEL_STAKE:             return this._stake(calldata);
      case SEL_WITHDRAW:          return this._withdraw(calldata);
      case SEL_COMPOUND:          return this._compound();
      case SEL_UPDATE_SIGNAL:     return this._updateSignal(calldata);
      case SEL_TOTAL_STAKED:      return this._viewTotalStaked();
      case SEL_ACCUMULATED_YIELD: return this._viewAccumulatedYield();
      case SEL_LAST_COMPOUND:     return this._viewLastCompound();
      case SEL_SIGNAL_SCORE:      return this._viewSignalScore();
      case SEL_YIELD_SCORE:       return this._viewYieldScore();
      case SEL_RISK_SCORE:        return this._viewRiskScore();
      case SEL_LIQUIDITY_SCORE:   return this._viewLiquidityScore();
      case SEL_BALANCE_OF:        return this._viewBalanceOf(calldata);
      default:
        throw new Revert('SignalStake: unknown selector');
    }
  }

  private _stake(calldata: Calldata): BytesWriter {
    const sender = Blockchain.tx.sender;
    const amount = calldata.readU256();
    if (Address.isZero(sender)) throw new Revert('SignalStake: zero address');
    if (u256.eq(amount, u256.Zero)) throw new Revert('SignalStake: zero amount');
    const currentBalance = this._getUserBalance(sender);
    const newBalance = SafeMath.add(currentBalance, amount);
    this._setUserBalance(sender, newBalance);
    this._totalStaked.value = SafeMath.add(this._totalStaked.value, amount);
    const writer = new BytesWriter(1);
    writer.writeBoolean(true);
    return writer;
  }

  private _withdraw(calldata: Calldata): BytesWriter {
    const sender = Blockchain.tx.sender;
    const amount = calldata.readU256();
    if (Address.isZero(sender)) throw new Revert('SignalStake: zero address');
    if (u256.eq(amount, u256.Zero)) throw new Revert('SignalStake: zero amount');
    const currentBalance = this._getUserBalance(sender);
    if (u256.lt(currentBalance, amount)) throw new Revert('SignalStake: insufficient balance');
    const newBalance = SafeMath.sub(currentBalance, amount);
    this._setUserBalance(sender, newBalance);
    this._totalStaked.value = SafeMath.sub(this._totalStaked.value, amount);
    const writer = new BytesWriter(1);
    writer.writeBoolean(true);
    return writer;
  }

  private _compound(): BytesWriter {
    const yield_ = this._accumulatedYield.value;
    if (u256.eq(yield_, u256.Zero)) throw new Revert('SignalStake: no yield to compound');
    this._totalStaked.value = SafeMath.add(this._totalStaked.value, yield_);
    this._accumulatedYield.value = u256.Zero;
    this._lastCompound.value = Blockchain.block.numberU64;
    const writer = new BytesWriter(1);
    writer.writeBoolean(true);
    return writer;
  }

  private _updateSignal(calldata: Calldata): BytesWriter {
    Revert.ifNotOwner(this, Blockchain.tx.sender);
    const yieldScore     = calldata.readU32();
    const riskScore      = calldata.readU32();
    const liquidityScore = calldata.readU32();
    if (yieldScore     > MAX_YIELD_SCORE)     throw new Revert('SignalStake: yield score out of range');
    if (riskScore      > MAX_RISK_SCORE)      throw new Revert('SignalStake: risk score out of range');
    if (liquidityScore > MAX_LIQUIDITY_SCORE) throw new Revert('SignalStake: liquidity score out of range');
    this._yieldScore.value     = yieldScore;
    this._riskScore.value      = riskScore;
    this._liquidityScore.value = liquidityScore;
    this._signalScore.value    = this._computeSignalScore(yieldScore, riskScore, liquidityScore);
    const writer = new BytesWriter(1);
    writer.writeBoolean(true);
    return writer;
  }

  @inline
  private _computeSignalScore(yield_: u32, risk: u32, liquidity: u32): u32 {
    const raw = yield_ + liquidity;
    const score: u32 = raw > risk ? (((raw - risk) * SIGNAL_PRECISION) / 90) : 0;
    return score > 100 ? 100 : score;
  }

  @inline
  private _getUserBalance(user: Address): u256 {
    return Blockchain.getStorageAt(8, user);
  }

  @inline
  private _setUserBalance(user: Address, value: u256): void {
    Blockchain.setStorageAt(8, user, value);
  }

  private _viewTotalStaked(): BytesWriter {
    const w = new BytesWriter(32);
    w.writeU256(this._totalStaked.value);
    return w;
  }

  private _viewAccumulatedYield(): BytesWriter {
    const w = new BytesWriter(32);
    w.writeU256(this._accumulatedYield.value);
    return w;
  }

  private _viewLastCompound(): BytesWriter {
    const w = new BytesWriter(8);
    w.writeU64(this._lastCompound.value);
    return w;
  }

  private _viewSignalScore(): BytesWriter {
    const w = new BytesWriter(4);
    w.writeU32(this._signalScore.value);
    return w;
  }

  private _viewYieldScore(): BytesWriter {
    const w = new BytesWriter(4);
    w.writeU32(this._yieldScore.value);
    return w;
  }

  private _viewRiskScore(): BytesWriter {
    const w = new BytesWriter(4);
    w.writeU32(this._riskScore.value);
    return w;
  }

  private _viewLiquidityScore(): BytesWriter {
    const w = new BytesWriter(4);
    w.writeU32(this._liquidityScore.value);
    return w;
  }

  private _viewBalanceOf(calldata: Calldata): BytesWriter {
    const account = calldata.readAddress();
    const balance = this._getUserBalance(account);
    const w = new BytesWriter(32);
    w.writeU256(balanc
