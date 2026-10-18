(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await sleep(300)
  const heading = [...document.querySelectorAll('h1,h2,h3,h4,div,span')]
    .find((node) => (node.textContent ?? '').trim() === '已安装插件')
  heading?.scrollIntoView({ block: 'start' })
  await sleep(600)
  const text = (document.body.innerText ?? '').replace(/\s+/gu, ' ')
  const at = text.indexOf('已安装插件')
  return {
    found: heading !== undefined,
    excerpt: at < 0 ? text.slice(-1200) : text.slice(at, at + 900),
    icons: [...document.querySelectorAll('img,svg')].slice(-12).map((node) => ({
      tag: node.tagName,
      src: node.getAttribute('src'),
      w: node.getAttribute('width'),
      h: node.getAttribute('height'),
    })),
  }
})()
