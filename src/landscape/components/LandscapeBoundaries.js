import React, { useCallback, useState, useEffect } from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { GEOJSON_MAX_SIZE } from 'config';
import { fetchLandscapeForm, saveLandscape } from 'landscape/landscapeSlice';
import { isValidGeoJson } from 'landscape/landscapeUtils';
import { addMessage } from 'notifications/notificationsSlice';
import logger from 'monitoring/logger';
import PageContainer from 'layout/PageContainer';
import LandscapeMap from './LandscapeMap';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';

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
    try {
      const json = JSON.parse(contents);
      if (isValidGeoJson(json)) {
        return Promise.resolve(json);
      } else {
        throw new Error('Invalid GEO Json format');
      }
    } catch (error) {
      return Promise.reject(error);
    }
  });

const getFormatedSize = bytes => {
  const size = (bytes).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  return `${size}`;
};

const CurrentFile = ({ file }) => {
  const size = getFormatedSize(file.size / 1000.0);
  return (
    <Typography sx={{ fontWeight: 'bold' }}>
      {file.name} {size}KB
    </Typography>
  );
};

const DropZone = props => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { onFileSelected } = props;
  const [currentFile, setCurrentFile] = useState();
  const onDrop = useCallback(
    acceptedFiles => {
      const selectedFile = acceptedFiles[0];
      openGeoJsonFile(selectedFile)
        .then(json => {
          setCurrentFile(selectedFile);
          onFileSelected(json);
        })
        .catch(error => {
          logger.error('Failed to parse file. Error:', error);
          dispatch(
            addMessage({
              severity: 'error',
              content: 'landscape.boundaries_format_error',
            })
          );
        });
    },
    [onFileSelected, dispatch]
  );
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: '.json,.geojson',
    maxFiles: 1,
    maxSize: GEOJSON_MAX_SIZE,
  });
  return (
    <Stack
      component={Paper}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={2}
      variant="outlined"
      sx={({ palette }) => ({
        backgroundColor: isDragActive ? palette.blue.mid : palette.blue.lite,
        border: `2px dashed ${palette.blue.dark}`,
        paddingTop: 2,
        paddingBottom: 3,
        marginBottom: 2,
        minHeight: '125px',
        cursor: 'pointer',
      })}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <Typography>{t('landscape.boundaries_drop_message')}</Typography>
      ) : (
        <>
          <Paper
            variant="outlined"
            onClick={open}
            sx={({ spacing, palette }) => ({
              padding: `${spacing(1)} ${spacing(3)}`,
              borderColor: palette.black,
            })}
          >
            {t('landscape.boundaries_select_file')}
          </Paper>
          {currentFile ? (
            <CurrentFile file={currentFile} />
          ) : (
            <>
              <Typography variant="caption">
                {t('landscape.boundaries_format')}
              </Typography>
              <Typography variant="caption">
                {t('landscape.boundaries_size', {
                  size: getFormatedSize(GEOJSON_MAX_SIZE / 1000000.0),
                })}
              </Typography>
            </>
          )}
        </>
      )}
    </Stack>
  );
};

const LandscapeBoundaries = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, landscape, success } = useSelector(
    state => state.landscape.form
  );
  const [areaPolygon, setAreaPolygon] = useState();
  const onFileSelected = areaPolygon => {
    setAreaPolygon(areaPolygon);
  };

  useEffect(() => {
    dispatch(fetchLandscapeForm(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    if (success) {
      navigate(`/landscapes/${slug}`);
    }
  }, [success, slug, navigate, dispatch]);

  if (fetching) {
    return <PageLoader />;
  }

  const onSave = () => {
    dispatch(
      saveLandscape({
        ...landscape,
        areaPolygon,
      })
    );
  };

  return (
    <PageContainer>
      <PageHeader header={t('landscape.boundaries_title')} />
      <Typography variant="h2">{t('landscape.boundaries_subtitle')}</Typography>
      <Typography sx={{ marginTop: 2 }}>
        {t('landscape.boundaries_description')}
      </Typography>
      <Link component={Box} sx={{ marginTop: 1 }} href="">
        {t('landscape.boundaries_help_geojson')}
      </Link>
      <Paper variant="outlined" sx={{ padding: 2, marginTop: 2 }}>
        <Typography sx={{ marginBottom: 2 }}>
          {t('landscape.boundaries_select_title')}
        </Typography>
        <DropZone onFileSelected={onFileSelected} />
        <LandscapeMap
          landscape={{
            areaPolygon: areaPolygon || _.get('areaPolygon', landscape),
          }}
        />
        <Link component={Box} sx={{ marginTop: 2 }} href="">
          {t('landscape.boundaries_help_map')}
        </Link>
      </Paper>
      <Grid
        container
        direction="row"
        justifyContent="space-between"
        sx={{ marginTop: 2 }}
      >
        <Button variant="text" onClick={() => navigate(`/landscapes/${slug}`)}>
          {t('landscape.boundaries_cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={!areaPolygon}
          sx={{ paddingLeft: 5, paddingRight: 5 }}
          onClick={onSave}
        >
          {t('landscape.boundaries_save')}
        </Button>
      </Grid>
    </PageContainer>
  );
};

export default LandscapeBoundaries;
