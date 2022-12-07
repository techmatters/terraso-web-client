import React, { useCallback, useEffect, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Button, Paper, Stack, Tab, Typography } from '@mui/material';

import { useAnalytics } from 'monitoring/analytics';

import {
  addSharedDataLink,
  resetUploads,
  uploadSharedDataFile,
} from 'sharedData/sharedDataSlice';

import ShareDataFiles, { useFilesState } from './ShareDataFiles';
import ShareDataLinks, { useLinksState } from './ShareDataLinks';
import { validateLink } from './utils';

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

  const { groupSlug, onCancel, onCompleteSuccess } = props;

  const [section, setSection] = useState('files');

  const filesState = useFilesState();
  const { filesPending, filesErrors, filesUploading, filesSuccess } =
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
      dispatch(addSharedDataLink({ groupSlug, link }))
    );
    const filesPromises = toUpload.files.map(file =>
      dispatch(uploadSharedDataFile({ groupSlug, file }))
    );

    const allPromises = [...filesPromises, ...linksPromises];
    Promise.allSettled(allPromises).then(results => {
      results
        .filter(
          result => _.get('value.meta.requestStatus', result) === 'fulfilled'
        )
        .forEach(result => {
          const isLink = _.has('value.meta.arg.link', result);
          if (isLink) {
            trackEvent('uploadLink', { props: { owner: groupSlug } });
          } else {
            trackEvent('uploadFile', { props: { owner: groupSlug } });
          }
        });
      setShowSummary(true);
    });
  }, [toUpload, groupSlug, dispatch, trackEvent]);

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
                  count: filesPending.length,
                })}
                value="files"
              />
              <Tab
                label={t('sharedData.tab_links', {
                  count: linksPending.length,
                })}
                value="links"
              />
            </TabList>
          </Box>
          <TabPanel value="files">
            <ShareDataFiles filesState={filesState} />
          </TabPanel>
          <TabPanel value="links">
            <ShareDataLinks linksState={linksState} />
          </TabPanel>
        </TabContext>
      </Paper>
      {showSummary && (
        <Typography sx={{ mt: 2 }}>
          {t('sharedData.upload_summary', {
            count: filesSuccess + linksSuccess,
            successCount: filesSuccess + linksSuccess,
            errorCount: filesPending.length + linksPending.length,
            successCounts: localizedCounts(t, filesSuccess, linksSuccess),
            errorCounts: localizedCounts(
              t,
              filesPending.length,
              linksPending.length
            ),
          })}
        </Typography>
      )}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="space-between"
        sx={{ marginTop: 3 }}
      >
        <LoadingButton
          variant="contained"
          disabled={isSaveDisabled}
          loading={isUploading}
          onClick={onSave}
          sx={{ paddingLeft: 5, paddingRight: 5 }}
        >
          {t('sharedData.upload_save')}
        </LoadingButton>
        <Button variant="text" onClick={onCancel}>
          {t('sharedData.upload_cancel')}
        </Button>
      </Stack>
    </>
  );
};

export default SharedDataUpload;
