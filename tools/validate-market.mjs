import { readFileSync } from 'node:fs'
import { parseMarketIndex, marketInstallTarget } from './.market/dsh/node_modules/@deepseek-ai/dsh-plugin-market-index/lib/index.js'

const indexUrl = process.argv[2] ?? 'https://cdn.jsdelivr.net/gh/yis2014/dsh-session-delete@main/market.json'
const document = JSON.parse(readFileSync('../market.json', 'utf8'))
const index = parseMarketIndex(document, indexUrl)
console.log(JSON.stringify({ title: index.title, plugins: index.plugins.length }, null, 2))
for (const plugin of index.plugins) {
  for (const version of plugin.versions) {
    console.log(JSON.stringify({
      name: plugin.name,
      version: version.version,
      icon: plugin.icon,
      engines: version.engines,
      install: marketInstallTarget(plugin.name, version),
    }, null, 2))
  }
}
