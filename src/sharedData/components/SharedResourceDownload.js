/*
 * Copyright © 2024 Technology Matters
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

import React, { useCallback, useEffect } from 'react';
import queryString from 'query-string';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils';
import { useSelector } from 'terrasoApi/store';
import { Button, Paper, Stack, Typography } from '@mui/material';

import NotFound from 'layout/NotFound';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useDownloadEvent } from 'monitoring/events';
import { generateReferrerPath } from 'navigation/navigationUtils';
import { fetchSharedResource } from 'sharedData/sharedDataSlice';

const SharedResourceDownload = props => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { shareUuid, ...params } = useParams();
  const { data: sharedResource, fetching: fetchingSharedResource } =
    useSelector(state => state.sharedData.sharedResource);
  const hasToken = useSelector(state => state.account.hasToken);

  const { entityType } = props;
  const ownerSlug =
    entityType === 'group' ? params.groupSlug : params.landscapeSlug;
  const { onDownload } = useDownloadEvent();

  useFetchData(
    useCallback(() => fetchSharedResource({ shareUuid }), [shareUuid])
  );

  useEffect(() => {
    if (fetchingSharedResource || sharedResource || hasToken) {
      return;
    }
    const referrer = generateReferrerPath(location);

    const to = referrer
      ? queryString.stringifyUrl({
          url: '/account',
          query: {
            referrer,
          },
        })
      : '/account';
    navigate(to);
  }, [fetchingSharedResource, location, sharedResource, hasToken, navigate]);

  const downloadFile = useCallback(() => {
    onDownload(entityType, ownerSlug, 'download page');
    window.open(sharedResource.downloadUrl, '_blank');
  }, [onDownload, entityType, ownerSlug, sharedResource]);

  if (fetchingSharedResource) {
    return <PageLoader />;
  }

  if (!sharedResource) {
    return <NotFound />;
  }

  return (
    <PageContainer maxWidth="sm">
      <Stack
        alignItems="center"
        component={Paper}
        variant="outlined"
        spacing={2}
        sx={{ p: 4, mt: 6 }}
      >
        <Typography variant="h1">{`${sharedResource.dataEntry?.name}.${sharedResource.dataEntry?.resourceType}`}</Typography>
        <Button variant="contained" onClick={downloadFile}>
          {t('sharedData.shared_resource_download_button')}
        </Button>
      </Stack>
    </PageContainer>
  );
};

export default SharedResourceDownload;
