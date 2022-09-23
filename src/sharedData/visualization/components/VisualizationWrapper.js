import React, { useCallback, useEffect, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
  Alert,
  Button,
  CircularProgress,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import ConfirmButton from 'common/components/ConfirmButton';
import SocialShare from 'common/components/SocialShare';
import PageHeader from 'layout/PageHeader';
import { formatDate } from 'localization/utils';
import { useBreadcrumbsParams } from 'navigation/breadcrumbsContext';
import Restricted from 'permissions/components/Restricted';

import MapExport from 'gis/components/MapExport';
import { useGroupContext } from 'group/groupContext';
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
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const { downloadFile } = useSharedData();
  const { configId, onDeleted } = props;
  const { data, fetching, deleting } = useSelector(
    state => state.sharedData.visualizationConfig
  );
  const { group, owner } = useGroupContext();
  const [imagePrinter, setImagePrinter] = useState();

  useEffect(() => {
    dispatch(fetchVisualizationConfig(configId));
  }, [dispatch, configId]);

  const visualizationConfig = useMemo(
    () =>
      fetching
        ? {}
        : {
            ...data.configuration,
            selectedFile: data.dataEntry,
          },
    [data, fetching]
  );

  const mapTitle = useMemo(
    () => _.get('annotateConfig.mapTitle', visualizationConfig),
    [visualizationConfig]
  );

  useBreadcrumbsParams(
    useMemo(
      () => ({ mapTitle: visualizationConfig?.annotateConfig?.mapTitle }),
      [visualizationConfig?.annotateConfig?.mapTitle]
    )
  );

  const handleDownload = file => e => {
    e.preventDefault();
    downloadFile(file);
  };

  const handleDownloadPng = useCallback(() => {
    imagePrinter.printMap('CurrentSize', mapTitle);
  }, [imagePrinter, mapTitle]);

  const onDelete = () => {
    dispatch(deleteVisualizationConfig(data)).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        onDeleted();
      }
    });
  };

  return (
    <VisualizationContextProvider visualizationConfig={visualizationConfig}>
      <VisualizationContext.Consumer>
        {({ loadingFile, loadingFileError }) => (
          <>
            <PageHeader header={mapTitle} />
            <Restricted
              permission="visualization.delete"
              resource={{ group, visualizationConfig: data }}
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
              {!fetching && (
                <Stack alignItems="flex-end">
                  <Typography sx={{ fontWeight: 600 }}>
                    {t('sharedData.visualization_created_by', {
                      date: formatDate(i18n.resolvedLanguage, data.createdAt),
                      user: t('user.full_name', { user: data.createdBy }),
                    })}
                  </Typography>
                  <Trans
                    i18nKey="sharedData.visualization_source_data"
                    values={{ file: data.dataEntry }}
                  >
                    <Typography>
                      Source data:
                      <Link
                        href={data.dataEntry.url}
                        onClick={handleDownload(data.dataEntry)}
                      >
                        File
                      </Link>
                    </Typography>
                  </Trans>
                </Stack>
              )}
              {(loadingFile || fetching) && (
                <CircularProgress aria-label={t('common.loader_label')} />
              )}
              {loadingFileError && (
                <Alert severity="error">
                  {t('sharedData.visualization_file_load_error', {
                    name: data.dataEntry,
                  })}
                </Alert>
              )}
              {!(loadingFile || loadingFileError || fetching) && (
                <>
                  <Visualization>
                    <MapExport onImagePrinterChange={setImagePrinter} />
                  </Visualization>
                  <Trans
                    i18nKey="sharedData.visualization_share_description"
                    values={{ ownerName: owner.name }}
                  >
                    <Typography>First</Typography>
                    <Typography sx={{ mt: 1 }}>Second</Typography>
                  </Trans>
                  <Stack alignItems="flex-start" direction="row" spacing={2}>
                    <SocialShare name={mapTitle} />
                    <Button variant="outlined" onClick={handleDownloadPng}>
                      {t('sharedData.visualization_download_png')}
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          </>
        )}
      </VisualizationContext.Consumer>
    </VisualizationContextProvider>
  );
};

export default VisualizationWrapper;
