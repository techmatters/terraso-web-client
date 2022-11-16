import React, { useCallback, useEffect, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Button, Paper, Stack, Tab } from '@mui/material';

import { useAnalytics } from 'monitoring/analytics';

import { resetUploads, uploadSharedDataFile } from 'sharedData/sharedDataSlice';

import ShareDataFiles from './ShareDataFiles';

const SharedDataUpload = props => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { trackEvent } = useAnalytics();

  const { groupSlug, onCancel, onCompleteSuccess } = props;

  const [section, setSection] = useState('files');
  const [filesPending, setFilesPending] = useState([]);
  const [filesErrors, setFilesErrors] = useState([]);
  const [filesUploading, setFilesUploading] = useState(false);
  const [filesSuccess, setFilesSuccess] = useState(false);

  useEffect(() => {
    dispatch(resetUploads());
  }, [dispatch]);

  useEffect(() => {
    const isCompleteSuccess = filesSuccess;
    if (isCompleteSuccess) {
      onCompleteSuccess(true);
    }
  }, [filesSuccess, onCompleteSuccess]);

  const onSave = useCallback(() => {
    const promises = filesPending.map(([fileId, file]) =>
      dispatch(uploadSharedDataFile({ groupSlug, file }))
    );
    Promise.allSettled(promises).then(results =>
      results
        .filter(result => result.status === 'fulfilled')
        .forEach(result => {
          trackEvent('uploadFile', { props: { owner: groupSlug } });
        })
    );
  }, [filesPending, groupSlug, dispatch, trackEvent]);

  const hasBlockingErrors = useMemo(
    () =>
      !_.isEmpty(Object.values(filesErrors).filter(error => !_.isEmpty(error))),
    [filesErrors]
  );

  const isSaveDisabled = useMemo(
    () => _.isEmpty(filesPending) || hasBlockingErrors,
    [filesPending, hasBlockingErrors]
  );

  const isUploading = useMemo(() => filesUploading, [filesUploading]);

  return (
    <>
      <Paper component={Stack} spacing={2} variant="outlined" sx={{ p: 1 }}>
        <TabContext value={section}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList
              onChange={(event, newValue) => setSection(newValue)}
              aria-label="lab API tabs example"
            >
              <Tab label={t('sharedData.tab_files')} value="files" />
              <Tab label={t('sharedData.tab_links')} value="links" />
            </TabList>
          </Box>
          <TabPanel value="files">
            <ShareDataFiles
              setFilesPending={setFilesPending}
              setFilesErrors={setFilesErrors}
              setFilesUploading={setFilesUploading}
              setFilesSuccess={setFilesSuccess}
            />
          </TabPanel>
          <TabPanel value="links">Item Two</TabPanel>
        </TabContext>
      </Paper>
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
