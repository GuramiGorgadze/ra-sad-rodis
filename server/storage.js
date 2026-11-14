// Two interchangeable storage back-ends with the same methods:
//   • MongoDB   — used when MONGODB_URI is set (Render + MongoDB Atlas)
//   • JSON files — used otherwise (local computer, no database needed)
import fs from 'node:fs/promises'
import path from 'node:path'
import { MongoClient, Binary } from 'mongodb'

const EMPTY = { game: null, gameRev: 0, scores: null, scoresRev: 0 }

export async function createStorage() {
  if (process.env.MONGODB_URI) return mongoStorage(process.env.MONGODB_URI)
  return fileStorage(process.env.DATA_DIR || path.resolve('data'))
}

/* ───────────── MongoDB ───────────── */

async function mongoStorage(uri) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 })
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || 'ra-sad-rodis')
  const state = db.collection('state')
  const images = db.collection('images')

  const bump = async (field, value) => {
    const res = await state.findOneAndUpdate(
      { _id: 'main' },
      { $set: { [field]: value, updatedAt: new Date() }, $inc: { [`${field}Rev`]: 1 } },
      { upsert: true, returnDocument: 'after' },
    )
    return res[`${field}Rev`]
  }

  return {
    kind: 'mongo',
    async getState() {
      const doc = await state.findOne({ _id: 'main' })
      return { ...EMPTY, ...(doc ?? {}) }
    },
    async getRevs() {
      const doc = await state.findOne({ _id: 'main' }, { projection: { gameRev: 1, scoresRev: 1 } })
      return { gameRev: doc?.gameRev ?? 0, scoresRev: doc?.scoresRev ?? 0 }
    },
    saveGame: (game) => bump('game', game),
    saveScores: (scores) => bump('scores', scores),
    async putImage(id, type, buf) {
      await images.replaceOne({ _id: id }, { _id: id, type, size: buf.length, data: new Binary(buf) }, { upsert: true })
    },
    async getImage(id) {
      const doc = await images.findOne({ _id: id })
      return doc ? { type: doc.type, data: Buffer.from(doc.data.buffer) } : null
    },
    deleteImage: (id) => images.deleteOne({ _id: id }),
    deleteAllImages: () => images.deleteMany({}),
  }
}

/* ───────────── JSON files ───────────── */

async function fileStorage(dir) {
  const imgDir = path.join(dir, 'images')
  await fs.mkdir(imgDir, { recursive: true })
  const statePath = path.join(dir, 'state.json')

  const read = async () => {
    try {
      return { ...EMPTY, ...JSON.parse(await fs.readFile(statePath, 'utf8')) }
    } catch {
      return { ...EMPTY }
    }
  }
  // writes are queued so two saves never interleave
  let queue = Promise.resolve()
  const bump = (field, value) =>
    (queue = queue.then(async () => {
      const s = await read()
      s[field] = value
      s[`${field}Rev`] = (s[`${field}Rev`] ?? 0) + 1
      s.updatedAt = new Date().toISOString()
      await fs.writeFile(statePath + '.tmp', JSON.stringify(s))
      await fs.rename(statePath + '.tmp', statePath)
      return s[`${field}Rev`]
    }))

  return {
    kind: 'file',
    getState: read,
    async getRevs() {
      const s = await read()
      return { gameRev: s.gameRev, scoresRev: s.scoresRev }
    },
    saveGame: (game) => bump('game', game),
    saveScores: (scores) => bump('scores', scores),
    async putImage(id, type, buf) {
      await fs.writeFile(path.join(imgDir, id), buf)
      await fs.writeFile(path.join(imgDir, id + '.type'), type)
    },
    async getImage(id) {
      try {
        const [data, type] = await Promise.all([
          fs.readFile(path.join(imgDir, id)),
          fs.readFile(path.join(imgDir, id + '.type'), 'utf8'),
        ])
        return { type, data }
      } catch {
        return null
      }
    },
    async deleteImage(id) {
      await fs.rm(path.join(imgDir, id), { force: true })
      await fs.rm(path.join(imgDir, id + '.type'), { force: true })
    },
    async deleteAllImages() {
      await fs.rm(imgDir, { recursive: true, force: true })
      await fs.mkdir(imgDir, { recursive: true })
    },
  }
}
