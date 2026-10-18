# Verification tooling

These scripts exercised the plugin against a live Desktop Host on Windows. They are development tools, not part of the installable package.

| Script | Purpose |
|---|---|
| `test-api.mjs` | Mints the owner browser cookie from the profile's `client-connection/browser-session` secret and calls one authenticated route or Typert RPC (`node test-api.mjs rpc session/list @payload.json`). |
| `cdp.mjs` | Launches/attaches to headless Chrome over CDP, installs the same cookie, navigates to the live GUI, evaluates an expression file, and captures screenshots. |
| `asar-tool.mjs` | Reads an Electron `app.asar` directly (list or extract by path substring) so installed packages can be inspected without Electron. |
| `validate-market.mjs` | Parses `../market.json` with the official `@deepseek-ai/dsh-plugin-market-index` validator and prints the canonical pnpm install spec. |
| `validate-remote-market.mjs` | Fetches the published index URL, validates it with the same parser, and prints the resolved icon and install target. |

## Preparing the validator

`validate-market.mjs` and `validate-remote-market.mjs` import the real market-index parser, which depends on `semver`. Extract both from the DSH installation first:

```powershell
node asar-tool.mjs "<install>/resources/app.asar" .market "dsh/node_modules/@deepseek-ai/dsh-plugin-market-index"
node asar-tool.mjs "<install>/resources/app.asar" .market "dsh/node_modules/semver"
node validate-remote-market.mjs
```

The `.market/` extraction is git-ignored. Screenshots (`*.png`) are also git-ignored because they contain local session titles and account UI.
