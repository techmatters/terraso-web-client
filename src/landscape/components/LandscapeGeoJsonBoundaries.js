import React, { useCallback, useState } from 'react';

import _ from 'lodash/fp';
import { Trans, useTranslation } from 'react-i18next';

import BaseDropZone from 'common/components/DropZone';
import ExternalLink from 'common/components/ExternalLink';
import InlineHelp from 'common/components/InlineHelp';
import { sendToRollbar } from 'monitoring/logger';

import { isValidGeoJson } from 'landscape/landscapeUtils';

import { GEOJSON_MAX_SIZE } from 'config';

import LandscapeMap from './LandscapeMap';

const openFile = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const contents = event.target.result;
      resolve(contents);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const openGeoJsonFile = file =>
  openFile(file).then(contents => {
    if (!contents.length) {
      throw new Error('boundaries_file_empty');
    }
    let json;

    try {
      json = JSON.parse(contents);
    } catch (error) {
      throw new Error('boundaries_file_invalid_json');
    }

    if (isValidGeoJson(json)) {
      return json;
    } else {
      throw new Error('boundaries_file_invalid_geojson');
    }
  });

const DropZone = props => {
  const { t } = useTranslation();
  const { onFileSelected } = props;
  const [currentFile, setCurrentFile] = useState();
  const [error, setError] = useState();
  const onDrop = useCallback(
    acceptedFiles => {
      if (_.isEmpty(acceptedFiles)) {
        setError(t('landscape.boundaries_file_no_accepted'));
        return;
      }
      setError(null);
      const selectedFile = acceptedFiles[0];
      openGeoJsonFile(selectedFile)
        .then(json => {
          onFileSelected(json);
          setCurrentFile(selectedFile);
        })
        .catch(error => {
          setError(t(`landscape.${error.message}`));
          sendToRollbar('error', error);
        });
    },
    [onFileSelected, t]
  );
  return (
    <BaseDropZone
      errors={error ? [error] : null}
      currentFile={currentFile}
      onDrop={onDrop}
      maxSize={GEOJSON_MAX_SIZE}
      fileExtensions={['json', 'geojson']}
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
