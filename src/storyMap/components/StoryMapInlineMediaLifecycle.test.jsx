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
import { within } from '@testing-library/react';
import { Editor, Transforms } from 'slate';
import { HistoryEditor } from 'slate-history';
import { ReactEditor } from 'slate-react';
import * as api from 'terraso-client-shared/terrasoApi/api';

import BufferedChapterForm from 'terraso-web-client/storyMap/components/StoryMapForm/BufferedChapterForm';
import {
  StoryMapConfigContextProvider,
  useStoryMapBufferedChapterActionsContext,
  useStoryMapConfigDataContext,
  useStoryMapMediaContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';
import { updateStoryMap } from 'terraso-web-client/storyMap/storyMapService';

jest.mock('terraso-client-shared/terrasoApi/api');

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

// Expose the actual Slate editor so jsdom can apply atomic deletion and undo
// without pretending to exercise a browser's native contenteditable behavior.
let mockEditor;
let mockCollectionChange;
let mockInlineMediaChange;
jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia',
  () => {
    const Actual = jest.requireActual(
      'terraso-web-client/storyMap/components/StoryMapForm/EditableMedia'
    ).default;
    return props => {
      if (props.collectionAction) {
        mockInlineMediaChange = props.onChange;
      }
      return <Actual {...props} />;
    };
  }
);
jest.mock(
  'terraso-web-client/storyMap/components/StoryMapForm/InlineMediaCollection',
  () => {
    const actual = jest.requireActual(
      'terraso-web-client/storyMap/components/StoryMapForm/InlineMediaCollection'
    );
    const { useSlate } = jest.requireActual('slate-react');
    return {
      ...actual,
      InlineMediaCollection: props => {
        mockCollectionChange = props.onCollectionChange;
        return <actual.InlineMediaCollection {...props} />;
      },
      InlineMediaToolbar: () => {
        mockEditor = useSlate();
        return <actual.InlineMediaToolbar />;
      },
    };
  }
);

let currentConfig;
let currentFiles;
const ChapterHarness = () => {
  const { config } = useStoryMapConfigDataContext();
  const { mediaFiles } = useStoryMapMediaContext();
  const { flushBufferedChapterEdits } =
    useStoryMapBufferedChapterActionsContext();
  currentConfig = config;
  currentFiles = mediaFiles;
  return (
    <>
      <BufferedChapterForm record={config.chapters[0]} />
      <button onClick={() => flushBufferedChapterEdits()}>Flush edits</button>
    </>
  );
};

const collectionNodes = chapter =>
  chapter.description.filter(node => node.type === 'media-collection');

test('an empty inline collection is deleted without confirmation', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{
        chapters: [
          { id: 'chapter-1', title: 'Chapter 1', description: 'Hello' },
        ],
        dataLayers: {},
      }}
      storyMap={{ id: 'story-1', memberships: [] }}
    >
      <ChapterHarness />
    </StoryMapConfigContextProvider>
  );
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert media collection' })
    )
  );
  const deleteButton = screen.getByRole('button', {
    name: 'Delete collection',
  });
  const addButton = screen.getAllByRole('button', { name: 'Add media' })[1];
  expect(deleteButton).toHaveClass(
    'MuiButton-outlined',
    'MuiButton-sizeMedium'
  );
  expect(addButton).toHaveClass('MuiButton-outlined', 'MuiButton-sizeMedium');
  expect(getComputedStyle(deleteButton).fontWeight).toBe(
    getComputedStyle(addButton).fontWeight
  );
  await act(async () => fireEvent.click(deleteButton));
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(collectionNodes(currentConfig.chapters[0])).toEqual([]);
});

test('deleting pending inline media removes it and undo restores an empty collection', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{
        chapters: [
          { id: 'chapter-1', title: 'Chapter 1', description: 'Hello' },
        ],
        dataLayers: {},
      }}
      storyMap={{ id: 'story-1', memberships: [] }}
    >
      <ChapterHarness />
    </StoryMapConfigContextProvider>
  );

  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert media collection' })
    )
  );
  expect(
    screen.getByRole('button', { name: 'Delete collection' })
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Add media' })[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Select inline file' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Add media' })).toBeEnabled()
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add media' }))
  );

  const chapter = currentConfig.chapters[0];
  const [collection] = collectionNodes(chapter);
  const [item] = chapter.mediaItems;
  expect(item).toEqual(
    expect.objectContaining({
      inlineCollectionId: collection.collectionId,
      contentId: expect.any(String),
      filename: 'inline.png',
    })
  );
  expect(currentFiles[item.contentId].file.name).toBe('inline.png');

  const collectionActions = screen.getByRole('toolbar', {
    name: 'Media collection actions',
  });
  const addMediaButton = within(collectionActions).getByRole('button', {
    name: 'Add media',
  });
  const deleteCollectionButton = within(collectionActions).getByRole('button', {
    name: 'Delete collection',
  });
  expect(addMediaButton).toHaveClass('MuiButton-sizeSmall');
  expect(deleteCollectionButton).toHaveClass('MuiButton-sizeSmall');
  expect(getComputedStyle(deleteCollectionButton).fontSize).toBe(
    getComputedStyle(addMediaButton).fontSize
  );
  expect(getComputedStyle(deleteCollectionButton).fontWeight).toBe(
    getComputedStyle(addMediaButton).fontWeight
  );
  await act(async () =>
    fireEvent.click(
      within(collectionActions).getByRole('button', {
        name: 'Delete collection',
      })
    )
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));

  expect(collectionNodes(currentConfig.chapters[0])).toEqual([]);
  expect(
    screen.queryByRole('img', { name: 'image media' })
  ).not.toBeInTheDocument();
  expect(currentConfig.chapters[0].mediaItems).toEqual([]);

  api.request.mockResolvedValue({});
  await updateStoryMap({
    storyMap: { id: 'story-1', config: currentConfig, publish: true },
    files: currentFiles,
  });
  const body = api.request.mock.calls[0][0].body;
  const submittedChapter = JSON.parse(body.get('configuration')).chapters[0];
  expect(body.get('publish')).toBe('true');
  expect(collectionNodes(submittedChapter)).toEqual([]);
  expect(submittedChapter.mediaItems).toEqual([]);
  expect(body.getAll('files')).toEqual([]);

  await act(async () => HistoryEditor.undo(mockEditor));
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));
  expect(collectionNodes(currentConfig.chapters[0])).toEqual([collection]);
  expect(currentConfig.chapters[0].mediaItems).toEqual([]);
  expect(
    screen.queryByRole('img', { name: 'image media' })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('previous media');

  await act(async () => HistoryEditor.redo(mockEditor));
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));
  expect(collectionNodes(currentConfig.chapters[0])).toEqual([]);
  expect(currentConfig.chapters[0].mediaItems).toEqual([]);
});

test('saving and publishing after deleting one collection preserves only referenced media', async () => {
  const header = {
    id: 'header-image',
    type: 'image/png',
    signedUrl: 'https://example.com/header.png',
    altText: 'Header image',
  };
  const deleted = {
    id: 'deleted-image',
    type: 'image/png',
    signedUrl: 'https://example.com/deleted.png',
    altText: 'Deleted inline image',
    inlineCollectionId: 'deleted-collection',
  };
  const retained = {
    id: 'retained-image',
    type: 'image/png',
    signedUrl: 'https://example.com/retained.png',
    altText: 'Retained inline image',
    inlineCollectionId: 'retained-collection',
  };
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{
        chapters: [
          {
            id: 'chapter-1',
            title: 'Chapter 1',
            description: [
              { type: 'paragraph', children: [{ text: 'Before' }] },
              {
                type: 'media-collection',
                collectionId: 'deleted-collection',
                children: [{ text: '' }],
              },
              { type: 'paragraph', children: [{ text: 'Between' }] },
              {
                type: 'media-collection',
                collectionId: 'retained-collection',
                children: [{ text: '' }],
              },
              { type: 'paragraph', children: [{ text: 'After' }] },
            ],
            mediaItems: [header, deleted, retained],
          },
        ],
        dataLayers: {},
      }}
      storyMap={{ id: 'story-1', memberships: [] }}
    >
      <ChapterHarness />
    </StoryMapConfigContextProvider>
  );
  expect(
    screen.getByRole('img', { name: 'Deleted inline image' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Retained inline image' })
  ).toBeInTheDocument();
  expect(currentConfig.chapters[0].mediaItems).toEqual([
    header,
    deleted,
    retained,
  ]);

  await act(async () =>
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Delete collection' })[0]
    )
  );
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));
  expect(
    screen.queryByRole('img', { name: 'Deleted inline image' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Retained inline image' })
  ).toBeInTheDocument();

  api.request.mockClear();
  api.request.mockResolvedValue({});
  for (const publish of [false, true]) {
    await updateStoryMap({
      storyMap: { id: 'story-1', config: currentConfig, publish },
      files: currentFiles,
    });
    const body = api.request.mock.calls.at(-1)[0].body;
    const submittedChapter = JSON.parse(body.get('configuration')).chapters[0];
    const liveCollectionIds = collectionNodes(submittedChapter).map(
      collection => collection.collectionId
    );
    expect(body.get('publish')).toBe(String(publish));
    expect(liveCollectionIds).toEqual(['retained-collection']);
    expect(submittedChapter.mediaItems.map(item => item.id)).toEqual([
      'header-image',
      'retained-image',
    ]);
    expect(
      submittedChapter.mediaItems.find(item => item.id === 'header-image')
        .inlineCollectionId
    ).toBeUndefined();
    const taggedItems = submittedChapter.mediaItems.filter(
      item => item.inlineCollectionId
    );
    expect(taggedItems).toHaveLength(1);
    taggedItems.forEach(item =>
      expect(liveCollectionIds).toContain(item.inlineCollectionId)
    );
    expect(body.getAll('files')).toEqual([]);
  }
});

const setupSavedCollection = async () => {
  const item = {
    id: 'saved-image',
    type: 'image/png',
    signedUrl: 'https://example.com/saved.png',
    inlineCollectionId: 'saved-collection',
  };
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{
        chapters: [
          {
            id: 'chapter-1',
            description: [
              {
                type: 'media-collection',
                collectionId: 'saved-collection',
                children: [{ text: '' }],
              },
            ],
            mediaItems: [item],
          },
        ],
        dataLayers: {},
      }}
      storyMap={{ id: 'story-1', memberships: [] }}
    >
      <ChapterHarness />
    </StoryMapConfigContextProvider>
  );
  return item;
};

test('a late media update cannot recreate a deleted collection', async () => {
  const item = await setupSavedCollection();
  const lateUpdate = mockCollectionChange;
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }))
  );
  await act(async () => lateUpdate('saved-collection', [item]));
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));
  expect(collectionNodes(currentConfig.chapters[0])).toEqual([]);
  expect(currentConfig.chapters[0].mediaItems).toEqual([]);
});

test('an update from a deleted collection cannot restore media after undo', async () => {
  const item = await setupSavedCollection();
  const oldUpdate = mockInlineMediaChange;
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }))
  );
  await act(async () => HistoryEditor.undo(mockEditor));
  await act(async () => oldUpdate([item]));
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));
  expect(collectionNodes(currentConfig.chapters[0])).toHaveLength(1);
  expect(currentConfig.chapters[0].mediaItems).toEqual([]);
});

test('replacing text across a collection removes only that collection’s media', async () => {
  const header = { id: 'header', type: 'image/png' };
  const inline = {
    id: 'inline',
    type: 'image/png',
    inlineCollectionId: 'collection-1',
  };
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{
        chapters: [
          {
            id: 'chapter-1',
            description: [
              { type: 'paragraph', children: [{ text: 'Before' }] },
              {
                type: 'media-collection',
                collectionId: 'collection-1',
                children: [{ text: '' }],
              },
              { type: 'paragraph', children: [{ text: 'After' }] },
            ],
            mediaItems: [header, inline],
          },
        ],
        dataLayers: {},
      }}
      storyMap={{ id: 'story-1', memberships: [] }}
    >
      <ChapterHarness />
    </StoryMapConfigContextProvider>
  );
  await act(async () => {
    Transforms.select(mockEditor, {
      anchor: Editor.start(mockEditor, [0]),
      focus: Editor.end(mockEditor, [2]),
    });
    Transforms.insertText(mockEditor, 'Replacement');
  });
  expect(collectionNodes(currentConfig.chapters[0])).toEqual([]);
  expect(currentConfig.chapters[0].mediaItems).toEqual([header]);
});

test('publishing after deleting saved inline media omits its metadata', async () => {
  const item = {
    id: 'saved-image',
    type: 'image/png',
    signedUrl: 'https://example.com/saved.png',
    altText: 'Saved inline image',
    inlineCollectionId: 'saved-collection',
  };
  await render(
    <StoryMapConfigContextProvider
      baseConfig={{
        chapters: [
          {
            id: 'chapter-1',
            title: 'Chapter 1',
            description: [
              { type: 'paragraph', children: [{ text: 'Before' }] },
              {
                type: 'media-collection',
                collectionId: 'saved-collection',
                presentation: 'carousel',
                children: [{ text: '' }],
              },
              { type: 'paragraph', children: [{ text: 'After' }] },
            ],
            mediaItems: [item],
          },
        ],
        dataLayers: {},
      }}
      storyMap={{ id: 'story-1', memberships: [] }}
    >
      <ChapterHarness />
    </StoryMapConfigContextProvider>
  );
  expect(
    screen.getByRole('img', { name: 'Saved inline image' })
  ).toBeInTheDocument();

  await act(async () => {
    ReactEditor.focus(mockEditor);
    const [, path] = Editor.nodes(mockEditor, {
      at: [],
      match: node => node.collectionId === 'saved-collection',
    }).next().value;
    HistoryEditor.withNewBatch(mockEditor, () =>
      Transforms.removeNodes(mockEditor, { at: path })
    );
  });
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));
  expect(collectionNodes(currentConfig.chapters[0])).toEqual([]);
  expect(
    screen.queryByRole('img', { name: 'Saved inline image' })
  ).not.toBeInTheDocument();

  api.request.mockResolvedValue({});
  await updateStoryMap({
    storyMap: { id: 'story-1', config: currentConfig, publish: true },
    files: currentFiles,
  });
  const body = api.request.mock.calls[0][0].body;
  const submittedChapter = JSON.parse(body.get('configuration')).chapters[0];
  expect(body.get('publish')).toBe('true');
  expect(collectionNodes(submittedChapter)).toEqual([]);
  expect(submittedChapter.mediaItems).toEqual([]);
  expect(body.getAll('files')).toEqual([]);

  await act(async () => HistoryEditor.undo(mockEditor));
  await act(async () => fireEvent.click(screen.getByText('Flush edits')));
  expect(currentConfig.chapters[0].mediaItems).toEqual([]);
  expect(
    screen.queryByRole('img', { name: 'Saved inline image' })
  ).not.toBeInTheDocument();
});
