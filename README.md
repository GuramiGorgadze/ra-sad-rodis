# რა? სად? როდის? — სკოლის თამაშის ეკრანი

React-ის აპლიკაცია პროექტორისთვის: კითხვის ნომერი და სურათი, 60/20 წამიანი ტაიმერი ხმით,
პასუხები (ტექსტი ან სურათი), ყველა პასუხის სია, შედეგები და შესვენება.
ქულები და მართვა ცალკე ფანჯარაშია — პროექტორზე არ ჩანს.

## ყველაზე მარტივი გაშვება (ინტერნეტის და პროგრამების გარეშე)

გახსენით **`ra-sad-rodis.html`** Google Chrome-ში ან Microsoft Edge-ში (ორჯერ დააწკაპუნეთ).
ეს ერთი ფაილი შეიცავს მთელ აპლიკაციას და შრიფტებს.

## გაშვება როგორც React პროექტი

საჭიროა [Node.js](https://nodejs.org) 20 ან უფრო ახალი.

```bash
npm install
npm run dev            # გაიხსნება http://localhost:5173
npm run build          # ჩვეულებრივი build → dist/
npm run build:single   # ერთი HTML ფაილი → dist-single/index.html
```

## ონლაინ შენახვა (MERN: MongoDB + Express + React + Node)

როცა აპლიკაცია სერვერიდან იხსნება (`npm start` ან Render), გუნდები, კითხვები, პასუხები, სურათები და ქულები
ავტომატურად ინახება MongoDB-ში. ნებისმიერ კომპიუტერზე: გახსენით მისამართი → პაროლი → ყველაფერი ჩაიტვირთება.
სათაურში ჩანს «შენახულია ონლაინ». ეკრანის მიმდინარე მდგომარეობა (რომელი კითხვაა, ტაიმერი) რჩება ამ კომპიუტერზე.

```bash
npm install
npm run build
ADMIN_PASSWORD=ჩემი-პაროლი MONGODB_URI="mongodb+srv://..." npm start   # http://localhost:3001
```

| ცვლადი | რისთვის |
|---|---|
| `ADMIN_PASSWORD` | პაროლი შესასვლელად (აუცილებელია საჯარო სერვერზე) |
| `MONGODB_URI` | MongoDB Atlas-ის მისამართი. თუ არ არის — მონაცემები ინახება `data/` საქაღალდეში |
| `MONGODB_DB` | ბაზის სახელი (ნაგულისხმევი: `ra-sad-rodis`) |

დეველოპმენტი: `npm run dev` უშვებს Vite-ს (5173) და API-ს (3001) ერთად.
Render-ზე: **Web Service**, Build `npm install && npm run build`, Start `npm start`, + ზემოთ მოცემული ცვლადები.

## როგორ ჩავატაროთ თამაში

1. **რედაქტორი** (`#/editor`) — ჩაწერეთ გუნდების სახელები, თითო ეტაპისთვის მონიშნეთ მონაწილე გუნდები,
   ატვირთეთ კითხვის სურათები (გადმოათრიეთ, აირჩიეთ ან Ctrl+V) და ჩაწერეთ პასუხები.
   «კითხვის ტექსტი» მხოლოდ წამყვანს უჩანს პულტზე.
2. **ლეპტოპი + პროექტორი** — Win + P → «Extend». დააჭირეთ «პროექტორის ეკრანი», ფანჯარა გადაიტანეთ
   პროექტორზე და დააჭირეთ **F** (სრული ეკრანი).
3. **პულტი** (`#/control`) — თქვენს ეკრანზე: ცოცხალი გადახედვა, შემდეგი/წინა, ტაიმერი,
   სწორი პასუხების მონიშვნა, შედეგები, შესვენება, შავი ეკრანი.
4. **ქულები** (`#/scores`) — სრული ცხრილი, +/− კორექცია, «შედეგები ეკრანზე».

### კლავიშები

| კლავიში | პულტზე | პროექტორის ფანჯარაში |
|---|---|---|
| → / PageDown | შემდეგი | შემდეგი (პრეზენტაციის პულტიც მუშაობს) |
| ← / PageUp | წინა | წინა |
| Space | ტაიმერი: დაწყება / პაუზა | იგივე |
| 1 … 9 | გუნდმა სწორად უპასუხა (მიმდინარე კითხვა) | — |
| R | შედეგები | შედეგები |
| B | შავი ეკრანი / დაბრუნება | იგივე |
| F | — | სრული ეკრანი |

### ფორმატი (შეგიძლიათ შეცვალოთ რედაქტორში)

- **პირველი დღე** — 8 გუნდი, 10 კითხვა
- **მეორე დღე** — 4 გუნდი, 10 კითხვა
- **ფინალი** — 1 გუნდი, 10 კითხვა + ბლიცი (3 × 20 წმ) + სუპერბლიცი (3 × 20 წმ)

20 კითხვისთვის ეტაპს დაუმატეთ მეორე «ტური». თანმიმდევრობა ავტომატურია:
კითხვები → ყველა პასუხი → შედეგები → **შესვენება** → მეორე ტური → ყველა პასუხი → შედეგები.
კითხვების ნუმერაცია მეორე ტურში გრძელდება (11–20).
ეტაპის პარამეტრებში შეგიძლიათ აირჩიოთ პასუხების ჩვენება «ყოველი კითხვის შემდეგ» ან «ტურის ბოლოს».

### მნიშვნელოვანი

- ყველა ფანჯარა (პროექტორი, პულტი, რედაქტორი) **ერთ კომპიუტერზე, ერთსა და იმავე ბრაუზერში** უნდა იყოს გახსნილი —
  ისინი ერთმანეთს ბრაუზერის მეხსიერებით უკავშირდებიან.
- ფაილიდან (`ra-sad-rodis.html`) გახსნისას მონაცემები ინახება მხოლოდ ამ ბრაუზერში. სხვა კომპიუტერზე გადასატანად: რედაქტორი → «ზოგადი და ფაილები» →
  «სარეზერვო ასლის ჩამოტვირთვა», შემდეგ იქ «ასლის ატვირთვა». **თამაშის წინ აუცილებლად გააკეთეთ ასლი.**
- ხმა: ტაიმერის სიგნალები ისმის პულტის ფანჯრიდან (თუ ის ღიაა), წინააღმდეგ შემთხვევაში — პროექტორის ფანჯრიდან.
  ბრაუზერი ხმას რთავს მხოლოდ მას შემდეგ, რაც ფანჯარაზე ერთხელ დააწკაპუნებთ.
- «დემო თამაში» (რედაქტორი → ზოგადი) ავსებს სატესტო მონაცემებს — სცადეთ თამაშამდე.

---

## English summary

A projector app for the Georgian school edition of *What? Where? When?*.

- `#/screen` — the projected display (question number + optional picture, timer ring, answers, recap, results, break).
- `#/control` — operator panel with live preview, run-of-show list, timer, per-question scoring (keys 1–9).
- `#/scores` — full score grid with +/- adjustments; not projected.
- `#/editor` — teams, stages, rounds (regular / blitz / super blitz), questions with image upload, backup import/export, demo data.

Online mode (MERN): `server/index.js` (Express 5) stores the game, scores and pictures in MongoDB (`MONGODB_URI`)
or in `./data` without it, protected by `ADMIN_PASSWORD`; the client autosaves, polls for changes from other
computers every 15 s and caches all pictures locally so the show keeps working offline.
State syncs between windows of the same browser through `localStorage` + `storage` events; pictures are
stored in IndexedDB and downsized to ≤2400 px. Sounds are synthesised with Web Audio. Fonts (Noto Serif Georgian,
FiraGO, Playfair Display) are bundled, so it runs fully offline. Stack: Vite, React 19, TypeScript, Tailwind CSS 4,
Motion, Zustand, Lucide. Design notes: `docs/brand-guidelines.md`.
