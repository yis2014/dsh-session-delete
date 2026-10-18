window.__ModuleLoader__.load({
  id: '@local/dsh-session-delete',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /**
     * The host UI primitives are part of the browser module table. The
     * require is guarded so an older shell without them still renders a
     * usable menu row and dialog instead of blanking the slot entry.
     */
    let primitives = null
    try {
      primitives = require('@deepseek-ai/dsh-client-ui-primitives')
    } catch (error) {
      console.warn('[session-delete] host primitives unavailable; using fallback controls', error)
    }
    const MenuItemButton = primitives?.MenuItemButton ?? FallbackMenuItem
    const Modal = primitives?.Modal ?? FallbackModal
    const Button = primitives?.Button ?? FallbackButton
    const TrashIcon = primitives?.IconTrashOutlineRegular ?? null

    const NS = 'session-delete'

    const en = {
      'menu.delete': 'Delete session',
      'dialog.title': 'Delete session',
      'dialog.desc': '“{title}” will be permanently deleted: its session log, projection cache, and workspace accounting are removed. This cannot be undone.',
      'dialog.untitled': 'Untitled session',
      'dialog.runningNotice': 'This session is running. Deleting it stops its running work first.',
      'dialog.busyDesc': '“{title}” still has work running. Continuing stops that work and then deletes the session.',
      'dialog.activity': 'Running work',
      'dialog.cancel': 'Cancel',
      'dialog.delete': 'Delete',
      'dialog.forceDelete': 'Delete anyway',
      'dialog.pending': 'Stopping running work and deleting…',
      'dialog.error': 'The session could not be deleted.',
      'activity.turn': 'The turn in progress',
      'activity.subagent.one': '1 running subagent: {names}',
      'activity.subagent.other': '{n} running subagents: {names}',
      'activity.job.one': '1 background job: {names}',
      'activity.job.other': '{n} background jobs: {names}',
      'activity.schedule.one': '1 scheduled reminder: {names}',
      'activity.schedule.other': '{n} scheduled reminders: {names}',
      'activity.other.one': '1 running item ({kind}): {names}',
      'activity.other.other': '{n} running items ({kind}): {names}',
      'toast.deleted': 'Session deleted',
      'toast.failed': 'Delete failed: {message}',
    }
    const zh = {
      'menu.delete': '删除会话',
      'dialog.title': '删除会话',
      'dialog.desc': '“{title}”将被永久删除：会话日志、投影缓存与工作区记账都会一并移除，且无法恢复。',
      'dialog.untitled': '未命名会话',
      'dialog.runningNotice': '该会话正在运行。删除会先停止它正在运行的工作。',
      'dialog.busyDesc': '“{title}”仍有正在运行的工作。继续删除会先停止这些工作，然后删除会话。',
      'dialog.activity': '正在运行的工作',
      'dialog.cancel': '取消',
      'dialog.delete': '删除',
      'dialog.forceDelete': '仍要删除',
      'dialog.pending': '正在停止运行中的工作并删除…',
      'dialog.error': '会话删除失败。',
      'activity.turn': '进行中的回合',
      'activity.subagent.one': '1 个运行中的子代理：{names}',
      'activity.subagent.other': '{n} 个运行中的子代理：{names}',
      'activity.job.one': '1 个后台任务：{names}',
      'activity.job.other': '{n} 个后台任务：{names}',
      'activity.schedule.one': '1 个定时提醒：{names}',
      'activity.schedule.other': '{n} 个定时提醒：{names}',
      'activity.other.one': '1 个运行中的项目（{kind}）：{names}',
      'activity.other.other': '{n} 个运行中的项目（{kind}）：{names}',
      'toast.deleted': '会话已删除',
      'toast.failed': '删除失败：{message}',
    }

    const styles = {
      notice: {
        margin: '0 0 8px',
        padding: '8px 10px',
        borderRadius: '8px',
        background: 'var(--dsw-alias-bg-layer-2)',
        color: 'var(--dsw-alias-state-warn-primary)',
        fontSize: '13px',
        lineHeight: '20px',
      },
      activity: {
        color: 'var(--dsw-alias-label-primary)',
        margin: '0 0 8px',
        paddingLeft: '18px',
        fontSize: '13px',
        lineHeight: '20px',
      },
      status: {
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: '12px',
        lineHeight: '18px',
      },
      error: {
        color: 'var(--dsw-alias-state-error-primary)',
        marginTop: '8px',
        fontSize: '12px',
        lineHeight: '18px',
      },
      danger: {
        color: 'var(--dsw-alias-state-error-primary)',
      },
      toast: {
        position: 'fixed',
        left: '50%',
        bottom: '24px',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxWidth: 'min(420px, calc(100vw - 32px))',
        padding: '10px 16px',
        borderRadius: '10px',
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-overlay)',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: '13px',
        lineHeight: '20px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
        pointerEvents: 'none',
      },
    }

    /**
     * Minimal host-like menu row used only when the primitives are missing.
     */
    function FallbackMenuItem({ icon, onSelect, children, separatorBefore }) {
      return h(React.Fragment, null,
        separatorBefore ? h('div', {
          'aria-hidden': true,
          style: { height: '1px', margin: '4px 8px', background: 'var(--dsw-alias-border-l1)' },
        }) : null,
        h('button', {
          type: 'button',
          role: 'menuitem',
          onClick: onSelect,
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '6px 10px',
            border: 'none',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--dsw-alias-label-primary)',
            font: 'inherit',
            textAlign: 'left',
            cursor: 'pointer',
          },
        }, icon, h('span', null, children)),
      )
    }

    /**
     * Minimal host-like dialog used only when the primitives are missing.
     */
    function FallbackModal({ open, onClose, closeLabel, title, description, footer, children }) {
      React.useEffect(() => {
        if (!open) return undefined
        const onKey = (event) => {
          if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [open, onClose])
      if (!open) return null
      return h('div', {
        style: {
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.32)',
        },
        onMouseDown: (event) => {
          if (event.target === event.currentTarget) onClose()
        },
      }, h('div', {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': title,
        style: {
          width: 'min(420px, calc(100vw - 32px))',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--dsw-alias-border-l1)',
          background: 'var(--dsw-alias-bg-overlay)',
          color: 'var(--dsw-alias-label-primary)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.24)',
        },
      },
      h('h2', { style: { margin: '0 0 8px', fontSize: '16px', lineHeight: '24px' } }, title),
      description ? h('p', { style: { margin: '0 0 12px', color: 'var(--dsw-alias-label-secondary)', fontSize: '13px', lineHeight: '20px' } }, description) : null,
      children,
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' } }, footer),
      h('button', { type: 'button', hidden: true, onClick: onClose }, closeLabel)))
    }

    /**
     * Minimal host-like button used only when the primitives are missing.
     */
    function FallbackButton({ variant, disabled, onClick, children, style }) {
      return h('button', {
        type: 'button',
        disabled,
        onClick,
        style: {
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid var(--dsw-alias-border-l2)',
          background: variant === 'primary' ? 'var(--dsw-alias-brand-primary)' : 'transparent',
          color: variant === 'primary' ? '#fff' : 'var(--dsw-alias-label-primary)',
          font: 'inherit',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          ...style,
        },
      }, children)
    }

    /**
     * Create the request/toast store shared by the menu row and the overlay.
     * @returns the store plus the hooks its consumers read.
     */
    function createStore() {
      let snapshot = { request: null, toast: null }
      const listeners = new Set()
      let sequence = 0
      let toastTimer

      const publish = (next) => {
        snapshot = next
        for (const listener of [...listeners]) listener()
      }

      const store = {
        getSnapshot: () => snapshot,
        subscribe: (listener) => {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        /** Raise one confirmation request for a Session row. */
        open(sessionId, displayTitle, running, openInMain) {
          publish({
            ...snapshot,
            request: {
              id: sequence += 1,
              sessionId,
              displayTitle: typeof displayTitle === 'string' ? displayTitle : '',
              running: running === true,
              openInMain: openInMain === true,
            },
          })
        },
        /** Dismiss the pending confirmation. */
        close() {
          if (snapshot.request === null) return
          publish({ ...snapshot, request: null })
        },
        /** Show one transient notice. */
        notify(text, tone = 'success') {
          if (toastTimer !== undefined) clearTimeout(toastTimer)
          publish({ ...snapshot, toast: { text, tone } })
          toastTimer = setTimeout(() => {
            toastTimer = undefined
            publish({ ...snapshot, toast: null })
          }, 3200)
        },
        /** Drop pending state and timers when the plugin unloads. */
        dispose() {
          if (toastTimer !== undefined) clearTimeout(toastTimer)
          toastTimer = undefined
          listeners.clear()
          snapshot = { request: null, toast: null }
        },
      }
      return store
    }

    /**
     * Build a `useSyncExternalStore` hook over one selector.
     * @param store - the request store.
     * @param select - pure selector over the immutable snapshot.
     * @returns the hook.
     */
    function useStore(store, select) {
      return function useSelected() {
        return React.useSyncExternalStore(store.subscribe, () => select(store.getSnapshot()))
      }
    }

    /**
     * Turn one activity entry into a localised line.
     * @param entry - `{ kind, items }` from the Host waterfall.
     * @param t - locale translate function.
     * @returns the line text.
     */
    function activityLine(entry, t) {
      const items = Array.isArray(entry.items) ? entry.items : []
      const names = items
        .map((item) => (typeof item?.label === 'string' && item.label !== '' ? item.label : item?.id))
        .filter((value) => typeof value === 'string' && value !== '')
        .join(', ')
      const n = items.length
      const plural = n === 1 ? 'one' : 'other'
      switch (entry.kind) {
        case 'turn': return t('activity.turn')
        case 'subagent': return t(`activity.subagent.${plural}`, { n, names: names || '—' })
        case 'job': return t(`activity.job.${plural}`, { n, names: names || '—' })
        case 'schedule': return t(`activity.schedule.${plural}`, { n, names: names || '—' })
        default: return t(`activity.other.${plural}`, { kind: String(entry.kind ?? '—'), n, names: names || '—' })
      }
    }

    /**
     * Ask the Host to delete one Session.
     * @param sessionId - Session to delete.
     * @param force - stop running work instead of refusing.
     * @returns `{ ok: true }`, `{ ok: false, busy: true, activity }`, or `{ ok: false, message }`.
     */
    async function requestDelete(sessionId, force) {
      let response
      try {
        response = await fetch('api/session.delete', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, force: force === true }),
        })
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : String(error) }
      }
      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      if (response.ok && payload?.ok === true) return { ok: true }
      const activity = payload?.details?.activity
      if (response.status === 409 && Array.isArray(activity)) {
        return { ok: false, busy: true, activity }
      }
      return {
        ok: false,
        message: typeof payload?.message === 'string'
          ? payload.message
          : `HTTP ${String(response.status)}`,
      }
    }

    /**
     * Menu row (order 500): open the delete confirmation for this row.
     */
    function DeleteSessionMenuItem({ sessionId, displayTitle, useMenuOpenState, useSessionStatus, useSessionRetainInfo, requestDelete: openDelete, t }) {
      const [, setMenuOpen] = useMenuOpenState()
      const status = useSessionStatus((all) => all.get(sessionId))
      const openInMain = useSessionRetainInfo((info) => (info?.retainedBy?.mainView ?? 0) > 0)
      return h(MenuItemButton, {
        separatorBefore: true,
        icon: TrashIcon ? h(TrashIcon, { size: 14 }) : null,
        onSelect: () => {
          setMenuOpen(false)
          openDelete(sessionId, displayTitle, status?.running === true, openInMain === true)
        },
      }, t('menu.delete'))
    }

    /**
     * The `shell.overlay` entry: one dialog per request plus transient notices.
     */
    function DeleteSessionOverlay({ useRequest, useToast, closeDelete, confirmDelete, t }) {
      const request = useRequest((snapshot) => snapshot.request)
      const toast = useToast((snapshot) => snapshot.toast)
      return h(React.Fragment, null,
        request === null ? null : h(DeleteSessionDialog, {
          key: request.id,
          request,
          closeDelete,
          confirmDelete,
          t,
        }),
        toast === null ? null : h('div', {
          role: 'status',
          style: styles.toast,
        }, toast.text))
    }

    /**
     * One request's dialog. Its in-flight and error state die with the request.
     */
    function DeleteSessionDialog({ request, closeDelete, confirmDelete, t }) {
      const [phase, setPhase] = React.useState('confirm')
      const [activity, setActivity] = React.useState(null)
      const [error, setError] = React.useState(null)
      const displayTitle = request.displayTitle || t('dialog.untitled')
      const deleting = phase === 'deleting'
      const busy = phase === 'busy'

      const close = () => {
        if (deleting) return
        closeDelete()
      }

      const submit = async (force) => {
        setPhase('deleting')
        setError(null)
        const result = await confirmDelete(request.sessionId, force, request.openInMain === true)
        if (result.ok) {
          closeDelete()
          // The row disappears through the Host's removal event; the notice
          // confirms the action even when the sidebar is not in view.
          return result
        }
        if (result.busy === true) {
          setActivity(result.activity)
          setPhase('busy')
          return result
        }
        setPhase(busy ? 'busy' : 'confirm')
        setError(result.message || t('dialog.error'))
        return result
      }

      return h(Modal, {
        open: true,
        onClose: close,
        closeLabel: t('dialog.cancel'),
        title: t('dialog.title'),
        description: busy
          ? t('dialog.busyDesc', { title: displayTitle })
          : t('dialog.desc', { title: displayTitle }),
        footer: h(React.Fragment, null,
          h(Button, {
            variant: 'outline',
            disabled: deleting,
            onClick: close,
          }, t('dialog.cancel')),
          h(Button, {
            variant: 'outline',
            disabled: deleting,
            style: styles.danger,
            onClick: () => { void submit(busy) },
          }, busy ? t('dialog.forceDelete') : t('dialog.delete'))),
      },
      phase === 'confirm' && request.running
        ? h('div', { style: styles.notice }, t('dialog.runningNotice'))
        : null,
      busy && Array.isArray(activity) && activity.length > 0
        ? h('ul', { style: styles.activity, 'aria-label': t('dialog.activity') },
          activity.map((entry, index) => h('li', { key: `${String(entry?.kind)}-${String(index)}` }, activityLine(entry ?? {}, t))))
        : null,
      deleting
        ? h('div', { role: 'status', style: styles.status }, t('dialog.pending'))
        : null,
      error !== null
        ? h('div', { role: 'alert', style: styles.error }, error)
        : null)
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const store = createStore()
        const useRequest = useStore(store, (snapshot) => snapshot.request)
        const useToast = useStore(store, (snapshot) => snapshot.toast)

        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'session-delete: dictionaries')
        ctx.effect(() => () => { store.dispose() }, 'session-delete: request store')

        // A live Agent keeps its deleted Session in the Host's in-memory
        // registry, so a freshly loaded page receives it in the list
        // baseline. Ask the Host to re-announce the removal once the
        // baseline has landed.
        ctx.effect(() => {
          const sweep = () => {
            void fetch('api/session.delete.sweep', {
              method: 'POST',
              credentials: 'same-origin',
            }).catch(() => {})
          }
          const timers = [1500, 4000].map((ms) => setTimeout(sweep, ms))
          return () => {
            for (const timer of timers) clearTimeout(timer)
          }
        }, 'session-delete: startup sweep')

        ctx.slots.inject('sidebar.workspaces.session.menu.item', () => ctx.slots.register({
          name: 'sidebar.workspaces.session.menu.item',
          id: 'session-delete.delete',
          order: 500,
          locale: NS,
          inject: () => ({ requestDelete: store.open.bind(store) }),
        }, DeleteSessionMenuItem))

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'session-delete.dialog',
          locale: NS,
          inject: () => ({
            useRequest,
            useToast,
            closeDelete: store.close.bind(store),
            confirmDelete: async (sessionId, force, openInMain) => {
              const result = await requestDelete(sessionId, force)
              if (result.ok) {
                // A deleted Session cannot be opened again: leave the
                // conversation that showed it and start a fresh blank one.
                if (openInMain === true) {
                  try {
                    ctx.get('uiWorkspace')?.startSession()
                  } catch (error) {
                    console.warn('[session-delete] closing the deleted conversation failed', error)
                  }
                }
                store.notify(ctx.locale.bind(NS)('toast.deleted'), 'success')
              } else if (result.busy !== true) {
                store.notify(ctx.locale.bind(NS)('toast.failed', { message: result.message }), 'error')
              }
              return result
            },
          }),
        }, DeleteSessionOverlay))
      },
    }
  },
})
