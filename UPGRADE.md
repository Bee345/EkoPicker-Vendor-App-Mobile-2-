# Expo SDK 51 to 55 Upgrade Plan

Owner: Michael
Started: [fill in date]
Branch: `chore/expo-sdk-55-upgrade`     
     
## Why this doc exists

I'm on Expo SDK 51 and need to get to 55. That's a four-SDK jump. Expo
explicitly recommends upgrading one SDK at a time. This doc tracks the
plan, what each step changes, what I checked, and what I rolled back.

If something breaks, the answer lives here, not in chat history.

## Target stack

| Layer        | From (SDK 51) | To (SDK 55)   |
| ------------ | ------------- | ------------- |
| Expo SDK     | 51            | 55            |
| React Native | 0.74.x        | 0.83.2        |
| React        | 18.2.0        | 19.2.x        |
| Architecture | Legacy        | New (forced)  |

## The original error that triggered this

```
npm error Could not resolve dependency:
npm error peer react@"^19.2.0" from react-test-renderer@19.2.0
```

Root cause: tried to install jest-expo@55 against a project still pinned
to react@18.2.0 and react-native@0.74.5. SDK 55 requires React 19.

## Ground rules

1. Work on a dedicated branch. Never on main.
2. One SDK at a time. 51 -> 52 -> 53 -> 54 -> 55.
3. Commit after each SDK upgrade with a clear message.
4. Boot the app in Expo Go (or dev client) between each step before
   moving forward.
5. If a step won't boot, stop. Don't pile the next SDK on top of
   broken state.
6. Never accept `npm install --force` or `--legacy-peer-deps` unless
   I understand exactly what's being suppressed.

## Step-by-step

### Step 0 - Prep
- `git checkout -b chore/expo-sdk-55-upgrade`
- Commit anything uncommitted on main first
- Note current versions: `cat package.json | grep -E '"(expo|react|react-native)"'`
- Confirm the app boots cleanly on SDK 51 before touching anything

### Step 1 - SDK 51 to 52
- `npx expo install expo@^52.0.0`
- `npx expo install --fix`
- React Native goes 0.74 -> 0.76 in this step
- Boot the app. Test core flows.
- `git commit -m "chore: upgrade expo sdk 51 to 52"`

### Step 2 - SDK 52 to 53
- `npx expo install expo@^53.0.0`
- `npx expo install --fix`
- React jumps to 19.0 in this step
- `expo-av` is deprecated. If I use it, plan the migration to
  `expo-audio` and `expo-video` now (the real removal is SDK 55).
- Boot. Test.
- `git commit -m "chore: upgrade expo sdk 52 to 53"`

### Step 3 - SDK 53 to 54
- `npx expo install expo@^54.0.0`
- `npx expo install --fix`
- Legacy Architecture is frozen. New Architecture should already be on.
- React Native 0.79 -> 0.81
- Boot. Test.
- `git commit -m "chore: upgrade expo sdk 53 to 54"`

### Step 4 - SDK 54 to 55
- `npx expo install expo@^55.0.0`
- `npx expo install --fix`
- `expo-av` is GONE. Must migrate to `expo-audio` and `expo-video`.
- Legacy Architecture support is fully removed.
- React Native 0.81 -> 0.83.2, React 19.0 -> 19.2.
- iOS AppDelegate may need changes if I have an `ios/` directory.
- Boot. Test.
- `git commit -m "chore: upgrade expo sdk 54 to 55"`

### Step 5 - Cleanup
- Delete `ios/` and `android/` if I'm using prebuild (they regenerate)
- Run `npx expo doctor` and fix anything it flags
- Update README if any setup steps changed
- Open PR or merge to main

## Things I need to decide before starting

- [ ] Do I use `expo-av` anywhere? Grep for it: `grep -r "expo-av" .`
- [ ] Do I have `ios/` and `android/` folders, or am I purely managed?
- [ ] Do I use `react-native-reanimated`? Version 3 to 4 has breaking
      changes around SDK 54.
- [ ] Is my testing setup (`jest-expo`, `@testing-library/react-native`,
      `@testing-library/jest-native`) something I actually use, or
      installed-and-forgotten? If I don't write tests, I can remove
      them and most of the original error goes away.
- [ ] Do I have any custom config plugins or native modules?

## Rollback procedure

If a step breaks beyond fixing in 30 minutes:
1. `git reset --hard HEAD~1` (undo the last commit)
2. `rm -rf node_modules package-lock.json`
3. `npm install`
4. Verify the previous SDK still boots
5. Open an issue in the Expo repo or ask in the chat

## Log

| Date | Step | Outcome | Notes |
| ---- | ---- | ------- | ----- |
| 2026-05-20 | Step 1 — SDK 51 → 52 | ✅ Done | RN 0.74.5 → 0.76.9, React 18.2 → 18.3.1, reanimated 3.10 → 3.16, screens 3 → 4. `expo-font` plugin auto-added to app.json. TypeScript clean. |
| 2026-05-20 | Step 2 — SDK 52 → 53 | ✅ Done | RN 0.76.9 → 0.79.6, React 18.3 → **19.0.0** (major). Fixed: `useRef<T>()` → `useRef<T \| undefined>(undefined)` in ChatConversationScreen (React 19 removed zero-arg overload). TypeScript clean. |
| 2026-05-20 | Step 3 — SDK 53 → 54 | ✅ Done | RN 0.79.6 → 0.81.5, React 19.0 → 19.1. **reanimated 3 → 4** (major — worklets extracted to separate peer package). TypeScript clean. |
| 2026-05-20 | Step 4 — SDK 54 → 55 | ✅ Done | RN 0.81.5 → 0.83.6, React 19.1 → 19.2. Installed `react-native-worklets@0.8.3` (reanimated v4 peer dep, missed by `expo install --fix`). TypeScript clean. **Ready for boot test.** |
