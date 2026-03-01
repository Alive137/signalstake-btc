# SignalStake BTC

> The DeFi Signal — Make money work on Bitcoin. DeFi on L1.

Auto-compounding BTC staking vault with signal-based yield optimization, built natively on Bitcoin Layer 1 using OP_NET.

## Project Structure

contracts/   - AssemblyScript smart contract
backend/     - hyper-express API server
frontend/    - React + TypeScript frontend
shared/      - Shared types, ABI, and config

## Built With
- OP_NET — Bitcoin Layer 1 smart contract protocol
- AssemblyScript — TypeScript to WebAssembly
- hyper-express — High-performance Node.js server
- React — Frontend framework
- @btc-vision/walletconnect — OP_WALLET integration

## Network
- Testnet RPC: https://testnet.opnet.org
- Deploy contract via opnet-cli
- Update shared/src/config.ts with deployed address after deployment

## Safety Checklist
- SafeMath used for all u256 arithmetic
- No while loops
- Unique storage pointers
- onDeployment() for one-time init
- Zero address and zero amount validation
- Owner-only functions protected
- No private keys in frontend
- .env in .gitignore
- hyper-express only
- JSONRpcProvider for all chain reads
- Simulate before every transaction
