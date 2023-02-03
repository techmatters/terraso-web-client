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
import React, { useEffect, useState } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';

import TriangleIcon from '@mui/icons-material/ChangeHistoryTwoTone';
import CircleIcon from '@mui/icons-material/CircleTwoTone';
import HexagonIcon from '@mui/icons-material/HexagonTwoTone';
import SquareIcon from '@mui/icons-material/SquareTwoTone';
import {
  Grid,
  OutlinedInput,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import StepperStep from 'common/components/StepperStep';

import { useVisualizationContext } from 'sharedData/visualization/visualizationContext';

import VisualizationPreview from './VisualizationPreview';

const visualizeIcons = {
  circle: CircleIcon,
  square: SquareIcon,
  hexagon: HexagonIcon,
  triangle: TriangleIcon,
};

const Shape = props => {
  const { t } = useTranslation();
  const { shape, setShape } = props;
  return (
    <>
      <Grid item xs={3} component={Typography} id="shape-label">
        {t('sharedData.form_step_visualize_shape')}:
      </Grid>

      <Grid
        item
        xs={9}
        component={ToggleButtonGroup}
        value={shape}
        exclusive
        onChange={(event, newShape) => setShape(newShape)}
        aria-labelledby="shape-label"
      >
        {_.toPairs(visualizeIcons).map(([key, IconComponent]) => (
          <ToggleButton
            key={key}
            value={key}
            aria-label={t(`sharedData.form_step_visualize_shape_${key}`)}
          >
            <IconComponent />
          </ToggleButton>
        ))}
      </Grid>
    </>
  );
};

const Size = props => {
  const { t } = useTranslation();
  const { size, setSize } = props;
  const [value, setValue] = useState(size);
  const [debouncedValue] = useDebounce(value, 100);

  useEffect(() => {
    setSize(debouncedValue);
  }, [debouncedValue, setSize]);

  return (
    <>
      <Grid item xs={3} component={Typography} id="size-label">
        {t('sharedData.form_step_visualize_size')}:
      </Grid>
      <Grid item xs={5}>
        <Slider
          aria-hidden="true"
          value={value}
          onChange={(event, newValue) => setValue(newValue)}
          step={1}
          min={5}
          max={30}
        />
      </Grid>
      <Grid item xs={2}>
        <OutlinedInput
          value={size}
          size="small"
          onChange={event => setSize(event.target.value)}
          inputProps={{
            step: 1,
            min: 5,
            max: 30,
            type: 'number',
            'aria-labelledby': 'size-label',
          }}
          sx={{ width: '100%' }}
        />
      </Grid>
      <Grid item xs={1} component={Typography} variant="caption">
        px
      </Grid>
    </>
  );
};

const Color = props => {
  const { t } = useTranslation();
  const { color, setColor } = props;
  const [value, setValue] = useState(color);
  const [debouncedValue] = useDebounce(value, 100);

  useEffect(() => {
    setColor(debouncedValue);
  }, [debouncedValue, setColor]);

  return (
    <>
      <Grid item xs={3} component={Typography} id="color-label">
        {t('sharedData.form_step_visualize_color')}:
      </Grid>
      <Grid item xs={8}>
        <OutlinedInput
          value={value}
          size="small"
          onChange={event => setValue(event.target.value)}
          inputProps={{
            step: 1,
            min: 5,
            max: 30,
            type: 'color',
            'aria-labelledby': 'color-label',
          }}
          sx={{ width: '75px', height: '50px' }}
        />
      </Grid>
    </>
  );
};

const VisualizeStep = props => {
  const { t } = useTranslation();
  const { onNext, onBack } = props;
  const { visualizationConfig } = useVisualizationContext();
  const [visualizeConfig, setVisualizeConfig] = useState(
    visualizationConfig.visualizeConfig
  );
  const [shape, setShape] = useState(visualizationConfig.visualizeConfig.shape);
  const [size, setSize] = useState(visualizationConfig.visualizeConfig.size);
  const [color, setColor] = useState(visualizationConfig.visualizeConfig.color);

  useEffect(() => {
    setVisualizeConfig(visualizationConfig.visualizeConfig);
  }, [visualizationConfig.visualizeConfig]);

  useEffect(() => {
    setVisualizeConfig({
      shape,
      size,
      color,
    });
  }, [shape, size, color]);

  return (
    <StepperStep
      title={t('sharedData.form_step_visualize_step_title')}
      backLabel={t('sharedData.form_back')}
      onBack={() => onBack(visualizeConfig)}
      nextLabel={t('sharedData.form_next')}
      onNext={() => onNext(visualizeConfig)}
    >
      <Typography sx={{ mb: 4 }} id="visualize-settings-label">
        {t('sharedData.form_step_visualize_step_description')}
      </Typography>
      <Grid container spacing={2}>
        <Grid
          item
          component="section"
          aria-labelledby="visualize-settings-label"
          xs={12}
          md={6}
        >
          <Grid container alignItems="center" spacing={2}>
            <Shape shape={shape} setShape={setShape} />
            <Size size={size} setSize={setSize} />
            <Color color={color} setColor={setColor} />
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <VisualizationPreview
            title={t('sharedData.form_visualization_preview_title')}
            customConfig={{ visualizeConfig }}
          />
        </Grid>
      </Grid>
    </StepperStep>
  );
};

export default VisualizeStep;
