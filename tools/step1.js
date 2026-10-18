(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const clickText = (text) => {
    const button = [...document.querySelectorAll('button')].find((candidate) => (candidate.innerText ?? '').trim() === text)
    if (button === undefined) return false
    button.click()
    return true
  }
  const clickLabel = (label) => {
    const button = document.querySelector(`button[aria-label="${label}"]`)
    if (button === null) return false
    button.click()
    return true
  }

  const dismissed = clickText('继续')
  await sleep(400)
  const expanded = clickLabel('打开侧边栏')
  await sleep(800)

  const rows = [...document.querySelectorAll('[data-row-key]')].map((row) => ({
    key: row.getAttribute('data-row-key'),
    text: (row.innerText ?? '').replace(/\s+/gu, ' ').trim().slice(0, 80),
  }))
  return {
    dismissed,
    expanded,
    rows,
    sidebarText: (document.querySelector('aside')?.innerText ?? '').slice(0, 600),
  }
})()
