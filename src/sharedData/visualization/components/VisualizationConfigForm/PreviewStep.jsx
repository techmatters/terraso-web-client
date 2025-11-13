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

import { useCallback, useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Typography } from '@mui/material';

import { useCollaborationContext } from 'terraso-web-client/collaboration/collaborationContext';
import StepperStep from 'terraso-web-client/common/components/StepperStep';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import { useAnalytics } from 'terraso-web-client/monitoring/analytics';
import {
  ILM_OUTPUT_PROP,
  RESULTS_ANALYSIS_IMPACT,
} from 'terraso-web-client/monitoring/ilm';
import { addVisualizationConfig } from 'terraso-web-client/sharedData/sharedDataSlice';
import VisualizationPreview from 'terraso-web-client/sharedData/visualization/components/VisualizationConfigForm/VisualizationPreview';
import { useVisualizationContext } from 'terraso-web-client/sharedData/visualization/visualizationContext';

const PreviewStep = props => {
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { onBack, onSaved } = props;
  const dispatch = useDispatch();
  const { saving } = useSelector(
    state => state.sharedData.visualizationConfigForm
  );
  const visualizationContext = useVisualizationContext();
  const { visualizationConfig } = visualizationContext;
  const [viewportConfig, setViewportConfig] = useState(
    visualizationConfig.viewportConfig
  );
  const { owner, entityTypeLocalized, entityType } = useCollaborationContext();

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

  const onStyleChange = useCallback(
    style => {
      setViewportConfig(current => ({
        ...current,
        baseMapStyle: style,
      }));
    },
    [setViewportConfig]
  );

  const onPublish = useCallback(() => {
    const completeConfig = {
      ...visualizationConfig,
      viewportConfig,
    };
    const filteredConfig = _.omit(
      [
        'datasetConfig.preview',
        'annotateConfig.dataPointsTitle',
        'annotateConfig.mapTitle',
        'annotateConfig.mapDescription',
      ],
      completeConfig
    );
    dispatch(
      addVisualizationConfig({
        title: _.get('annotateConfig.mapTitle', completeConfig),
        description: _.get('annotateConfig.mapDescription', completeConfig),
        visualizationConfig: filteredConfig,
        selectedFile: visualizationConfig.selectedFile,
        ownerId: owner.id,
        ownerType: entityType,
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
        onSaved(data.payload);
      }
    });
  }, [
    dispatch,
    onSaved,
    owner.name,
    owner.id,
    entityType,
    trackEvent,
    viewportConfig,
    visualizationConfig,
  ]);

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
          {t('sharedData.form_step_preview_step_description')}
        </Typography>
        <VisualizationPreview
          useConfigBounds
          onBoundsChange={onBoundsChange}
          onStyleChange={onStyleChange}
        />
        <Typography sx={{ mt: 2 }}>
          {t('sharedData.form_step_preview_step_map_description', {
            entityType: entityTypeLocalized,
          })}
        </Typography>
      </StepperStep>
    </>
  );
};

export default PreviewStep;
