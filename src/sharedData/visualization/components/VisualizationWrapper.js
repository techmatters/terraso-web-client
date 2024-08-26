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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Link, Paper, Stack, Typography } from '@mui/material';

import { daysSince } from 'timeUtils';

import { useCollaborationContext } from 'collaboration/collaborationContext';
import ConfirmButton from 'common/components/ConfirmButton';
import SocialShare, {
  useSocialShareContext,
} from 'common/components/SocialShare';
import NotFound from 'layout/NotFound';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import { formatDate } from 'localization/utils';
import { useAnalytics } from 'monitoring/analytics';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import Restricted from 'permissions/components/Restricted';
import MapExport from 'gis/components/MapExport';
import { useSharedData } from 'sharedData/sharedDataHooks';
import {
  deleteVisualizationConfig,
  fetchVisualizationConfig,
} from 'sharedData/sharedDataSlice';
import {
  VisualizationContext,
  VisualizationContextProvider,
} from 'sharedData/visualization/visualizationContext';

import Visualization from './Visualization';

const VisualizationWrapper = props => {
  const { trackEvent } = useAnalytics();
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const { downloadFile } = useSharedData();
  const { configSlug, readableId, onDeleted } = props;
  const { data, fetching, deleting } = useSelector(
    state => state.sharedData.visualizationConfig
  );
  const { owner, entityType } = useCollaborationContext();
  const [imagePrinter, setImagePrinter] = useState();

  useEffect(() => {
    dispatch(
      fetchVisualizationConfig({
        ownerSlug: owner.slug,
        ownerType: entityType,
        configSlug,
        readableId,
      })
    );
  }, [dispatch, owner.slug, entityType, configSlug, readableId]);

  const visualizationConfig = useMemo(
    () =>
      fetching || !data
        ? {}
        : {
            ...data.configuration,
            selectedFile: data.dataEntry,
            tilesetId: data.mapboxTilesetId,
          },
    [data, fetching]
  );

  const mapTitle = useMemo(() => _.get('title', data), [data]);

  useBreadcrumbsParams(useMemo(() => ({ mapTitle }), [mapTitle]));

  useSocialShareContext(
    useMemo(
      () => ({
        name: mapTitle,
      }),
      [mapTitle]
    )
  );

  const handleDownload = file => e => {
    e.preventDefault();
    downloadFile(file);
  };

  const handleDownloadPng = useCallback(() => {
    imagePrinter(mapTitle);
    trackEvent('map.png.download', {
      props: {
        owner: owner.name,
        fileID: visualizationConfig?.selectedFile.id,
      },
    });
  }, [
    imagePrinter,
    mapTitle,
    owner,
    trackEvent,
    visualizationConfig?.selectedFile,
  ]);

  const onDelete = useCallback(() => {
    dispatch(deleteVisualizationConfig(data)).then(response => {
      const success = _.get('meta.requestStatus', response) === 'fulfilled';
      if (success) {
        onDeleted();
        trackEvent('dataMap.delete', {
          props: {
            [entityType]: owner.slug,
            durationDays: daysSince(data.createdAt),
          },
        });
      }
    });
  }, [dispatch, data, onDeleted, owner, trackEvent, entityType]);

  if (!data && !fetching) {
    return <NotFound />;
  }

  return (
    <PageContainer>
      <VisualizationContextProvider visualizationConfig={visualizationConfig}>
        <VisualizationContext.Consumer>
          {({ loadingFile, loadingFileError }) => (
            <>
              <PageHeader
                header={mapTitle}
                typographyProps={{ sx: { mb: 3 } }}
              />
              <Restricted
                permission="visualization.delete"
                resource={{ owner, visualizationConfig: data }}
              >
                <ConfirmButton
                  onConfirm={onDelete}
                  confirmTitle={t(
                    'sharedData.visualization_delete_confirm_title',
                    {
                      visualization: data,
                    }
                  )}
                  confirmMessage={t(
                    'sharedData.visualization_delete_confirm_message',
                    {
                      visualization: data,
                    }
                  )}
                  confirmButton={t('sharedData.visualization_confirm_delete')}
                  buttonLabel={t('sharedData.visualization_delete')}
                  buttonProps={{ sx: { mb: 2 } }}
                  loading={deleting}
                />
              </Restricted>
              <Stack
                component={Paper}
                variant="outlined"
                sx={{ p: 2 }}
                spacing={2}
              >
                {loadingFileError && (
                  <Alert severity="error">
                    {t('sharedData.visualization_file_load_error', {
                      name: data.dataEntry.name,
                    })}
                  </Alert>
                )}
                {!(loadingFileError || fetching) && (
                  <Visualization useConfigBounds>
                    <MapExport onImagePrinterChange={setImagePrinter} />
                  </Visualization>
                )}
                {!fetching && (
                  <>
                    <Typography sx={{ mt: 2 }}>{data?.description}</Typography>
                    <Trans
                      i18nKey="sharedData.visualization_source_data"
                      values={{
                        date: formatDate(i18n.resolvedLanguage, data.createdAt),
                        user: t('user.full_name', { user: data.createdBy }),
                        file: data.dataEntry,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        Source data:
                        <Link
                          href={data.dataEntry.url}
                          onClick={handleDownload(data.dataEntry)}
                        >
                          File
                        </Link>
                      </Typography>
                    </Trans>
                  </>
                )}
              </Stack>
              {!(loadingFile || loadingFileError || fetching) && (
                <>
                  <Typography sx={{ mt: 2 }}>
                    {t('sharedData.visualization_share_description', {
                      ownerName: owner.name,
                    })}
                  </Typography>
                  <Stack
                    alignItems="flex-start"
                    direction="row"
                    spacing={2}
                    sx={{ mt: 2 }}
                  >
                    <SocialShare />
                    <Button variant="outlined" onClick={handleDownloadPng}>
                      {t('sharedData.visualization_download_png')}
                    </Button>
                  </Stack>
                </>
              )}
            </>
          )}
        </VisualizationContext.Consumer>
      </VisualizationContextProvider>
    </PageContainer>
  );
};

export default VisualizationWrapper;
