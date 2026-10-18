(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const close = [...document.querySelectorAll('button')].find((button) => (button.innerText ?? '').trim() === '关闭')
  close?.click()
  await sleep(500)
  const plugins = document.querySelector('button[aria-label="插件"]')
  plugins?.click()
  await sleep(1500)
  const text = (document.body.innerText ?? '').replace(/\s+/gu, ' ')
  return {
    closed: close !== undefined,
    opened: plugins !== undefined,
    hasTitle: text.includes('Session Delete'),
    excerpt: text.slice(0, 1600),
  }
})()
