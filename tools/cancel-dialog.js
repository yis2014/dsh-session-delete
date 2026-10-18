(() => {
  const dialog = document.querySelector('[role="dialog"]')
  const cancel = [...(dialog?.querySelectorAll('button') ?? [])].find((button) => (button.innerText ?? '').trim() === '取消')
  cancel?.click()
  return { closed: cancel !== undefined, remainingDialog: document.querySelector('[role="dialog"]') !== null }
})()
