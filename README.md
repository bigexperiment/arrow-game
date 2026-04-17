# ArrowX

ArrowX is a mobile-first chain-reaction puzzle game built with React and Vite.

You tap an arrow, it fires in its direction, and any arrow it hits fires too. The goal is to clear the board before you run out of taps.

## Project Status

The active game currently runs from [`new-update.jsx`](./new-update.jsx) through [`src/main.jsx`](./src/main.jsx).

What we are trying / iterating on right now:

- campaign-style progression instead of manual level picking
- solver-backed procedural boards
- deceptive puzzle design through decoy arrows
- lighter frozen-arrow usage so freeze stays a modifier, not the main mechanic
- mobile playability improvements
- iOS wrapping via Xcode so the game can behave more like a native app

## Current Features

- splash screen
- journey map
- tutorial levels
- per-level stars
- saved progress
- solver-backed optimal tap counts
- decoy arrows
- sound effects
- haptics
- settings and progress reset

## Gameplay Model

- `Tutorial levels 1-4` teach tap, chain, multi-chain, and frozen-arrow behavior
- `Level 5+` uses procedural generation
- levels are built from valid solution chains first
- decoys are added after chain construction
- every generated board is checked for solvability before use

## Stars

Stars are awarded from taps used versus the exact optimal tap count for the board:

- `3 stars`: optimal or better
- `2 stars`: `optimal + 1`
- `1 star`: any slower win

The logic lives in [`calcStars()`](./new-update.jsx).

## Difficulty Progression

Current procedural caps:

- max grid size: `7 x 8`
- max chain count: `6`
- increasing decoys in later levels
- tighter tap slack in later levels

Current frozen tuning:

- early game: none outside tutorial
- mid game: at most `1` frozen arrow on a board
- later game: capped at `2` frozen arrows on a board

## Temporary Testing Toggles

There are a few explicit temporary test settings in [`new-update.jsx`](./new-update.jsx):

- `START_LEVEL_OVERRIDE = 100`
  - forces the game to start at level 100 for testing higher difficulty
  - set to `null` to restore normal saved-progress behavior

- `AUTO_PLAY_DEMO`
  - temporary self-playing mode for visual testing
  - if enabled, the game auto-starts, solves boards, and advances automatically

These should be treated as temporary dev toggles, not production defaults.

## Local Development

Install and run:

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:5173/
```

## Build

```bash
npm run build
```

## Simulation / Generator Testing

There is a standalone simulation script for generator and difficulty analysis:

```bash
npm run simulate:games
```

Useful example:

```bash
npm run simulate:games -- --games 1000 --levels 40
```

The simulator reports things like:

- impossible boards found
- fallback board usage
- average generation attempts
- optimal tap counts
- tap slack
- decoy/frozen density by level band
- greedy bot win rate

Main file:

- [`scripts/simulate-games.mjs`](./scripts/simulate-games.mjs)

There is also an older helper:

- [`scripts/verify-generator.mjs`](./scripts/verify-generator.mjs)

## iOS / Xcode Work

We have started the iOS conversion path as a native wrapper around the current web game.

Current iOS-related pieces:

- [`ios/`](./ios): current iOS shell source files
- [`ios-template/`](./ios-template): earlier wrapper/template files
- `npm run build:ios-web`: builds the web app and prepares bundled assets for Xcode

The wrapper approach uses:

- `SwiftUI`
- `WKWebView`
- a JS bridge for native-like features

Current native bridge hooks:

- haptics
- local notifications

Bridge access from JS:

```js
window.ArrowXNativeBridge.vibrate(20)
```

```js
window.ArrowXNativeBridge.notify({
  title: "ArrowX",
  body: "Test notification",
  delayMs: 3000
})
```

## Testing In Xcode

Current intended flow:

1. build iOS web assets
2. create/open an iOS App project in Xcode
3. use the Swift files from [`ios/ArrowX`](./ios/ArrowX)
4. add bundled `WebAssets` as a folder reference
5. run on:
   - iPhone Simulator
   - your physical iPhone from Xcode
6. later, archive for TestFlight

See:

- [ios/README.md](/Users/ganesh/arrow-game/ios/README.md)
- [ios-template/README.md](/Users/ganesh/arrow-game/ios-template/README.md)

## TestFlight Direction

The project is not fully TestFlight-ready yet, but the intended path is:

- use the Xcode iOS wrapper
- validate on simulator
- validate on real iPhone
- configure signing and bundle id
- archive and upload to App Store Connect
- distribute through TestFlight

## Important Files

- [`new-update.jsx`](./new-update.jsx): active game, generator, solver, stars, settings, temporary toggles
- [`src/main.jsx`](./src/main.jsx): web app entry
- [`scripts/simulate-games.mjs`](./scripts/simulate-games.mjs): batch simulator
- [`scripts/prepare-ios-web-assets.mjs`](./scripts/prepare-ios-web-assets.mjs): prepares bundled web assets for Xcode
- [`ios/ArrowX`](./ios/ArrowX): current native iOS shell files
- [`ios-app/`](./ios-app): prepared folder with copied Swift files and WebAssets for convenience

## Recent Work Summary

Recent changes and experiments include:

- migrated active gameplay to the new campaign flow
- added decoy-based deceptive puzzle generation
- switched generated levels to solver-backed optimal tap counts
- reduced frozen-arrow density
- improved mobile HUD and board sizing
- added generator simulation/testing scripts
- added temporary autoplay demo mode
- added temporary level-100 start override
- started iOS wrapper/Xcode conversion work
- added native bridge support for haptics and local notifications
