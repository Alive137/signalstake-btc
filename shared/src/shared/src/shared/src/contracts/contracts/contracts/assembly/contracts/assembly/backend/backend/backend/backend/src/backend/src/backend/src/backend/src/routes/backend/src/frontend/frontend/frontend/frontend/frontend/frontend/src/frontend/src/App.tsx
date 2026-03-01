// SignalStake BTC — App Root

import React from 'react';
import { Dashboard } from './components/Dashboard';
import { useWallet }  from './hooks/useWallet';
import { useVault }   from './hooks/useVault';

function App() {
  const wallet = useWallet();
  const vault  = useVault(wallet.address, wallet.walletConnect);

  return (
    <Dashboard
      wallet={wallet}
      vault={vault}
      onConnect={wallet.connect}
      onStake={vault.stake}
      onWithdraw={vault.withdraw}
      onCompound={vault.compound}
    />
  );
}

export default App;
