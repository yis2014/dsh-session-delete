/**
 * Drive the running DSH Web GUI in headless Chrome through CDP.
 *
 * Creates an authenticated page (owner browser cookie minted from the
 * profile credential record), navigates it to the live GUI, then evaluates a
 * JavaScript file in the page and prints the JSON result. Optionally captures
 * a screenshot.
 *
 * Usage: node cdp.mjs <expression.js> [screenshot.png] [waitMs]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash, createHmac } from 'node:crypto'

const authority = process.env.DSH_TEST_AUTHORITY ?? '127.0.0.1:59374'
const origin = `http://${authority}`
const debugPort = process.env.CDP_PORT ?? '9333'
const expressionPath = process.argv[2]
const screenshotPath = process.argv[3]
const waitMs = Number(process.argv[4] ?? 4000)

const raw = readFileSync(`${process.env.USERPROFILE}\\.dsh\\.credentials.yaml`, 'utf8')
const secretLine = raw.split(/\r?\n/u).find((line) => line.includes('secret:'))
const secret = Buffer.from(secretLine.slice(secretLine.indexOf('secret:') + 'secret:'.length).trim(), 'base64url')
const b64 = (value) => Buffer.from(value).toString('base64url')
const cookieName = `dsh-auth-${createHash('sha256').update(authority).digest('base64url')}`
const now = Date.now()
const cookieBody = b64(JSON.stringify({ version: 1, authority, issuedAt: now, expiresAt: now + 86_400_000 }))
const cookieValue = `v1.${cookieBody}.${createHmac('sha256', secret).update(cookieBody).digest('base64url')}`

const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()
const target = targets.find((entry) => entry.type === 'page')
if (target === undefined) throw new Error('no page target')

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()
const consoleLines = []
socket.addEventListener('message', (event) => {
  const message = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString())
  if (message.id !== undefined) {
    const entry = pending.get(message.id)
    if (entry !== undefined) {
      pending.delete(message.id)
      if (message.error !== undefined) entry.reject(new Error(JSON.stringify(message.error)))
      else entry.resolve(message.result)
    }
    return
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    const text = message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ')
    if (text.includes('session-delete') || message.params.type === 'error') consoleLines.push(`[console.${message.params.type}] ${text}`)
  }
  if (message.method === 'Runtime.exceptionThrown') {
    consoleLines.push(`[exception] ${message.params.exceptionDetails?.exception?.description ?? message.params.exceptionDetails?.text ?? ''}`)
  }
})

function send(method, params = {}) {
  const id = nextId++
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

await send('Runtime.enable')
await send('Page.enable')
await send('Network.enable')
await send('Network.setCookie', {
  name: cookieName,
  value: cookieValue,
  domain: '127.0.0.1',
  path: '/',
  httpOnly: true,
  sameSite: 'Strict',
})

const currentUrl = await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true })
if (!String(currentUrl.result?.value ?? '').startsWith(origin)) {
  await send('Page.navigate', { url: `${origin}/` })
}
await new Promise((resolve) => setTimeout(resolve, waitMs))

let result
if (expressionPath !== undefined) {
  const expression = readFileSync(expressionPath, 'utf8')
  result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (result.exceptionDetails !== undefined) {
    console.log('EVAL-ERROR', JSON.stringify(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text))
  } else {
    console.log(JSON.stringify(result.result?.value ?? null, null, 2))
  }
}

if (screenshotPath !== undefined) {
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(screenshotPath, Buffer.from(shot.data, 'base64'))
  console.log(`screenshot ${screenshotPath}`)
}

for (const line of consoleLines) console.log(line)
socket.close()
