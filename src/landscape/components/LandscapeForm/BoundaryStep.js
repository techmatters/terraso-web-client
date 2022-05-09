import React, { useCallback, useState } from 'react';

import * as turf from '@turf/helpers';
import { Trans, useTranslation } from 'react-i18next';

import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import PinDropIcon from '@mui/icons-material/PinDrop';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Button, Link, Paper, Stack, Typography } from '@mui/material';

import PageHeader from 'layout/PageHeader';

import LandscapeBoundaries from 'landscape/components/LandscapeBoundaries';
import LandscapeMap from 'landscape/components/LandscapeMap';

const OPTION_GEOJSON = 'geo-json';
const OPTION_MAP_PIN = 'map-pin';
const OPTION_SELECT_OPTIONS = 'options';

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
        <LandscapeBoundaries
          areaPolygon={areaPolygon || landscape?.areaPolygon}
          onFileSelected={onFileSelected}
        />
      </Paper>
      <Stack direction="row" justifyContent="space-between">
        <Button
          sx={{ marginTop: 2 }}
          onClick={() => setOption(OPTION_SELECT_OPTIONS)}
        >
          {t('landscape.form_boundary_options_back')}
        </Button>
        <Button variant="contained" sx={{ marginTop: 2 }} onClick={onSave}>
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
      </Paper>
      <Stack direction="row" justifyContent="space-between">
        <Button
          sx={{ marginTop: 2 }}
          onClick={() => setOption(OPTION_SELECT_OPTIONS)}
        >
          {t('landscape.form_boundary_options_back')}
        </Button>
        <Button variant="contained" sx={{ marginTop: 2 }} onClick={onSave}>
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
      label: 'landscape.form_boundary_options_geojson',
      onClick: () => setOption(OPTION_GEOJSON),
    },
    {
      Icon: PinDropIcon,
      label: 'landscape.form_boundary_options_pin',
      onClick: () => setOption(OPTION_MAP_PIN),
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
      <Trans i18nKey="landscape.form_boundary_options_description">
        Prefix
        <Link href={t('landscape.boundaries_help_geojson_url')} target="_blank">
          link
        </Link>
        .
      </Trans>
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

const getOptionComponent = option => {
  switch (option) {
    case OPTION_GEOJSON:
      return GeoJson;
    case OPTION_MAP_PIN:
      return MapPin;
    default:
      return BoundaryOptions;
  }
};

const BoundaryStep = props => {
  const [option, setOption] = useState(OPTION_SELECT_OPTIONS);

  const OptionComponent = getOptionComponent(option);

  return <OptionComponent setOption={setOption} {...props} />;
};

export default BoundaryStep;
