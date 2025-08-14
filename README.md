# Midan — Prototype

A lightweight front‑end prototype for an on‑chain, team‑first arena where users can create events, form teams, and collaborate. This repo contains a minimal, dependency‑free implementation using plain HTML/CSS/JS with in‑memory state (no backend).

## Highlights
- On‑chain flavored events (mocked): create and browse events with types, tags, and status filters
- Wallet connect (mock): UI gating for actions that require a connected wallet
- Create Event modal: requires wallet; includes team cap options and banner preview
- Fun UX:
  - Confetti animation after creating an event
  - Emoji reactions (🎉🔥👍) on event cards; one active reaction per wallet
- Teams per event: public/private teams, join with code for private, capacity and membership rules
- Embedded team chat prototype (separate minimal app), opened in‑page for team members

## Tech Stack
- Vanilla JavaScript, HTML, CSS
- No frameworks, no build step, no database
- State is kept in memory; a page refresh resets mock data

## Project Structure
```
.
├─ index.html               # Root entry
├─ prototype/               # Main UI prototype
│  ├─ index.html
│  ├─ app.js               # Router, state, views, UI wiring
│  └─ styles.css
├─ team-chat/               # Minimal embedded chat prototype
│  ├─ index.html
│  ├─ app.js
│  └─ styles.css
└─ vercel.json              # Static hosting config (optional)
```

## Running Locally
You can open directly in a browser, or serve with any static server to ensure all assets load correctly.

Option A: Python (built‑in)
```bash
python3 -m http.server 5173
```
Then visit `http://localhost:5173/` and open the prototype via the root `index.html`.

Option B: Node (if you have it)
```bash
npx serve -l 5173
```

## Usage Guide
- Connect Wallet (mock):
  - Click “Connect Wallet” in the header. The address is mocked and stored in memory.
- Create Event:
  - Requires wallet connection. Open the “Create Event” modal, fill required fields, optionally set a fixed team cap and upload a banner. On success, a confetti animation plays.
- Event Reactions:
  - On each event card, tap 🎉🔥👍 to react. Wallet connection required. You can toggle your selection; counts are stored per session.
- Teams:
  - Inside an event, create a team or join existing ones. Private teams require a join code; public teams can be joined directly if not full. One wallet can be in only one team per event.
- Team Chat:
  - If you are a team member, an embedded chat prototype appears with a quick link to open in a new window.

## Notes
- Everything is client‑side and mocked for speed of iteration. Refreshing the page resets data.
- There is no real wallet or chain integration yet; connect is a UI gate only.
- Confetti and reactions are implemented client‑side for instant feedback.

## Contributing
- Keep changes dependency‑free and readable.
- Prefer small, composable functions and clear naming.
- Match existing code style and avoid unrelated reformatting. 