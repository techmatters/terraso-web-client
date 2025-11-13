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

import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import MapIcon from '@mui/icons-material/Map';
import PinDropIcon from '@mui/icons-material/PinDrop';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Button, Stack, Typography } from '@mui/material';

import { useIsMounted } from 'custom-hooks';

import ExternalLink from 'common/components/ExternalLink';
import { countryNameForCode } from 'common/countries';
import PageHeader from 'layout/PageHeader';
import { scrollToNavBar } from 'navigation/scrollTo';
import { getPlaceInfoByName } from 'gis/gisService';
import OptionBoundariesFile from 'landscape/components/LandscapeForm/BoundaryStep/OptionBoundariesFile';

import OptionAddPin from './OptionAddPin';
import OptionDrawPolygon from './OptionDrawPolygon';

import { MAP_DATA_ACCEPTED_TYPES_NAMES } from 'config';

const OPTION_GEOJSON = 'geo-json';
const OPTION_MAP_DRAW_POLYGON = 'map-draw-polygon';
const OPTION_MAP_PIN = 'map-pin';
export const OPTION_BOUNDARY_CHOICES = 'options';
const OPTION_SKIP_BOUNDARY = 'skip-boundary';

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
      return OptionBoundariesFile;
    case OPTION_MAP_DRAW_POLYGON:
      return OptionDrawPolygon;
    case OPTION_MAP_PIN:
      return OptionAddPin;
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
      getPlaceInfoByName(currentCountry.name)
        .then(data => {
          if (isMounted.current) {
            setBoundingBox(data.boundingbox);
          }
        })
        .catch(() => {
          // If we can't get the bounding box, just ignore it.
        });
    }
  }, [landscape.location, isMounted]);

  useEffect(() => {
    setAreaPolygon(landscape.areaPolygon);
  }, [landscape.areaPolygon]);

  const getAreaPolygon = useCallback(
    updatedValues => {
      const hasFeatures = !_.isEmpty(updatedValues.areaPolygon?.features);
      if (!hasFeatures) {
        return null;
      }
      if (!boundingBox) {
        return updatedValues.areaPolygon;
      }
      return {
        ...updatedValues.areaPolygon,
        bbox: boundingBox,
      };
    },
    [boundingBox]
  );

  const onSaveWrapper = useCallback(
    updatedValues => {
      onSave({
        boundaryOption: option,
        ...updatedValues,
        areaPolygon: getAreaPolygon(updatedValues),
      });
    },
    [onSave, option, getAreaPolygon]
  );

  const setUpdatedLandscapeWrapper = useCallback(
    updatedValues => {
      setUpdatedLandscape({
        boundaryOption: option,
        ...updatedValues,
        areaPolygon: getAreaPolygon(updatedValues),
      });
    },
    [setUpdatedLandscape, option, getAreaPolygon]
  );

  const onBoundsChange = useCallback(
    bounds => {
      const newBounds = [
        bounds.getSouthWest().lng,
        bounds.getSouthWest().lat,
        bounds.getNorthEast().lng,
        bounds.getNorthEast().lat,
      ];
      setBoundingBox(newBounds);
    },
    [setBoundingBox]
  );

  return (
    <OptionComponent
      boundingBox={boundingBox}
      setOption={setOption}
      areaPolygon={areaPolygon}
      setAreaPolygon={setAreaPolygon}
      onBoundsChange={onBoundsChange}
      {...props}
      onSave={onSaveWrapper}
      setUpdatedLandscape={setUpdatedLandscapeWrapper}
    />
  );
};
export default BoundaryStep;
