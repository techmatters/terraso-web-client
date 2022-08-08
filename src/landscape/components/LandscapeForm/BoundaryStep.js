import React, { useCallback, useEffect, useMemo, useState } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';

import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import PinDropIcon from '@mui/icons-material/PinDrop';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import { countryNameForCode, scrollToNavBar } from 'common/utils';
import PageHeader from 'layout/PageHeader';

import { getPlaceInfoByName } from 'gis/gisService';
import LandscapeGeoJsonBoundaries from 'landscape/components/LandscapeGeoJsonBoundaries';
import LandscapeMap from 'landscape/components/LandscapeMap';

import { useIsMounted } from 'custom-hooks';

import './BoundaryStep.css';

const OPTION_GEOJSON = 'geo-json';
const OPTION_MAP_DRAW_POLYGON = 'map-draw-polygon';
const OPTION_MAP_PIN = 'map-pin';
const OPTION_SELECT_OPTIONS = 'options';

const POLYGON_FILTER = feature => _.get('geometry.type', feature) === 'Polygon';
const POINT_FILTER = feature => _.get('geometry.type', feature) === 'Point';

const GeoJson = props => {
  const { t } = useTranslation();
  const {
    mapCenter,
    landscape,
    setOption,
    save,
    saveLabel,
    areaPolygon,
    setAreaPolygon,
  } = props;

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
        <LandscapeGeoJsonBoundaries
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
          {saveLabel}
        </Button>
      </Stack>
    </>
  );
};

const MapDrawPolygon = props => {
  const { t } = useTranslation();
  const {
    landscape,
    boundingBox,
    setOption,
    save,
    saveLabel,
    areaPolygon,
    setAreaPolygon,
  } = props;
  const [editHelp, setEditHelp] = useState(false);
  const [open, setOpen] = useState(false);

  const onPolygonChange = useCallback(() => {
    setOpen(true);
  }, [setOpen]);
  const onEditStart = useCallback(() => {
    setEditHelp(true);
  }, [setEditHelp]);
  const onEditStop = useCallback(() => {
    setEditHelp(false);
  }, [setEditHelp]);

  const onSave = () => {
    save({
      ...landscape,
      areaPolygon,
    });
  };

  const drawOptions = useMemo(
    () => ({
      polygon: true,
      zoomToFeatures: true,
      onEditStart,
      onEditStop,
      onLayerChange: onPolygonChange,
    }),
    [onEditStart, onEditStop, onPolygonChange]
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'transparent',
          },
          '& .MuiPaper-root': {
            backgroundColor: '#055989',
          },
          '& .MuiDialogContent-root': {
            color: '#ffffff',
          },
        }}
      >
        <IconButton
          aria-label="close"
          onClick={() => setOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ pr: 7 }}>
          <Trans i18nKey="landscape.form_boundary_draw_polygon_updated">
            {{ saveLabel }}
            <span
              role="img"
              aria-label={t('gis.map_draw.edit.toolbar.buttons.edit')}
              className="landascape-boundary-step-map-icon landascape-boundary-step-draw-icon landascape-boundary-step-draw-edit-icon"
            />
          </Trans>
        </DialogContent>
      </Dialog>
      <PageHeader
        header={t('landscape.form_boundary_draw_polygon_title', {
          name: landscape.name,
        })}
      />
      <Paper
        component={Stack}
        spacing={2}
        variant="outlined"
        sx={{ padding: 2, marginTop: 2 }}
      >
        <Trans i18nKey="landscape.form_boundary_draw_polygon_description">
          <Typography>
            first
            <span
              role="img"
              aria-label={t('landscape.form_boundary_map_basemap_label')}
              className="landascape-boundary-step-map-icon landascape-boundary-step-draw-basemap-icon"
            />
            third
            <span
              role="img"
              aria-label={t('gis.map_draw.draw.toolbar.buttons.polygon')}
              className="landascape-boundary-step-map-icon landascape-boundary-step-draw-icon landascape-boundary-step-draw-polygon-icon"
            />
          </Typography>
        </Trans>
        <LandscapeMap
          enableSearch
          enableDraw
          boundingBox={boundingBox}
          areaPolygon={areaPolygon}
          onGeoJsonChange={setAreaPolygon}
          geoJsonFilter={POLYGON_FILTER}
          drawOptions={drawOptions}
        />
        {editHelp && (
          <Alert severity="info">
            <Trans i18nKey="landscape.form_boundary_draw_polygon_edit_help">
              {{ saveLabel }}
            </Trans>
          </Alert>
        )}
        <ExternalLink href={t('landscape.form_boundary_draw_polygon_help_url')}>
          {t('landscape.form_boundary_draw_polygon_help')}
        </ExternalLink>
      </Paper>
      <Stack direction="row" justifyContent="space-between">
        <Button
          sx={{ marginTop: 2 }}
          onClick={() => setOption(OPTION_SELECT_OPTIONS)}
        >
          {t('landscape.form_boundary_options_back')}
        </Button>
        <Button variant="contained" sx={{ marginTop: 2 }} onClick={onSave}>
          {saveLabel}
        </Button>
      </Stack>
    </>
  );
};

const MapPin = props => {
  const { t } = useTranslation();
  const {
    landscape,
    boundingBox,
    setOption,
    save,
    saveLabel,
    areaPolygon,
    setAreaPolygon,
  } = props;

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
          geoJsonFilter={POINT_FILTER}
          drawOptions={{ marker: true }}
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
          {saveLabel}
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
      Icon: MapIcon,
      label: 'landscape.form_boundary_options_draw_polygon',
      onClick: () => setOption(OPTION_MAP_DRAW_POLYGON),
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
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Typography>First</Typography>
          <Typography variant="body2">second</Typography>
          <ExternalLink href={t('landscape.boundaries_help_geojson_url')}>
            link
          </ExternalLink>
        </Stack>
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
    case OPTION_MAP_DRAW_POLYGON:
      return MapDrawPolygon;
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
  const [areaPolygon, setAreaPolygon] = useState(landscape.areaPolygon);

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
      areaPolygon={areaPolygon}
      setAreaPolygon={setAreaPolygon}
      {...props}
    />
  );
};
export default BoundaryStep;
