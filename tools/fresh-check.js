(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const clickText = (text) => {
    const button = [...document.querySelectorAll('button')].find((candidate) => (candidate.innerText ?? '').trim() === text)
    button?.click()
    return button !== undefined
  }
  const clickLabel = (label) => {
    const button = document.querySelector(`button[aria-label="${label}"]`)
    button?.click()
    return button !== undefined
  }

  const dismissed = clickText('继续')
  await sleep(300)
  const expanded = clickLabel('打开侧边栏')
  await sleep(1200)

  const row = [...document.querySelectorAll('[data-row-key^="session:"]')]
    .find((candidate) => (candidate.innerText ?? '').includes('相机连接电脑访问DC-S5'))
  const more = row === undefined
    ? undefined
    : [...row.parentElement.parentElement.querySelectorAll('button')]
      .find((button) => (button.getAttribute('aria-label') ?? '').includes('相机连接电脑访问DC-S5'))
  more?.click()
  await sleep(500)
  const menu = document.querySelector('[role="menu"]')
  const items = [...(menu?.querySelectorAll('[role="menuitem"]') ?? [])]
    .map((item) => (item.innerText ?? '').replace(/\s+/gu, ' ').trim())

  return {
    dismissed,
    expanded,
    rows: [...document.querySelectorAll('[data-row-key^="session:"]')].map((candidate) => (candidate.innerText ?? '').replace(/\s+/gu, ' ').trim()),
    menuItems: items,
    hasDelete: items.some((text) => text === '删除会话'),
  }
})()
