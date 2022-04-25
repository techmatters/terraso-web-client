import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Link, Paper, Stack, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PinDropIcon from '@mui/icons-material/PinDrop';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import * as turf from '@turf/helpers';

import PageHeader from 'layout/PageHeader';
import LandscapeBoundaries from 'landscape/components/LandscapeBoundaries';
import LandscapeMap from 'landscape/components/LandscapeMap';

const GeoJson = props => {
  const { t } = useTranslation();
  const { landscape, setOption, save } = props;
  const [areaPolygon, setAreaPolygon] = useState();
  const onFileSelected = areaPolygon => {
    setAreaPolygon(areaPolygon);
  };

  const onSave = () => {
    save({
      ...landscape,
      areaPolygon,
    });
  };

  return (
    <>
      <PageHeader
        typographyProps={{ id: 'landscape-form-page-title' }}
        header={t('landscape.form_boundary_geojson_title')}
      />
      <Paper variant="outlined" sx={{ padding: 2, marginTop: 2 }}>
        <Typography sx={{ marginBottom: 2 }}>
          {t('landscape.form_boundary_geojson_description')}
        </Typography>
        <LandscapeBoundaries
          areaPolygon={areaPolygon || landscape?.areaPolygon}
          onFileSelected={onFileSelected}
        />
      </Paper>
      <Stack direction="row" justifyContent="space-between">
        <Button sx={{ marginTop: 2 }} onClick={() => setOption(-1)}>
          {t('landscape.form_boundary_options_back')}
        </Button>
        <Button
          disabled={!areaPolygon}
          variant="contained"
          sx={{ marginTop: 2 }}
          onClick={onSave}
        >
          {t('landscape.form_save_label')}
        </Button>
      </Stack>
    </>
  );
};

const MapPin = props => {
  const { t } = useTranslation();
  const { landscape, setOption, save } = props;
  const [areaPolygon, setAreaPolygon] = useState();
  const onPinLocationChange = useCallback(
    ({ pinLocation: { lat, lng }, boundingBox }) => {
      if (!lat || !lng || !boundingBox) {
        return;
      }
      setAreaPolygon({
        type: 'FeatureCollection',
        bbox: boundingBox,
        features: [turf.point([lng, lat])],
      });
    },
    [setAreaPolygon]
  );

  const onSave = () => {
    save({
      ...landscape,
      areaPolygon,
    });
  };

  return (
    <>
      <PageHeader
        typographyProps={{ id: 'landscape-form-page-title' }}
        header={t('landscape.form_boundary_pin_title')}
      />
      <Typography>{t('landscape.form_boundary_pin_description')}</Typography>
      <Paper variant="outlined" sx={{ padding: 2, marginTop: 2 }}>
        <LandscapeMap enableSearch onPinLocationChange={onPinLocationChange} />
        <Link variant="body2">
          {t('landscape.form_boundary_pin_help_link')}
        </Link>
      </Paper>
      <Stack direction="row" justifyContent="space-between">
        <Button sx={{ marginTop: 2 }} onClick={() => setOption(-1)}>
          {t('landscape.form_boundary_options_back')}
        </Button>
        <Button
          disabled={!areaPolygon}
          variant="contained"
          sx={{ marginTop: 2 }}
          onClick={onSave}
        >
          {t('landscape.form_save_label')}
        </Button>
      </Stack>
    </>
  );
};

const BoundaryOptions = props => {
  const { t } = useTranslation();
  const { landscape, setOption, setActiveStepIndex, save } = props;

  const options = [
    {
      Icon: UploadFileIcon,
      label: 'landscape.form_boundary_options_geo_json',
      onClick: () => setOption(0),
    },
    {
      Icon: PinDropIcon,
      label: 'landscape.form_boundary_options_pin',
      onClick: () => setOption(1),
    },
    {
      Icon: ArrowRightAltIcon,
      label: 'landscape.form_boundary_options_skip',
      onClick: () => save(landscape),
    },
  ];
  return (
    <>
      <PageHeader
        typographyProps={{ id: 'landscape-form-page-title' }}
        header={t('landscape.form_boundary_options_title')}
      />
      <Typography>
        {t('landscape.form_boundary_options_description')}
      </Typography>
      <Typography variant="body2" sx={{ marginTop: 2, marginBottom: 4 }}>
        {t('landscape.form_boundary_options_suggestion')}
      </Typography>
      <Link variant="body2">{t('landscape.form_boundary_options_link')}</Link>
      <Stack sx={{ marginTop: 2 }} spacing={3}>
        {options.map((option, index) => (
          <Button
            key={index}
            fullWidth
            variant="outlined"
            onClick={option.onClick}
            sx={{
              justifyContent: 'start',
              padding: 4,
              borderColor: 'gray.mid',
            }}
          >
            <option.Icon
              sx={{ fontSize: '40px', marginRight: 2, color: 'gray.mid2' }}
            />
            {t(option.label)}
          </Button>
        ))}
      </Stack>
      <Button
        sx={{ marginTop: 2 }}
        onClick={() => setActiveStepIndex(current => current - 1)}
      >
        {t('landscape.form_boundary_options_back')}
      </Button>
    </>
  );
};

const BoundaryStep = props => {
  const [option, setOption] = useState(-1);

  switch (option) {
    case 0:
      return <GeoJson setOption={setOption} {...props} />;
    case 1:
      return <MapPin setOption={setOption} {...props} />;
    default:
      return <BoundaryOptions setOption={setOption} {...props} />;
  }
};

export default BoundaryStep;
