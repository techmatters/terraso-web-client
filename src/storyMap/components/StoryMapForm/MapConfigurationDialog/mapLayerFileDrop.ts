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

import { useCallback, useEffect, useState } from 'react';
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

export type MapLayerWindowDropOptions = {
  /** Gates the listeners (e.g. the host dialog is open). */
  enabled: boolean;
  /**
   * While true (a create session is in progress) dropped files are ignored
   * entirely — no file swap mid-form. The drag overlay is still reported so
   * the host can explain why the drop is ignored.
   */
  suspended: boolean;
  onFile: (file: File) => void;
  onReject: (file: File) => void;
};

/**
 * The window-wide file drop target of the map layer create flow: while the
 * host is enabled, dropping a file anywhere on the window starts (or is
 * offered to) the create flow. Returns the drag-active state for the host's
 * drop affordance.
 */
export const useMapLayerWindowDrop = ({
  enabled,
  suspended,
  onFile,
  onReject,
}: MapLayerWindowDropOptions) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (isMapLayerFileAccepted(file)) {
        onFile(file);
      } else {
        onReject(file);
      }
    },
    [onFile, onReject]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes('Files')) {
        event.preventDefault();
        setDragActive(true);
      }
    };
    const onDragLeave = (event: DragEvent) => {
      // Inner dragleave events fire for every element crossed; only leaving
      // the window (no relatedTarget) cancels the affordance.
      if (!event.relatedTarget) {
        setDragActive(false);
      }
    };
    const onDrop = (event: DragEvent) => {
      setDragActive(false);
      const files = event.dataTransfer?.files;
      if (!files?.length) {
        return;
      }
      event.preventDefault();
      if (suspended) {
        // A layer creation is in progress: ignore the drop entirely (no file
        // swap mid-form).
        return;
      }
      // Multi-file drop: take the first file and ignore the rest.
      handleFile(files[0]);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [enabled, suspended, handleFile]);

  return dragActive;
};
