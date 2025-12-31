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

import { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { FileRejection } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { DataEntryNode } from 'terraso-web-client/terrasoApi/shared/graphqlSchema/graphql';
import { useDispatch, useSelector } from 'terraso-web-client/terrasoApi/store';

import { useCollaborationContext } from 'terraso-web-client/collaboration/collaborationContext';
import DropZone from 'terraso-web-client/common/components/DropZone';
import { FileWrapper, fileWrapper } from 'terraso-web-client/common/fileUtils';
import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import {
  ILM_OUTPUT_PROP,
  RESULTS_ANALYSIS_IMPACT,
} from 'terraso-web-client/monitoring/ilm';
import {
  resetUploads,
  UPLOAD_STATUS_SUCCESS,
  UPLOAD_STATUS_UPLOADING,
  uploadSharedDataFile,
} from 'terraso-web-client/sharedData/sharedDataSlice';
import { useVisualizationContext } from 'terraso-web-client/sharedData/visualization/visualizationContext';
import { useStoryMapConfigContext } from 'terraso-web-client/storyMap/components/StoryMapForm/storyMapConfigContext';

import {
  MAP_LAYER_ACCEPTED_EXTENSIONS,
  MAP_LAYER_ACCEPTED_TYPES,
  SHARED_DATA_MAX_SIZE,
} from 'terraso-web-client/config';

type FileUploadProps = {
  onCompleteSuccess: (dataEntry: DataEntryNode) => void;
};
export const FileUpload = (props: FileUploadProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const {
    storyMap: { id, slug },
  } = useStoryMapConfigContext();
  const [dropzoneErrors, setDropzoneErrors] = useState<string[]>([]);

  const { onCompleteSuccess } = props;

  useEffect(() => {
    dispatch(resetUploads());
  }, [dispatch]);

  const { entityType } = useCollaborationContext();

  const [file, setFile] = useState<FileWrapper | undefined>();
  const uploadingStatus = useSelector(state =>
    file ? state.sharedData.uploads.files[file.id].status : undefined
  );

  const onDropAccepted = useCallback(
    ([bareFile]: File[]) => {
      const file = fileWrapper(bareFile);
      setFile(file);
      setDropzoneErrors([]);
      dispatch(
        uploadSharedDataFile({
          targetType: entityType,
          targetId: id,
          file: file,
        })
      ).then(result => {
        const file = result.meta.arg.file.file;
        const status = result.meta.requestStatus;
        trackEvent('dataEntry.file.upload', {
          props: {
            story_map_slug: slug,
            story_map_id: id,
            [ILM_OUTPUT_PROP]: RESULTS_ANALYSIS_IMPACT,
            size: file.size,
            type: file.type,
            success: status === 'fulfilled',
          },
        });
        if (status === 'fulfilled') {
          onCompleteSuccess(result.payload as DataEntryNode);
        }
        if (status === 'rejected') {
          setDropzoneErrors([t('storyMap.upload_rejected')]);
        }
      });
    },
    [onCompleteSuccess, trackEvent, dispatch, entityType, id, slug, t]
  );

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

  const { loadingFile, loadingFileError } = useVisualizationContext();

  const loadingFileErrors = useMemo(() => {
    if (!loadingFileError) {
      return [];
    }
    return [
      t('sharedData.upload_rejected_cant-parse', {
        rejectedFiles: `${file?.name}${file?.resourceType}`,
      }),
    ];
  }, [loadingFileError, file, t]);

  const errors = useMemo(
    () => (dropzoneErrors.length > 0 ? dropzoneErrors : loadingFileErrors),
    [dropzoneErrors, loadingFileErrors]
  );

  return (
    <DropZone
      loading={
        uploadingStatus === UPLOAD_STATUS_UPLOADING ||
        (uploadingStatus === UPLOAD_STATUS_SUCCESS && loadingFile)
      }
      errors={errors}
      onDropAccepted={onDropAccepted}
      onDropRejected={onDropRejected}
      maxSize={SHARED_DATA_MAX_SIZE}
      fileTypes={MAP_LAYER_ACCEPTED_TYPES}
      fileExtensions={MAP_LAYER_ACCEPTED_EXTENSIONS}
      buttonLabel={t('storyMap.form_upload_file_button_label')}
      instructions={t('storyMap.drop_zone_instructions')}
      acceptedFormats={t('storyMap.drop_zone_format')}
    />
  );
};
