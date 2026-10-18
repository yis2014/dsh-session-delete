(() => {
  const row = document.querySelector('[data-row-key^="session:"][aria-selected="true"]')
  const chain = []
  let node = row
  for (let depth = 0; depth < 4 && node !== null; depth += 1) {
    chain.push({
      depth,
      tag: node.tagName,
      cls: String(node.className).slice(0, 80),
      buttons: [...node.querySelectorAll('button')].map((button) => ({
        label: button.getAttribute('aria-label'),
        title: button.getAttribute('title'),
        text: (button.innerText ?? '').trim().slice(0, 20),
        cls: String(button.className).slice(0, 40),
      })),
    })
    node = node.parentElement
  }
  return {
    key: row?.getAttribute('data-row-key'),
    titleEl: row?.querySelector('span.hIlkoa_title')?.outerHTML,
    chain,
  }
})()
