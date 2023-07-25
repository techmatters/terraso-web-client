import React, { useCallback, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Box, Paper, Typography } from '@mui/material';

import PageHeader from 'layout/PageHeader';
import DrawControls from 'gis/components/DrawControls';
import { MARKER_CONTROL_ICON } from 'gis/mapMarkers';

import { OPTION_BOUNDARY_CHOICES } from '.';
import BaseMap from '../../LandscapeMap';
import Actions from '../Actions';

const OptionAddPin = props => {
  const { t } = useTranslation();
  const {
    landscape,
    boundingBox,
    onBoundsChange,
    setOption,
    onSave,
    setUpdatedLandscape,
    areaPolygon,
    setAreaPolygon,
    isNew,
  } = props;

  const updatedValues = useMemo(
    () => ({ ...landscape, areaPolygon }),
    [landscape, areaPolygon]
  );

  const drawOptions = useMemo(
    () => ({
      point: true,
    }),
    []
  );

  const onCreateWrapper = useCallback(
    (event, draw) => {
      setAreaPolygon({
        type: 'FeatureCollection',
        features: [event.features[0]],
      });
      draw.deleteAll();
    },
    [setAreaPolygon]
  );

  return (
    <>
      <PageHeader header={t('landscape.form_boundary_pin_title')} />
      <Trans i18nKey="landscape.form_boundary_pin_description">
        <Typography>
          first
          <Box
            component="img"
            src={MARKER_CONTROL_ICON}
            aria-label={t('landscape.form_boundary_map_basemap_label')}
            sx={{ verticalAlign: 'middle' }}
          />
          third
        </Typography>
      </Trans>
      <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2 }}>
        <BaseMap
          showGeocoder
          showMarkers
          boundingBox={boundingBox}
          onBoundsChange={onBoundsChange}
          areaPolygon={areaPolygon}
        >
          <DrawControls onCreate={onCreateWrapper} drawOptions={drawOptions} />
        </BaseMap>
      </Paper>
      <Actions
        isNew={isNew}
        onCancel={() => setOption(OPTION_BOUNDARY_CHOICES)}
        onSave={onSave}
        updatedValues={updatedValues}
        onNext={setUpdatedLandscape}
      />
    </>
  );
};

export default OptionAddPin;
