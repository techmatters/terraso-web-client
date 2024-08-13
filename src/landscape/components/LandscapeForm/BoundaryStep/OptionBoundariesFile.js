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
import bbox from '@turf/bbox';
import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Paper } from '@mui/material';

import BaseDropZone from 'common/components/DropZone';
import ExternalLink from 'common/components/ExternalLink';
import InlineHelp from 'common/components/InlineHelp';
import PageHeader from 'layout/PageHeader';
import { useMap } from 'gis/components/Map';
import { parseFileToGeoJSON } from 'gis/gisSlice';
import mapboxgl from 'gis/mapbox';

import { OPTION_BOUNDARY_CHOICES } from '.';
import BaseMap from '../../LandscapeMap';
import Actions from '../Actions';

import {
  GEOJSON_MAX_SIZE,
  MAP_DATA_ACCEPTED_EXTENSIONS,
  MAP_DATA_ACCEPTED_TYPES,
} from 'config';

const DropZone = props => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { onFileSelected } = props;
  const [currentFile, setCurrentFile] = useState();
  const [dropError, setDropError] = useState();
  const {
    processing: processingFile,
    fileName: processingFileName,
    error: processingError,
    geojson,
  } = useSelector(_.get('gis.parsing'));

  useEffect(() => {
    if (geojson) {
      onFileSelected({ geojson, selectedFile: currentFile });
    }
  }, [geojson, onFileSelected, currentFile]);

  const onDrop = useCallback(
    acceptedFiles => {
      if (_.isEmpty(acceptedFiles)) {
        setDropError(t('landscape.boundaries_file_no_accepted'));
        return;
      }
      setDropError(null);

      const selectedFile = acceptedFiles[0];

      dispatch(parseFileToGeoJSON(selectedFile)).then(data => {
        const success = _.get('meta.requestStatus', data) === 'fulfilled';
        if (success) {
          setCurrentFile(selectedFile);
        } else {
          console.error(data.payload);
        }
      });
    },
    [t, dispatch]
  );

  const errors = useMemo(
    () =>
      _.compact(
        _.concat(
          dropError,
          processingError?.map(error =>
            t(error.content, {
              ...error.params,
              name: processingFileName,
            })
          )
        )
      ),
    [dropError, processingError, processingFileName, t]
  );

  return (
    <BaseDropZone
      errors={errors}
      currentFile={currentFile}
      onDrop={onDrop}
      maxSize={GEOJSON_MAX_SIZE}
      fileTypes={MAP_DATA_ACCEPTED_TYPES}
      fileExtensions={MAP_DATA_ACCEPTED_EXTENSIONS}
      loading={processingFile}
    />
  );
};

const FitBounds = props => {
  const { areaPolygon } = props;
  const { map } = useMap();

  useEffect(() => {
    if (areaPolygon) {
      const calculatedBbox = bbox(areaPolygon);
      const bounds = new mapboxgl.LngLatBounds(
        [calculatedBbox[0], calculatedBbox[1]],
        [calculatedBbox[2], calculatedBbox[3]]
      );
      map.fitBounds(bounds, { padding: 50, animate: false });
    }
  }, [areaPolygon, map]);
};

const OptionBoundariesFile = props => {
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
    onBoundsChange,
  } = props;
  const [selectedFile, setSelectedFile] = useState();

  const onFileSelectedWrapper = useCallback(
    ({ geojson, selectedFile }) => {
      setSelectedFile(selectedFile);
      setAreaPolygon(geojson);
    },
    [setAreaPolygon]
  );

  const updatedValues = useMemo(
    () => ({ ...landscape, areaPolygon }),
    [landscape, areaPolygon]
  );

  return (
    <>
      <PageHeader header={t('landscape.form_boundary_geojson_title')} />
      <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2 }}>
        <BaseMap
          showPolygons
          showMarkers
          center={mapCenter}
          areaPolygon={areaPolygon || landscape?.areaPolygon}
          onBoundsChange={onBoundsChange}
        >
          {selectedFile && <FitBounds areaPolygon={areaPolygon} />}
        </BaseMap>
        {selectedFile && (
          <Alert
            severity="info"
            aria-live="assertive"
            aria-atomic="true"
            className="sr-only"
          >
            {t('landscape.boundaries_file_selected', {
              name: selectedFile.name,
            })}
          </Alert>
        )}
        <DropZone onFileSelected={onFileSelectedWrapper} />
        <InlineHelp
          items={[
            {
              title: t('landscape.boundaries_help_geojson'),
              details: (
                <Trans i18nKey="landscape.boundaries_help_geojson_detail">
                  Prefix
                  <ExternalLink
                    href={t('landscape.boundaries_help_geojson_url')}
                  >
                    link
                  </ExternalLink>
                  .
                </Trans>
              ),
            },
          ]}
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

export default OptionBoundariesFile;
