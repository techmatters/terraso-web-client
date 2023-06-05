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
import { countryNameForCode } from 'common/utils';
import PageHeader from 'layout/PageHeader';
import { getPlaceInfoByName } from 'gis/gisService';
import LandscapeBoundariesFile from 'landscape/components/LandscapeForm/BoundaryStepBoundariesFile';
import LandscapeMap from 'landscape/components/LandscapeMap';
import { useIsMounted } from 'custom-hooks';
import './BoundaryStep.css';
import { scrollToNavBar } from 'navigation/scrollTo';
import { LAYER_ESRI } from 'gis/components/Map';
import { MAP_DATA_ACCEPTED_TYPES_NAMES } from 'config';
import Actions from './Actions';

const OPTION_GEOJSON = 'geo-json';
const OPTION_MAP_DRAW_POLYGON = 'map-draw-polygon';
const OPTION_MAP_PIN = 'map-pin';
const OPTION_BOUNDARY_CHOICES = 'options';
const OPTION_SKIP_BOUNDARY = 'skip-boundary';

const POLYGON_FILTER = feature => _.get('geometry.type', feature) === 'Polygon';
const POINT_FILTER = feature => _.get('geometry.type', feature) === 'Point';

const GeoJson = props => {
  const { t } = useTranslation();
  const {
    mapCenter,
    landscape,
    setOption,
    onSave,
    areaPolygon,
    setAreaPolygon,
    setUpdatedLandscape,
    isNew,
  } = props;

  const updatedValues = useMemo(
    () => ({ ...landscape, areaPolygon }),
    [landscape, areaPolygon]
  );

  return (
    <>
      <PageHeader header={t('landscape.form_boundary_geojson_title')} />
      <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2 }}>
        <LandscapeBoundariesFile
          mapCenter={mapCenter}
          areaPolygon={areaPolygon || landscape?.areaPolygon}
          onFileSelected={setAreaPolygon}
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

const MapDrawPolygon = props => {
  const { t } = useTranslation();
  const {
    landscape,
    isNew,
    boundingBox,
    setOption,
    onSave,
    saveLabel,
    areaPolygon,
    setAreaPolygon,
    setUpdatedLandscape,
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

  const updatedValues = useMemo(
    () => ({ ...landscape, areaPolygon }),
    [landscape, areaPolygon]
  );

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
          <Trans
            i18nKey="landscape.form_boundary_draw_polygon_saved"
            context={isNew ? 'create' : 'update'}
          >
            prefix
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
        sx={{ p: 2, mt: 2, mb: 2 }}
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
          label={t('landscape.form_map_section_lanel')}
          defaultLayer={LAYER_ESRI}
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

const MapPin = props => {
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
          drawOptions={{ marker: true }}
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

const BoundaryOptions = props => {
  const { t } = useTranslation();
  const { landscape, setOption, onCancel, title, setUpdatedLandscape } = props;

  const onOptionClick = option => () => {
    option.onClick();
    scrollToNavBar();
  };

  const options = [
    {
      Icon: UploadFileIcon,
      label: (
        <Trans
          i18nKey="landscape.form_boundary_options_geojson"
          values={{ formats: MAP_DATA_ACCEPTED_TYPES_NAMES.join(', ') }}
        >
          prefix
          <Typography sx={{ ml: 1, fontSize: 'inherit' }}>Formats</Typography>
        </Trans>
      ),
      onClick: () => setOption(OPTION_GEOJSON),
    },
    {
      Icon: MapIcon,
      label: t('landscape.form_boundary_options_draw_polygon'),
      onClick: () => setOption(OPTION_MAP_DRAW_POLYGON),
    },
    {
      Icon: PinDropIcon,
      label: t('landscape.form_boundary_options_pin'),
      onClick: () => setOption(OPTION_MAP_PIN),
    },
    {
      Icon: ArrowRightAltIcon,
      label: t('landscape.form_boundary_options_skip'),
      onClick: () =>
        setUpdatedLandscape({
          ...landscape,
          boundaryOption: OPTION_SKIP_BOUNDARY,
        }),
    },
  ];

  return (
    <>
      <PageHeader
        typographyProps={{
          id: 'landscape-form-page-title',
          variant: 'h1',
          component: 'h2',
        }}
        header={title}
      />
      <Trans i18nKey="landscape.form_boundary_options_description">
        <Stack spacing={2} sx={{ mb: 4 }}>
          <Typography variant="body2">First</Typography>
          <Typography variant="body2">second</Typography>
          <ExternalLink
            linkProps={{ fontSize: 14 }}
            href={t('landscape.boundaries_help_geojson_url')}
          >
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
              fontWeight: 500,
              backgroundColor: 'white',
            }}
          >
            <option.Icon
              sx={{ fontSize: '40px', marginRight: 2, color: 'gray.mid2' }}
            />
            {option.label}
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
  const [boundingBox, setBoundingBox] = useState();
  const isMounted = useIsMounted();
  const { landscape, onSave, setUpdatedLandscape } = props;
  const [option, setOption] = useState(
    landscape.boundaryOption || OPTION_BOUNDARY_CHOICES
  );
  const OptionComponent = getOptionComponent(option);
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
  }, [landscape.location, isMounted]);

  useEffect(() => {
    setAreaPolygon(landscape.areaPolygon);
  }, [landscape.areaPolygon]);

  const onSaveWrapper = useCallback(
    updatedValues => {
      onSave({ boundaryOption: option, ...updatedValues });
    },
    [onSave, option]
  );

  const setUpdatedLandscapeWrapper = useCallback(
    updatedValues => {
      setUpdatedLandscape({ boundaryOption: option, ...updatedValues });
    },
    [setUpdatedLandscape, option]
  );

  return (
    <OptionComponent
      boundingBox={boundingBox}
      setOption={setOption}
      areaPolygon={areaPolygon}
      setAreaPolygon={setAreaPolygon}
      {...props}
      onSave={onSaveWrapper}
      setUpdatedLandscape={setUpdatedLandscapeWrapper}
    />
  );
};
export default BoundaryStep;
