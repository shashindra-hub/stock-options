// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import ScreenerPage from './ScreenerPage.jsx';

let container;
let root;

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  root = null;
  container = null;
  vi.unstubAllGlobals();
});

it('shows screener indicators and opens the selected symbol', async () => {
  const onSelect = vi.fn();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      asOf: '2026-09-28',
      results: [{
        symbol: 'INTC',
        technicals: {
          price: 117.36,
          changePercent: -4.59,
          ema: 104.23,
          sma200: 79.59,
          rsi: 60,
          redDay: true,
          belowEma: false,
          rsiInRange: false,
        },
        put: {
          expiration: '2026-10-30',
          strike: 108,
          delta: -0.3,
          bid: 5.25,
          yieldPercent: 4.86,
          dte: 32,
          meetsYield: true,
        },
        match: false,
      }],
    }),
  }));

  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(<ScreenerPage onSelect={onSelect} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  expect(container.textContent).toContain('SMA200');
  expect(container.textContent).toContain('RSI14');
  expect(container.textContent).toContain('$117.36');
  expect(container.textContent).toContain('Below EMA50');
  await act(async () => container.querySelector('.screener-symbol').click());
  expect(onSelect).toHaveBeenCalledWith('INTC');
});