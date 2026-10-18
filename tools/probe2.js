(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const newSession = document.querySelector('button[aria-label="新建会话"]')
  newSession?.click()
  await sleep(1200)

  const rows = [...document.querySelectorAll('[data-row-key^="session:"]')]
  const selected = rows.find((row) => row.getAttribute('aria-current') === 'true') ?? rows[0]
  const buttons = [...(selected?.querySelectorAll('button') ?? [])].map((button) => ({
    label: button.getAttribute('aria-label'),
    title: button.getAttribute('title'),
    cls: String(button.className).slice(0, 50),
    text: (button.innerText ?? '').trim().slice(0, 30),
  }))
  return {
    count: rows.length,
    selectedKey: selected?.getAttribute('data-row-key'),
    selectedText: (selected?.innerText ?? '').replace(/\s+/gu, ' ').trim().slice(0, 120),
    buttons,
    html: (selected?.outerHTML ?? '').slice(0, 2500),
  }
})()
