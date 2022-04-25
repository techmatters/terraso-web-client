import React, { useState, useEffect } from 'react';
import _ from 'lodash/fp';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Grid, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { fetchLandscapeForm, saveLandscape } from 'landscape/landscapeSlice';
import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageHeader from 'layout/PageHeader';
import PageLoader from 'layout/PageLoader';
import LandscapeBoundaries from './LandscapeBoundaries';

const LandscapeBoundariesUpdate = () => {
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
        <LandscapeBoundaries
          areaPolygon={areaPolygon || _.get('areaPolygon', landscape)}
          onFileSelected={onFileSelected}
        />
      </Paper>
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

export default LandscapeBoundariesUpdate;
