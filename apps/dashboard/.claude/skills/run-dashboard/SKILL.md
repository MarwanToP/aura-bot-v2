---
name: run-dashboard
description: build, launch, and screenshot the Aura Dashboard web interface
---

The Aura Dashboard is the neural intelligence control plane for the Aura ecosystem. It is a Next.js application driven by an Express server.

This app is driven using `chromium-cli`.

## Prerequisites
The dashboard requires a running environment with Node.js 18+. No additional OS packages are required for the headless `chromium-cli` driver.

## Build
Run the following from the project root:
```bash
npm install
# Note: The dashboard uses Next.js; build is handled by the server in dev mode 
# or via 'npm run build' for production.
```

## Run (agent path)
The dashboard is launched via `npm run start:dashboard`. Once running, use `chromium-cli` to interact with it.

**Launch:**
```bash
npm run start:dashboard &
```

**Drive & Screenshot:**
Pipe the following commands to `chromium-cli` to verify the dashboard is loading:
```bash
cat << 'EOF' | chromium-cli
goto http://localhost:3000
screenshot dashboard_home.png
EOF
```

## Run (human path)
For developers with a GUI:
```bash
npm run start:dashboard
```
Then open `http://localhost:3000` in your browser.

## Gotchas
- **Port Conflict:** The dashboard defaults to port 3000. If it fails to start, check if another process is using the port.
- **Next.js Prepare:** The server calls `nextApp.prepare()`. In some environments, this can be slow; give the server a few seconds to fully initialize before running `chromium-cli`.

## Troubleshooting
- **Failed to connect to localhost:3000:** Ensure the background process `npm run start:dashboard` hasn't crashed. Check logs for database connection errors (PostgreSQL/Redis).
- **Blank Screenshot:** This usually means the Next.js frontend is still compiling or the server is stuck in `nextApp.prepare()`. Wait 10 seconds and retry.
