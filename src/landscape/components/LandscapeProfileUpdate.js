import React, { useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';

import InfoStep from 'landscape/components/LandscapeForm/InfoStep';
import { fetchLandscapeForm, saveLandscape } from 'landscape/landscapeSlice';

const LandscapeProfileUpdate = () => {
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

export default LandscapeProfileUpdate;
