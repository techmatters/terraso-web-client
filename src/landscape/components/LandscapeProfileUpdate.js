import React, { useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';

import InfoStep from 'landscape/components/LandscapeForm/InfoStep';
import { fetchLandscapeForm } from 'landscape/landscapeSlice';

const LandscapeProfileUpdate = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, landscape, success } = useSelector(
    state => state.landscape.form
  );

  useDocumentTitle(
    t('landscape.update_document_title', {
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
      <InfoStep isMultiStep={false} landscape={landscape} />
    </PageContainer>
  );
};

export default LandscapeProfileUpdate;
