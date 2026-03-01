// SignalStake BTC — Vault API Routes

import HyperExpress from 'hyper-express';
import { getVaultStats, getUserInfo, getSignalInfo } from '../vaultService';

export function registerVaultRoutes(app: HyperExpress.Server): void {

  app.get('/vault/stats', async (req, res) => {
    try {
      const stats = await getVaultStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[/vault/stats]', message);
      res.status(500).json({ success: false, error: message });
    }
  });

  app.get('/vault/user/:address', async (req, res) => {
    const { address } = req.path_parameters;

    if (!address || address.length < 10) {
      return res.status(400).json({ success: false, error: 'Invalid address' });
    }

    try {
      const userInfo = await getUserInfo(address);
      res.status(200).json({ success: true, data: userInfo });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[/vault/user]', message);
      res.status(500).json({ success: false, error: message });
    }
  });

  app.get('/vault/signal', async (_req, res) => {
    try {
      const signal = await getSignalInfo();
      res.status(200).json({ success: true, data: signal });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[/vault/signal]', message);
      res.status(500).json({ success: false, error: message });
    }
  });
}
