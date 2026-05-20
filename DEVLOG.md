# DEVLOG — EkoPicker Vendor App

A running log of developer decisions, setup steps, and session notes. Newest entries at the top.

---

## 2026-05-21 — Session: SDK Upgrade, Tooling & Dev Environment Setup

**Developer:** Bee345 (lilbeezee8@gmail.com)

### What Was Done

#### Expo SDK 51 → 55 Upgrade (Complete)
All 4 upgrade steps completed on 2026-05-20 / 2026-05-21:

| Step | From → To | Key Changes |
|------|-----------|-------------|
| 1 | SDK 51 → 52 | RN 0.74.5 → 0.76.9, React 18.2 → 18.3.1 |
| 2 | SDK 52 → 53 | RN 0.76.9 → 0.79.6, **React 18 → 19** (major); fixed `useRef` breaking change in ChatConversationScreen |
| 3 | SDK 53 → 54 | RN 0.79.6 → 0.81.5, **reanimated 3 → 4** (major; worklets extracted to peer package) |
| 4 | SDK 54 → 55 | RN 0.81.5 → 0.83.6, React 19.1 → 19.2; added `react-native-worklets` peer dep |

Branch: `chore/expo-sdk-55-upgrade` (not yet merged to `main`)

#### Bug Fixes Applied During Upgrade
- `jest.config.js`: typo `setupFilesAfterEach` → `setupFilesAfterEnv` (tests were silently skipping setup)
- `app.json`: added missing `expo-font` plugin (detected during upgrade run)
- `ChatConversationScreen.tsx`: `useRef<T>()` → `useRef<T | undefined>(undefined)` (React 19 removed zero-arg `useRef` overload)

#### Placeholder Assets Created
`assets/` folder was missing entirely — Metro could not bundle the app at all.
Created placeholder PNGs with brand colors (`#0F172A` background, `#FACC15` accent):
- `assets/icon.png` (1024×1024)
- `assets/splash.png` (1242×2436)
- `assets/adaptive-icon.png` (1024×1024)
- `assets/favicon.png` (48×48)

> Replace these with real EkoPicker brand assets before any production build.

#### CLAUDE.md Refreshed
- Bumped all SDK 51 / RN 0.74.5 references to SDK 55 / RN 0.83.6
- Removed stale "no tooling pipeline" gap (ESLint, Prettier, Husky, Jest are all configured)
- Added `PayoutsScreen` and new service files (`queryClient`, `queryPersister`, `sentry`, `uploads`) to folder map
- Removed incorrect jest-expo / SDK version mismatch note (both now v55)
- Added Section 14: Branch Workflow
- Added Section 13 gotcha: Expo Go does not support SDK 55 — use Development Build

---

### Claude Code Environment Setup (Global — applies to all projects)

#### Plugins Enabled (`~/.claude/settings.json`)
| Plugin | Purpose | API Key Needed? |
|--------|---------|-----------------|
| `typescript-lsp@claude-plugins-official` | TypeScript type-aware code analysis | No |
| `playwright@claude-plugins-official` | Browser automation + UI testing | No |
| `context7@claude-plugins-official` | Pull live library docs into context | No |
| `github@claude-plugins-official` | Manage PRs, issues, code via Claude | Yes — `GITHUB_PERSONAL_ACCESS_TOKEN` env var |

#### MCP Servers (`~/.claude/.mcp.json`)
| Server | Purpose | Status |
|--------|---------|--------|
| `figma` | Read/inspect Figma designs from Claude | Needs `FIGMA_API_KEY` filled in |
| `postman` | Run/manage Postman collections from Claude | Needs `POSTMAN_API_KEY` filled in |

To activate: get API keys from figma.com and postman.com, paste into `C:\Users\HP\.claude\.mcp.json`.

---

### Key Decisions Made This Session

#### Branch Workflow (permanent rule)
- `main` = stable only, no direct commits, human-reviewed merges
- All work on feature/chore branches, PR to merge
- GitHub Action will auto-create a PR from `chore/expo-sdk-55-upgrade → main` every 2 days
- **Merge to `main` is always done by a human** — review, approve, then merge

#### Expo Go → Development Build (permanent decision)
Expo Go does not support SDK 55. The app must be run via a **Development Build**:
```bash
# One-time: login (Google OAuth account → use browser)
npx expo login --sso

# Build dev APK in cloud (free EAS tier)
npx eas build --profile development --platform android
# → installs on phone, works like Expo Go but no SDK version restrictions
```

#### GitHub Account Confirmed
- GitHub username: `Bee345`
- Email: `lilbeezee8@gmail.com`
- Repo: `github.com/Bee345/EkoPicker-Vendor-App-Mobile-2-`
- Secondary email (Claude Code login): `coachmikkebeezee@gmail.com`

---

### Outstanding TODOs From This Session

- [ ] Get Figma Personal Access Token → paste into `~/.claude/.mcp.json`
- [ ] Get Postman API Key → paste into `~/.claude/.mcp.json`
- [ ] Get GitHub PAT → set as `GITHUB_PERSONAL_ACCESS_TOKEN` env var
- [ ] Login to Expo: `npx expo login --sso` (Google OAuth — do NOT use password login)
- [ ] Run `npx eas build --profile development --platform android` to get dev APK
- [ ] Replace placeholder assets in `assets/` with real EkoPicker brand images
- [ ] Set up GitHub Action for auto-PR every 2 days (see CLAUDE.md Section 14)
- [ ] Fill `sonar.projectKey` + `sonar.organization` in `sonar-project.properties`
- [ ] Run `eas init` to get real EAS project ID (TASKS P0-06)
- [ ] Add Sentry DSN to `.env` and run `npx expo install @sentry/react-native` (TASKS P0-08)
