import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';

import BoundaryStep from './BoundaryStep';

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

  useFetchData(useCallback(() => fetchLandscapeForm(slug), [slug]));

  useEffect(() => {
    if (success) {
      navigate(`/landscapes/${slug}`);
    }
    return () => dispatch(setFormNewValues());
  }, [success, slug, navigate, dispatch]);

  if (fetching || !landscape) {
    return <PageLoader />;
  }

  const onSave = async updatedLandscape => {
    return dispatch(
      saveLandscape({
        successKey: 'landscape.boundary_success',
        landscape: {
          id: landscape.id,
          areaPolygon: updatedLandscape.areaPolygon,
        },
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
        onSkip={onSave}
        onSave={onSave}
        saveLabel={t('landscape.boundaries_update_save')}
        onCancel={() => navigate(`/landscapes/${slug}`)}
      />
    </PageContainer>
  );
};

export default LandscapeBoundariesUpdate;
