/**
 * Session Delete — Host half.
 *
 * One destructive operation, owned here so the browser half can only ask for
 * it: stop the Session's running work when the caller insists, then remove
 * its durable log directory, its projection-cache record, and every workspace
 * accounting reference, and finally tell connected clients the Session is
 * gone.
 *
 * The operation is exposed as an authenticated exact Fetch route because a
 * plain-JS Client plugin cannot add a generated Remote namespace; Connection
 * applies its Host/Origin and browser-session checks before this handler runs.
 *
 * @module @local/dsh-session-delete
 */
import { rm } from 'node:fs/promises'
import { dirname, isAbsolute, relative, sep } from 'node:path'

/** Loader row identity; also the value the route and dialog agree on. */
export const name = 'session-delete'

/** Connection carries the authenticated request; persistence supplies the Session header. */
export const inject = ['connection', 'sessionPersistence']

/** The exact route the Client half posts to, relative to the served document root. */
export const ROUTE_PATH = '/api/session.delete'

/** The exact route a freshly loaded page posts to, to drop resurrected rows. */
export const SWEEP_PATH = '/api/session.delete.sweep'

/** Longest wait for an interrupted Agent to reach idle before the log is removed. */
const IDLE_TIMEOUT_MS = 15_000

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

/**
 * Serialize one JSON response.
 * @param status - HTTP status code.
 * @param body - JSON-compatible body.
 * @returns the Fetch response.
 */
function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

/**
 * Build one failure response with a stable code.
 * @param status - HTTP status code.
 * @param code - machine-readable failure code.
 * @param message - human-readable message.
 * @param details - optional structured details.
 * @returns the Fetch response.
 */
function failure(status, code, message, details = {}) {
  return json(status, { ok: false, code, message, details })
}

/**
 * Whether `child` is a strict descendant of `parent`.
 * @param parent - absolute ancestor directory.
 * @param child - absolute candidate directory.
 * @returns true only for a strict descendant.
 */
function isStrictDescendant(parent, child) {
  if (!isAbsolute(parent) || !isAbsolute(child)) return false
  const rel = relative(parent, child)
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

/**
 * Verify a decoded request body names one Session.
 * @param body - parsed JSON body.
 * @returns the Session id, or undefined when the body is unusable.
 */
function readRequest(body) {
  if (typeof body !== 'object' || body === null) return undefined
  const sessionId = body.sessionId
  if (typeof sessionId !== 'string') return undefined
  const trimmed = sessionId.trim()
  if (trimmed.length === 0 || trimmed.length > 512) return undefined
  // Control characters cannot belong to a path segment or a durable identity.
  if (/[\u0000-\u001f\u007f]/u.test(trimmed)) return undefined
  return { sessionId: trimmed, force: body.force === true }
}

/**
 * Install the route. Everything registered here is disposed with the plugin.
 * @param ctx - plugin context with `connection` and `sessionPersistence`.
 */
export function apply(ctx) {
  const tombstones = new Tombstones()

  // A live Agent outlives the deleted artifacts: its final events (a stopped
  // turn's `turn/end`, or session disposal at shutdown) make the projection
  // cache write a fresh checkpoint for a Session whose log is gone. Remember
  // deleted ids and drop such a checkpoint the moment it lands.
  ctx.effect(() => ctx.on('domain/changed', (change) => {
    if (change?.domain !== 'session_projcache' || change?.table !== 'sessions') return
    if (change.operation !== 'put' || !tombstones.has(change.key)) return
    void projectionCacheTable(ctx)?.delete(change.key).catch(() => {})
  }), 'session-delete: projection-cache tombstone guard')

  ctx.effect(() => ctx.on('api-session/added', (summary) => {
    const id = summary?.sessionId
    if (typeof id !== 'string' || !tombstones.has(id)) return
    // A live Agent keeps its Session in the Host's in-memory store and can
    // re-announce it; remove it after the announcement was forwarded.
    queueMicrotask(() => ctx.emit('api-session/removed', id))
  }), 'session-delete: re-added Session guard')

  ctx.effect(
    () => ctx.connection.fetch.register({
      path: ROUTE_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: (request) => handle(ctx, tombstones, request),
    }),
    'session-delete: exact Fetch route',
  )

  // A page that reloads receives the live Session back in its list baseline.
  // Each newly loaded page asks the Host to re-announce the removal, so the
  // row stays gone in every connected page.
  ctx.effect(
    () => ctx.connection.fetch.register({
      path: SWEEP_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: () => sweep(ctx, tombstones),
    }),
    'session-delete: sweep Fetch route',
  )
}

/**
 * Re-announce the removal of every deleted Session that is still live in
 * process memory (and therefore still appears in a fresh list baseline).
 * @param ctx - plugin context.
 * @param tombstones - deleted-Session memory.
 * @returns the Fetch response.
 */
async function sweep(ctx, tombstones) {
  const sessions = ctx.get('sessions')
  const swept = []
  for (const id of tombstones.list()) {
    if (sessions?.get(id) === undefined) continue
    ctx.emit('api-session/removed', id)
    swept.push(id)
  }
  return json(200, { ok: true, value: { swept } })
}

/**
 * Bounded process-local memory of deleted Session ids.
 */
class Tombstones {
  limit = 512
  ids = new Set()

  /** Remember one deleted Session. */
  add(id) {
    this.ids.delete(id)
    this.ids.add(id)
    while (this.ids.size > this.limit) {
      const oldest = this.ids.values().next().value
      if (oldest === undefined) return
      this.ids.delete(oldest)
    }
  }

  /** Whether this Session was deleted in this process. */
  has(id) {
    return this.ids.has(id)
  }

  /** Deleted Session ids, oldest first. */
  list() {
    return [...this.ids]
  }
}

/**
 * Handle one delete request.
 * @param ctx - plugin context.
 * @param tombstones - deleted-Session memory shared with the cache guard.
 * @param request - authenticated Fetch request.
 * @returns the Fetch response.
 */
async function handle(ctx, tombstones, request) {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return failure(415, 'session-delete/content-type', 'expected an application/json body')
  }
  let body
  try {
    body = await request.json()
  } catch {
    return failure(400, 'session-delete/body', 'the request body is not valid JSON')
  }
  const parsed = readRequest(body)
  if (parsed === undefined) {
    return failure(400, 'session-delete/request', 'sessionId must be a non-empty string')
  }
  const { sessionId, force } = parsed

  try {
    return await deleteSession(ctx, tombstones, sessionId, force)
  } catch (error) {
    ctx.logger.warn(`session-delete: deleting "${sessionId}" failed: ${String(error)}`)
    return failure(500, 'session-delete/failed', 'the session could not be deleted', {
      reason: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Delete one Session's durable artifacts and accounting.
 * @param ctx - plugin context.
 * @param tombstones - deleted-Session memory shared with the cache guard.
 * @param sessionId - Session to delete.
 * @param force - stop running work instead of refusing.
 * @returns the Fetch response.
 */
async function deleteSession(ctx, tombstones, sessionId, force) {
  const persistence = ctx.sessionPersistence
  const snapshot = await persistence.stat(sessionId)
  const sessions = ctx.get('sessions')
  const agents = ctx.get('agents')
  const liveSession = sessions?.get(sessionId)
  const liveAgent = agents?.get(sessionId)
  const header = snapshot?.header ?? liveSession?.header ?? liveAgent?.session?.header

  const cacheTable = projectionCacheTable(ctx)
  const cacheRecorded = cacheTable?.get(sessionId) !== undefined
  const registry = ctx.get('workspaceRegistry')
  const accounted = workspaceAccounting(ctx, registry, sessionId)

  if (header === undefined && !cacheRecorded && accounted === 0) {
    return failure(404, 'session/not-found', `session "${sessionId}" is unknown`)
  }

  const running = await collectActivity(ctx, sessionId, liveAgent)
  if (running.length > 0 && !force) {
    return json(409, {
      ok: false,
      code: 'session/busy',
      message: 'the session still has running work',
      details: { sessionId, activity: running },
    })
  }
  const stopped = running.length > 0
    ? await stopActivity(ctx, sessionId, liveAgent)
    : false

  // A stopped turn appends its closing events right after `whenIdle()`; give
  // them one short beat so the log deletion is not raced by a final append.
  if (stopped || liveAgent !== undefined) await delay(300)

  // 1. Workspace accounting: membership order, pin, archive.
  const removedAccounting = await detachWorkspaceAccounting(ctx, registry, sessionId)

  // 2. Durable log directory, including every retained format generation.
  let removedLog = false
  if (header !== undefined) {
    const locate = typeof persistence.locate === 'function' ? persistence.locate(header) : undefined
    if (typeof locate?.path !== 'string') {
      return failure(501, 'session-delete/unsupported-store',
        'the mounted session-persistence backend exposes no log location')
    }
    const directory = dirname(locate.path)
    const root = typeof persistence.root === 'string' ? persistence.root : undefined
    if (root !== undefined && !isStrictDescendant(root, directory)) {
      return failure(500, 'session-delete/unsafe-path',
        'the resolved session directory is outside the session-persistence root')
    }
    try {
      await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 })
      removedLog = true
    } catch (error) {
      return failure(500, 'session-delete/log', 'the session log could not be removed', {
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // 3. Projection cache. A live Session's closing events can schedule one
  //    more checkpoint write, so for a live Session the row is removed and
  //    then watched until it stays absent.
  let removedCache = false
  if (cacheTable !== undefined) {
    try {
      removedCache = await deleteCacheUntilStable(cacheTable, sessionId, liveAgent !== undefined)
    } catch (error) {
      return failure(500, 'session-delete/projection-cache', 'the projection cache could not be removed', {
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // 4. Connected clients drop the row. This is a plain Host event the API
  //    Remotes assembly forwards to every answering page.
  tombstones.add(sessionId)
  ctx.emit('api-session/removed', sessionId)

  return json(200, {
    ok: true,
    value: {
      sessionId,
      log: removedLog,
      projectionCache: removedCache,
      workspaceAccounting: removedAccounting,
      stopped,
    },
  })
}

/**
 * Resolve the projection-cache table when that plugin is mounted.
 * @param ctx - plugin context.
 * @returns the table handle, or undefined.
 */
function projectionCacheTable(ctx) {
  try {
    const domain = ctx.get('storageDomain')?.get('session_projcache')
    const table = domain?.table?.('sessions')
    return table ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Count the workspace records that account for one Session, without mutating.
 * @param ctx - plugin context.
 * @param registry - workspace registry, when mounted.
 * @param sessionId - Session id.
 * @returns number of accounting references found.
 */
function workspaceAccounting(ctx, registry, sessionId) {
  if (registry === undefined) return 0
  let total = 0
  try {
    if (registry.archivedSessionIds?.includes(sessionId)) total += 1
    if (registry.pinnedSessionIds?.includes(sessionId)) total += 1
    for (const workspace of registry.list()) {
      if (workspace.sessionIds?.includes(sessionId)) total += 1
    }
  } catch (error) {
    ctx.logger.warn(`session-delete: reading workspace accounting for "${sessionId}" failed: ${String(error)}`)
  }
  return total
}

/**
 * Drop every workspace reference to one Session: archive set, pin set, and
 * each Workspace's ordered session account. The registry owns each write, so
 * its in-memory state stays authoritative; every step is independently
 * contained so one failing write cannot strand the rest.
 * @param ctx - plugin context.
 * @param registry - workspace registry, when mounted.
 * @param sessionId - Session id.
 * @returns number of accounting references removed.
 */
async function detachWorkspaceAccounting(ctx, registry, sessionId) {
  if (registry === undefined) return 0
  let removed = 0
  try {
    if (registry.archivedSessionIds?.includes(sessionId)) {
      await registry.unarchiveSession(sessionId)
      removed += 1
    }
  } catch (error) {
    ctx.logger.warn(`session-delete: unarchiving "${sessionId}" failed: ${String(error)}`)
  }
  try {
    if (registry.pinnedSessionIds?.includes(sessionId)) {
      await registry.unpinSession(sessionId)
      removed += 1
    }
  } catch (error) {
    ctx.logger.warn(`session-delete: unpinning "${sessionId}" failed: ${String(error)}`)
  }
  let workspaces = []
  try {
    workspaces = registry.list()
  } catch (error) {
    ctx.logger.warn(`session-delete: listing workspaces failed: ${String(error)}`)
  }
  for (const workspace of workspaces) {
    try {
      if (typeof workspace.detachSession !== 'function') continue
      // Call unconditionally: the entity's public getter filters members it
      // cannot validate, while the durable record may still hold the id.
      const accountedHere = workspace.sessionIds?.includes(sessionId) === true
      await workspace.detachSession(sessionId)
      if (accountedHere) removed += 1
    } catch (error) {
      ctx.logger.warn(`session-delete: detaching "${sessionId}" from workspace "${workspace.id}" failed: ${String(error)}`)
    }
  }
  return removed
}

/**
 * Collect the work a Session still runs, in provider order.
 * @param ctx - plugin context.
 * @param sessionId - Session id.
 * @param liveAgent - the live Agent, when attached.
 * @returns JSON-safe activity entries.
 */
async function collectActivity(ctx, sessionId, liveAgent) {
  let activity = []
  try {
    activity = await ctx.waterfall('workspace/session-activity', { sessionId }, () => Promise.resolve([]))
  } catch (error) {
    ctx.logger.warn(`session-delete: reading activity for "${sessionId}" failed: ${String(error)}`)
  }
  const entries = Array.isArray(activity) ? activity : []
  const runningAgent = liveAgent?.status === 'running'
  if (runningAgent && !entries.some((entry) => entry?.kind === 'turn')) {
    return [{ kind: 'turn', items: [] }, ...entries]
  }
  return entries
}

/**
 * Stop a Session's work the way the user's own stop actions do.
 * @param ctx - plugin context.
 * @param sessionId - Session id.
 * @param liveAgent - the live Agent, when attached.
 * @returns whether a stop was issued.
 */
async function stopActivity(ctx, sessionId, liveAgent) {
  let stopped = false
  try {
    if (liveAgent?.status === 'running') {
      liveAgent.cancel({ kind: 'user' })
      stopped = true
    }
  } catch (error) {
    ctx.logger.warn(`session-delete: cancelling "${sessionId}" failed: ${String(error)}`)
  }
  try {
    await ctx.parallel('workspace/session-stop', { sessionId })
    stopped = true
  } catch (error) {
    ctx.logger.warn(`session-delete: stopping session "${sessionId}" activity failed: ${String(error)}`)
  }
  if (typeof liveAgent?.whenIdle === 'function') {
    await Promise.race([liveAgent.whenIdle(), timeout(IDLE_TIMEOUT_MS)])
  }
  return stopped
}

/**
 * Remove one projection-cache record and, for a live Session, keep removing
 * it until its closing checkpoint writes have stopped landing.
 * @param table - `session_projcache.sessions` table handle.
 * @param sessionId - Session id.
 * @param live - whether a live Agent may still write checkpoints.
 * @returns whether at least one record was removed.
 */
async function deleteCacheUntilStable(table, sessionId, live) {
  let removed = false
  const drop = async () => {
    if (await table.delete(sessionId)) removed = true
  }
  await drop()
  if (!live) return removed
  let absentRounds = 0
  for (let round = 0; round < 16 && absentRounds < 3; round += 1) {
    await delay(150)
    if (table.get(sessionId) === undefined) {
      absentRounds += 1
      continue
    }
    absentRounds = 0
    await drop()
  }
  return removed
}

/**
 * A promise that resolves after `ms`.
 * @param ms - delay in milliseconds.
 * @returns the resolving promise.
 */
function delay(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    timer.unref?.()
  })
}

/**
 * A promise that resolves after `ms`.
 * @param ms - delay in milliseconds.
 * @returns the resolving promise.
 */
function timeout(ms) {
  return delay(ms)
}
