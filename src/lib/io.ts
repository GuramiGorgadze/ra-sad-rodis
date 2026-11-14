import { emptyScores, makeBlock, makeDefaultGame } from './defaults'
import { allImageIds, blobToDataUrl, clearImages, dataUrlToBlob, deleteImage, getImage, putImage } from './media'
import { replaceAll, useStore } from './store'
import type { Game, Scores } from './types'

interface BackupFile {
  app: 'ra-sad-rodis'
  version: 1
  savedAt: string
  game: Game
  scores: Scores
  media: Record<string, string>
}

function usedImageIds(game: Game) {
  const ids = new Set<string>()
  for (const st of game.stages)
    for (const b of st.blocks)
      for (const q of b.questions) {
        if (q.image) ids.add(q.image)
        if (q.answerImage) ids.add(q.answerImage)
      }
  return ids
}

export async function exportBackup() {
  const { game, scores } = useStore.getState()
  const media: Record<string, string> = {}
  for (const id of usedImageIds(game)) {
    const blob = await getImage(id)
    if (blob) media[id] = await blobToDataUrl(blob)
  }
  const data: BackupFile = { app: 'ra-sad-rodis', version: 1, savedAt: new Date().toISOString(), game, scores, media }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const a = document.createElement('a')
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}-${String(d.getMinutes()).padStart(2, '0')}`
  a.href = URL.createObjectURL(blob)
  a.download = `ra-sad-rodis_${stamp}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

export async function importBackup(file: File) {
  const data = JSON.parse(await file.text()) as BackupFile
  if (data?.app !== 'ra-sad-rodis' || !data.game?.stages) throw new Error('ეს ფაილი თამაშის სარეზერვო ასლი არ არის.')
  await clearImages()
  for (const [id, url] of Object.entries(data.media ?? {})) await putImage(await dataUrlToBlob(url), id)
  replaceAll(data.game, data.scores ?? emptyScores())
}

/** Removes pictures that no question uses any more. */
export async function cleanupImages() {
  const used = usedImageIds(useStore.getState().game)
  for (const id of await allImageIds()) if (!used.has(id)) await deleteImage(id)
}

export async function resetEverything() {
  await clearImages()
  replaceAll(makeDefaultGame(), emptyScores())
}

/* ───────────── demo content ───────────── */

const svgBlob = (svg: string) => new Blob([svg], { type: 'image/svg+xml' })

const DEMO_LANDSCAPE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2b4a"/><stop offset=".6" stop-color="#d9825b"/><stop offset="1" stop-color="#f3c67a"/></linearGradient>
<linearGradient id="m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3350"/><stop offset="1" stop-color="#1b1726"/></linearGradient></defs>
<rect width="1600" height="1000" fill="url(#sky)"/>
<circle cx="1150" cy="560" r="120" fill="#ffe2a6" opacity=".95"/>
<path d="M0 760 L260 430 L420 600 L640 300 L900 640 L1100 470 L1380 720 L1600 560 L1600 1000 L0 1000Z" fill="url(#m1)"/>
<path d="M640 300 L700 380 L660 370 L620 410 L590 360Z M260 430 L300 480 L270 470 L240 495Z" fill="#f4efe6" opacity=".9"/>
<path d="M0 860 C300 800 500 900 800 850 S1300 820 1600 870 L1600 1000 L0 1000Z" fill="#0f0c14"/>
</svg>`

const DEMO_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
<rect width="1000" height="1000" fill="#f3ece0"/>
<circle cx="500" cy="500" r="380" fill="#fffaf0" stroke="#2b261f" stroke-width="22"/>
${Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6
  const x1 = 500 + Math.sin(a) * 330, y1 = 500 - Math.cos(a) * 330
  const x2 = 500 + Math.sin(a) * 365, y2 = 500 - Math.cos(a) * 365
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2b261f" stroke-width="${i % 3 === 0 ? 16 : 8}" stroke-linecap="round"/>`
}).join('')}
<line x1="500" y1="500" x2="500" y2="300" stroke="#2b261f" stroke-width="22" stroke-linecap="round"/>
<line x1="500" y1="500" x2="500" y2="200" stroke="#2b261f" stroke-width="10" stroke-linecap="round"/>
<circle cx="500" cy="500" r="22" fill="#c9963a"/>
</svg>`

export async function loadDemo() {
  await clearImages()
  const g = makeDefaultGame()
  const names = ['ფიქრის ფრთები', 'ბუს თვალი', 'ჩიხი', 'ცოდნის ტალღა', 'ლოგოსი', 'კითხვის ნიშანი', 'მეოთხე განზომილება', 'ერუდიტები']
  g.teams.forEach((t, i) => (t.name = names[i]))
  g.settings.eventSubtitle = 'სკოლის ინტელექტუალური თამაში · დემო'
  const landscape = await putImage(svgBlob(DEMO_LANDSCAPE))
  const clock = await putImage(svgBlob(DEMO_CLOCK))
  const answers = [
    ['ფიროსმანი', 'ნიკო ფიროსმანაშვილი ხატავდა შავ მუშამბაზე — სწორედ ამიტომ არის მისი ფონი ასეთი მუქი.'],
    ['ქუთაისი', ''],
    ['ზუსტად შუადღეს', ''],
    ['ვეფხისტყაოსანი', 'შოთა რუსთაველის პოემა, XII საუკუნე.'],
    ['ჟანგბადი', ''],
    ['მთაწმინდა', ''],
    ['ჭადრაკი', 'ნონა გაფრინდაშვილი — პირველი ქალი, რომელმაც მამაკაცთა დიდოსტატის წოდება მიიღო.'],
    ['ილია ჭავჭავაძე', ''],
    ['ენგური', ''],
    ['ანბანი', '33 ასო თანამედროვე ქართულ ანბანში.'],
  ]
  const q = g.stages[0].blocks[0].questions
  q.forEach((qq, i) => {
    qq.answerText = answers[i][0]
    qq.comment = answers[i][1]
    qq.hostText = 'აქ ჩაწერეთ კითხვის ტექსტი — ის მხოლოდ წამყვანის ეკრანზე ჩანს და პროექტორზე არ გამოჩნდება.'
  })
  q[0].image = landscape
  q[2].answerImage = clock
  // a 20-question day: second block, then answers + break between them
  g.stages[0].blocks.push(makeBlock('regular', 'ტური 2'))
  g.stages[0].blocks[1].questions.forEach((qq, i) => (qq.answerText = `პასუხი ${i + 11}`))
  replaceAll(g, emptyScores())
}
