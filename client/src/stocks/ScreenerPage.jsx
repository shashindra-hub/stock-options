import { useEffect, useState } from 'react';
import { formatPrice, formatPercent } from './format.js';
import { stockApi } from './stockApi.js';
import './screener.css';

function displayNumber(value, digits = 2) {
  return value === null || value === undefined ? '—' : value.toFixed(digits);
}

function displayDate(value) {
  if (!value) return '—';
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function ScreenerRow({ result, onSelect }) {
  if (result.error || result.marketClosed) {
    return (
      <tr>
        <th scope="row">
          <button className="screener-symbol" type="button" onClick={() => onSelect(result.symbol)}>
            {result.symbol}
          </button>
        </th>
        <td colSpan="10" className="screener-row-message" title={result.error ?? ''}>
          {result.marketClosed ? 'No trading data for today' : 'Market data unavailable'}
        </td>
      </tr>
    );
  }

  const { technicals, put, match } = result;
  const checks = [
    ['Red day', technicals.redDay],
    ['Below EMA50', technicals.belowEma],
    ['RSI 30–50', technicals.rsiInRange],
    ['Put yield ≥2%', Boolean(put?.meetsYield)],
  ];

  return (
    <tr className={match ? 'screener-match' : ''}>
      <th scope="row">
        <button className="screener-symbol" type="button" onClick={() => onSelect(result.symbol)}>
          {result.symbol}
        </button>
      </th>
      <td>
        <div className="screener-checks">
          {checks.map(([label, passed]) => (
            <span
              className={passed ? 'check-pass' : 'check-fail'}
              key={label}
              aria-label={`${label}: ${passed ? 'pass' : 'not met'}`}
            >
              <span aria-hidden="true">{passed ? '✓' : '×'}</span> {label}
            </span>
          ))}
        </div>
      </td>
      <td className="screener-price-cell">
        {formatPrice(technicals.price)}
        <span className={technicals.changePercent < 0 ? 'negative' : 'positive'}>
          {formatPercent(technicals.changePercent)}
        </span>
      </td>
      <td>{displayNumber(technicals.ema)}</td>
      <td>{displayNumber(technicals.sma200)}</td>
      <td>{displayNumber(technicals.rsi, 0)}</td>
      <td>
        {put ? (
          <>
            <span>{displayDate(put.expiration)}</span>
            <span className="screener-secondary">${displayNumber(put.strike, put.strike % 1 ? 2 : 0)} put</span>
          </>
        ) : '—'}
      </td>
      <td>{put ? `−${Math.abs(put.delta).toFixed(2)}` : '—'}</td>
      <td>{put ? formatPrice(put.bid) : '—'}</td>
      <td className={put?.meetsYield ? 'positive' : ''}>{put ? formatPercent(put.yieldPercent) : '—'}</td>
      <td>{put ? put.dte : '—'}</td>
    </tr>
  );
}

export default function ScreenerPage({ onSelect }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    stockApi
      .screener({ signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);

  const results = data?.results ?? [];
  const matches = results.filter((result) => result.match).length;

  return (
    <section className="screener-page" aria-labelledby="screener-title" aria-busy={loading}>
      <div className="screener-toolbar">
        <div>
          <h2 id="screener-title">Put setup scan</h2>
          <p>
            {data?.asOf ? `Market date ${displayDate(data.asOf)}` : 'Daily technicals and put opportunities'}
            {results.length > 0 && ` · ${matches} of ${results.length} setups`}
          </p>
        </div>
        <button type="button" className="screener-refresh" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="screener-error" role="alert">{error}</p>}
      {!error && !loading && results.length === 0 && <p className="screener-empty">No screener data available.</p>}

      {results.length > 0 && (
        <div className="screener-table-wrap">
          <table className="screener-table">
            <thead>
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Rule status</th>
                <th scope="col">Price / day</th>
                <th scope="col">EMA50</th>
                <th scope="col">SMA200</th>
                <th scope="col">RSI14</th>
                <th scope="col">Selected put</th>
                <th scope="col">Delta</th>
                <th scope="col">Bid</th>
                <th scope="col">Yield</th>
                <th scope="col">DTE</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => <ScreenerRow key={result.symbol} result={result} onSelect={onSelect} />)}
            </tbody>
          </table>
        </div>
      )}

      <p className="screener-footnote">
        Rules: red day, below EMA50, RSI 30–50, and put yield at least 2%. Options quotes may be delayed ~15 minutes. Not investment advice.
      </p>
    </section>
  );
}