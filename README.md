# StockPage Repo

A standalone repo for the stock search and chart experience extracted from the original TaskFlow app.

## Included

- React stock page with search, range controls, and chart
- Yahoo Finance-backed search and chart API
- Express server for `/api/stocks` routes
- Morning put screener for macOS/iMessage

## Run locally

```bash
npm install
npm run dev:server
npm run dev:client
```

Open http://localhost:5173

## Morning put screener

Run the screener manually in dry-run mode:

```bash
SCREENER_PHONE="+15551234567" npm run screener -- --dry-run
```

Or with a custom watchlist:

```bash
SCREENER_PHONE="+15551234567" SCREENER_SYMBOLS="NVDA,TSLA,AMZN" npm run screener -- --dry-run
```

To send the actual iMessage summary, omit `--dry-run`:

```bash
SCREENER_PHONE="+15551234567" npm run screener
```

### macOS launchd setup

The app includes the screener script and can be scheduled with a LaunchAgent. Example:

```bash
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$HOME/Library/LaunchAgents/com.stockpage.morning-screener.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.stockpage.morning-screener</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd /Users/shashi/Documents/Claude/repository/ai-harness/stockpage-repo && SCREENER_PHONE='+15551234567' npm run screener</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>9</integer>
    <key>Minute</key>
    <integer>0</integer>
    <key>Weekday</key>
    <integer>1</integer>
  </dict>
</dict>
</plist>
PLIST
launchctl load "$HOME/Library/LaunchAgents/com.stockpage.morning-screener.plist"
```

The screener checks the market setup each morning and sends a summary by iMessage if the conditions match.

## Notes

The client reads from `/api/stocks/search` and `/api/stocks/:symbol/chart` via the Express server.
