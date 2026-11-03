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

import 'terraso-web-client/config';

import reducer, {
  fetchStoryMapForm,
  resetForm,
  unpublishStoryMap,
} from 'terraso-web-client/storyMap/storyMapSlice';

const PUBLISHED_MAP = {
  id: 'map-a',
  title: 'Map A',
  isPublished: true,
  publishedAt: '2026-10-19T20:00:00Z',
};

const OTHER_MAP = {
  ...PUBLISHED_MAP,
  id: 'map-b',
  title: 'Map B',
  config: { title: 'Map B draft', chapters: [] },
};

test.each([
  {
    scenario: 'another map has loaded',
    nextAction: fetchStoryMapForm.fulfilled(OTHER_MAP, 'load-b', {}),
    expectedForm: OTHER_MAP,
  },
  {
    scenario: 'the form has been reset',
    nextAction: resetForm(),
    expectedForm: null,
  },
])(
  'late unpublish leaves the form untouched when $scenario',
  ({ nextAction, expectedForm }) => {
    const loaded = reducer(
      undefined,
      fetchStoryMapForm.fulfilled(PUBLISHED_MAP, 'load-a', {})
    );
    const pending = reducer(
      loaded,
      unpublishStoryMap.pending('unpublish-a', { id: PUBLISHED_MAP.id })
    );
    const navigated = reducer(pending, nextAction);
    const completed = reducer(
      navigated,
      unpublishStoryMap.fulfilled(
        { id: PUBLISHED_MAP.id, isPublished: false, publishedAt: null },
        'unpublish-a',
        { id: PUBLISHED_MAP.id }
      )
    );

    expect(completed.form.data).toEqual(expectedForm);
    expect(completed.unpublish[PUBLISHED_MAP.id].unpublishing).toBe(false);
  }
);
