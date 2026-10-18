(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const row = document.querySelector('[data-row-key^="session:"][aria-selected="true"]')
  const title = row?.querySelector('span.hIlkoa_title') ?? row
  title?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }))
  await sleep(900)
  const dialog = document.querySelector('[role="dialog"]')
  return {
    dialog: dialog === null ? null : {
      text: (dialog.innerText ?? '').replace(/\s+/gu, ' ').trim().slice(0, 300),
      inputs: [...dialog.querySelectorAll('input,textarea')].map((input) => ({ tag: input.tagName, value: input.value, placeholder: input.placeholder })),
      buttons: [...dialog.querySelectorAll('button')].map((button) => ({ text: (button.innerText ?? '').trim(), label: button.getAttribute('aria-label') })),
    },
  }
})()
