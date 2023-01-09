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
          processingError?.map(error => t(error.content, error.params))
        )
      ),
    [dropError, processingError, t]
  );

  return (
    <BaseDropZone
      errors={errors}
      currentFile={currentFile}
      onDrop={onDrop}
      maxSize={GEOJSON_MAX_SIZE}
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
      <DropZone
        onFileSelected={onFileSelected}
        fileTypes={MAP_DATA_ACCEPTED_TYPES}
        fileExtensions={MAP_DATA_ACCEPTED_EXTENSIONS}
      />
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
