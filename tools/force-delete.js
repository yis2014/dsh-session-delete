(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const dialog = document.querySelector('[role="dialog"]')
  const force = [...(dialog?.querySelectorAll('button') ?? [])]
    .find((button) => (button.innerText ?? '').trim() === '仍要删除')
  force?.click()
  await sleep(1200)
  const statuses = [...document.querySelectorAll('[role="status"]')]
    .map((node) => (node.innerText ?? '').trim())
    .filter((text) => text !== '')
  return {
    clicked: force !== undefined,
    dialogOpen: document.querySelector('[role="dialog"]') !== null,
    rowPresent: [...document.querySelectorAll('[data-row-key^="session:"]')]
      .some((row) => (row.innerText ?? '').includes('运行中删除界面测试')),
    statuses,
  }
})()
