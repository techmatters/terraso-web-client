/*
 * Copyright © 2026 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

/*
 * CSS-side ownership pins for StoryMap.css. jsdom does not cascade real
 * stylesheets (CSS imports are identity-obj-proxy'd), so the OUTCOME leg of
 * these pins lives in StoryMap.test.jsx (the JS constant reaches the chapter
 * container as a custom property) and this file pins the VAR INDIRECTION in
 * the stylesheet itself: one value, one owner, drift fails one legible test.
 */

import fs from 'fs';
import path from 'path';

import {
  CHAPTER_ONLY_CONTENT_MAX_WIDTH,
  CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR,
} from 'terraso-web-client/storyMap/storyMapConstants';

const css = fs.readFileSync(path.join(__dirname, 'StoryMap.css'), 'utf8');

test('the chapter-only content cap consumes the JS-owned custom property (no second copy of the value)', () => {
  // The rule must read the var set by CHAPTER_ONLY_CONTENT_MAX_WIDTH…
  expect(css).toMatch(
    new RegExp(
      `max-width:\\s*var\\(${CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR}[^)]*\\)`
    )
  );
  // …and must not hardcode a second copy of the value anywhere.
  expect(css).not.toContain(`max-width: ${CHAPTER_ONLY_CONTENT_MAX_WIDTH}`);
});

test('the cap rule neutralizes in the editor: unset var falls back to none', () => {
  // ChapterForm (editor) never sets the var — the fallback keeps its
  // editable card at its full editing width instead of re-capping it at
  // 46rem through this (0,3,0) rule.
  expect(css).toMatch(
    new RegExp(`var\\(${CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR},\\s*none\\)`)
  );
});

test('the just-mode spans cancel the classic card paddings deterministically', () => {
  // The paddings being cancelled…
  expect(css).toMatch(
    /\.step-container\s*{[^}]*padding-top:\s*15vh;[^}]*padding-bottom:\s*35vh/s
  );
  // …are cancelled for BOTH render modes by one rule next to them
  // ((0,2,0) specificity — not stylesheet insertion order).
  expect(css).toMatch(
    /\.step-container\.map-only,\s*\.step-container\.chapter-only\s*{[^}]*padding-top:\s*0;[^}]*padding-bottom:\s*0/s
  );
});
