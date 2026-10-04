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

import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from 'terraso-web-client/tests/utils';
import {
  createTestStoryMap,
  createTestStoryMapConfig,
} from 'terraso-web-client/tests/data/storyMap';

import ChapterForm from 'terraso-web-client/storyMap/components/StoryMapForm/ChapterForm';
import { StoryMapConfigContextProvider } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR } from 'terraso-web-client/storyMap/storyMapConstants';

jest.mock('terraso-client-shared/terrasoApi/api');

const setup = async alignment => {
  const record = {
    id: 'chapter-1',
    title: 'Chapter 1',
    description: 'Chapter 1 description',
    alignment,
    media: {
      type: 'image/png',
      url: 'https://test.com/image.png',
      signedUrl: 'https://test.com/image.png',
    },
  };
  const onFieldChange = jest.fn(() => jest.fn());
  const onFieldBlur = jest.fn(() => jest.fn());
  const view = await render(
    <StoryMapConfigContextProvider
      baseConfig={{ ...createTestStoryMapConfig(), chapters: [record] }}
      storyMap={createTestStoryMap()}
    >
      <ChapterForm
        record={record}
        onFieldChange={onFieldChange}
        onFieldBlur={onFieldBlur}
      />
    </StoryMapConfigContextProvider>
  );
  return {
    ...view,
    section: screen.getByRole('region', { name: 'Chapter: Chapter 1' }),
  };
};

describe('ChapterForm: just-modes keep the editable card (K8)', () => {
  it.each(['justMap', 'justChapter'])(
    'renders the title, media and description editors for a %s chapter (never emptied)',
    async alignment => {
      const { section } = await setup(alignment);

      // The editor deliberately keeps the editable card for the render
      // modes — the map must stay visible and configurable while editing.
      // The title is a click-to-edit field (EditableText)…
      const title = within(section).getByRole('heading', { name: 'Chapter 1' });
      await act(async () => {
        fireEvent.click(title);
      });
      // …and opens the title editor with its value.
      expect(
        within(section).getByDisplayValue('Chapter 1')
      ).toBeInTheDocument();
      expect(
        within(section).getByRole('img', { name: 'Chapter media' })
      ).toBeInTheDocument();
      expect(
        within(section).getByText('Chapter 1 description')
      ).toBeInTheDocument();
    }
  );

  it.each(['justMap', 'justChapter'])(
    'the %s editor card keeps its full editing width (the viewer 46rem cap must not leak in)',
    async alignment => {
      const { section } = await setup(alignment);

      // The viewer's chapter-only cap is a CSS rule consuming a custom
      // property the VIEWER sets (see StoryMap.css.test.ts). The editor
      // never sets the var, so the rule's `none` fallback keeps the card at
      // its full editing width — the old hardcoded (0,3,0) rule re-capped
      // this card and must not come back.
      expect(
        section.style.getPropertyValue(CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR)
      ).toBe('');
      const content = within(section)
        .getByRole('heading', { name: 'Chapter 1' })
        .closest('.step-content');
      expect(content).toHaveStyle('max-width: none');
    }
  );
});
