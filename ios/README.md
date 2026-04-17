# ArrowX iOS Shell

This folder is the native iOS wrapper shell for ArrowX.

## What’s Here

- `ArrowX/`: Swift source files for the app shell
- `WebAssets/`: bundled production web build used by `WKWebView`

## Before Opening In Xcode

From the repo root:

```bash
npm run build:ios-web
```

Then copy the generated contents from:

- [ios-template/WebAssets](../ios-template/WebAssets)

into:

- [ios/WebAssets](./WebAssets)

You can also just keep using `ios-template/WebAssets` as the drag-in folder if you prefer.

## Create The Xcode Project

Because `xcodegen` is not installed locally, create the project once in Xcode:

1. Open Xcode
2. Create a new project:
   - iOS
   - App
   - Name: `ArrowX`
   - Interface: `SwiftUI`
   - Language: `Swift`
3. Replace the generated Swift files with the files in [ios/ArrowX](./ArrowX)
4. Drag the entire [ios/WebAssets](./WebAssets) folder into the Xcode project as a `folder reference`
5. Make sure the app target includes:
   - `ArrowXApp.swift`
   - `ContentView.swift`
   - `GameWebView.swift`
   - `WebAssets`

## Run In Xcode

1. Pick an iPhone simulator like `iPhone 15`
2. Press Run
3. The app will load `WebAssets/index.html` from the app bundle

## Native Features Supported

- Native haptics through the JS bridge
- Local notifications through the JS bridge
- Safari Web Inspector debugging on simulator

## Useful Test Calls

Inside Safari Web Inspector console:

```js
window.ArrowXNativeBridge.vibrate(20)
```

```js
window.ArrowXNativeBridge.notify({
  title: "ArrowX",
  body: "Test local notification",
  delayMs: 3000
})
```
