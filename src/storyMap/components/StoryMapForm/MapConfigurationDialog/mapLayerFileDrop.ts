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

import type { FileError } from 'react-dropzone';

import {
  MAP_LAYER_ACCEPTED_EXTENSIONS,
  MAP_LAYER_ACCEPTED_TYPES,
  SHARED_DATA_MAX_SIZE,
} from 'terraso-web-client/config';

/**
 * THE accept rule for the map layer create flow, shared by every drop/click
 * target (FileUpload's DropZone, the compact add control and the dialog's
 * window-wide drop target). Do not re-implement these rules anywhere else.
 */
export type MapLayerFileRejectionCode = 'file-too-large' | 'file-invalid-type';

export {
  MAP_LAYER_ACCEPTED_EXTENSIONS,
  MAP_LAYER_ACCEPTED_TYPES,
  SHARED_DATA_MAX_SIZE,
};

/**
 * Rejection code for a file, or null when accepted: oversize is reported
 * before the type check; a file is accepted when EITHER its extension OR its
 * MIME type is known (case-insensitive extension match).
 */
export const mapLayerFileRejectionCode = (
  file: File
): MapLayerFileRejectionCode | null => {
  if (file.size > SHARED_DATA_MAX_SIZE) {
    return 'file-too-large';
  }
  const name = file.name?.toLowerCase() ?? '';
  const extension = name.includes('.')
    ? name.slice(name.lastIndexOf('.') + 1)
    : '';
  const extensionOk = MAP_LAYER_ACCEPTED_EXTENSIONS.includes(extension);
  const typeOk = Object.keys(MAP_LAYER_ACCEPTED_TYPES).includes(file.type);
  return extensionOk || typeOk ? null : 'file-invalid-type';
};

/** Whether a file is accepted by the map layer create flow. */
export const isMapLayerFileAccepted = (file: File): boolean =>
  mapLayerFileRejectionCode(file) === null;

/** `accept` attribute for `<input type="file">` pickers. */
export const mapLayerAcceptAttribute = [
  ...Object.keys(MAP_LAYER_ACCEPTED_TYPES),
  ...MAP_LAYER_ACCEPTED_EXTENSIONS.map(extension => `.${extension}`),
].join(',');

/**
 * react-dropzone `validator` for the same rules (used by the create flow's
 * DropZone so it cannot diverge from the other drop targets).
 */
export const mapLayerFileValidator = (file: File): FileError | null => {
  const code = mapLayerFileRejectionCode(file);
  return code ? { code, message: code } : null;
};

/** Localized rejection message (sharedData.upload_rejected_* keys). */
export const mapLayerFileRejectionMessage = (
  file: File,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null => {
  const code = mapLayerFileRejectionCode(file);
  if (!code) {
    return null;
  }
  return t(`sharedData.upload_rejected_${code}`, {
    rejectedFiles: file.name,
    maxSize: SHARED_DATA_MAX_SIZE / 1000000.0,
    fileExtensions: MAP_LAYER_ACCEPTED_EXTENSIONS,
  });
};
