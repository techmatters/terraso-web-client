import React, { useCallback, useMemo, useState } from 'react';
import bbox from '@turf/bbox';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ExternalLink from 'common/components/ExternalLink';
import PageHeader from 'layout/PageHeader';
import DrawControls from 'gis/components/DrawControls';
import { useMap } from 'gis/components/MapboxMap';
import mapboxgl from 'gis/mapbox';
import { OPTION_BOUNDARY_CHOICES } from '.';
import BaseMap, { POLYGON_FILTER } from '../../LandscapeMap';
import Actions from '../Actions';

const Draw = props => {
  const { areaPolygon, setAreaPolygon, setEditHelp, setOpen } = props;
  const { map } = useMap();

  const onPolygonAdded = useCallback(
    (event, draw) => {
      const geoJson = draw.getAll();
      if (geoJson && !_.isEmpty(geoJson.features)) {
        setOpen(true);
      }
      const calculatedBbox = bbox(geoJson);
      const bounds = new mapboxgl.LngLatBounds(
        [calculatedBbox[0], calculatedBbox[1]],
        [calculatedBbox[2], calculatedBbox[3]]
      );
      setTimeout(() => {
        map.fitBounds(bounds);
      });
    },
    [setOpen, map]
  );

  const onDrawModeChange = useCallback(
    (event, draw) => {
      const mode = draw.getMode();
      const selected = draw.getSelected();
      const isNewPolygon = mode === 'draw_polygon';
      const isEdditing =
        _.includes(mode, ['direct_select', 'simple_select']) &&
        !_.isEmpty(selected.features);
      if (isNewPolygon || isEdditing) {
        setEditHelp(mode);
      } else {
        setEditHelp(null);
      }
    },
    [setEditHelp]
  );

  const drawOptions = useMemo(
    () => ({
      polygon: true,
      trash: true,
    }),
    []
  );

  const onlyPolygons = useMemo(
    () =>
      areaPolygon
        ? {
            ...areaPolygon,
            features: areaPolygon.features.filter(POLYGON_FILTER),
          }
        : null,
    [areaPolygon]
  );

  return (
    <DrawControls
      onChange={setAreaPolygon}
      onCreate={onPolygonAdded}
      onModeChange={onDrawModeChange}
      onSelectionChange={onDrawModeChange}
      drawOptions={drawOptions}
      geoJson={onlyPolygons}
    />
  );
};

const OptionDrawPolygon = props => {
  const { t } = useTranslation();
  const {
    landscape,
    isNew,
    boundingBox,
    onBoundsChange,
    setOption,
    saveLabel,
    onSave,
    areaPolygon,
    setAreaPolygon,
    setUpdatedLandscape,
  } = props;
  const [editHelp, setEditHelp] = useState(null);
  const [open, setOpen] = useState(false);

  const updatedValues = useMemo(
    () => ({ ...landscape, areaPolygon }),
    [landscape, areaPolygon]
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
        <BaseMap
          showGeocoder
          showPolygons
          boundingBox={boundingBox}
          onBoundsChange={onBoundsChange}
          areaPolygon={areaPolygon}
        >
          <Draw
            areaPolygon={areaPolygon}
            setAreaPolygon={setAreaPolygon}
            setEditHelp={setEditHelp}
            setOpen={setOpen}
            onBoundsChange={onBoundsChange}
          />
        </BaseMap>
        {editHelp && (
          <Alert severity="info">
            <Trans
              i18nKey="landscape.form_boundary_draw_polygon_edit_help"
              context={editHelp}
            >
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

export default OptionDrawPolygon;
