(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await sleep(300)
  document.querySelector('button[aria-label="打开侧边栏"]')?.click()
  await sleep(1200)
  const row = [...document.querySelectorAll('[data-row-key^="session:"]')]
    .find((candidate) => (candidate.innerText ?? '').includes('打开后删除测试二'))
  if (row === undefined) return { error: 'row not found', rows: [...document.querySelectorAll('[data-row-key^="session:"]')].map((r) => r.innerText) }
  row.querySelector('span.hIlkoa_title')?.click()
  await sleep(1500)
  const opened = (document.body.innerText ?? '').includes('打开后删除测试二')
  const more = [...row.parentElement.parentElement.querySelectorAll('button')]
    .find((button) => (button.getAttribute('aria-label') ?? '').includes('打开后删除测试二'))
  more?.click()
  await sleep(400)
  const menu = document.querySelector('[role="menu"]')
  const deleteItem = [...(menu?.querySelectorAll('[role="menuitem"]') ?? [])]
    .find((item) => (item.innerText ?? '').trim() === '删除会话')
  deleteItem?.click()
  await sleep(400)
  const dialog = document.querySelector('[role="dialog"]')
  const confirm = [...(dialog?.querySelectorAll('button') ?? [])]
    .find((button) => (button.innerText ?? '').trim() === '删除')
  confirm?.click()
  await sleep(1800)
  const text = (document.body.innerText ?? '').replace(/\s+/gu, ' ')
  return {
    opened,
    deleted: { menu: deleteItem !== undefined, confirm: confirm !== undefined },
    dialogOpen: document.querySelector('[role="dialog"]') !== null,
    rowPresent: [...document.querySelectorAll('[data-row-key^="session:"]')]
      .some((candidate) => (candidate.innerText ?? '').includes('打开后删除测试二')),
    showsDeletedContent: text.includes('打开后删除测试二'),
    unavailableNotice: text.includes('会话不可用'),
    heroVisible: text.includes('描述你想要构建的内容'),
    statuses: [...document.querySelectorAll('[role="status"]')].map((node) => (node.innerText ?? '').trim()).filter(Boolean),
  }
})()
