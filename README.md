# DSH Session Delete

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that adds **鍒犻櫎浼氳瘽 / Delete session** to the sidebar Session row `...` menu. Confirming permanently removes the Session's durable log, its projection-cache record, and its workspace accounting; a running Session is stopped first after an explicit second confirmation.

This repository **is** the plugin package: `package.json` at the root declares `dsh.bundle` and `dsh.client`, so the repository can be installed directly as a bundle.

| | |
|---|---|
| Package | `@local/dsh-session-delete` (bundle row id `session-delete`) |
| Version | 1.0.1 |
| Requires | DSH `>=0.2.1-rc.2 <0.3.0` |
| UI | sidebar Session menu (order 500) + a frame-wide confirmation dialog |
| Host route | authenticated `POST /api/session.delete` |

## Install

### From the plugin market (one click)

DSH reads plugin market indexes in [format 1](https://github.com/deepseek-ai/deepseek-harness). This repository publishes one at [`market.json`](market.json). Add the index URL in **Settings 鈫?Plugins 鈫?Discover**:

```
https://cdn.jsdelivr.net/gh/yis2014/dsh-session-delete@latest/market.json
```

Fallback if jsDelivr is unreachable:

```
https://raw.githubusercontent.com/yis2014/dsh-session-delete/main/market.json
```

The index pins an exact commit per version, so a cached copy never installs different code.

> Discover and market sources come from the optional `@deepseek-ai/dsh-experimental-plugin-market-bundle` row. Profiles that leave it disabled can install with the direct spec below.

### Direct install

Pass this pnpm spec to `plugin_manager`'s `install_bundle` (the Plugin Manager's add action or the agent tool):

```
git+https://github.com/yis2014/dsh-session-delete.git#075e2bbe88edee74c8c559ec58d0dc49e4253127
```

The current commit is in [`market.json`](market.json) (`plugins[0].versions[0].source.commit`). Because the package sits at the repository root, no `path:` parameter is needed. This spec was installed into a clean pnpm project during verification and resolved to `@local/dsh-session-delete` from the pinned commit.

### From a local checkout

```bash
git clone https://github.com/yis2014/dsh-session-delete.git
```

Then pass the absolute path of the checkout to `install_bundle`; the package manifest is at the root.

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

## Running Sessions

A Session with running work is refused first with the activity families the Host composes (the turn in progress, running subagents, background jobs, scheduled reminders). The dialog lists that work and offers **浠嶈鍒犻櫎**; confirming cancels the turn and the other providers the way the user's own stop actions do, waits for the Agent to reach idle, and then deletes.

## Implementation

- **Host half** ([`index.js`](index.js)) registers one authenticated exact Fetch route, `POST /api/session.delete`. Connection applies its Host/Origin and browser-credential checks before the handler runs. The handler stops activity on `force`, detaches workspace accounting, removes the log directory, deletes the projection-cache record until it stays absent, and emits `api-session/removed`. A `POST /api/session.delete.sweep` route lets a newly loaded page remove a live Session's resurrected row.
- **Client half** ([`client.js`](client.js)) registers the sidebar menu row (`session-delete.delete`, order 500) and one `shell.overlay` dialog. It reuses the host primitives (`MenuItemButton`, `Modal`, `Button`) and the client locale service; fallbacks keep the row usable if those primitives are absent.
- **Locales and icon**: [`locale/en.json`](locale/en.json), [`locale/zh.json`](locale/zh.json), [`icon.svg`](icon.svg).

## Where it appears

The built-in bundle catalog (`dsh-base` / `dsh-web-app` rows) is shipped read-only, so a third-party plugin cannot be inserted into it. The supported surfaces are:

- **宸插畨瑁呮彃浠?/ Installed plugins** in Plugin Manager 鈥?appears automatically after `install_bundle`.
- **Discover** 鈥?with the plugin-market bundle enabled, add the index URL above and install the entry with title, description, icon, category, and one click.

## Boundaries

- Only the named Session is deleted. Subagent child Sessions are separate logs and stay hidden in place.
- The operation is user-only: it is not exposed as an agent Tool, and the route requires the owner browser credential.
- Deletion is immediate and irreversible. The plugin does not move anything to a trash or backup.

## Verification tooling

[`tools/`](tools/README.md) contains the checks used to build this plugin: an authenticated API client, a CDP driver for the live Web GUI, an asar extractor, and market-index validators. Screenshots are intentionally not committed because they contain local session titles and account UI.

## License

MIT


