import express from 'express';
import cors from 'cors';
import {
  createStockService,
  StockNotFoundError,
  StockValidationError,
  UpstreamError,
} from './stocks.js';
import { screenWatchlist } from './screener/screener.js';

export function createApp({ stockService = createStockService(), screenerService = { watchlist: screenWatchlist } } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/stocks/search', async (req, res, next) => {
    try {
      res.json(await stockService.search(req.query.q));
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/stocks/screener', async (_req, res, next) => {
    try {
      const asOf = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      res.json({ asOf, results: await screenerService.watchlist(asOf) });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/stocks/:symbol/chart', async (req, res, next) => {
    try {
      res.json(await stockService.chart(req.params.symbol, req.query.range ?? '1D'));
    } catch (err) {
      next(err);
    }
  });

  app.use((err, _req, res, _next) => {
    if (err instanceof StockValidationError) return res.status(400).json({ error: err.message });
    if (err instanceof StockNotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof UpstreamError) return res.status(502).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
