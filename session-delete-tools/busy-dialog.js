(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  await sleep(300)
  const row = [...document.querySelectorAll('[data-row-key^="session:"]')]
    .find((candidate) => (candidate.innerText ?? '').includes('运行中删除界面测试'))
  if (row === undefined) return { error: 'row not found', rows: [...document.querySelectorAll('[data-row-key^="session:"]')].map((r) => r.innerText) }
  const more = [...row.parentElement.parentElement.querySelectorAll('button')]
    .find((button) => (button.getAttribute('aria-label') ?? '').includes('运行中删除界面测试'))
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
  const busyDialog = document.querySelector('[role="dialog"]')
  return {
    clicked: { more: more !== undefined, deleteItem: deleteItem !== undefined, confirm: confirm !== undefined },
    dialog: busyDialog === null ? null : {
      text: (busyDialog.innerText ?? '').replace(/\s+/gu, ' ').trim().slice(0, 600),
      buttons: [...busyDialog.querySelectorAll('button')].map((button) => (button.innerText ?? '').trim()).filter(Boolean),
    },
  }
})()
