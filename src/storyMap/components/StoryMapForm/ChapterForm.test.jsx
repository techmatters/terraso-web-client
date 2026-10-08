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
import {
  CHAPTER_ONLY_CONTENT_MAX_WIDTH,
  CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR,
} from 'terraso-web-client/storyMap/storyMapConstants';

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

describe('ChapterForm: just-modes render like the viewer (editor parity)', () => {
  it('renders nothing over the map for a justMap chapter (span kept)', async () => {
    const { section } = await setup('justMap');

    // Product decision (overrides the previous "authoring card"): the
    // editor shows NOTHING over the map for a `justMap` chapter — no title,
    // no media, no description, no background. The chapter keeps its scroll
    // span and stays switchable through the Configure Chapter sidebar, so
    // the config (content included) is never lost.
    expect(section).toBeEmptyDOMElement();
    expect(section.querySelector('.step-content')).toBeNull();
    expect(section).not.toHaveClass('story-theme');
    expect(section).toHaveClass('map-only');
    expect(section).toHaveStyle('min-height: 100vh');
  });

  it('renders a full-screen editable chapter for a justChapter chapter', async () => {
    const { section } = await setup('justChapter');

    // Full-screen shell: theme background covering the map, content
    // centered, 120% of the map viewport tall.
    expect(section).toHaveClass('chapter-only');
    expect(section).toHaveClass('story-theme');
    expect(section).toHaveStyle('width: 100%');
    expect(section).toHaveStyle('min-height: 120vh');
    expect(section).toHaveStyle(
      'background-color: var(--story-theme-background)'
    );
    expect(section).toHaveStyle('justify-content: center');
    expect(section).toHaveStyle('align-items: center');

    // The form is STILL editable (product decision: full screen must not
    // cost authoring). The title is a click-to-edit field (EditableText)…
    const title = within(section).getByRole('heading', { name: 'Chapter 1' });
    await act(async () => {
      fireEvent.click(title);
    });
    // …and opens the title editor with its value.
    expect(within(section).getByDisplayValue('Chapter 1')).toBeInTheDocument();
    expect(
      within(section).getByRole('img', { name: 'Chapter media' })
    ).toBeInTheDocument();
    expect(
      within(section).getByText('Chapter 1 description')
    ).toBeInTheDocument();
  });

  it('the justChapter form centers its content in the viewer reading column (var set)', async () => {
    const { section } = await setup('justChapter');

    // Same cap machinery as the viewer: the constant reaches the container
    // as a custom property and the CSS rule on `.step-content` consumes it.
    expect(section).toHaveStyle(
      `${CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR}: ${CHAPTER_ONLY_CONTENT_MAX_WIDTH}`
    );
    const content = within(section)
      .getByRole('heading', { name: 'Chapter 1' })
      .closest('.step-content');
    expect(content).toHaveStyle('width: 100%');
  });

  it('the classic editor card keeps its full editing width (var unset)', async () => {
    const { section } = await setup('center');

    // The viewer's chapter-only cap is a CSS rule consuming a custom
    // property only the `justChapter` render sets. A classic card never
    // sets the var, so the rule's `none` fallback keeps it at its full
    // editing width.
    expect(
      section.style.getPropertyValue(CHAPTER_ONLY_CONTENT_MAX_WIDTH_VAR)
    ).toBe('');
    const content = within(section)
      .getByRole('heading', { name: 'Chapter 1' })
      .closest('.step-content');
    expect(content).toHaveStyle('max-width: none');
  });
});
