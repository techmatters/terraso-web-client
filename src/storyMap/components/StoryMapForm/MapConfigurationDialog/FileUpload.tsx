/*
 * Copyright © 2021-2023 Technology Matters
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

import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { DataEntryNode } from 'terrasoApi/shared/graphqlSchema/graphql';

// import ErrorIcon from '@mui/icons-material/Report';
// import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
// import { Box, Button, Paper, Stack, Tab, Typography } from '@mui/material';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import DropZone from 'common/components/DropZone';
import { useAnalytics } from 'monitoring/analytics';
import { ILM_OUTPUT_PROP, RESULTS_ANALYSIS_IMPACT } from 'monitoring/ilm';
import { fileWrapper } from 'sharedData/components/SharedDataUpload/ShareDataFiles';
import { resetUploads, uploadSharedDataFile } from 'sharedData/sharedDataSlice';

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
  const [errors, setErrors] = useState<string[] | undefined>();

  const { onCompleteSuccess } = props;

  useEffect(() => {
    dispatch(resetUploads());
  }, [dispatch]);

  const { entityType } = useCollaborationContext();

  const [, setFile] = useState();

  const onDropAccepted = useCallback(
    ([bareFile]: any) => {
      const file = fileWrapper(bareFile);
      setFile(file as any);
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
      setErrors(() => messages);
    },
    [t, setErrors]
  );

  return (
    <DropZone
      errors={errors}
      onDropAccepted={onDropAccepted}
      onDropRejected={onDropRejected}
      maxSize={SHARED_DATA_MAX_SIZE}
      fileTypes={MAP_LAYER_ACCEPTED_TYPES}
      fileExtensions={MAP_LAYER_ACCEPTED_EXTENSIONS}
    />
  );
};
