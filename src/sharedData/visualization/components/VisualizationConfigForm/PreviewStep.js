import React, { useCallback, useEffect, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { Typography } from '@mui/material';

import StepperStep from 'common/components/StepperStep';
import PageLoader from 'layout/PageLoader';
import { useAnalytics } from 'monitoring/analytics';

import { useGroupContext } from 'group/groupContext';
import { addVisualizationConfig } from 'sharedData/sharedDataSlice';
import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

import VisualizationPreview from './VisualizationPreview';

const PreviewStep = props => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { onBack, onSaved } = props;
  const dispatch = useDispatch();
  const { saving } = useSelector(
    state => state.sharedData.visualizationConfigForm
  );
  const visualizationContext = useVisualizationContext();
  const { visualizationConfig, sheetContext: { selectedFile } = {} } =
    visualizationContext;
  const [viewportConfig, setViewportConfig] = useState(
    visualizationConfig.viewportConfig
  );
  const { entityType } = useGroupContext();

  useEffect(() => {
    setViewportConfig(visualizationConfig.viewportConfig);
  }, [visualizationConfig.viewportConfig]);

  const onBoundsChange = useCallback(bounds => {
    setViewportConfig(current => ({
      ...current,
      bounds: {
        northEast: bounds.getNorthEast(),
        southWest: bounds.getSouthWest(),
      },
    }));
  }, []);

  const onBaseMapChange = useCallback(layer => {
    setViewportConfig(current => ({
      ...current,
      baseMapUrl: layer._url,
    }));
  }, []);

  const onPublish = () => {
    const completeConfig = {
      ...visualizationConfig,
      viewportConfig,
    };
    const filteredConfig = _.omit(
      ['datasetConfig.preview', 'annotateConfig.dataPointsTitle'],
      completeConfig
    );
    dispatch(
      addVisualizationConfig({
        visualizationConfig: filteredConfig,
        selectedFile,
      })
    ).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        trackEvent('Map: Created', {
          props: {
            owner: owner.name,
            file: visualizationConfig?.selectedFile.name,
          },
        });
        onSaved(data.payload.id);
      }
    });
  };

  return (
    <>
      {saving && <PageLoader />}
      <StepperStep
        title={t('sharedData.form_step_preview_step_title')}
        backLabel={t('sharedData.form_back')}
        onBack={() => onBack(viewportConfig)}
        nextLabel={t('sharedData.form_step_preview_step_save')}
        onNext={onPublish}
      >
        <Typography sx={{ mb: 2 }}>
          {t('sharedData.form_step_preview_step_description', { entityType })}
        </Typography>
        <VisualizationPreview
          onBoundsChange={onBoundsChange}
          onBaseMapChange={onBaseMapChange}
        />
        <Typography sx={{ mt: 2 }}>
          {t('sharedData.form_step_preview_step_map_description', {
            entityType,
          })}
        </Typography>
      </StepperStep>
    </>
  );
};

export default PreviewStep;
