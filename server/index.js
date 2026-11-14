// რა? სად? როდის? — API server (Express) + the built React app.
//
//   npm run build && npm start          → http://localhost:3001
//
// Environment variables
//   ADMIN_PASSWORD   password for the editor / control panel (required on a public server)
//   MONGODB_URI      MongoDB Atlas connection string; without it data is kept in ./data
//   MONGODB_DB       database name (default: ra-sad-rodis)
//   PORT             set automatically by Render
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import { createStorage } from './storage.js'

const PORT = Number(process.env.PORT) || 3001
const PASSWORD = process.env.ADMIN_PASSWORD ?? ''
const DIST = path.resolve('dist')
const ID_RE = /^[a-z0-9_-]{1,64}$/i

const storage = await createStorage()
const app = express()
app.disable('x-powered-by')

/* ───────────── auth ───────────── */

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest()
const passwordOk = (given) => !PASSWORD || crypto.timingSafeEqual(sha(given ?? ''), sha(PASSWORD))

// very small brute-force brake for the login endpoint
const failures = new Map()
function auth(req, res, next) {
  if (passwordOk(req.get('x-admin-key'))) return next()
  res.status(401).json({ error: 'wrong-password' })
}

/* ───────────── API ───────────── */

const api = express.Router()
api.use(express.json({ limit: '8mb' }))

api.get('/health', (_req, res) => res.json({ ok: true, storage: storage.kind, auth: !!PASSWORD }))

api.post('/login', (req, res) => {
  const ip = req.ip ?? '?'
  const f = failures.get(ip) ?? { n: 0, until: 0 }
  if (f.until > Date.now()) return res.status(429).json({ error: 'too-many-attempts' })
  if (passwordOk(req.body?.password)) {
    failures.delete(ip)
    return res.json({ ok: true })
  }
  f.n += 1
  if (f.n >= 5) Object.assign(f, { n: 0, until: Date.now() + 60_000 })
  failures.set(ip, f)
  res.status(401).json({ error: 'wrong-password' })
})

api.use(auth)

api.get('/state', async (_req, res) => {
  const s = await storage.getState()
  res.json({ game: s.game, gameRev: s.gameRev, scores: s.scores, scoresRev: s.scoresRev })
})
api.get('/revs', async (_req, res) => res.json(await storage.getRevs()))

api.put('/game', async (req, res) => {
  if (!req.body?.game?.stages) return res.status(400).json({ error: 'bad-game' })
  res.json({ rev: await storage.saveGame(req.body.game) })
})
api.put('/scores', async (req, res) => {
  if (!req.body?.scores?.marks) return res.status(400).json({ error: 'bad-scores' })
  res.json({ rev: await storage.saveScores(req.body.scores) })
})

api.put('/images/:id', express.raw({ type: () => true, limit: '12mb' }), async (req, res) => {
  const { id } = req.params
  const type = req.get('content-type') ?? ''
  if (!ID_RE.test(id) || !type.startsWith('image/') || !req.body?.length) return res.status(400).json({ error: 'bad-image' })
  await storage.putImage(id, type, req.body)
  res.json({ ok: true })
})
api.get('/images/:id', async (req, res) => {
  if (!ID_RE.test(req.params.id)) return res.sendStatus(400)
  const img = await storage.getImage(req.params.id)
  if (!img) return res.sendStatus(404)
  res.set('Content-Type', img.type).set('Cache-Control', 'private, max-age=31536000, immutable').send(img.data)
})
api.delete('/images/:id', async (req, res) => {
  if (!ID_RE.test(req.params.id)) return res.sendStatus(400)
  await storage.deleteImage(req.params.id)
  res.json({ ok: true })
})
api.delete('/images', async (_req, res) => {
  await storage.deleteAllImages()
  res.json({ ok: true })
})

api.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status ?? 500).json({ error: err.type ?? 'server-error' })
})

app.use('/api', api)

/* ───────────── the React app ───────────── */

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: 'index.html', maxAge: '1h' }))
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(DIST, 'index.html')) : next()))
} else {
  app.get('/', (_req, res) => res.send('Run "npm run build" first, or use "npm run dev" for development.'))
}

app.listen(PORT, () => {
  console.log(`რა? სად? როდის? → http://localhost:${PORT}  (storage: ${storage.kind}${PASSWORD ? ', password on' : ', NO PASSWORD'})`)
})
