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

import ShareDataFiles from './ShareDataFiles';
import ShareDataLinks from './ShareDataLinks';
import { validateLink } from './utils';

const setState = setter => (field, newValue) =>
  setter(state => ({
    ...state,
    [field]: newValue(state[field]),
  }));

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

  const [filesState, setFilesState] = useState({});
  const [filesPending, setFilesPending] = useState([]);
  const [filesErrors, setFilesErrors] = useState([]);
  const [filesUploading, setFilesUploading] = useState(false);
  const [filesSuccess, setFilesSuccess] = useState(0);

  const [linksState, setLinksState] = useState({});
  const [linksPending, setLinksPending] = useState([]);
  const [linksErrors, setLinksErrors] = useState([]);
  const [linksUploading, setLinksUploading] = useState(false);
  const [linksSuccess, setLinksSuccess] = useState(0);

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
    const linksPromises = toUpload.links.map(link =>
      dispatch(addSharedDataLink({ groupSlug, link }))
    );
    const filesPromises = toUpload.files.map(file =>
      dispatch(uploadSharedDataFile({ groupSlug, file }))
    );

    const allPromises = [...filesPromises, ...linksPromises];
    Promise.allSettled(allPromises).then(results => {
      results
        .filter(result => result.status === 'fulfilled')
        .forEach(result => {
          // TODO send type of shared data
          trackEvent('uploadFile', { props: { owner: groupSlug } });
        });
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
            <ShareDataFiles
              filesState={filesState}
              setFilesState={useMemo(() => setState(setFilesState), [])}
              setFilesPending={setFilesPending}
              setFilesErrors={setFilesErrors}
              setFilesUploading={setFilesUploading}
              setFilesSuccess={setFilesSuccess}
            />
          </TabPanel>
          <TabPanel value="links">
            <ShareDataLinks
              linksState={linksState}
              setLinksState={useMemo(() => setState(setLinksState), [])}
              setLinksPending={setLinksPending}
              setLinksErrors={setLinksErrors}
              setLinksUploading={setLinksUploading}
              setLinksSuccess={setLinksSuccess}
            />
          </TabPanel>
        </TabContext>
      </Paper>
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
