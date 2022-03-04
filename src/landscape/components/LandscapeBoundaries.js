import React, { useCallback, useState } from 'react';
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

import PageContainer from 'layout/PageContainer';
import LandscapeMap from './LandscapeMap';
import PageHeader from 'layout/PageHeader';

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

const DropZone = props => {
  const { t } = useTranslation();
  const { onFileSelected } = props;
  const onDrop = useCallback(
    acceptedFiles => {
      openFile(acceptedFiles[0]).then(contents => {
        onFileSelected(contents);
      });
    },
    [onFileSelected]
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
      spacing={2}
      variant="outlined"
      sx={{
        backgroundColor: '#F3FAFD',
        border: '2px dashed #307F9C',
        paddingTop: 2,
        paddingBottom: 3,
        marginBottom: 2,
      }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <>
          <Button variant="outlined" onClick={open}>
            {t('landscape.boudaries_select_file')}
          </Button>
          <Typography>{t('landscape.boudaries_format')}</Typography>
          <Typography>{t('landscape.boudaries_size')}</Typography>
        </>
      )}
    </Stack>
  );
};

const LandscapeBoundaries = () => {
  const { t } = useTranslation();
  const [areaPolygon, setAreaPolygon] = useState();
  const onFileSelected = fileContent => {
    setAreaPolygon(JSON.parse(fileContent));
  };
  return (
    <PageContainer>
      <PageHeader header={t('landscape.boudaries_title')} />
      <Typography variant="h2">{t('landscape.boudaries_subtitle')}</Typography>
      <Typography sx={{ marginTop: 2 }}>{t('landscape.boudaries_description')}</Typography>
      <Link component={Box} sx={{ marginTop: 1 }} href="">
        {t('landscape.boundaries_help_geojson')}
      </Link>
      <Paper variant="outlined" sx={{ padding: 2, marginTop: 2 }}>
        <Typography sx={{ marginBottom: 2 }}>
          {t('landscape.boudaries_select_title')}
        </Typography>
        <DropZone onFileSelected={onFileSelected} />
        <LandscapeMap landscape={{ areaPolygon }} />
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
        <Button variant="text">{t('landscape.boundaries_help_cancel')}</Button>
        <Button variant="contained" sx={{ paddingLeft: 5, paddingRight: 5 }}>
          {t('landscape.boundaries_help_save')}
        </Button>
      </Grid>
    </PageContainer>
  );
};

export default LandscapeBoundaries;
