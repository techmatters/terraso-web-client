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
  within,
} from 'terraso-web-client/tests/utils';
import * as api from 'terraso-client-shared/terrasoApi/api';

import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import StoryMapUpdate from 'terraso-web-client/storyMap/components/StoryMapUpdate';

jest.mock('terraso-client-shared/terrasoApi/api');
jest.mock('terraso-web-client/monitoring/analytics', () => ({
  ...jest.requireActual('terraso-web-client/monitoring/analytics'),
  useAnalytics: jest.fn(),
}));
jest.mock('terraso-web-client/storyMap/components/StoryMap', () => props => (
  <>
    {props.TitleComponent && <props.TitleComponent config={props.config} />}
    {props.ChapterComponent && (
      <props.ChapterComponent record={props.config.chapters[0]} />
    )}
    <output data-testid="persisted-config">
      {JSON.stringify(props.config)}
    </output>
  </>
));
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

const config = {
  title: 'Story Map Title',
  subtitle: '',
  byline: '',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1',
      description: 'Hello',
      mediaItems: [],
    },
  ],
  dataLayers: {},
};
const storyMap = {
  id: '2b8b8352-2d41-4c92-9b97-0d5eb019d5ee',
  slug: 'test-slug',
  storyMapId: 'c4411282',
  title: config.title,
  configuration: JSON.stringify(config),
  createdBy: {
    id: 'author',
    email: 'author@example.com',
    firstName: 'Author',
    lastName: '',
  },
  membershipList: { memberships: { totalCount: 0, edges: [] } },
};

const deferred = () => {
  let resolve;
  const promise = new Promise(res => {
    resolve = res;
  });
  return { promise, resolve };
};

const savedResponse = configuration => ({
  id: storyMap.id,
  slug: storyMap.slug,
  story_map_id: storyMap.storyMapId,
  title: configuration.title,
  is_published: false,
  configuration,
});

const insertCollection = async () => {
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Insert media collection' })
    )
  );
};

const addInlineFile = async () => {
  fireEvent.click(screen.getAllByRole('button', { name: 'Add media' })[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Select inline file' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Add media' })).toBeEnabled()
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add media' }))
  );
};

const expectInlineUpload = body => {
  const chapter = JSON.parse(body.get('configuration')).chapters[0];
  const collection = chapter.description.find(
    node => node.type === 'media-collection'
  );
  expect(collection).toEqual(
    expect.objectContaining({ collectionId: expect.any(String) })
  );
  expect(chapter.mediaItems).toEqual([
    expect.objectContaining({
      inlineCollectionId: collection.collectionId,
      contentId: expect.any(String),
      filename: 'inline.png',
    }),
  ]);
  expect(body.getAll('files')).toHaveLength(1);
  expect(body.get('files').name).toBe(chapter.mediaItems[0].contentId);
};

beforeEach(() => {
  api.request.mockReset();
  api.requestGraphQL.mockReset();
  api.requestGraphQL.mockResolvedValue({
    storyMaps: { edges: [{ node: storyMap }] },
  });
  useAnalytics.mockReturnValue({ trackEvent: jest.fn() });
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
});

test('autosave sends the inserted collection together with its uploaded file', async () => {
  const pending = deferred();
  api.request.mockImplementation(() => pending.promise);
  await render(<StoryMapUpdate />, {
    account: { currentUser: { data: { id: 'author' } } },
  });
  await insertCollection();
  await addInlineFile();
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1), {
    timeout: 5000,
  });
  expectInlineUpload(api.request.mock.calls[0][0].body);
});

test.each(['before', 'after'])(
  'an older in-flight draft response %s adding media preserves the next request’s collection and upload',
  async timing => {
    const first = deferred();
    const second = deferred();
    api.request
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    await render(<StoryMapUpdate />, {
      account: { currentUser: { data: { id: 'author' } } },
    });

    const titleSection = screen.getByRole('region', {
      name: 'Title for: Story Map Title',
    });
    fireEvent.click(
      within(titleSection).getByRole('heading', { name: config.title })
    );
    fireEvent.change(
      within(titleSection).getByRole('textbox', {
        name: 'Story map title (Required)',
      }),
      { target: { value: 'New title' } }
    );
    await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1), {
      timeout: 5000,
    });
    const firstConfig = JSON.parse(
      api.request.mock.calls[0][0].body.get('configuration')
    );
    expect(firstConfig.chapters[0].description).toBe('Hello');
    await insertCollection();
    // The node is still buffered, not yet in the config used for saves.
    expect(
      JSON.parse(screen.getByTestId('persisted-config').textContent).chapters[0]
        .description
    ).toBe('Hello');
    if (timing === 'after') {
      await addInlineFile();
    }
    await act(async () => first.resolve(savedResponse(firstConfig)));
    if (timing === 'before') {
      await addInlineFile();
    }
    await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2), {
      timeout: 5000,
    });
    expectInlineUpload(api.request.mock.calls[1][0].body);
  }
);

test('overlapping drafts can overwrite inline media on a mock server that applies requests in completion order', async () => {
  const first = deferred();
  const second = deferred();
  let storedConfig;
  // This fake server applies each request on completion; actual backend ordering
  // must be tested separately.
  api.request
    .mockImplementationOnce(({ body }) =>
      first.promise.then(() => {
        storedConfig = JSON.parse(body.get('configuration'));
        return savedResponse(storedConfig);
      })
    )
    .mockImplementationOnce(({ body }) =>
      second.promise.then(() => {
        const submitted = JSON.parse(body.get('configuration'));
        const media = submitted.chapters[0].mediaItems[0];
        const { contentId, ...savedMedia } = media;
        storedConfig = {
          ...submitted,
          chapters: [
            {
              ...submitted.chapters[0],
              mediaItems: [{ ...savedMedia, url: '/saved.png' }],
            },
          ],
        };
        return savedResponse(storedConfig);
      })
    );
  await render(<StoryMapUpdate />, {
    account: { currentUser: { data: { id: 'author' } } },
  });
  const titleSection = screen.getByRole('region', {
    name: 'Title for: Story Map Title',
  });
  fireEvent.click(
    within(titleSection).getByRole('heading', { name: config.title })
  );
  fireEvent.change(
    within(titleSection).getByRole('textbox', {
      name: 'Story map title (Required)',
    }),
    { target: { value: 'New title' } }
  );
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1), {
    timeout: 5000,
  });
  await insertCollection();
  await addInlineFile();
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2), {
    timeout: 5000,
  });
  expectInlineUpload(api.request.mock.calls[1][0].body);
  await act(async () => second.resolve());
  expect(storedConfig.chapters[0].mediaItems).toHaveLength(1);
  await act(async () => first.resolve());
  expect(storedConfig.chapters[0].description).toBe('Hello');
  expect(storedConfig.chapters[0].mediaItems).toEqual([]);
});
