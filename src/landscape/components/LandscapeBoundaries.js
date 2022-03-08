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

import { fetchLandscapeForm, saveLandscape } from 'landscape/landscapeSlice';
import { isValidGeoJson } from 'landscape/landscapeUtils';
import { addMessage } from 'notifications/notificationsSlice';
import PageContainer from 'layout/PageContainer';
import LandscapeMap from './LandscapeMap';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import logger from 'monitoring/logger';

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

const CurrentFile = ({ file }) => {
  const size = (file.size / 1000).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
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
      openFile(selectedFile).then(contents => {
        try {
          const json = JSON.parse(contents);
          if (isValidGeoJson(json)) {
            setCurrentFile(selectedFile);
            onFileSelected(json);
          } else {
            throw new Error('Invalid GEO Json format');
          }
        } catch (error) {
          logger.error('Failed to parse file. Error:', error);
          dispatch(
            addMessage({
              severity: 'error',
              content: 'landscape.boundaries_format_error',
            })
          );
        }
      });
    },
    [onFileSelected, dispatch]
  );
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: '.json',
    maxFiles: 1,
    maxSize: 1000000,
  });
  return (
    <Stack
      component={Paper}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={2}
      variant="outlined"
      sx={{
        backgroundColor: '#F3FAFD',
        border: '2px dashed #307F9C',
        paddingTop: 2,
        paddingBottom: 3,
        marginBottom: 2,
        minHeight: '125px',
        cursor: 'pointer',
      }}
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
                {t('landscape.boundaries_size')}
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
        <Button variant="text" onClick={() => navigate(-1)}>
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
