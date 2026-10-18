(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  await sleep(500)
  const rows = [...document.querySelectorAll('[data-row-key^="session:"]')].map((row) => ({
    key: row.getAttribute('data-row-key'),
    text: (row.innerText ?? '').replace(/\s+/gu, ' ').trim(),
  }))
  const target = rows.find((row) => row.text.includes('删除功能验证会话'))
  if (target === undefined) return { rows, found: false }
  const rowEl = document.querySelector(`[data-row-key="${target.key}"]`)
  const more = [...(rowEl?.parentElement?.parentElement?.querySelectorAll('button') ?? [])]
    .find((button) => (button.getAttribute('aria-label') ?? '').includes('删除功能验证会话'))
  more?.click()
  await sleep(500)
  const menus = [...document.querySelectorAll('[role="menu"]')].map((menu) => ({
    text: (menu.innerText ?? '').replace(/\s+/gu, ' ').trim().slice(0, 400),
    items: [...menu.querySelectorAll('[role="menuitem"]')].map((item) => ({
      text: (item.innerText ?? '').replace(/\s+/gu, ' ').trim(),
      label: item.getAttribute('aria-label'),
      cls: String(item.className).slice(0, 60),
    })),
  }))
  return { found: true, rows, clicked: more !== undefined, menus }
})()
