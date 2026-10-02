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

import { createTestDataEntryNode } from 'terraso-web-client/tests/data/storyMap';

/**
 * THE FileUpload stub, shared by the create-flow suites (dialog, steps) so
 * the stubs cannot diverge. Wire it with:
 *
 *   jest.mock('.../MapConfigurationDialog/FileUpload', () =>
 *     jest.requireActual('terraso-web-client/tests/fileUploadMock')
 *   );
 *
 * and pull `fileUploadStub` with the SAME `jest.requireActual` path (the
 * stub keeps a handle to every rendered `onCompleteSuccess`, so tests can
 * simulate late/stale upload completions).
 */
export type FileUploadStubRender = {
  fileName: string;
  onCompleteSuccess: (dataEntry: unknown) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export const fileUploadStub = {
  renders: [] as FileUploadStubRender[],
  /** The most recent completion callback rendered for `fileName`. */
  lastFor: (fileName: string) =>
    [...fileUploadStub.renders]
      .reverse()
      .find(render => render.fileName === fileName)?.onCompleteSuccess,
};

type FileUploadStubProps = {
  externalFile?: File;
  onCompleteSuccess: (dataEntry: unknown) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export const FileUpload = ({
  externalFile,
  onCompleteSuccess,
  onUploadingChange,
}: FileUploadStubProps) => {
  const fileName = externalFile?.name ?? '';
  fileUploadStub.renders.push({
    fileName,
    onCompleteSuccess,
    onUploadingChange,
  });
  return (
    <div data-testid="stub-file-upload">
      <span data-testid="stub-create-file">{fileName}</span>
      <button type="button" onClick={() => onUploadingChange?.(true)}>
        stub-uploading
      </button>
      <button
        type="button"
        onClick={() => {
          onUploadingChange?.(false);
          onCompleteSuccess(
            createTestDataEntryNode({
              id: `entry-${fileName || 'points.geojson'}`,
              name: fileName || 'points.geojson',
              resourceType: fileName.split('.').pop() || 'geojson',
            })
          );
        }}
      >
        stub-upload-done
      </button>
    </div>
  );
};

export default FileUpload;
