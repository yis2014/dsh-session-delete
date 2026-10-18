# DSH Session Delete

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that adds **删除会话 / Delete session** to the sidebar Session row `...` menu. Confirming permanently removes the Session's durable log, its projection-cache record, and its workspace accounting; a running Session is stopped first after an explicit second confirmation.

| | |
|---|---|
| Package | `@local/dsh-session-delete` (bundle row id `session-delete`) |
| Plugin source | [`session-delete-plugin/`](session-delete-plugin/README.md) |
| Requires | DSH `>=0.2.1-rc.2 <0.3.0` |
| UI | sidebar Session menu (order 500) + a frame-wide confirmation dialog |

## Install

### From the plugin market (one click)

DSH reads plugin market indexes in [format 1](https://github.com/deepseek-ai/deepseek-harness). This repository publishes one at [`market.json`](market.json). Add the index URL in **Settings → Plugins → Discover** (or wherever the plugin market source list is shown):

```
https://cdn.jsdelivr.net/gh/yis2014/dsh-session-delete@main/market.json
```

Fallback URL if jsDelivr is unreachable:

```
https://raw.githubusercontent.com/yis2014/dsh-session-delete/main/market.json
```

The entry installs the exact commit pinned in the index, so a cached index never installs different code. The index parses with the official `@deepseek-ai/dsh-plugin-market-index` validator, and the entry's install target is `git+https://github.com/yis2014/dsh-session-delete.git#026a7a1…&path:/session-delete-plugin`.

> The Discover tab and market sources come from the optional `@deepseek-ai/dsh-experimental-plugin-market-bundle` row. Profiles that leave it disabled can still install with the direct spec below; no market UI is required.

### Direct install

Pass this pnpm spec to `plugin_manager`'s `install_bundle` (the Plugin Manager's add action or the agent tool):

```
git+https://github.com/yis2014/dsh-session-delete.git#026a7a11001c129cbd83908d6420374dcfd5243c&path:/session-delete-plugin
```

The commit is the one pinned in [`market.json`](market.json) (`plugins[0].versions[0].source.commit`). This exact spec was installed into a clean pnpm project during verification and resolved to `@local/dsh-session-delete 1.0.0` from the pinned commit. To regenerate the spec from the index, see [`session-delete-tools/validate-market.mjs`](session-delete-tools/README.md).

### Where it appears

The built-in bundle catalog (`dsh-base` / `dsh-web-app` rows) is shipped read-only, so a third-party plugin cannot be inserted into it. The supported surfaces are:

- **已安装插件 / Installed plugins** in Plugin Manager — the row appears here automatically after `install_bundle`.
- **Discover** — when the plugin-market bundle is enabled, add the index URL above and the entry appears with title, description, icon, category, and a one-click install.

### From a local checkout

```bash
git clone https://github.com/yis2014/dsh-session-delete.git
```

Then install the absolute path of `session-delete-plugin/` through `install_bundle`. This is what the development profile does.

### Manual composition

If you compose the profile by hand, insert the row:

```yaml
- insert:
    - id: session-delete
      name: '@local/dsh-session-delete'
```

## What it deletes

| Artifact | Removal |
|---|---|
| Session log directory (all retained format generations) | resolved through the mounted `sessionPersistence` backend and removed recursively |
| Projection cache (`session_projcache` domain, `sessions` table) | deleted through the domain write chain, then watched until it stays absent |
| Workspace accounting | membership order, pin set, and archive set, through the workspace registry's own writes |

Connected pages drop the row through `api-session/removed`; pages that reload ask the Host to re-announce the removal, because a live Agent can still carry the Session in the Host's in-memory registry. The derived search index reconciles itself on the next search.

Sessions with running work are refused first with the activity families the Host composes (turn, subagents, jobs, schedule). The dialog lists them and offers **仍要删除**; confirming cancels the turn and the other providers, waits for idle, then deletes.

## Boundaries

- Only the named Session is deleted. Subagent child Sessions are separate logs and stay hidden in place.
- The operation is user-only: it is not exposed as an agent Tool, and the route requires the owner browser credential.
- Deletion is immediate and irreversible. The plugin does not move anything to a trash or backup.

## Verification tooling

[`session-delete-tools/`](session-delete-tools/) contains the checks used to build this plugin: an authenticated API client (`test-api.mjs`), a CDP driver for the live Web GUI (`cdp.mjs`), an asar extractor (`asar-tool.mjs`), and the market-index validator wrapper (`validate-market.mjs`). Screenshots are intentionally not committed because they contain local session titles and account UI.

## License

MIT
