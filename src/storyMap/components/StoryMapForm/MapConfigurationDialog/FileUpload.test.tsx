/*
 * Copyright © 2025 Technology Matters
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

import { render, waitFor } from 'terraso-web-client/tests/utils';
import {
  createTestStoryMap,
  createTestStoryMapConfig,
} from 'terraso-web-client/tests/data/storyMap';

import * as sharedDataSlice from 'terraso-web-client/sharedData/sharedDataSlice';
import { FileUpload } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/FileUpload';
import { MapLayerCreateSessionProvider } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSession';
import { StoryMapConfigContextProvider } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

jest.mock('terraso-client-shared/terrasoApi/api');

// The upload thunk never registers an uploads entry in the store (e.g. the
// resetUploads() mount effect wiped it): the component must not crash on the
// missing entry.
jest.mock('terraso-web-client/sharedData/sharedDataSlice', () => {
  const actual = jest.requireActual(
    'terraso-web-client/sharedData/sharedDataSlice'
  );
  return {
    __esModule: true,
    ...actual,
    uploadSharedDataFile: jest.fn(),
  };
});

jest.mock('terraso-web-client/collaboration/collaborationContext', () => ({
  __esModule: true,
  CollaborationContextProvider: ({ children }: { children: any }) => children,
  useCollaborationContext: () => ({
    owner: { id: 'story-map-id' },
    entityType: 'story_map',
  }),
}));

describe('FileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      sharedDataSlice.uploadSharedDataFile as unknown as jest.Mock
    ).mockImplementation(() => () => new Promise(() => {}));
  });

  test('tolerates a missing uploads entry while the file is set', async () => {
    const onCompleteSuccess = jest.fn();
    const onUploadingChange = jest.fn();
    const file = new File(['x'], 'points.geojson', {
      type: 'application/geo+json',
    });
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      await render(
        <StoryMapConfigContextProvider
          baseConfig={createTestStoryMapConfig()}
          storyMap={createTestStoryMap()}
        >
          <MapLayerCreateSessionProvider file={file}>
            <FileUpload
              externalFile={file}
              showDropZone={false}
              onCompleteSuccess={onCompleteSuccess}
              onUploadingChange={onUploadingChange}
            />
          </MapLayerCreateSessionProvider>
        </StoryMapConfigContextProvider>,
        {
          sharedData: { uploads: { files: {} } },
        }
      );

      await waitFor(() => {
        expect(onUploadingChange).toHaveBeenCalledWith(false);
      });
      // The missing-entry crash is swallowed by the app's error boundary — it
      // surfaces as a TypeError on the console.
      const crashes = consoleSpy.mock.calls.filter(args =>
        String(args[0]).includes("reading 'status'")
      );
      expect(crashes).toEqual([]);
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
