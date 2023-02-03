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
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

import BaseDropZone from 'common/components/DropZone';
import ExternalLink from 'common/components/ExternalLink';
import InlineHelp from 'common/components/InlineHelp';
import { sendToRollbar } from 'monitoring/logger';

import { parseFileToGeoJSON } from 'gis/gisSlice';

import {
  GEOJSON_MAX_SIZE,
  MAP_DATA_ACCEPTED_EXTENSIONS,
  MAP_DATA_ACCEPTED_TYPES,
} from 'config';

import LandscapeMap from '../LandscapeMap';

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
      onFileSelected(geojson);
    }
  }, [geojson, onFileSelected]);

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
          sendToRollbar('error', data.payload);
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

const LandscapeGeoJsonBoundaries = props => {
  const { t } = useTranslation();
  const { areaPolygon, mapCenter, onFileSelected } = props;

  return (
    <>
      <LandscapeMap
        mapCenter={mapCenter}
        areaPolygon={areaPolygon}
        onGeoJsonChange={onFileSelected}
      />
      <DropZone onFileSelected={onFileSelected} />
      <InlineHelp
        items={[
          {
            title: t('landscape.boundaries_help_geojson'),
            details: (
              <Trans i18nKey="landscape.boundaries_help_geojson_detail">
                Prefix
                <ExternalLink href={t('landscape.boundaries_help_geojson_url')}>
                  link
                </ExternalLink>
                .
              </Trans>
            ),
          },
        ]}
      />
    </>
  );
};

export default LandscapeGeoJsonBoundaries;
