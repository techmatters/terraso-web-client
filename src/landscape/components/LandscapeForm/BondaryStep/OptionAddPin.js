import React, { useMemo } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { Paper, Typography } from '@mui/material';
import PageHeader from 'layout/PageHeader';
import LandscapeMap from 'landscape/components/LandscapeMap';
import { OPTION_BOUNDARY_CHOICES } from '.';
import Actions from '../Actions';

const POINT_FILTER = feature => _.get('geometry.type', feature) === 'Point';

const OptionAddPin = props => {
  const { t } = useTranslation();
  const {
    landscape,
    boundingBox,
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

  return (
    <>
      <PageHeader header={t('landscape.form_boundary_pin_title')} />
      <Typography>{t('landscape.form_boundary_pin_description')}</Typography>
      <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2 }}>
        <LandscapeMap
          enableSearch
          enableDraw
          boundingBox={boundingBox}
          areaPolygon={areaPolygon || landscape.areaPolygon}
          onGeoJsonChange={setAreaPolygon}
          geoJsonFilter={POINT_FILTER}
          drawOptions={{ point: true }}
        />
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
