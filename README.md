<div align="center">

# Games

Browser mini-games for kids - spelling bee, word spell, and coloring island, all in one Next.js app.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)

**[Play it live](https://games-bheng.vercel.app)**

</div>

## Games

The homepage grid auto-discovers every folder under `app/` that has a `page.tsx` - no manual registry, no config. Today that's 3 games:

- **Spelling Bee** (`/spelling-bee`) - 12 categories (animals, food, colors, transportation, and more), 10 words each. The browser reads each word aloud with the Web Speech API, you spell it back on an on-screen keyboard, and get a score out of 100 with confetti on every correct word.
- **Spell** (`/spell`) - a lighter word-building quiz across 2 categories (colors, animals). Tap letters on an on-screen keyboard to spell the word shown, with confetti on completion.
- **Coloring Island** (`/coloring-island`) - tap-to-paint fruit outlines (grapes, orange, strawberry, apple, banana) from a 9-color palette, with a bucket cursor and a clear-canvas button.

## Features

- Confetti celebration on every correct answer, via `canvas-confetti`
- Text-to-speech word prompts in Spelling Bee, using the browser's native Web Speech API
- On-screen keyboards with live feedback - keys flash green on a correct letter, wiggle red on a miss
- Auto-discovered game grid - the homepage scans `app/` for routable subfolders and renders tiles for whatever exists, so adding a game is just adding a folder
- Per-game favicon and page title set client-side via a shared `usePageMeta` hook
- Kid-friendly by design - no login, no backend, no ads, no data collection

## Tech stack

| Layer     | Choice                           |
| --------- | --------------------------------- |
| Framework | Next.js 16 (App Router)          |
| UI        | React 19                         |
| Language  | TypeScript 5                     |
| Styling   | Tailwind CSS v4                  |
| Effects   | canvas-confetti                  |
| Speech    | Web Speech API (browser native)  |
| Lint      | ESLint 9                         |
| Deploy    | Vercel                           |

## Getting started

```bash
npm install
npm run dev     # start the dev server at http://localhost:3000
npm run build   # production build
npm start       # run the production build
npm run lint    # eslint
```

## License

MIT - see [LICENSE](LICENSE).
