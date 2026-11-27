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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from 'terraso-web-client/tests/utils';

import BufferedChapterForm from 'terraso-web-client/storyMap/components/StoryMapForm/BufferedChapterForm';
import {
  StoryMapConfigContextProvider,
  useStoryMapConfigDataContext,
  useStoryMapMediaContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

jest.mock(
  'terraso-web-client/common/components/DropZone',
  () =>
    ({ onDrop }) => (
      <button
        onClick={() =>
          onDrop([new File(['image'], 'inline.png', { type: 'image/png' })])
        }
      >
        Select inline file
      </button>
    )
);

const header = {
  id: 'header',
  type: 'image/png',
  signedUrl: 'https://example.com/header.png',
  altText: 'Header image',
};

const ChapterHarness = () => {
  const { config } = useStoryMapConfigDataContext();
  const { mediaFiles } = useStoryMapMediaContext();
  return (
    <>
      <BufferedChapterForm record={config.chapters[0]} />
      <output data-testid="chapter-config">
        {JSON.stringify(config.chapters[0])}
      </output>
      <output data-testid="media-files">
        {JSON.stringify(
          Object.fromEntries(
            Object.entries(mediaFiles).map(([id, entry]) => [
              id,
              entry.file.name,
            ])
          )
        )}
      </output>
    </>
  );
};

test('inserting and uploading inline media preserves the chapter header and commits the collection reference', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{
        chapters: [
          {
            id: 'chapter-1',
            title: 'Chapter 1',
            description: 'Hello',
            mediaItems: [header],
          },
        ],
        dataLayers: {},
      }}
      storyMap={{ id: 'story-map-id-1', memberships: [] }}
    >
      <ChapterHarness />
    </StoryMapConfigContextProvider>
  );

  expect(screen.getAllByRole('img', { name: 'Header image' })).toHaveLength(1);
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert media collection' })
    )
  );
  fireEvent.click(screen.getAllByRole('button', { name: 'Add media' })[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Select inline file' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Add media' })).toBeEnabled()
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add media' }))
  );

  await waitFor(() => {
    const chapter = JSON.parse(
      screen.getByTestId('chapter-config').textContent
    );
    const collection = chapter.description.find(
      node => node.type === 'media-collection'
    );
    expect(collection).toEqual(
      expect.objectContaining({
        collectionId: expect.any(String),
        presentation: 'carousel',
      })
    );
    expect(chapter.mediaItems).toEqual([
      header,
      expect.objectContaining({
        filename: 'inline.png',
        type: 'image/png',
        inlineCollectionId: collection.collectionId,
        contentId: expect.any(String),
      }),
    ]);
    expect(JSON.parse(screen.getByTestId('media-files').textContent)).toEqual({
      [chapter.mediaItems[1].contentId]: 'inline.png',
    });
  });
  expect(screen.getAllByRole('img', { name: 'Header image' })).toHaveLength(1);
});
