# webOS Player (Enact + Vite)

A minimal media playlist player for webOS built with Enact Spotlight, React, and pure CSS. Includes manual D‑pad navigation, basic video controls, and localStorage-backed logs (media errors and page transition performance).

## Scripts
- `npm run dev`: Start Vite dev server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run test`: Run tests in watch mode
- `npm run test:run`: Run tests once
- `npm run lint` / `npm run lint:fix`: Lint code

## Structure
- `public/playlist.json`: Media list consumed by the app
- `appinfo.json`: webOS app manifest (packaging)
- `public/manifest.json`: Web app manifest (PWA)
- `src/hooks`: `useVideoPlayer`, `useSpotlightNavigation`
- `src/components`: `Playlist`, `VideoPlayer`, `NavBar`, `LogViewer`
- `docs/NOTES.md`: Results and constraints log

## Run
1. Install deps: `npm install`
2. Dev server: `npm run dev` then open the printed URL on the TV/emulator or browser
3. Navigate with arrow keys and Enter. ESC/Backspace navigates back.

## Packaging (webOS)
Use `appinfo.json` at project root. After building (`npm run build`), copy `dist/` contents alongside `appinfo.json` for packaging with `ares-package`.
