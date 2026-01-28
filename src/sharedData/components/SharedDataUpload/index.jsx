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

import { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import ErrorIcon from '@mui/icons-material/Report';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';

import { useCollaborationContext } from 'terraso-web-client/collaboration/collaborationContext';
import {
  Tab,
  TabContext,
  TabList,
  TabPanel,
} from 'terraso-web-client/common/components/Tabs';
import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import {
  ILM_OUTPUT_PROP,
  RESULTS_ANALYSIS_IMPACT,
} from 'terraso-web-client/monitoring/ilm';
import ShareDataFiles, {
  useFilesState,
} from 'terraso-web-client/sharedData/components/SharedDataUpload/ShareDataFiles';
import ShareDataLinks, {
  useLinksState,
} from 'terraso-web-client/sharedData/components/SharedDataUpload/ShareDataLinks';
import { ShareDataUploadContextProvider } from 'terraso-web-client/sharedData/components/SharedDataUpload/ShareDataUploadContext';
import { validateLink } from 'terraso-web-client/sharedData/components/SharedDataUpload/utils';
import {
  addSharedDataLink,
  resetUploads,
  uploadSharedDataFile,
} from 'terraso-web-client/sharedData/sharedDataSlice';

const localizedCounts = (t, files, links) =>
  [
    { count: files, key: 'sharedData.upload_summary_files' },
    { count: links, key: 'sharedData.upload_summary_links' },
  ]
    .filter(({ count }) => count > 0)
    .map(({ count, key }) => t(key, { count }))
    .join(t('sharedData.upload_summary_separator'));

const SharedDataUpload = props => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();
  const { owner, entityType } = useCollaborationContext();

  const { targetInput, onCancel, onCompleteSuccess } = props;

  const [section, setSection] = useState('files');

  const filesState = useFilesState();
  const { filesPending, filesErrors, filesUploading, filesSuccess, apiErrors } =
    filesState;

  const linksState = useLinksState();
  const {
    linksPending,
    linksUploading,
    linksSuccess,
    linksErrors = {},
  } = linksState;

  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    dispatch(resetUploads());
  }, [dispatch]);

  useEffect(() => {
    const isCompleteSuccess =
      (filesSuccess > 0 || linksSuccess > 0) &&
      _.isEmpty(filesPending) &&
      _.isEmpty(linksPending);

    if (isCompleteSuccess) {
      onCompleteSuccess(true);
    }
  }, [
    filesPending,
    filesSuccess,
    linksPending,
    linksSuccess,
    onCompleteSuccess,
  ]);

  const toUpload = useMemo(() => {
    const links = linksPending.map(validateLink).filter(_.isObject);

    return {
      links,
      files: filesPending,
      count: links.length + filesPending.length,
    };
  }, [filesPending, linksPending]);

  const onSave = useCallback(() => {
    setShowSummary(false);
    const linksPromises = toUpload.links.map(link =>
      dispatch(addSharedDataLink({ ...targetInput, link }))
    );
    const filesPromises = toUpload.files.map(file =>
      dispatch(uploadSharedDataFile({ ...targetInput, file }))
    );

    const allPromises = [...filesPromises, ...linksPromises];
    Promise.allSettled(allPromises).then(results => {
      const byType = _.groupBy(
        result => (_.has('value.meta.arg.link', result) ? 'links' : 'files'),
        results
      );
      byType.files?.forEach(result => {
        const file = _.get('value.meta.arg.file.file', result);
        trackEvent('dataEntry.file.upload', {
          props: {
            [entityType]: owner.slug,
            [ILM_OUTPUT_PROP]: RESULTS_ANALYSIS_IMPACT,
            size: file.size,
            type: file.type,
            success: result.status === 'fulfilled',
          },
        });
      });
      byType.links?.forEach(result => {
        trackEvent('dataEntry.link.create', {
          props: {
            [entityType]: owner.slug,
            success: result.status === 'fulfilled',
          },
        });
      });
      setShowSummary(true);
    });
  }, [entityType, owner.slug, toUpload, targetInput, dispatch, trackEvent]);

  const hasBlockingErrors = useMemo(
    () =>
      !_.isEmpty(
        [...Object.values(filesErrors), ...Object.values(linksErrors)].filter(
          error => !_.isEmpty(error)
        )
      ),
    [filesErrors, linksErrors]
  );

  const isSaveDisabled = useMemo(
    () => toUpload.count === 0 || hasBlockingErrors,
    [toUpload, hasBlockingErrors]
  );

  const isUploading = useMemo(
    () => filesUploading || linksUploading,
    [filesUploading, linksUploading]
  );

  const successCount = useMemo(
    () => filesSuccess + linksSuccess,
    [filesSuccess, linksSuccess]
  );

  const errorCount = useMemo(() => {
    const numFilesErrors = Object.values(filesErrors).length;
    const numLinksErrors = Object.values(linksErrors).length;
    const numApiErrors = apiErrors ? Object.values(apiErrors).length : 0;

    return numFilesErrors + numLinksErrors + numApiErrors;
  }, [filesErrors, linksErrors, apiErrors]);

  return (
    <>
      <Paper component={Stack} spacing={2} variant="outlined" sx={{ p: 1 }}>
        <TabContext value={section}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList
              onChange={(event, newValue) => setSection(newValue)}
              aria-label="lab API tabs example"
            >
              <Tab
                label={t('sharedData.tab_files', {
                  count: showSummary ? 0 : filesPending.length,
                })}
                value="files"
              />
              <Tab
                label={t('sharedData.tab_links', {
                  count: showSummary ? 0 : linksPending.length,
                })}
                value="links"
              />
            </TabList>
          </Box>
          <ShareDataUploadContextProvider showSummary={showSummary}>
            <TabPanel value="files">
              <ShareDataFiles filesState={filesState} />
            </TabPanel>
            <TabPanel value="links">
              <ShareDataLinks linksState={linksState} />
            </TabPanel>
          </ShareDataUploadContextProvider>
        </TabContext>
      </Paper>
      {showSummary && errorCount > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2 }}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <ErrorIcon color="error" />
          <Typography sx={{ color: 'error.main' }}>
            {t('sharedData.upload_summary_error', {
              count: errorCount,
              errorCounts: localizedCounts(
                t,
                filesPending.length,
                linksPending.length
              ),
            })}
          </Typography>
        </Stack>
      )}
      {showSummary && successCount > 0 && (
        <Typography sx={{ mt: 1, pl: 4 }}>
          {t('sharedData.upload_summary_success', {
            count: successCount,
            successCounts: localizedCounts(t, filesSuccess, linksSuccess),
          })}
        </Typography>
      )}
      <Stack direction="row" spacing={2} sx={{ marginTop: 3 }}>
        <Button
          variant="contained"
          disabled={isSaveDisabled}
          loading={isUploading}
          onClick={onSave}
          sx={{ paddingLeft: 5, paddingRight: 5 }}
        >
          {t('sharedData.upload_save')}
        </Button>
        <Button variant="text" onClick={onCancel}>
          {t('sharedData.upload_cancel')}
        </Button>
      </Stack>
    </>
  );
};

export default SharedDataUpload;
