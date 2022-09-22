import React from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';

import { Paper, Typography } from '@mui/material';

import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

import Visualization from '../Visualization';

const VisualizationPreview = props => {
  const { t } = useTranslation();
  const { title } = props;
  const visualizationContext = useVisualizationContext();

  return (
    <Paper
      component="section"
      aria-label={t('sharedData.form_visualization_preview_label')}
      sx={({ palette }) => ({
        border: `2px dashed ${palette.blue.dark}`,
        p: 2,
      })}
    >
      <Typography sx={{ mb: 2, fontWeight: 600 }}>
        {title ||
          _.get(
            'visualizationConfig.annotateConfig.mapTitle',
            visualizationContext
          )}
      </Typography>
      <Visualization {...props} />
    </Paper>
  );
};

export default VisualizationPreview;
