import React, { useEffect, useState } from 'react';

import { Trans, useTranslation } from 'react-i18next';

import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import PinDropIcon from '@mui/icons-material/PinDrop';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Button, Link, Paper, Stack, Typography } from '@mui/material';

import { countryNameForCode, scrollToNavBar } from 'common/utils';
import PageHeader from 'layout/PageHeader';

import { getPlaceInfoByName } from 'gis/gisService';
import LandscapeBoundaries from 'landscape/components/LandscapeBoundaries';
import LandscapeMap from 'landscape/components/LandscapeMap';

import { useIsMounted } from 'custom-hooks';

const OPTION_GEOJSON = 'geo-json';
const OPTION_MAP_PIN = 'map-pin';
const OPTION_SELECT_OPTIONS = 'options';

const GeoJson = props => {
  const { t } = useTranslation();
  const { mapCenter, landscape, setOption, save } = props;
  const [areaPolygon, setAreaPolygon] = useState();

  const onSave = () => {
    save({
      ...landscape,
      areaPolygon,
    });
  };

  return (
    <>
      <PageHeader header={t('landscape.form_boundary_geojson_title')} />
      <Paper variant="outlined" sx={{ padding: 2, marginTop: 2 }}>
        <LandscapeBoundaries
          mapCenter={mapCenter}
          areaPolygon={areaPolygon || landscape?.areaPolygon}
          onFileSelected={setAreaPolygon}
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
          {t('landscape.form_add_label')}
        </Button>
      </Stack>
    </>
  );
};

const MapPin = props => {
  const { t } = useTranslation();
  const { landscape, boundingBox, setOption, save } = props;
  const [areaPolygon, setAreaPolygon] = useState();

  const onSave = () => {
    save({
      ...landscape,
      areaPolygon,
    });
  };

  return (
    <>
      <PageHeader header={t('landscape.form_boundary_pin_title')} />
      <Typography>{t('landscape.form_boundary_pin_description')}</Typography>
      <Paper variant="outlined" sx={{ padding: 2, marginTop: 2 }}>
        <LandscapeMap
          enableSearch
          enableDraw
          boundingBox={boundingBox}
          areaPolygon={areaPolygon || landscape.areaPolygon}
          onGeoJsonChange={setAreaPolygon}
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
          {t('landscape.form_add_label')}
        </Button>
      </Stack>
    </>
  );
};

const BoundaryOptions = props => {
  const { t } = useTranslation();
  const { landscape, setOption, save, onCancel, title } = props;

  const onOptionClick = option => () => {
    option.onClick();
    scrollToNavBar();
  };

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
      <PageHeader header={title} />
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
            onClick={onOptionClick(option)}
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
      {onCancel && (
        <Button sx={{ marginTop: 2 }} onClick={onCancel}>
          {t('landscape.form_boundary_options_back')}
        </Button>
      )}
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
  const [boundingBox, setBoundingBox] = useState();
  const isMounted = useIsMounted();
  const OptionComponent = getOptionComponent(option);
  const { landscape } = props;

  useEffect(() => {
    if (landscape.location) {
      const currentCountry = countryNameForCode(landscape.location);

      if (!currentCountry) {
        return;
      }

      // Whenever the location (country) changes, fetch the lat/lng for the
      // country and center the map on that country.
      getPlaceInfoByName(currentCountry.name).then(data => {
        if (isMounted.current) {
          setBoundingBox(data.boundingbox);
        }
      });
    }
  }, [landscape, isMounted]);

  return (
    <OptionComponent
      boundingBox={boundingBox}
      setOption={setOption}
      {...props}
    />
  );
};
export default BoundaryStep;
