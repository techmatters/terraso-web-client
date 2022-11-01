import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import DevelopmentStrategyStep from 'landscape/components/LandscapeForm/DevelopmentStrategyStep';
import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';

const DevelopmentStrategyUpdate = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, saving, landscape } = useSelector(
    state => state.landscape.form
  );

  const onSave = updatedLandscape => {
    dispatch(
      saveLandscape(_.pick(['id', 'developmentStrategy'], updatedLandscape))
    ).then(data => {
      const success = _.get('meta.requestStatus', data) === 'fulfilled';
      if (success) {
        navigate(`/landscapes/${landscape.slug}/profile`);
      }
    });
  };

  useDocumentTitle(
    t('landscape.form_edit_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  // Clean form values on unmount
  useEffect(() => () => dispatch(setFormNewValues()), [dispatch]);

  useFetchData(useCallback(() => fetchLandscapeForm(slug), [slug]));

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      {saving && <PageLoader />}
      <DevelopmentStrategyStep
        landscape={landscape}
        onSave={updatedLandscape => {
          onSave(updatedLandscape);
        }}
        onCancel={() => navigate(`/landscapes/${landscape.slug}/profile`)}
      />
    </PageContainer>
  );
};

export default DevelopmentStrategyUpdate;
