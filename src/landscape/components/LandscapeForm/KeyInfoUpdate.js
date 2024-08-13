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

import React, { useCallback, useEffect } from 'react';
import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useFetchData } from 'terraso-client-shared/store/utils';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import InfoStep from 'landscape/components/LandscapeForm/KeyInfoStep';
import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';

const KeyInfoUpdate = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, saving, landscape, success } = useSelector(
    state => state.landscape.form
  );

  const onSave = updatedLandscape => {
    dispatch(
      saveLandscape({
        successKey: 'landscape.key_info_success',
        landscape: _.pick(
          ['id', 'name', 'description', 'location', 'email', 'website'],
          updatedLandscape
        ),
      })
    );
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

export default KeyInfoUpdate;
