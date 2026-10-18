(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  await sleep(400)
  const row = [...document.querySelectorAll('[data-row-key^="session:"]')]
    .find((candidate) => (candidate.innerText ?? '').includes('相机连接电脑访问DC-S5'))
  if (row === undefined) return { error: 'row not found' }
  const rowKey = row.getAttribute('data-row-key')
  const more = [...row.parentElement.parentElement.querySelectorAll('button')]
    .find((button) => (button.getAttribute('aria-label') ?? '').includes('相机连接电脑访问DC-S5'))
  more?.click()
  await sleep(500)
  const menu = document.querySelector('[role="menu"]')
  const items = [...(menu?.querySelectorAll('[role="menuitem"]') ?? [])].map((item) => ({
    text: (item.innerText ?? '').replace(/\s+/gu, ' ').trim(),
    role: item.getAttribute('role'),
  }))
  const deleteItem = [...(menu?.querySelectorAll('[role="menuitem"]') ?? [])]
    .find((item) => (item.innerText ?? '').trim() === '删除会话')
  deleteItem?.click()
  await sleep(700)
  const dialog = document.querySelector('[role="dialog"]')
  return {
    rowKey,
    items,
    dialog: dialog === null ? null : {
      text: (dialog.innerText ?? '').replace(/\s+/gu, ' ').trim().slice(0, 500),
      buttons: [...dialog.querySelectorAll('button')].map((button) => (button.innerText ?? '').trim()).filter(Boolean),
    },
  }
})()
