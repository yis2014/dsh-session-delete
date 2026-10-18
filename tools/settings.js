(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const account = document.querySelector('button[aria-label="账号菜单"]')
  account?.click()
  await sleep(600)
  const menuItems = [...document.querySelectorAll('[role="menuitem"]')].map((item) => (item.innerText ?? '').replace(/\s+/gu, ' ').trim())
  const settings = [...document.querySelectorAll('[role="menuitem"]')].find((item) => (item.innerText ?? '').includes('设置'))
  settings?.click()
  await sleep(1000)
  return {
    menuItems,
    settingsClicked: settings !== undefined,
    panelText: (document.body.innerText ?? '').replace(/\s+/gu, ' ').slice(0, 800),
    tabs: [...document.querySelectorAll('[role="tab"],[role="menuitem"],[role="button"]')].map((node) => (node.innerText ?? '').replace(/\s+/gu, ' ').trim()).filter(Boolean).slice(0, 40),
  }
})()
