(() => {
  const buttons = [...document.querySelectorAll('button')]
    .slice(0, 40)
    .map((button) => ({
      label: button.getAttribute('aria-label'),
      title: button.getAttribute('title'),
      text: (button.innerText ?? '').trim().slice(0, 40),
      cls: String(button.className).slice(0, 60),
    }))
  return {
    href: location.href,
    title: document.title,
    boot: Boolean(window.__DSH_BOOT__),
    rootChildren: document.getElementById('root')?.childElementCount ?? -1,
    text: (document.body.innerText ?? '').slice(0, 1200),
    buttons,
  }
})()
