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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from 'terraso-web-client/tests/utils';
import { useEffect, useRef } from 'react';
import { useSelector } from 'terraso-web-client/terrasoApi/store';
import {
  createTestDataEntryNode,
  createTestStoryMap,
  createTestStoryMapConfig,
} from 'terraso-web-client/tests/data/storyMap';

import * as sharedDataSlice from 'terraso-web-client/sharedData/sharedDataSlice';
import { FileUpload } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/FileUpload';
import {
  MapLayerCreateSessionProvider,
  useMapLayerCreateFlow,
  useMapLayerCreateSession,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSession';
import { StoryMapConfigContextProvider } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

jest.mock('terraso-client-shared/terrasoApi/api');

// The upload thunk is mocked so tests own the promise; its result shape
// matches the real `uploadSharedDataFile` thunk result.
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

const createFile = (name = 'points.geojson', type = 'application/geo+json') =>
  new File(['x'], name, { type });

// Reads back the GLOBAL uploads store: FileUpload must not stomp it (it is
// shared with SharedDataUpload).
const UploadsProbe = () => {
  const uploads = useSelector(
    (state: any) => state.sharedData?.uploads?.files ?? {}
  );
  return <div data-testid="uploads-probe">{JSON.stringify(uploads)}</div>;
};

const SessionProbe = () => {
  const session = useMapLayerCreateSession();
  return <div data-testid="session-file">{session?.file?.name ?? ''}</div>;
};

const SessionHost = ({
  file,
  children,
}: {
  file: File;
  children: React.ReactNode;
}) => {
  const session = useMapLayerCreateFlow({
    enabled: true,
    onCreateLayer: () => {},
  });
  const { startCreateFlow, cancelCreate } = session;
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startCreateFlow(file);
    }
  }, [file, startCreateFlow]);
  return (
    <MapLayerCreateSessionProvider session={session}>
      <button type="button" onClick={cancelCreate}>
        stub-cancel-session
      </button>
      <button
        type="button"
        onClick={() => startCreateFlow(createFile('other.geojson'))}
      >
        stub-start-other
      </button>
      {/* Like the real hosts: the create flow renders only while a session
          is active (the session must exist before the upload starts). */}
      {session.creating ? children : null}
    </MapLayerCreateSessionProvider>
  );
};

const renderFileUpload = async ({
  file = createFile(),
  onCompleteSuccess = jest.fn(),
  onUploadingChange = jest.fn(),
  initialState,
}: {
  file?: File;
  onCompleteSuccess?: jest.Mock;
  onUploadingChange?: jest.Mock;
  initialState?: Record<string, unknown>;
} = {}) => {
  const utils = await render(
    <StoryMapConfigContextProvider
      baseConfig={createTestStoryMapConfig()}
      storyMap={createTestStoryMap()}
    >
      <SessionHost file={file}>
        <FileUpload
          externalFile={file}
          showDropZone={false}
          onCompleteSuccess={onCompleteSuccess}
          onUploadingChange={onUploadingChange}
        />
        <SessionProbe />
        <UploadsProbe />
      </SessionHost>
    </StoryMapConfigContextProvider>,
    initialState
  );
  return { utils, onCompleteSuccess, onUploadingChange };
};

describe('FileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      sharedDataSlice.uploadSharedDataFile as unknown as jest.Mock
    ).mockImplementation(() => () => new Promise(() => {}));
  });

  test('tracks upload status locally: truthful busy reporting, no uploads-entry needed', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    try {
      const { onUploadingChange } = await renderFileUpload({
        initialState: { sharedData: { uploads: { files: {} } } },
      });

      await waitFor(() => {
        expect(onUploadingChange).toHaveBeenCalledWith(true);
      });
      // Idle is reported before the upload starts.
      expect(onUploadingChange).toHaveBeenCalledWith(false);
      // The missing-entry crash regression (57c4f80) is impossible now:
      // this flow never reads the uploads store.
      const crashes = consoleSpy.mock.calls.filter(args =>
        String(args[0]).includes("reading 'status'")
      );
      expect(crashes).toEqual([]);
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('never stomps the global uploads store shared with SharedDataUpload', async () => {
    await renderFileUpload({
      initialState: {
        sharedData: {
          uploads: {
            files: { 'shared-data-file': { status: 'uploading' } },
          },
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('session-file')).toHaveTextContent(
        'points.geojson'
      );
    });
    // The other flow's entry survives mount + upload start (the old
    // resetUploads() on mount wiped it).
    expect(screen.getByTestId('uploads-probe').textContent).toContain(
      'shared-data-file'
    );
  });

  test('drops an upload completion that lands after unmount', async () => {
    let resolveUpload: (value: unknown) => void = () => {};
    (
      sharedDataSlice.uploadSharedDataFile as unknown as jest.Mock
    ).mockImplementation(
      () => () =>
        new Promise(resolve => {
          resolveUpload = resolve;
        })
    );
    const file = createFile();
    const { utils, onCompleteSuccess } = await renderFileUpload({ file });

    await waitFor(() => expect(resolveUpload).toBeDefined());
    utils.unmount();

    await act(async () => {
      resolveUpload({
        meta: {
          arg: { file: { file } },
          requestStatus: 'fulfilled',
        },
        payload: createTestDataEntryNode(),
      });
    });

    // The completion must not write into whatever session is current.
    expect(onCompleteSuccess).not.toHaveBeenCalled();
  });

  test('drops an upload completion of a cancelled session (new session wins)', async () => {
    const uploadResolvers: Array<(value: unknown) => void> = [];
    (
      sharedDataSlice.uploadSharedDataFile as unknown as jest.Mock
    ).mockImplementation(
      () => () =>
        new Promise(resolve => {
          uploadResolvers.push(resolve);
        })
    );
    const file = createFile();
    const { onCompleteSuccess } = await renderFileUpload({ file });

    await waitFor(() => expect(uploadResolvers.length).toBeGreaterThan(0));
    // The session is cancelled and a NEW one started with another file.
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'stub-cancel-session' })
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'stub-start-other' }));
    });
    await waitFor(() => {
      expect(screen.getByTestId('session-file')).toHaveTextContent(
        'other.geojson'
      );
    });

    // The OLD session's upload completion lands late — it is dropped.
    await act(async () => {
      uploadResolvers[0]({
        meta: {
          arg: { file: { file } },
          requestStatus: 'fulfilled',
        },
        payload: createTestDataEntryNode(),
      });
    });
    expect(onCompleteSuccess).not.toHaveBeenCalled();
  });

  test('an upload failure offers recovery: choosing another file starts a fresh session', async () => {
    let resolveUpload: (value: unknown) => void = () => {};
    (
      sharedDataSlice.uploadSharedDataFile as unknown as jest.Mock
    ).mockImplementation(
      () => () =>
        new Promise(resolve => {
          resolveUpload = resolve;
        })
    );
    const file = createFile();
    await renderFileUpload({ file });

    await waitFor(() => expect(resolveUpload).toBeDefined());
    await act(async () => {
      resolveUpload({
        meta: {
          arg: { file: { file } },
          requestStatus: 'rejected',
        },
        error: new Error('upload failed'),
      });
    });

    // The failure is visible and is not a dead end.
    await waitFor(() => {
      expect(screen.getByText('The file cannot be added.')).toBeInTheDocument();
    });
    const chooseButton = screen.getByRole('button', {
      name: 'Choose another file',
    });
    expect(chooseButton).toBeInTheDocument();

    // Picking another file recovers: a fresh session with the new file.
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, {
        target: { files: [createFile('other.geojson')] },
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('session-file')).toHaveTextContent(
        'other.geojson'
      );
    });
  });
});
