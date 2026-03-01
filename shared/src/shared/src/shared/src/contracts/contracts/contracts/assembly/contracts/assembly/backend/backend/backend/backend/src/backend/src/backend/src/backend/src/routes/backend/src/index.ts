// SignalStake BTC — Backend Entry Point

import 'dotenv/config';
import HyperExpress from 'hyper-express';
import { registerVaultRoutes } from './routes/vault';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const app = new HyperExpress.Server();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  next();
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'SignalStake BTC API' });
});

registerVaultRoutes(app);

app.set_not_found_handler((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(PORT)
  .then(() => {
    console.log(`✅ SignalStake BTC API running on port ${PORT}`);
    console.log(`   Network: ${process.env.OPNET_NETWORK ?? 'testnet'}`);
    console.log(`   Contract: ${process.env.CONTRACT_ADDRESS ?? '(not set)'}`);
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
