# Dependency patches

`npm ci` installs `terraso-client-shared` from the pinned GitHub ref
(`github:techmatters/terraso-client-shared#2026-08-17.0`). A few fixes must be
applied on top of the installed package and would otherwise live as
uncommitted hand edits in `node_modules/` — lost on every `npm ci`.

## How it works

- `patches/terraso-client-shared-store-utils.patch` — unified diff against the
  pristine package file `store/utils.js`.
- `scripts/patch-terraso-client-shared.mjs` — applies the patch with the
  system `patch` binary (no npm dependencies). Wired to `postinstall`, so
  `npm install`/`npm ci` set it up automatically. The script is idempotent:
  re-running it is a no-op when the patch is already applied, and it exits
  with an error when neither the forward nor the reverse patch applies (i.e.
  the dependency pin changed and the patch needs revisiting).

## What the patch does (and why)

`terraso-client-shared/store/utils.js` and `account/accountSlice` form an
import cycle. Vite's dependency pre-bundling may evaluate `accountSlice`
first, which leaves the `const` arrow declarations of `store/utils.js` in the
temporal dead zone (`Cannot access ... before initialization`) at runtime.

The patch converts the two cycle-critical declarations
(`generateErrorFallbacksPartial` and `createAsyncThunk`) to hoisted `function`
declarations and documents the intent inline. Hoisted function declarations
are initialized before any module evaluation, so the cycle becomes order
independent.

## Updating the dependency pin

When bumping the `terraso-client-shared` pin in `package.json`, re-create the
patch against the new pristine file (or drop it if upstream fixed the cycle):

```sh
npm pack github:techmatters/terraso-client-shared#<tag>
tar xzf terraso-client-shared-*.tgz
diff -u package/store/utils.js node_modules/terraso-client-shared/store/utils.js \
  > patches/terraso-client-shared-store-utils.patch
```
