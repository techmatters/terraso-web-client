import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import InfoStep from 'landscape/components/LandscapeForm/InfoStep';
import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';

const LandscapeUpdateProfile = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, saving, landscape, success } = useSelector(
    state => state.landscape.form
  );

  const onSave = updatedLandscape => {
    dispatch(saveLandscape(updatedLandscape));
  };

  useDocumentTitle(
    t('landscape.form_edit_document_title', {
      name: _.get('name', landscape),
    }),
    fetching
  );

  useEffect(() => () => dispatch(setFormNewValues()), [dispatch]);

  useFetchData(useCallback(() => fetchLandscapeForm(slug), [slug]));

  useEffect(() => {
    if (success && landscape.slug) {
      navigate(`/landscapes/${landscape.slug}`);
    }
  }, [success, landscape?.slug, navigate, dispatch]);

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      {saving && <PageLoader />}
      <InfoStep
        landscape={landscape}
        setUpdatedLandscape={updatedLandscape => {
          onSave(updatedLandscape);
        }}
      />
    </PageContainer>
  );
};

export default LandscapeUpdateProfile;
