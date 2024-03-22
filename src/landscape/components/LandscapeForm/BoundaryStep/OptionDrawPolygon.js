/*
 * Copyright © 2023 Technology Matters
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
import React, { useCallback, useMemo, useState } from 'react';
import bbox from '@turf/bbox';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';

import ExternalLink from 'common/components/ExternalLink';
import PageHeader from 'layout/PageHeader';
import DrawControls from 'gis/components/DrawControls';
import { useMap } from 'gis/components/Map';
import mapboxgl from 'gis/mapbox';

import { OPTION_BOUNDARY_CHOICES } from '.';
import BaseMap, { POLYGON_FILTER } from '../../LandscapeMap';
import Actions from '../Actions';

import drawPolygonIcon from 'assets/gis/draw-polygon.svg';
import setBasemapIcon from 'assets/gis/set-basemap.svg';

const Draw = props => {
  const { areaPolygon, setAreaPolygon, setEditHelp } = props;
  const { map } = useMap();

  const onPolygonAdded = useCallback(
    (event, draw) => {
      const geoJson = draw.getAll();
      const calculatedBbox = bbox(geoJson);
      const bounds = new mapboxgl.LngLatBounds(
        [calculatedBbox[0], calculatedBbox[1]],
        [calculatedBbox[2], calculatedBbox[3]]
      );
      setTimeout(() => {
        map.fitBounds(bounds, { padding: 50, animate: false });
      });
    },
    [map]
  );

  const onDrawModeChange = useCallback(
    (event, draw) => {
      const mode = draw.getMode();
      const selected = draw.getSelected();
      const isNewPolygon = mode === 'draw_polygon';
      const isEditing =
        _.includes(mode, ['direct_select', 'simple_select']) &&
        !_.isEmpty(selected.features);
      if (isNewPolygon || isEditing) {
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

  const updatedValues = useMemo(
    () => ({ ...landscape, areaPolygon }),
    [landscape, areaPolygon]
  );

  return (
    <>
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
            <Box
              component="img"
              src={setBasemapIcon}
              title={t('gis.basemap_label')}
              sx={{ verticalAlign: 'middle' }}
            />
            third
            <Box
              component="img"
              src={drawPolygonIcon}
              title={t('gis.map_draw.draw.toolbar.buttons.polygon')}
              sx={{ verticalAlign: 'middle' }}
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
