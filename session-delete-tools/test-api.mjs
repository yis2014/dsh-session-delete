/**
 * Local test client for the running DSH Web Host.
 *
 * Mints the owner browser cookie from the profile's stored signing secret and
 * issues one authenticated request. Used to exercise Host routes without a
 * browser.
 *
 * Usage:
 *   node test-api.mjs POST /api/session.delete @body.json
 *   node test-api.mjs rpc <endpoint> @payload.json
 */
import { readFileSync } from 'node:fs'
import { createHash, createHmac } from 'node:crypto'

const credentialPath = `${process.env.USERPROFILE}\\.dsh\\.credentials.yaml`
const authority = process.env.DSH_TEST_AUTHORITY ?? '127.0.0.1:59374'
const origin = `http://${authority}`

const raw = readFileSync(credentialPath, 'utf8')
const secretLine = raw.split(/\r?\n/u).find((line) => line.includes('secret:'))
if (secretLine === undefined) throw new Error('no browser-session secret in credentials')
const secret = Buffer.from(secretLine.slice(secretLine.indexOf('secret:') + 'secret:'.length).trim(), 'base64url')

const b64 = (value) => Buffer.from(value).toString('base64url')
const cookieName = `dsh-auth-${createHash('sha256').update(authority).digest('base64url')}`
const now = Date.now()
const cookieBody = b64(JSON.stringify({ version: 1, authority, issuedAt: now, expiresAt: now + 86_400_000 }))
const cookie = `v1.${cookieBody}.${createHmac('sha256', secret).update(cookieBody).digest('base64url')}`

const mode = process.argv[2]
const readPayload = (arg) => (arg?.startsWith('@') === true ? readFileSync(arg.slice(1), 'utf8') : arg)

let path
let method = 'POST'
let body
if (mode === 'rpc') {
  const endpoint = process.argv[3]
  const payload = readPayload(process.argv[4]) ?? '{}'
  path = `/api/${endpoint}`
  body = JSON.stringify({
    type: 'client-request',
    rpcId: `test-${String(Date.now())}`,
    method: endpoint,
    payload: JSON.parse(payload),
  })
} else {
  method = (mode ?? 'GET').toUpperCase()
  path = process.argv[3] ?? '/api/session.list'
  body = readPayload(process.argv[4])
}

const response = await fetch(`${origin}${path}`, {
  method,
  headers: {
    cookie: `${cookieName}=${cookie}`,
    ...(body === undefined ? {} : { 'content-type': 'application/json' }),
  },
  ...(body === undefined ? {} : { body }),
})
const text = await response.text()
console.log(`HTTP ${String(response.status)} ${response.headers.get('content-type') ?? ''}`)
console.log(text.slice(0, 6000))
