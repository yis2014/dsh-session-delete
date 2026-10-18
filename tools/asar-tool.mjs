import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

const asarPath = process.argv[2]
const outDir = process.argv[3]
const filter = process.argv[4] ?? ''

const fd = readFileSync(asarPath)
// ASAR layout: uint32 4 | uint32 headerBlockSize | uint32 headerStringSize | uint32 jsonSize | JSON
const jsonLength = fd.readUInt32LE(12)
const header = JSON.parse(fd.subarray(16, 16 + jsonLength).toString('utf8'))
const baseOffset = 8 + fd.readUInt32LE(4)

const entries = []
function walk(node, prefix) {
  for (const [name, child] of Object.entries(node.files ?? {})) {
    const path = prefix ? `${prefix}/${name}` : name
    if (child.files) walk(child, path)
    else if (child.link) continue
    else entries.push({ path, offset: Number(child.offset), size: Number(child.size) })
  }
}
walk(header, '')

if (!outDir) {
  for (const e of entries) if (e.path.includes(filter)) console.log(e.path, e.size)
} else {
  let n = 0
  for (const e of entries) {
    if (filter && !e.path.includes(filter)) continue
    const dest = join(outDir, e.path)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, fd.subarray(baseOffset + e.offset, baseOffset + e.offset + e.size))
    n++
  }
  console.log(`extracted ${n} files to ${outDir}`)
}
