## Remove misleading App Install prompt

The `InstallPrompt` component shows a fixed banner with "App installieren" text that the user finds misleading. It also has logic for iOS manual install instructions, Android deferred prompt handling, and localStorage dismiss state.

### Steps
1. Remove `<InstallPrompt />` usage from `src/App.tsx` (line 71).
2. Remove the `import InstallPrompt` statement from `src/App.tsx` (line 22).
3. Delete `src/components/InstallPrompt.tsx` entirely, since it will no longer be used anywhere in the codebase.

No other changes required.