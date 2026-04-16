# ArrowX

ArrowX is a mobile-first chain-reaction puzzle game built with React and Vite.

You tap an arrow, it fires in its direction, and any arrow it hits fires too. The goal is to clear the full board before you run out of taps.

## Current State

- Uses the new campaign-style flow from [`new-update.jsx`](./new-update.jsx)
- Includes splash screen, journey map, tutorials, win/lose overlays, stars, settings, and saved progress
- Generates solver-backed boards with decoys and exact optimal tap counts
- Uses frozen arrows more lightly now, capped as a small modifier instead of a dominant mechanic
- Is currently set to start at level `100` for temporary testing

## Core Gameplay

- `Tutorial levels 1-4` teach tapping, chaining, multiple chains, and frozen arrows
- `Level 5+` uses procedural generation with a controlled difficulty ramp
- Boards are built from valid solution chains first, then modified into playable puzzles
- Decoy arrows are inserted to make boards less obvious without breaking solvability
- Every generated board is checked for solvability before being accepted

## Stars

Stars are based on taps used versus the board's exact optimal tap count:

- `3 stars`: clear in optimal taps or better
- `2 stars`: clear in `optimal + 1`
- `1 star`: clear slower than that

The star logic lives in [`calcStars()`](./new-update.jsx).

## Difficulty Progression

The current procedural ramp in [`getLevelInfo()`](./new-update.jsx) uses:

- board size up to `7 x 8`
- chain count up to `6`
- increasing decoy count
- tighter tap slack at later levels
- lighter frozen usage

Current frozen tuning:

- early levels: none outside tutorial
- mid game: at most `1` frozen arrow on a board
- later game: capped at `2` frozen arrows on a board

## Recent Changes

- Moved the active app entry to [`new-update.jsx`](./new-update.jsx)
- Added deceptive puzzle support with decoy arrows to the new campaign flow
- Switched optimal tap counts to solver-backed values for generated levels
- Reduced frozen-arrow density so it stays a light modifier
- Improved mobile board layout and simplified the in-game HUD
- Added a standalone simulator for large batch testing
- Added a temporary level-start override for testing higher levels quickly

## Local Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Then open:

```txt
http://localhost:5173/
```

## Build

```bash
npm run build
```

## Simulation / Generator Testing

Run the batch simulator:

```bash
npm run simulate:games
```

Useful flags:

```bash
npm run simulate:games -- --games 1000 --levels 40
```

The simulator lives in [`scripts/simulate-games.mjs`](./scripts/simulate-games.mjs) and reports:

- impossible boards found
- fallback board usage
- average generation attempts
- optimal tap counts
- tap slack
- decoy/frozen density by level band
- greedy bot success rate

## Important Files

- [`new-update.jsx`](./new-update.jsx): active game UI, progression flow, generator, solver, stars, settings
- [`src/main.jsx`](./src/main.jsx): app entry point
- [`scripts/simulate-games.mjs`](./scripts/simulate-games.mjs): batch simulation and generator analysis
- [`scripts/verify-generator.mjs`](./scripts/verify-generator.mjs): older generator verification helper

## Temporary Test Override

The game currently starts from level `100` because of this constant in [`new-update.jsx`](./new-update.jsx):

```js
const START_LEVEL_OVERRIDE = 100;
```

To restore normal saved-progress start behavior, set it back to:

```js
const START_LEVEL_OVERRIDE = null;
```
