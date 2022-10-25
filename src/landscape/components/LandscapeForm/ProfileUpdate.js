import React, { useCallback, useEffect } from 'react';

import _ from 'lodash/fp';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useDocumentTitle } from 'common/document';
import PageContainer from 'layout/PageContainer';
import PageLoader from 'layout/PageLoader';
import { useFetchData } from 'state/utils';

import ProfileStep from 'landscape/components/LandscapeForm/ProfileStep';
import {
  fetchLandscapeForm,
  saveLandscape,
  setFormNewValues,
} from 'landscape/landscapeSlice';
import {
  TYPE_COMMODITY,
  TYPE_ECOSYSTEM_TYPE,
  TYPE_LIVELIHOOD,
} from 'taxonomies/taxonomiesConstants';
import { fetchTermsForTypes } from 'taxonomies/taxonomiesSlice';

const ProfileUpdate = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const { fetching, saving, landscape } = useSelector(
    state => state.landscape.form
  );
  const { fetching: fetchingTaxonomies = true } = useSelector(
    _.getOr({}, `taxonomies.terms.${TYPE_ECOSYSTEM_TYPE}`)
  );

  const onSave = updatedLandscape => {
    dispatch(saveLandscape(updatedLandscape)).then(data => {
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
  useFetchData(
    useCallback(
      () =>
        fetchTermsForTypes({
          types: [TYPE_ECOSYSTEM_TYPE, TYPE_LIVELIHOOD, TYPE_COMMODITY],
        }),
      []
    )
  );

  if (fetching || fetchingTaxonomies) {
    return <PageLoader />;
  }

  return (
    <PageContainer>
      {saving && <PageLoader />}
      <ProfileStep
        landscape={landscape}
        onSave={updatedLandscape => {
          onSave(updatedLandscape);
        }}
        onCancel={() => navigate(`/landscapes/${landscape.slug}/profile`)}
      />
    </PageContainer>
  );
};

export default ProfileUpdate;
