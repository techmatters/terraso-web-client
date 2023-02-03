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
import React, { useCallback } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { Paper, Typography } from '@mui/material';

import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

import Visualization from '../Visualization';

const VisualizationPreview = props => {
  const { t } = useTranslation();
  const { title, customConfig } = props;
  const visualizationContext = useVisualizationContext();
  const { setVisualizationConfig } = visualizationContext;

  const onBaseMapChange = useCallback(
    layer => {
      setVisualizationConfig(current => ({
        ...current,
        viewportConfig: {
          ...(current.viewportConfig || {}),
          baseMapUrl: layer._url,
        },
      }));
    },
    [setVisualizationConfig]
  );

  return (
    <Paper
      component="section"
      aria-label={t('sharedData.form_visualization_preview_label')}
      sx={({ palette }) => ({
        border: `2px dashed ${palette.blue.dark}`,
        p: 2,
      })}
    >
      {title ? (
        <Typography sx={{ mb: 2, fontWeight: 600 }}>{title}</Typography>
      ) : (
        <Typography variant="h1" sx={{ mb: 2 }}>
          {_.getOr(
            _.get(
              'visualizationConfig.annotateConfig.mapTitle',
              visualizationContext
            ),
            'annotateConfig.mapTitle',
            customConfig
          )}
        </Typography>
      )}
      <Visualization onBaseMapChange={onBaseMapChange} {...props} />
    </Paper>
  );
};

export default VisualizationPreview;
