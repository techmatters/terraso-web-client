#!/usr/bin/env node
/*
 * Copyright © 2025 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

/*
 * Applies patches/terraso-client-shared-store-utils.patch to
 * node_modules/terraso-client-shared/store/utils.js after dependency
 * installation (wired to `postinstall`). See docs/dependency-patches.md for
 * the background.
 *
 * In short: store/utils.js and account/accountSlice form an import cycle, and
 * Vite's dep pre-bundling may evaluate accountSlice first — which leaves the
 * const-arrow declarations of store/utils.js in the temporal dead zone
 * ("Cannot access ... before initialization"). The patch converts the two
 * cycle-critical declarations to hoisted function declarations so evaluation
 * order no longer matters.
 *
 * Idempotent and safe to run at any time: when the patch is already applied
 * (or the dependency is not installed) it does nothing. It fails loudly when
 * neither the forward nor the reverse patch applies — i.e. when the pinned
 * dependency changed underneath us and the patch needs revisiting.
 *
 * Requires the system `patch` binary (no npm dependencies added).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const patchFile = path.join(
  root,
  'patches',
  'terraso-client-shared-store-utils.patch'
);
const target = 'node_modules/terraso-client-shared/store/utils.js';

if (!existsSync(path.join(root, target))) {
  console.log(
    '[patch-terraso-client-shared] terraso-client-shared not installed, skipping'
  );
  process.exit(0);
}

// The patch hoists this declaration; its presence marks the applied state
// (patch(1) auto-detects patch direction, so state checks cannot rely on -R).
const APPLIED_MARKER = 'function generateErrorFallbacksPartial';
const content = () => readFileSync(path.join(root, target), 'utf8');

if (content().includes(APPLIED_MARKER)) {
  console.log('[patch-terraso-client-shared] already applied');
  process.exit(0);
}

const applied = spawnSync(
  'patch',
  ['-p0', '--batch', '--forward', '--input', patchFile],
  { cwd: root, encoding: 'utf8' }
);
if (applied.status === 0 && content().includes(APPLIED_MARKER)) {
  console.log('[patch-terraso-client-shared] applied');
  process.exit(0);
}

console.error(
  '[patch-terraso-client-shared] FAILED: the patch applies neither forward nor' +
    ' in reverse. The terraso-client-shared pin probably changed — revisit' +
    ' patches/terraso-client-shared-store-utils.patch (see docs/dependency-patches.md).'
);
process.exit(1);
