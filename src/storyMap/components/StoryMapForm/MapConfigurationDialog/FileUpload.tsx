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
import { useTranslation } from 'react-i18next';
import { DataEntryNode } from 'terrasoApi/shared/graphqlSchema/graphql';
import { useDispatch, useSelector } from 'terrasoApi/store';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import DropZone from 'common/components/DropZone';
import { FileWrapper, fileWrapper } from 'common/fileUtils';
import { useAnalytics } from 'monitoring/analytics';
import { ILM_OUTPUT_PROP, RESULTS_ANALYSIS_IMPACT } from 'monitoring/ilm';
import {
  resetUploads,
  UPLOAD_STATUS_SUCCESS,
  UPLOAD_STATUS_UPLOADING,
  uploadSharedDataFile,
} from 'sharedData/sharedDataSlice';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

import { useStoryMapConfigContext } from '../storyMapConfigContext';

import {
  MAP_LAYER_ACCEPTED_EXTENSIONS,
  MAP_LAYER_ACCEPTED_TYPES,
  SHARED_DATA_MAX_SIZE,
} from 'config';

type FileUploadProps = {
  onCompleteSuccess: (dataEntry: DataEntryNode) => void;
};
export const FileUpload = (props: FileUploadProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const {
    storyMap: { slug },
  } = useStoryMapConfigContext();
  const [dropzoneErrors, setDropzoneErrors] = useState<string[]>([]);

  const { onCompleteSuccess } = props;

  useEffect(() => {
    dispatch(resetUploads());
  }, [dispatch]);

  const { entityType } = useCollaborationContext();

  const [file, setFile] = useState<FileWrapper | undefined>();
  const uploadingStatus = useSelector(state =>
    file ? (state.sharedData.uploads.files as any)[file.id].status : undefined
  );

  const onDropAccepted = useCallback(
    ([bareFile]: any) => {
      const file = fileWrapper(bareFile);
      setFile(file);
      dispatch(
        uploadSharedDataFile({
          targetType: entityType,
          targetSlug: slug,
          file: file,
        }) as any
      ).then((result: any) => {
        const file = result.meta.arg.file.file;
        const status = result.meta.requestStatus;
        trackEvent('dataEntry.file.upload', {
          props: {
            story_map: slug,
            [ILM_OUTPUT_PROP]: RESULTS_ANALYSIS_IMPACT,
            size: file.size,
            type: file.type,
            success: status === 'fulfilled',
          },
        });
        if (status === 'fulfilled') {
          onCompleteSuccess(result.payload);
        }
      });
    },
    [onCompleteSuccess, trackEvent, dispatch, entityType, slug]
  );

  const onDropRejected = useCallback(
    (rejections: any) => {
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
    />
  );
};
