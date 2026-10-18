(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const target = [...document.querySelectorAll('button,[role="tab"],[role="menuitem"]')]
    .find((node) => (node.innerText ?? '').trim() === '内置插件')
  target?.click()
  await sleep(1200)
  const text = (document.body.innerText ?? '').replace(/\s+/gu, ' ')
  return {
    clicked: target !== undefined,
    hasBundle: text.includes('Session Delete'),
    hasZhBundle: text.includes('删除会话'),
    excerpt: text.slice(text.indexOf('内置插件'), text.indexOf('内置插件') + 1200),
  }
})()
