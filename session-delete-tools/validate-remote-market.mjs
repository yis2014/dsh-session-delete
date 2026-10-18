import { parseMarketIndex, marketInstallTarget } from './.market/dsh/node_modules/@deepseek-ai/dsh-plugin-market-index/lib/index.js'

const url = process.argv[2] ?? 'https://cdn.jsdelivr.net/gh/yis2014/dsh-session-delete@main/market.json'
const response = await fetch(url)
if (!response.ok) throw new Error(`${url} answered ${String(response.status)}`)
const index = parseMarketIndex(await response.json(), url)
const plugin = index.plugins[0]
console.log(JSON.stringify({
  url,
  title: index.title,
  plugin: plugin.name,
  icon: plugin.icon,
  version: plugin.versions[0].version,
  engines: plugin.versions[0].engines,
  install: marketInstallTarget(plugin.name, plugin.versions[0]),
}, null, 2))
