import request from 'supertest';
import { createApp } from '../src/app.js';
import { createStockService } from '../src/stocks.js';

describe('stock service search', () => {
  test('returns formatted search results for a valid query', async () => {
    const service = createStockService({
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          quotes: [
            { symbol: 'AAPL', quoteType: 'EQUITY', longname: 'Apple Inc.', exchDisp: 'NASDAQ', typeDisp: 'Equity' },
            { symbol: 'AMZN', quoteType: 'EQUITY', longname: 'Amazon.com Inc.', exchDisp: 'NASDAQ', typeDisp: 'Equity' },
          ],
        }),
      }),
    });

    const results = await service.search('apple');
    expect(results).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Equity' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'Equity' },
    ]);
  });
});

describe('stock routes', () => {
  test('GET /api/stocks/search returns json results', async () => {
    const service = {
      search: async () => [{ symbol: 'AAPL', name: 'Apple Inc.' }],
      chart: async () => ({ symbol: 'AAPL' }),
    };

    const app = createApp({ stockService: service });
    const res = await request(app).get('/api/stocks/search?q=apple');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ symbol: 'AAPL', name: 'Apple Inc.' }]);
  });

  test('GET /api/stocks/screener returns the watchlist and market date', async () => {
    const app = createApp({
      stockService: { search: async () => [], chart: async () => ({}) },
      screenerService: { watchlist: async (today) => [{ symbol: 'INTC', today }] },
    });
    const res = await request(app).get('/api/stocks/screener');

    expect(res.status).toBe(200);
    expect(res.body.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.results).toEqual([{ symbol: 'INTC', today: res.body.asOf }]);
  });
});
