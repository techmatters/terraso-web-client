/*
 * Copyright © 2021-2023 Technology Matters
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 */

import { useCallback, useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { useFetchData } from 'terraso-client-shared/store/utils';

import { useDocumentTitle } from 'terraso-web-client/common/document';
import PageContainer from 'terraso-web-client/layout/PageContainer';
import PageLoader from 'terraso-web-client/layout/PageLoader';
import ProfileImageStep from 'terraso-web-client/landscape/components/LandscapeForm/ProfileImageStep';
import {
  fetchLandscapeForm,
  setFormNewValues,
  uploadProfileImage,
} from 'terraso-web-client/landscape/landscapeSlice';

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
