# 42 Brain — Android app

This is the native Android app workspace, built with Expo, React Native, TypeScript, and on-device SQLite.

## Requirements

- Node.js 22 or newer
- Android Studio and an Android emulator, or a physical Android device with Expo Go for development

## Run locally

```sh
cd apps/android
npm install
npm start
```

Use the Expo CLI menu to open an emulator or scan the development QR code. For an Android bundle smoke check:

```sh
npm run typecheck
npm run export
```

## Current native scope

- Offline-first home and training navigation
- Daily logic challenge with a local-calendar date seed
- Playable logic, memory, focus, and mental-math sessions
- Session history and personal bests stored in SQLite
- No required account and no remote database

## Release gates still required

- Implement and test Android backup/restore
- Port and quality-test the flagship web arcade games rather than treating this starter set as the final library
- Test on a range of Android screen sizes and accessibility settings
- Produce a signed Android build and verify installation/update behavior on real devices
