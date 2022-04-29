import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Button,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import _ from 'lodash/fp';

import InlineHelp from 'common/components/InlineHelp';
import { useDocumentTitle } from 'common/document';
import { GEOJSON_MAX_SIZE } from 'config';
import { fetchLandscapeForm, saveLandscape } from 'landscape/landscapeSlice';
import { isValidGeoJson } from 'landscape/landscapeUtils';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import { sendToRollbar } from 'monitoring/logger';
import theme from 'theme';

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

const getFormatedSize = bytes => {
  const size = bytes.toLocaleString(undefined, {
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
  const { onFileSelected } = props;
  const [currentFile, setCurrentFile] = useState();
  const [error, setError] = useState();
  const onDrop = useCallback(
    acceptedFiles => {
      if (_.isEmpty(acceptedFiles)) {
        setError('No accepted files');
        return;
      }
      setError(null);
      const selectedFile = acceptedFiles[0];
      setCurrentFile(selectedFile);
      openGeoJsonFile(selectedFile)
        .then(json => {
          onFileSelected(json);
        })
        .catch(error => {
          setError(error);
          sendToRollbar('error', error);
        });
    },
    [onFileSelected]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.json,.geojson',
    useFsAccessApi: false,
    multiple: false,
    maxSize: GEOJSON_MAX_SIZE,
  });
  return (
    <Stack
      component={Paper}
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      variant="outlined"
      sx={({ palette }) => ({
        backgroundColor: isDragActive ? palette.blue.mid : palette.blue.lite,
        border: `3px dashed ${palette.blue.dark}`,
        paddingTop: error ? 0 : 2,
        paddingBottom: 3,
        marginTop: 2,
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
          {error && (
            <Alert
              style={{
                width: '100%',
                boxSizing: 'border-box',
                margin: `0 0 ${theme.spacing(1)}`,
              }}
              severity="error"
            >
              {t(`landscape.${error.message}`)}
            </Alert>
          )}
          <Paper
            variant="outlined"
            sx={({ spacing, palette }) => ({
              padding: `${spacing(1)} ${spacing(3)}`,
              borderColor: palette.black,
            })}
          >
            {t('landscape.boundaries_select_file')}
          </Paper>
          <Typography
            variant="caption"
            sx={{ fontWeight: 'bold', paddingTop: 1 }}
          >
            {t('landscape.boundaries_format')}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 'bold' }}
            style={{ margin: 0 }}
          >
            {t('landscape.boundaries_size', {
              size: getFormatedSize(GEOJSON_MAX_SIZE / 1000000.0),
            })}
          </Typography>
          {!error && currentFile && <CurrentFile file={currentFile} />}
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

  useDocumentTitle(
    t('landscape.boundaries_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

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
        id: landscape.id,
        areaPolygon,
      })
    );
  };

  return (
    <PageContainer>
      <PageHeader
        header={t('landscape.boundaries_title', {
          name: _.get('name', landscape),
        })}
      />
      <Paper variant="outlined" sx={{ padding: 2 }}>
        <LandscapeMap
          landscape={{
            areaPolygon: areaPolygon || _.get('areaPolygon', landscape),
          }}
        />
        <DropZone onFileSelected={onFileSelected} />
      </Paper>
      <InlineHelp
        items={[
          {
            title: t('landscape.boundaries_help_geojson'),
            details: (
              <Trans i18nKey="landscape.boundaries_help_geojson_detail">
                Prefix
                <Link
                  href={t('landscape.boundaries_help_geojson_url')}
                  target="_blank"
                >
                  link
                </Link>
                .
              </Trans>
            ),
          },
        ]}
      />
      <Grid
        container
        direction="row"
        justifyContent="space-between"
        sx={{ marginTop: 2 }}
      >
        <Button
          variant="contained"
          disabled={!areaPolygon}
          sx={{ paddingLeft: 5, paddingRight: 5 }}
          onClick={onSave}
        >
          {t('landscape.boundaries_save')}
        </Button>
        <Button variant="text" onClick={() => navigate(`/landscapes/${slug}`)}>
          {t('landscape.boundaries_cancel')}
        </Button>
      </Grid>
    </PageContainer>
  );
};

export default LandscapeBoundaries;
