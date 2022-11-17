import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import ProfileImageStep from 'landscape/components/LandscapeForm/ProfileImageStep';
import {
  fetchLandscapeForm,
  setFormNewValues,
  uploadProfileImage,
} from 'landscape/landscapeSlice';

const ProfileImageUpdate = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, landscape, success } = useSelector(_.get('landscape.form'));
  const { uploading } = useSelector(_.get('landscape.uploadProfileImage'));

  const onSave = updatedLandscape => {
    dispatch(
      uploadProfileImage({
        landscapeSlug: updatedLandscape.slug,
        blob: updatedLandscape.profileImage.result,
        description: updatedLandscape.profileImageDescription,
      })
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

  useEffect(() => () => dispatch(setFormNewValues()), [dispatch]);

  useFetchData(useCallback(() => fetchLandscapeForm(slug), [slug]));

  useEffect(() => {
    if (success && landscape.slug) {
      navigate(`/landscapes/${landscape.slug}/profile`);
    }
  }, [success, landscape?.slug, navigate, dispatch]);

  if (fetching) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      {uploading && <PageLoader />}
      <ProfileImageStep
        landscape={landscape}
        setUpdatedLandscape={updatedLandscape => {
          onSave(updatedLandscape);
        }}
      />
    </PageContainer>
  );
};

export default ProfileImageUpdate;
