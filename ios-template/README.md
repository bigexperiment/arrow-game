# iOS Wrapper Template

This folder gives you a practical Xcode path for turning the current React/Vite game into an iOS app without rewriting the whole game in Swift first.

## What This Is

- `ArrowXHost/*.swift`: SwiftUI + `WKWebView` wrapper files
- `WebAssets/`: bundled production web build for Xcode
- native bridge handlers for:
  - haptics via `window.webkit.messageHandlers.haptics`
  - local notifications via `window.webkit.messageHandlers.notifications`

## Prepare Assets

From the repo root:

```bash
npm run build:ios-web
```

That will:

- build the web app
- copy `dist/` into `ios-template/WebAssets`
- rewrite absolute asset paths in `index.html` so they work from Xcode bundle resources

## Create the Xcode App

1. Open Xcode.
2. Create a new project:
   - iOS
   - App
   - Interface: `SwiftUI`
   - Language: `Swift`
3. Name it something like `ArrowXHost`.
4. Delete the default `ContentView.swift` and app file if you want to replace them fully.
5. Drag these files from this repo into the Xcode project:
   - `ios-template/ArrowXHost/ArrowXHostApp.swift`
   - `ios-template/ArrowXHost/ContentView.swift`
   - `ios-template/ArrowXHost/GameWebView.swift`
6. Drag the whole `ios-template/WebAssets` folder into Xcode as a folder reference:
   - choose `Create folder references`
   - make sure your app target is checked

## Run In Xcode

1. Choose an iPhone simulator, for example `iPhone 15`.
2. Press Run.
3. The app should load `WebAssets/index.html` directly inside the bundled `WKWebView`.

## How To Test Native Features

### Haptics

The web game already routes vibration through:

- browser vibration when running on web
- native iOS haptics when loaded in the wrapper

The bridge is also exposed in JS for testing:

```js
window.ArrowXNativeBridge.vibrate(20)
```

### Local notifications

You can trigger a local notification from Safari Web Inspector console or from future game code:

```js
window.ArrowXNativeBridge.notify({
  title: "ArrowX",
  body: "Come back and play",
  delayMs: 3000
})
```

The first time, iOS will ask for notification permission.

## Inspect In Xcode / Simulator

- Use Xcode simulator for native app testing
- Use Safari Web Inspector for web content debugging:
  - open Simulator
  - in macOS Safari: `Develop > Simulator > ArrowXHost`

That lets you inspect DOM, console, and network just like a browser tab.

## Best Long-Term Path

This wrapper is the fastest conversion path.

If you later want full App Store polish and native UI/game services, the next step would be:

- keep puzzle logic/design
- gradually move shell/UI/native services to Swift
- optionally rewrite the board scene in SwiftUI, SpriteKit, or SceneKit

For now, this wrapper gets you:

- Xcode project workflow
- iPhone simulator testing
- native haptics
- native local notifications
- no full rewrite yet
