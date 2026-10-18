# Session Delete

Adds **删除会话 (Delete session)** to the `...` menu of every Session row in the Harness sidebar. Choosing it opens a confirmation dialog; confirming permanently removes the Session and its derived state.

## What one deletion removes

| Artifact | Where it lives | How it is removed |
|---|---|---|
| Session log | the persisted Session directory, every retained format generation | the directory is deleted through the mounted `sessionPersistence` backend's own `locate()` result |
| Projection cache | the `session_projcache` storage domain (`sessions` table) | the record is deleted through the domain's write chain, then watched until it stays absent |
| Workspace accounting | workspace registry membership order, pin set, archive set | the registry's own `detachSession`, `unpinSession`, and `unarchiveSession` writes |

Connected pages drop the row through the Host's `api-session/removed` notification. A page that reloads receives a fresh list baseline, and a live Agent can still carry the deleted Session in the Host's in-memory registry, so each newly loaded page asks the Host to re-announce the removal. The full-text search index is derived: its reconciliation drops rows for a Session that left persistence on the next search.

The conversation that displayed the deleted Session shows the client's own *Session unavailable* state until another Session is opened; the durable content is already gone.

## Running Sessions

A Session with running work is refused first: the Host answers with the activity families the composed providers report (the turn in progress, running subagents, background jobs, scheduled reminders) and writes nothing. The dialog lists that work and offers **仍要删除 (Delete anyway)**. Confirming stops the work the way the user's own stop actions do (`agent.cancel` plus the `workspace/session-stop` event), waits for the Agent to reach idle, and only then deletes.

## Boundaries

- Only the named Session is deleted. Subagent child Sessions are separate durable logs and are left untouched; they stay hidden from the sidebar.
- A live Agent cannot be disposed through a public Service, so it may briefly outlive its log. The plugin keeps a bounded tombstone set and removes any projection-cache checkpoint such a Session writes afterwards (a stopped turn's closing events, or disposal at shutdown).
- The operation is a user action. It is not exposed as an agent Tool, and the route requires the owner browser credential.

## Composition

The Host half registers one authenticated exact Fetch route, `POST /api/session.delete`. The Client half registers the sidebar menu row (`session-delete.delete`, order 500) and one `shell.overlay` dialog. Both are removed with the plugin.

```yaml
- insert:
    - id: session-delete
      name: '@local/dsh-session-delete'
```
