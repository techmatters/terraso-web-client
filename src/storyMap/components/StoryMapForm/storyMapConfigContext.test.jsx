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

import { act, render } from 'terraso-web-client/tests/utils';

import {
  StoryMapConfigContextProvider,
  useStoryMapConfigActionsContext,
  useStoryMapConfigDataContext,
  useStoryMapMediaContext,
  useStoryMapSaveContext,
} from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

const baseConfig = {
  chapters: [{ id: 'one', mediaItems: [] }],
  dataLayers: {},
};
let context;

const CaptureContext = () => {
  context = {
    ...useStoryMapConfigActionsContext(),
    ...useStoryMapConfigDataContext(),
    ...useStoryMapMediaContext(),
    ...useStoryMapSaveContext(),
  };
  return null;
};

const setup = async () => {
  await render(
    <StoryMapConfigContextProvider baseConfig={baseConfig}>
      <CaptureContext />
    </StoryMapConfigContextProvider>
  );
};

test('a successful save retains files not referenced in its configuration, even if they were in the snapshot', async () => {
  await setup();
  const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });
  let id;
  act(() => {
    id = context.addMediaFile('preview', file);
  });
  const snapshot = context.mediaFiles;
  act(() => {
    context.applySavedRevisionConfig(0, baseConfig, baseConfig, snapshot);
  });
  expect(context.getMediaFile(id)).toBe('preview');
  expect(context.mediaFiles[id].file).toBe(file);
});

test('only acknowledged uploaded files are cleared; stale and unresolved saves keep them', async () => {
  await setup();
  const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });
  let id;
  act(() => {
    id = context.addMediaFile('preview', file);
  });
  act(() => {
    context.setConfig(config => ({
      ...config,
      chapters: [{ ...config.chapters[0], mediaItems: [{ contentId: id }] }],
    }));
  });
  const submitted = context.config;
  const submittedFiles = context.mediaFiles;
  const revision = context.configRevision;
  act(() => {
    context.applySavedRevisionConfig(
      revision - 1,
      submitted,
      submitted,
      submittedFiles
    );
  });
  expect(context.mediaFiles[id].file).toBe(file);
  act(() => {
    context.applySavedRevisionConfig(
      revision,
      submitted,
      submitted,
      submittedFiles
    );
  });
  expect(context.mediaFiles[id].file).toBe(file);
  const uploaded = {
    ...submitted,
    chapters: [
      { ...submitted.chapters[0], mediaItems: [{ url: '/saved.jpg' }] },
    ],
  };
  act(() => {
    context.applySavedRevisionConfig(
      revision,
      uploaded,
      submitted,
      submittedFiles
    );
  });
  expect(context.mediaFiles[id]).toBeUndefined();
  expect(context.config.chapters[0].mediaItems).toEqual([
    { url: '/saved.jpg' },
  ]);
});
