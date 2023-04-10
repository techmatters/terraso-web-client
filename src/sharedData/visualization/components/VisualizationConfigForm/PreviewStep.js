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
import { useDispatch, useSelector } from 'react-redux';

import { Typography } from '@mui/material';

import StepperStep from 'common/components/StepperStep';
import PageLoader from 'layout/PageLoader';
import { useAnalytics } from 'monitoring/analytics';
import { ILM_OUTPUT_PROP, RESULTS_ANALYSIS_IMPACT } from 'monitoring/ilm';

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
  const { owner, entityType, group } = useGroupContext();

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
      [
        'datasetConfig.preview',
        'annotateConfig.dataPointsTitle',
        'annotateConfig.mapTitle',
      ],
      completeConfig
    );
    dispatch(
      addVisualizationConfig({
        title: _.get('annotateConfig.mapTitle', completeConfig),
        visualizationConfig: filteredConfig,
        selectedFile,
        group,
      })
    ).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        trackEvent('map.create', {
          props: {
            owner: owner.name,
            file: visualizationConfig?.selectedFile.name,
            fileID: visualizationConfig?.selectedFile.id,
            [ILM_OUTPUT_PROP]: RESULTS_ANALYSIS_IMPACT,
          },
        });
        onSaved(data.payload.slug);
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
