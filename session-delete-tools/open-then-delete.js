(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  // Close any open menu/settings by escaping, then open the scratch Session.
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await sleep(400)
  const row = [...document.querySelectorAll('[data-row-key^="session:"]')]
    .find((candidate) => (candidate.innerText ?? '').includes('打开后删除测试'))
  if (row === undefined) return { error: 'row not found' }
  row.querySelector('span.hIlkoa_title')?.click()
  await sleep(1500)
  const opened = (document.body.innerText ?? '').includes('打开后删除测试')
  const more = [...row.parentElement.parentElement.querySelectorAll('button')]
    .find((button) => (button.getAttribute('aria-label') ?? '').includes('打开后删除测试'))
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
  await sleep(1500)
  return {
    opened,
    deleted: { menu: deleteItem !== undefined, confirm: confirm !== undefined },
    dialogOpen: document.querySelector('[role="dialog"]') !== null,
    rowPresent: [...document.querySelectorAll('[data-row-key^="session:"]')]
      .some((candidate) => (candidate.innerText ?? '').includes('打开后删除测试')),
    mainText: (document.querySelector('main')?.innerText ?? document.body.innerText ?? '')
      .replace(/\s+/gu, ' ').slice(0, 400),
  }
})()
