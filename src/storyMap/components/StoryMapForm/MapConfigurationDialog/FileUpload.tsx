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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _ from 'lodash/fp';
import { FileRejection } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { DataEntryNode } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';
import { useDispatch } from 'terraso-web-client/terrasoApi/store';
import { Alert, Box, Button } from '@mui/material';

import { useCollaborationContext } from 'terraso-web-client/collaboration/collaborationContext';
import DropZone from 'terraso-web-client/common/components/DropZone';
import { FileWrapper, fileWrapper } from 'terraso-web-client/common/fileUtils';
import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import {
  ILM_OUTPUT_PROP,
  RESULTS_ANALYSIS_IMPACT,
} from 'terraso-web-client/monitoring/ilm';
import { uploadSharedDataFile } from 'terraso-web-client/sharedData/sharedDataSlice';
import { useMapLayerCreateSession } from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/MapLayerCreateSession';
import {
  MAP_LAYER_ACCEPTED_EXTENSIONS,
  MAP_LAYER_ACCEPTED_TYPES,
  mapLayerAcceptAttribute,
  mapLayerFileRejectionMessage,
  mapLayerFileValidator,
  SHARED_DATA_MAX_SIZE,
} from 'terraso-web-client/storyMap/components/StoryMapForm/MapConfigurationDialog/mapLayerFileDrop';
import { useStoryMapConfigDataContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

/**
 * Upload status of THIS component's current file, held in local state around
 * the upload thunk promise (the promise is the source of truth). The global
 * `sharedData.uploads` store is NOT consulted or reset from this flow: it is
 * shared with `SharedDataUpload` and a component lifecycle hook must never
 * stomp it (the thunk still records entries there for the shared-data flows).
 */
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

type FileUploadProps = {
  onCompleteSuccess: (dataEntry: DataEntryNode) => void;
  /** File to upload immediately (e.g. dropped outside the drop zone). */
  externalFile?: File;
  /** When false, only the upload state/errors are rendered (no drop zone). */
  showDropZone?: boolean;
  /** Reports upload progress to the host (e.g. to show a busy indicator). */
  onUploadingChange?: (uploading: boolean) => void;
};
export const FileUpload = (props: FileUploadProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const {
    storyMap: { id, slug },
  } = useStoryMapConfigDataContext();
  const [dropzoneErrors, setDropzoneErrors] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');

  const {
    onCompleteSuccess,
    externalFile,
    showDropZone = true,
    onUploadingChange,
  } = props;

  const session = useMapLayerCreateSession();

  const { entityType } = useCollaborationContext();

  const [file, setFile] = useState<FileWrapper | undefined>();

  // Truthful busy reporting: driven by the local status around the promise.
  useEffect(() => {
    onUploadingChange?.(uploadStatus === 'uploading');
  }, [uploadStatus, onUploadingChange]);

  // Mounted fence: an upload completion that lands after this component (and
  // its create session) is gone is dropped, never written into whatever
  // session is current when it lands.
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const processFile = useCallback(
    (bareFile: File) => {
      const file = fileWrapper(bareFile);
      setFile(file);
      setDropzoneErrors([]);
      setUploadStatus('uploading');
      // Captured at dispatch time: completions are fenced against the
      // session they were started in (see useMapLayerCreateSession).
      const sessionIdAtStart = session?.sessionId ?? 0;
      dispatch(
        uploadSharedDataFile({
          targetType: entityType,
          targetId: id,
          file: file,
        })
      ).then(result => {
        const uploadedFile = result.meta.arg.file.file;
        const status = result.meta.requestStatus;
        trackEvent('dataEntry.file.upload', {
          props: {
            story_map_slug: slug,
            story_map_id: id,
            [ILM_OUTPUT_PROP]: RESULTS_ANALYSIS_IMPACT,
            size: uploadedFile.size,
            type: uploadedFile.type,
            success: status === 'fulfilled',
          },
        });
        if (
          !aliveRef.current ||
          (sessionIdAtStart > 0 &&
            session &&
            !session.isCurrentSession(sessionIdAtStart))
        ) {
          // The session this upload belongs to is gone: drop the completion.
          return;
        }
        if (status === 'fulfilled') {
          setUploadStatus('success');
          onCompleteSuccess(result.payload as DataEntryNode);
        }
        if (status === 'rejected') {
          setUploadStatus('error');
          setDropzoneErrors([t('storyMap.upload_rejected')]);
        }
      });
    },
    [onCompleteSuccess, trackEvent, dispatch, entityType, id, slug, t, session]
  );

  const onDropAccepted = useCallback(
    ([bareFile]: File[]) => {
      processFile(bareFile);
    },
    [processFile]
  );

  const processedExternalFileRef = useRef<File | undefined>(undefined);
  useEffect(() => {
    if (externalFile && processedExternalFileRef.current !== externalFile) {
      processedExternalFileRef.current = externalFile;
      processFile(externalFile);
    }
  }, [externalFile, processFile]);

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      const messages = _.flow(
        // Group by error code
        _.groupBy(_.get('errors[0].code')),
        // Get only rejected files filename and join them
        _.mapValues(_.flow(_.map(_.get('file.name')), _.join(', '))),
        _.toPairs,
        // Generate localized messages
        _.map(([errorCode, rejectedFiles]) =>
          t(`sharedData.upload_rejected_${errorCode}`, {
            rejectedFiles,
            maxSize: (SHARED_DATA_MAX_SIZE as number) / 1000000.0,
            fileExtensions: MAP_LAYER_ACCEPTED_EXTENSIONS,
          })
        )
      )(rejections);
      setDropzoneErrors(messages);
    },
    [t, setDropzoneErrors]
  );

  // Upload/drop errors only: parse errors are owned by the create steps (ONE
  // owner — they are a session state, not an upload state).
  const errors = dropzoneErrors;

  // Recovery affordance: with the drop zone hidden, an upload failure must
  // not be a dead end — pick another file without leaving the flow. It
  // starts a NEW create session with the picked file (the file IS the
  // session identity), so nothing of the failed session leaks into it.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onChooseFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const picked = event.target.files?.[0];
      // Allow re-picking the same file name later.
      event.target.value = '';
      if (!picked) {
        return;
      }
      const rejectionMessage = mapLayerFileRejectionMessage(picked, t);
      if (rejectionMessage) {
        setDropzoneErrors([rejectionMessage]);
        return;
      }
      if (session) {
        session.startCreateFlow(picked);
        return;
      }
      processFile(picked);
    },
    [session, processFile, t]
  );

  return (
    <>
      {showDropZone && (
        <DropZone
          loading={
            uploadStatus === 'uploading' ||
            (uploadStatus === 'success' && Boolean(session?.loadingFile))
          }
          errors={errors}
          onDropAccepted={onDropAccepted}
          onDropRejected={onDropRejected}
          // Same accept rule as the compact add control and the window-wide
          // drop target (mapLayerFileDrop.ts).
          validator={mapLayerFileValidator}
          maxSize={SHARED_DATA_MAX_SIZE}
          fileTypes={MAP_LAYER_ACCEPTED_TYPES}
          fileExtensions={MAP_LAYER_ACCEPTED_EXTENSIONS}
          buttonLabel={t('storyMap.form_upload_file_button_label')}
          instructions={t('storyMap.drop_zone_instructions')}
          acceptedFormats={t('storyMap.drop_zone_format')}
        />
      )}
      {!showDropZone && (
        <>
          {errors.map((error, index) => (
            <Alert key={index} severity="error">
              {error}
            </Alert>
          ))}
          {errors.length > 0 && (
            <Box>
              <Button
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{ pl: 0 }}
              >
                {t('storyMap.form_map_layers_create_change_file')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept={mapLayerAcceptAttribute}
                onChange={onChooseFile}
              />
            </Box>
          )}
        </>
      )}
    </>
  );
};

export default FileUpload;
