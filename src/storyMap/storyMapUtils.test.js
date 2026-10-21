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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import logger from 'terraso-client-shared/monitoring/logger';

import { STORY_MAP_TITLE_ID } from 'terraso-web-client/storyMap/storyMapConstants';
import {
  getTransition,
  updateTransition,
} from 'terraso-web-client/storyMap/storyMapUtils';

const makeConfig = () => ({
  title: 'Story',
  titleTransition: { location: { zoom: 2 } },
  chapters: [
    { id: 'chapter-1', title: 'Chapter 1' },
    { id: 'chapter-2', title: 'Chapter 2' },
  ],
});

describe('getTransition', () => {
  test('resolves the title transition and chapters by id', () => {
    const config = makeConfig();

    expect(getTransition({ config, id: STORY_MAP_TITLE_ID })).toBe(
      config.titleTransition
    );
    expect(getTransition({ config, id: 'chapter-2' })).toBe(config.chapters[1]);
  });

  test('returns undefined for unknown ids and for a missing title transition', () => {
    expect(getTransition({ config: makeConfig(), id: 'missing' })).toBe(
      undefined
    );
    expect(
      getTransition({ config: { chapters: [] }, id: STORY_MAP_TITLE_ID })
    ).toBe(undefined);
  });
});

describe('updateTransition', () => {
  test('creates the title transition from undefined', () => {
    const config = { chapters: [] };

    const next = updateTransition({
      config,
      id: STORY_MAP_TITLE_ID,
      update: transition => ({ ...transition, location: { zoom: 3 } }),
    });

    expect(next.titleTransition).toEqual({ location: { zoom: 3 } });
    // Immutable: the input is untouched.
    expect(config.titleTransition).toBe(undefined);
  });

  test('updates the matching chapter immutably', () => {
    const config = makeConfig();

    const next = updateTransition({
      config,
      id: 'chapter-1',
      update: chapter => ({ ...chapter, alignment: 'left' }),
    });

    expect(next.chapters[0].alignment).toBe('left');
    expect(next.chapters[1]).toBe(config.chapters[1]);
    expect(config.chapters[0].alignment).toBe(undefined);
  });

  test('warns and leaves the config untouched for unknown ids', () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const config = makeConfig();

    const next = updateTransition({
      config,
      id: 'deleted-chapter',
      update: () => ({ title: 'changed' }),
    });

    // Silent drops are forbidden: the write is dropped LOUDLY and nothing
    // else in the config changes.
    expect(warn).toHaveBeenCalled();
    expect(next).toBe(config);
    warn.mockRestore();
  });
});
