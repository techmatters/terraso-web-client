import React, { useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';

import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';

import BoundaryStep from './LandscapeForm/BoundaryStep';

const LandscapeBoundariesUpdate = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, landscape, success } = useSelector(
    state => state.landscape.form
  );

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
    return () => dispatch(setFormNewValues());
  }, [success, slug, navigate, dispatch]);

  if (fetching) {
    return <PageLoader />;
  }

  const onSave = updatedLandscape => {
    dispatch(
      saveLandscape({
        id: landscape.id,
        areaPolygon: updatedLandscape.areaPolygon,
      })
    );
  };

  return (
    <PageContainer>
      <BoundaryStep
        title={t('landscape.boundaries_title', {
          name: _.get('name', landscape),
        })}
        landscape={landscape}
        save={onSave}
        saveLabel={t('landscape.boundaries_update_save')}
        onCancel={() => navigate(`/landscapes/${slug}`)}
      />
    </PageContainer>
  );
};

export default LandscapeBoundariesUpdate;
