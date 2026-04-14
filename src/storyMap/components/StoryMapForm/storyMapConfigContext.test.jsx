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

import { act, fireEvent, render, screen } from 'terraso-web-client/tests/utils';

import {
  StoryMapConfigContextProvider,
  useStoryMapConfigContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

const baseConfig = {
  title: 'Story Map Title',
  chapters: [],
  dataLayers: {},
};

const ContextProbe = () => {
  const {
    config,
    mediaFiles,
    configRevision,
    setConfig,
    isDirty,
    isConfigDirty,
    saved,
    addMediaFile,
    applySavedConfig,
    setBufferedChapterChangesPending,
  } = useStoryMapConfigContext();

  return (
    <>
      <div>{config.title}</div>
      <div>{isDirty ? 'dirty' : 'clean'}</div>
      <div>{isConfigDirty ? 'config-dirty' : 'config-clean'}</div>
      <div>{`media:${Object.keys(mediaFiles).length}`}</div>
      <div>{`revision:${configRevision}`}</div>
      <button
        onClick={() => setConfig(config => ({ ...config, title: 'One' }))}
      >
        first change
      </button>
      <button
        onClick={() => setConfig(config => ({ ...config, title: 'Two' }))}
      >
        second change
      </button>
      <button
        onClick={() => setBufferedChapterChangesPending('chapter-1', true)}
      >
        set buffered dirty
      </button>
      <button
        onClick={() => setBufferedChapterChangesPending('chapter-1', false)}
      >
        clear buffered dirty
      </button>
      <button onClick={() => saved(1)}>saved first revision</button>
      <button onClick={() => saved(2)}>saved second revision</button>
      <button
        onClick={() =>
          addMediaFile('file-content', {
            name: 'story-map-image.png',
            type: 'image/png',
          })
        }
      >
        add media file
      </button>
      <button
        onClick={() =>
          applySavedConfig(1, {
            ...baseConfig,
            title: 'Saved One',
          })
        }
      >
        apply first saved config
      </button>
      <button
        onClick={() =>
          applySavedConfig(2, {
            ...baseConfig,
            title: 'Saved Two',
          })
        }
      >
        apply second saved config
      </button>
    </>
  );
};

test('StoryMapConfigContext ignores stale saved revisions', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={baseConfig}
      storyMap={{ id: 'story-map-id-1' }}
    >
      <ContextProbe />
    </StoryMapConfigContextProvider>
  );

  expect(screen.getByText('clean')).toBeInTheDocument();
  expect(screen.getByText('config-clean')).toBeInTheDocument();
  expect(screen.getByText('revision:0')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'first change' }));
  });

  expect(screen.getByText('dirty')).toBeInTheDocument();
  expect(screen.getByText('revision:1')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'second change' }));
  });

  expect(screen.getByText('dirty')).toBeInTheDocument();
  expect(screen.getByText('revision:2')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'saved first revision' })
    );
  });

  expect(screen.getByText('dirty')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'saved second revision' })
    );
  });

  expect(screen.getByText('clean')).toBeInTheDocument();
});

test('StoryMapConfigContext keeps buffered chapter changes separate from config revisions', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={baseConfig}
      storyMap={{ id: 'story-map-id-1' }}
    >
      <ContextProbe />
    </StoryMapConfigContextProvider>
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'set buffered dirty' }));
  });

  expect(screen.getByText('dirty')).toBeInTheDocument();
  expect(screen.getByText('config-clean')).toBeInTheDocument();
  expect(screen.getByText('revision:0')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'saved first revision' })
    );
  });

  expect(screen.getByText('dirty')).toBeInTheDocument();
  expect(screen.getByText('config-clean')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'clear buffered dirty' })
    );
  });

  expect(screen.getByText('clean')).toBeInTheDocument();
  expect(screen.getByText('config-clean')).toBeInTheDocument();
});

test('StoryMapConfigContext ignores stale saved config responses and clears media for the current revision', async () => {
  await render(
    <StoryMapConfigContextProvider
      baseConfig={baseConfig}
      storyMap={{ id: 'story-map-id-1' }}
    >
      <ContextProbe />
    </StoryMapConfigContextProvider>
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'first change' }));
  });

  expect(screen.getByText('One')).toBeInTheDocument();
  expect(screen.getByText('revision:1')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'second change' }));
  });

  expect(screen.getByText('Two')).toBeInTheDocument();
  expect(screen.getByText('revision:2')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'add media file' }));
  });

  expect(screen.getByText('media:1')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'apply first saved config' })
    );
  });

  expect(screen.getByText('Two')).toBeInTheDocument();
  expect(screen.getByText('dirty')).toBeInTheDocument();
  expect(screen.getByText('media:1')).toBeInTheDocument();
  expect(screen.getByText('revision:2')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'apply second saved config' })
    );
  });

  expect(screen.getByText('Saved Two')).toBeInTheDocument();
  expect(screen.getByText('clean')).toBeInTheDocument();
  expect(screen.getByText('config-clean')).toBeInTheDocument();
  expect(screen.getByText('media:0')).toBeInTheDocument();
  expect(screen.getByText('revision:2')).toBeInTheDocument();
});
